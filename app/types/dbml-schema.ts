/**
 * Neutral input/schema model for DBML import.
 * Sits between raw DBML text and the conceptual ER model.
 * Physical-level representation: tables, columns, FK constraints.
 */

export interface SchemaColumn {
  name: string;
  type: string;
  /** Primary key column */
  pk: boolean;
  /** NOT NULL constraint */
  notNull: boolean;
  /** UNIQUE constraint — used by V2 heuristics to infer 1:1 cardinality. Defaults to false when absent. */
  unique?: boolean;
  /** Column-level note (DBML `note:` field) */
  note?: string;
}

export interface SchemaRef {
  /** Source table */
  fromTable: string;
  /** Source column */
  fromColumn: string;
  /** Target table */
  toTable: string;
  /** Target column */
  toColumn: string;
  /** Optional alias declared on the Ref line: `Ref: table.col > table.col [alias: "NAME"]` */
  alias?: string;
}

export interface SchemaTable {
  name: string;
  /** Optional alias declared in the DBML table header: `Table name [alias: "Alias"] {` */
  alias?: string;
  columns: SchemaColumn[];
  /** Table-level note */
  note?: string;
}

export interface NeutralSchema {
  tables: SchemaTable[];
  refs: SchemaRef[];
}
