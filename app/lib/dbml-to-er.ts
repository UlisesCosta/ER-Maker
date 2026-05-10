/**
 * Interpreter: NeutralSchema → ERDiagram (conceptual model).
 *
 * V1 rules:
 * 1. Tables that are NOT join tables → EREntity
 *    - PK columns → key attribute
 *    - Non-FK, non-PK columns → simple attribute
 *    - FK columns are HIDDEN (conceptual view hides physical FKs)
 * 2. Simple FK ref (table A has FK → table B) → 1:N ERRelationship
 * 3. Pure join table (only FK columns, no business columns) → N:M with no attributes
 * 4. Enriched join table (FK + extra columns) → N:M with relationship attributes (collapsed by default)
 *
 * V2 additions (heuristic improvements):
 * - participation: total when FK col is NOT NULL, partial when nullable
 * - cardinality: 1:1 when FK col has UNIQUE constraint, else 1:N
 * - joinTableKind: "pure" | "enriched-simple" | "associative-entity-candidate"
 *   - associative-entity-candidate: has its own PK + ≥3 business columns
 *   - still rendered as N:M relationship by default (relation-first policy)
 *
 * Entity names are uppercased per Chen convention.
 */

import type { NeutralSchema, SchemaTable, SchemaRef } from "~/types/dbml-schema";
import type { ERDiagram, EREntity, ERRelationship, ERAttribute, SourceTrace, InferenceMeta } from "~/types/er-model";

// ── Helpers ───────────────────────────────────────────────────────────────────

function slug(name: string): string {
  return name.toLowerCase().replace(/\W+/g, "-");
}

/**
 * Returns the set of column names that are FK columns in the given table
 * (i.e., appear as `fromColumn` in refs with `fromTable === tableName`).
 */
function fkColumnsFor(tableName: string, refs: SchemaRef[]): Set<string> {
  const fkCols = new Set<string>();
  for (const ref of refs) {
    if (ref.fromTable === tableName) {
      fkCols.add(ref.fromColumn);
    }
  }
  return fkCols;
}

/**
 * A join table is a table whose ONLY columns are FK columns (no business columns).
 * It must also have EXACTLY 2 FK refs pointing to other tables.
 */
function isJoinTable(table: SchemaTable, refs: SchemaRef[]): boolean {
  const fkCols = fkColumnsFor(table.name, refs);
  if (fkCols.size !== 2) return false;
  // All columns must be FK columns (or PK columns that are also FK columns)
  const nonFkCols = table.columns.filter((c) => !fkCols.has(c.name));
  return nonFkCols.length === 0;
}

/**
 * V2: Classify enriched join table kind.
 * - "associative-entity-candidate": table has an own PK column that is NOT a FK col
 *   AND has ≥ 3 business (non-FK) columns (including the own PK counts as business col)
 * - "enriched-simple": 1–2 extra business columns, no own non-FK PK
 */
function classifyEnrichedJoin(
  table: SchemaTable,
  fkCols: Set<string>
): "enriched-simple" | "associative-entity-candidate" {
  const extraCols = table.columns.filter((c) => !fkCols.has(c.name));
  const hasOwnPk = extraCols.some((c) => c.pk);
  if (hasOwnPk && extraCols.length >= 3) {
    return "associative-entity-candidate";
  }
  return "enriched-simple";
}

function makeAttributeId(tableName: string, colName: string): string {
  return `attr-${slug(tableName)}-${slug(colName)}`;
}

function makeEntityId(tableName: string): string {
  return `entity-${slug(tableName)}`;
}

function makeRelId(name: string): string {
  return `rel-${slug(name)}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function schemaToEr(
  schema: NeutralSchema,
  origin: SourceTrace["origin"] = "dbml"
): ERDiagram {
  const { tables, refs } = schema;

  // Identify join tables
  const joinTableNames = new Set(
    tables.filter((t) => isJoinTable(t, refs)).map((t) => t.name)
  );

  // Also identify "enriched" join tables: 2 FK refs + extra non-FK columns
  const enrichedJoinTableNames = new Set<string>();
  const referencedTables = new Set(refs.map((r) => r.toTable));
  for (const table of tables) {
    const fkCols = fkColumnsFor(table.name, refs);
    const tableRefs = refs.filter((r) => r.fromTable === table.name);
    if (tableRefs.length === 2 && fkCols.size === 2) {
      // A table referenced by other tables must remain an entity
      if (referencedTables.has(table.name)) continue;
      const extraCols = table.columns.filter((c) => !fkCols.has(c.name));
      if (extraCols.length > 0) {
        enrichedJoinTableNames.add(table.name);
      }
    }
  }

  const allJoinLike = new Set([...joinTableNames, ...enrichedJoinTableNames]);

  // ── Build entities ────────────────────────────────────────────────────────
  const entities: EREntity[] = [];
  const entityIdByTableName = new Map<string, string>();

  for (const table of tables) {
    if (allJoinLike.has(table.name)) continue;

    const fkCols = fkColumnsFor(table.name, refs);
    const entityId = makeEntityId(table.name);
    entityIdByTableName.set(table.name, entityId);

    const attributes: ERAttribute[] = table.columns
      .filter((c) => !fkCols.has(c.name)) // hide FK columns
      .map((c) => ({
        id: makeAttributeId(table.name, c.name),
        name: c.name,
        kind: c.pk ? "key" : "simple",
        source: { origin, sourceId: `${table.name}.${c.name}` },
      }));

    const entitySource: SourceTrace = { origin, sourceId: table.name };
    const entityInference: InferenceMeta = {
      confidence: 0.95,
      reasons: [`non-join table "${table.name}" mapped to entity`],
      inferredKind: "entity",
    };

    entities.push({
      type: "entity",
      id: entityId,
      name: table.name.toUpperCase(),
      attributes,
      source: entitySource,
      inference: entityInference,
    });
  }

  // ── Build relationships ───────────────────────────────────────────────────
  const relationships: ERRelationship[] = [];

  // Build a lookup for quick column access: tableName → Map<colName, column>
  const tableColMap = new Map(
    tables.map((t) => [t.name, new Map(t.columns.map((c) => [c.name, c]))])
  );

  // 1:N (or 1:1) relationships from direct FK refs (only from non-join tables)
  for (const ref of refs) {
    if (allJoinLike.has(ref.fromTable)) continue;

    const fromEntityId = entityIdByTableName.get(ref.fromTable);
    const toEntityId = entityIdByTableName.get(ref.toTable);
    if (!fromEntityId || !toEntityId) continue;

    // V2: check unique & nullability of the FK column
    const fkCol = tableColMap.get(ref.fromTable)?.get(ref.fromColumn);
    const isUnique = fkCol?.unique ?? false;
    const isNotNull = fkCol?.notNull ?? false;

    // Cardinality: unique FK → 1:1, else → 1:N
    const fromCardinality = isUnique ? "1" : "N";
    const inferredKind = isUnique ? "11-relationship" : "1n-relationship";

    // Participation: NOT NULL FK → total on FK side, nullable → partial
    const fromParticipation = isNotNull ? "total" : "partial";

    const reasons: string[] = [
      `FK ref ${ref.fromTable}.${ref.fromColumn} → ${ref.toTable}.${ref.toColumn}`,
    ];
    if (isUnique) {
      reasons.push(`unique constraint on ${ref.fromTable}.${ref.fromColumn} → 1:1 cardinality`);
    } else {
      reasons.push("1:N assumed: many rows on FK side reference one row on referenced side");
    }
    if (isNotNull) {
      reasons.push(`${ref.fromTable}.${ref.fromColumn} is not null → total participation on ${ref.fromTable.toUpperCase()}`);
    } else {
      reasons.push(`${ref.fromTable}.${ref.fromColumn} is nullable → partial participation on ${ref.fromTable.toUpperCase()}`);
    }

    const relName = ref.alias ?? `${ref.fromTable.toUpperCase()}_${ref.toTable.toUpperCase()}`;
    relationships.push({
      type: "relationship",
      id: makeRelId(relName),
      name: relName,
      participants: [
        { entityId: fromEntityId, cardinality: fromCardinality, participation: fromParticipation },
        { entityId: toEntityId, cardinality: "1", participation: "partial" },
      ],
      attributes: [],
      attributesExpanded: true,
      source: { origin, sourceId: `${ref.fromTable}.${ref.fromColumn}` },
      inference: {
        confidence: isUnique ? 0.9 : 0.8,
        reasons,
        inferredKind,
      },
    });
  }

  // N:M from pure join tables
  for (const tableName of joinTableNames) {
    const table = tables.find((t) => t.name === tableName)!;
    const tableRefs = refs.filter((r) => r.fromTable === tableName);
    const [ref1, ref2] = tableRefs;
    const eid1 = entityIdByTableName.get(ref1.toTable);
    const eid2 = entityIdByTableName.get(ref2.toTable);
    if (!eid1 || !eid2) continue;

    const relName = table.alias ?? tableName.toUpperCase();

    relationships.push({
      type: "relationship",
      id: makeRelId(tableName),
      name: relName,
      participants: [
        { entityId: eid1, cardinality: "N", participation: "partial" },
        { entityId: eid2, cardinality: "M", participation: "partial" },
      ],
      attributes: [],
      attributesExpanded: true,
      source: { origin, sourceId: tableName },
      inference: {
        confidence: 0.95,
        reasons: [
          `pure join table "${tableName}": exactly 2 FK refs, no business columns`,
        ],
        inferredKind: "nm-relationship",
        joinTableKind: "pure",
      },
    });
  }

  // N:M from enriched join tables
  for (const tableName of enrichedJoinTableNames) {
    const table = tables.find((t) => t.name === tableName)!;
    const tableRefs = refs.filter((r) => r.fromTable === tableName);
    const [ref1, ref2] = tableRefs;
    const eid1 = entityIdByTableName.get(ref1.toTable);
    const eid2 = entityIdByTableName.get(ref2.toTable);
    if (!eid1 || !eid2) continue;

    const fkCols = fkColumnsFor(tableName, refs);
    const extraCols = table.columns.filter((c) => !fkCols.has(c.name));
    const relAttributes: ERAttribute[] = extraCols.map((c) => ({
      id: makeAttributeId(tableName, c.name),
      name: c.name,
      kind: "simple" as const,
    }));

    // V2: classify the enriched join table
    const joinTableKind = classifyEnrichedJoin(table, fkCols);
    const isAssociative = joinTableKind === "associative-entity-candidate";

    const reasons: string[] = [
      `enriched join table "${tableName}": 2 FK refs + ${extraCols.length} business column(s)`,
    ];
    if (isAssociative) {
      reasons.push(
        `has own PK and ${extraCols.length} business columns → ambiguous: associative entity candidate`,
        `kept as N:M relationship by default (relation-first policy); consider promoting to entity`
      );
    }

    const relName = table.alias ?? tableName.toUpperCase();

    relationships.push({
      type: "relationship",
      id: makeRelId(tableName),
      name: relName,
      participants: [
        { entityId: eid1, cardinality: "N", participation: "partial" },
        { entityId: eid2, cardinality: "M", participation: "partial" },
      ],
      attributes: relAttributes,
      attributesExpanded: false,
      source: { origin, sourceId: tableName },
      inference: {
        // associative-entity-candidate is more ambiguous → lower confidence
        confidence: isAssociative ? 0.65 : 0.9,
        reasons,
        inferredKind: "nm-relationship",
        joinTableKind,
      },
    });
  }

  return {
    id: `imported-${Date.now()}`,
    name: "Imported Schema",
    entities,
    relationships,
  };
}
