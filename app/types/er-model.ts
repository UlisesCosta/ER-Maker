/**
 * Canonical ER model types — Chen notation, conceptual level.
 * No physical FK attributes. No table-level concerns.
 *
 * V2 additions:
 * - SourceTrace: where did this element come from?
 * - InferenceMeta: how confident is the interpreter in this element?
 * - OverrideMeta: manual correction applied by the user.
 */

export type Cardinality = "1" | "N" | "M";
export type Participation = "total" | "partial";

// ── Metadata types ────────────────────────────────────────────────────────────

/** Where an ER element originated. */
export interface SourceTrace {
  /** "dbml" = imported from a DBML file; "sql" = imported from SQL DDL; "manual" = created by hand */
  origin: "dbml" | "sql" | "manual";
  /** The original identifier in the source (e.g. table name in DBML). */
  sourceId?: string;
}

/** Interpreter confidence and reasoning for an inferred element. */
export interface InferenceMeta {
  /** 0–1 confidence score assigned by the interpreter. */
  confidence: number;
  /** Human-readable reasons that support this inference. */
  reasons: string[];
  /**
   * What kind of element was inferred.
   * - "entity"                       — regular entity from a non-join table
   * - "11-relationship"              — 1:1 inferred from a unique FK column
   * - "1n-relationship"              — 1:N inferred from a direct FK ref
   * - "nm-relationship"              — N:M inferred from a pure or enriched join table
   */
  inferredKind: "entity" | "11-relationship" | "1n-relationship" | "nm-relationship";
  /**
   * For N:M relationships only — how the join table was classified.
   * - "pure"                         — only FK columns, classic pivot table
   * - "enriched-simple"              — FK cols + a few extra attributes, no own PK
   * - "associative-entity-candidate" — has its own PK and multiple business attrs;
   *                                    ambiguous — may warrant promotion to entity
   */
  joinTableKind?: "pure" | "enriched-simple" | "associative-entity-candidate";
}

/** A manual correction applied on top of the inferred/imported model. */
export interface OverrideMeta {
  /** ISO date string for when the override was applied. */
  appliedAt: string;
  /** Partial fields that were overridden. */
  fields: Partial<{
    name: string;
    cardinality: Cardinality;
    participation: Participation;
  }>;
}

export interface ERAttribute {
  id: string;
  name: string;
  /** key = primary/identifier attribute (underlined in Chen) */
  kind: "simple" | "key" | "derived" | "multivalued" | "composite";
  /** For composite attributes, nested children */
  children?: ERAttribute[];
  source?: SourceTrace;
  inference?: InferenceMeta;
}

export interface EREntity {
  type: "entity";
  id: string;
  name: string;
  attributes: ERAttribute[];
  /** Weak entities depend on a strong entity */
  weak?: boolean;
  source?: SourceTrace;
  inference?: InferenceMeta;
  override?: OverrideMeta;
}

export interface ERParticipant {
  entityId: string;
  cardinality: Cardinality;
  participation: Participation;
}

export interface ERRelationship {
  type: "relationship";
  id: string;
  name: string;
  participants: ERParticipant[];
  /** Attributes that belong to the relationship itself */
  attributes: ERAttribute[];
  /**
   * When true, relationship attributes are hidden by default
   * and can be expanded by the user.
   */
  attributesExpanded?: boolean;
  source?: SourceTrace;
  inference?: InferenceMeta;
  override?: OverrideMeta;
}

export interface ERDiagram {
  id: string;
  name: string;
  entities: EREntity[];
  relationships: ERRelationship[];
}
