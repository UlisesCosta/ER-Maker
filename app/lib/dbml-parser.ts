/**
 * DBML V1 subset parser.
 *
 * Supported syntax:
 *   Table <name> {
 *   Table <name> [alias: "ALIAS"] {
 *     <column> <type> [pk] [not null] [multivalued] [derived]
 *     ...
 *   }
 *   Ref: <table>.<col> > <table>.<col>
 *   // line comments
 *
 * NOT supported in V1: enums, indexes, schema prefix, multi-column FKs,
 * inline refs, headercolor, group blocks.
 */

import type { NeutralSchema, SchemaTable, SchemaColumn, SchemaRef } from "~/types/dbml-schema";

// ── regex patterns ────────────────────────────────────────────────────────────
  /** Matches: Table <name> { OR Table <name> [alias: "ALIAS"] { */
  const TABLE_OPEN = /^Table\s+(\w+)\s*(?:\[alias:\s*"([^"]+)"\])?\s*\{/;
  const COLUMN_LINE = /^(\w+)\s+(\w+)(.*)$/;
  const REF_LINE = /^Ref:\s*(\w+)\.(\w+)\s*[<>-]+\s*(\w+)\.(\w+)(?:\s*\[alias:\s*"([^"]+)"\])?/;

export function parseDbml(input: string): NeutralSchema {
  const tables: SchemaTable[] = [];
  const refs: SchemaRef[] = [];

  const lines = input
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("//"));

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const tableMatch = line.match(TABLE_OPEN);
    if (tableMatch) {
      const tableName = tableMatch[1];
      const tableAlias = tableMatch[2] as string | undefined;
      const columns: SchemaColumn[] = [];
      i++;
      while (i < lines.length && lines[i] !== "}") {
        const colLine = lines[i];
        if (!colLine.startsWith("//")) {
          const colMatch = colLine.match(COLUMN_LINE);
          if (colMatch) {
            const [, colName, colType, flags] = colMatch;
            columns.push({
              name: colName,
              type: colType,
              pk: flags.includes("pk"),
              notNull: flags.includes("not null") || flags.includes("pk"),
              unique: flags.includes("unique") || flags.includes("pk"),
              multivalued: flags.includes("multivalued"),
              derived: flags.includes("derived"),
            });
          }
        }
        i++;
      }
      tables.push({ name: tableName, alias: tableAlias, columns });
      i++; // skip closing `}`
      continue;
    }

    const refMatch = line.match(REF_LINE);
    if (refMatch) {
      refs.push({
        fromTable: refMatch[1],
        fromColumn: refMatch[2],
        toTable: refMatch[3],
        toColumn: refMatch[4],
        alias: refMatch[5],
      });
      i++;
      continue;
    }

    i++;
  }

  return { tables, refs };
}
