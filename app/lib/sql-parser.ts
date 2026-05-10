/**
 * SQL DDL subset parser (MySQL/PostgreSQL common dialect).
 *
 * Supported syntax:
 *   CREATE TABLE [IF NOT EXISTS] name (
 *     col_name TYPE [NOT NULL] [NULL] [PRIMARY KEY] [UNIQUE] [DEFAULT ...] [REFERENCES tbl(col)],
 *     ...
 *     PRIMARY KEY (col),
 *     FOREIGN KEY (col) REFERENCES tbl(col)
 *   );
 *
 * NOT supported: ALTER TABLE, CREATE INDEX, CHECK, multi-column PK/FK,
 *   inline FK via CONSTRAINT ... FOREIGN KEY.
 */

import type { NeutralSchema, SchemaTable, SchemaColumn, SchemaRef } from "~/types/dbml-schema";

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripComments(input: string): string {
  // Strip /* */ block comments
  let result = input.replace(/\/\*[\s\S]*?\*\//g, " ");
  // Strip -- line comments
  result = result.replace(/--[^\r\n]*/g, " ");
  return result;
}

function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let depth = 0;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "(") {
      depth++;
      current += ch;
    } else if (ch === ")") {
      depth--;
      current += ch;
    } else if (ch === ";" && depth === 0) {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = "";
    } else {
      current += ch;
    }
  }
  const trimmed = current.trim();
  if (trimmed.length > 0) statements.push(trimmed);
  return statements;
}

/** Split table body items by commas, respecting nested parentheses. */
function splitBodyItems(body: string): string[] {
  const items: string[] = [];
  let current = "";
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "(") {
      depth++;
      current += ch;
    } else if (ch === ")") {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0) {
      const trimmed = current.trim();
      if (trimmed.length > 0) items.push(trimmed);
      current = "";
    } else {
      current += ch;
    }
  }
  const trimmed = current.trim();
  if (trimmed.length > 0) items.push(trimmed);
  return items;
}

function normalizeKeyword(s: string): string {
  return s.toLowerCase();
}

function tokenizeDef(def: string): string[] {
  // Split on whitespace but keep parentheses groups together for REFERENCES
  const tokens: string[] = [];
  let current = "";
  for (let i = 0; i < def.length; i++) {
    const ch = def[i];
    if (/\s/.test(ch)) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function parseType(tokens: string[], startIdx: number): { type: string; nextIdx: number } {
  // Type may include parentheses, e.g. VARCHAR(255) or DECIMAL(10,2)
  if (startIdx >= tokens.length) return { type: "", nextIdx: startIdx };
  let type = tokens[startIdx];
  let i = startIdx + 1;
  // If type token ends with ')', it already included the parens (e.g. "varchar(255)")
  // If next token starts with '(', append it (e.g. "decimal" "(10,2)")
  if (i < tokens.length && tokens[i].startsWith("(")) {
    type += tokens[i];
    i++;
  }
  return { type, nextIdx: i };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function parseSqlDdl(input: string): NeutralSchema {
  const tables: SchemaTable[] = [];
  const refs: SchemaRef[] = [];

  const cleaned = stripComments(input);
  const statements = splitStatements(cleaned);

  const CREATE_TABLE_RE = /^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\((.*)\)$/is;

  for (const stmt of statements) {
    const match = stmt.match(CREATE_TABLE_RE);
    if (!match) continue;

    const tableName = match[1];
    const body = match[2];
    const items = splitBodyItems(body);

    const columns: SchemaColumn[] = [];
    const columnIndexByName = new Map<string, number>();

    for (const item of items) {
      const tokens = tokenizeDef(item);
      if (tokens.length === 0) continue;

      const first = normalizeKeyword(tokens[0]);

      // Table-level PRIMARY KEY (col)
      if (first === "primary" && tokens.length >= 3 && normalizeKeyword(tokens[1]) === "key") {
        const pkMatch = item.match(/PRIMARY\s+KEY\s*\(\s*(\w+)\s*\)/i);
        if (pkMatch) {
          const colName = pkMatch[1];
          const idx = columnIndexByName.get(colName);
          if (idx !== undefined) {
            columns[idx].pk = true;
          }
        }
        continue;
      }

      // Table-level FOREIGN KEY (col) REFERENCES tbl(col)
      if (first === "foreign" && tokens.length >= 5 && normalizeKeyword(tokens[1]) === "key") {
        const fkMatch = item.match(/FOREIGN\s+KEY\s*\(\s*(\w+)\s*\)\s+REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/i);
        if (fkMatch) {
          const [, fromColumn, toTable, toColumn] = fkMatch;
          refs.push({ fromTable: tableName, fromColumn, toTable, toColumn });
        }
        continue;
      }

      // Table-level UNIQUE (col) — ignored (we only track unique per column for 1:1 heuristic)
      if (first === "unique") {
        continue;
      }

      // Column definition
      const colName = tokens[0];
      if (!/^[a-zA-Z_]\w*$/.test(colName)) continue;

      const { type, nextIdx } = parseType(tokens, 1);
      if (!type) continue;

      let pk = false;
      let notNull = false;
      let unique = false;
      let hasRef = false;
      let refTable = "";
      let refColumn = "";

      let i = nextIdx;
      while (i < tokens.length) {
        const tok = normalizeKeyword(tokens[i]);

        if (tok === "not" && i + 1 < tokens.length && normalizeKeyword(tokens[i + 1]) === "null") {
          notNull = true;
          i += 2;
          continue;
        }
        if (tok === "null") {
          // explicit NULL — doesn't change default, but we skip it
          i++;
          continue;
        }
        if (tok === "primary" && i + 1 < tokens.length && normalizeKeyword(tokens[i + 1]) === "key") {
          pk = true;
          i += 2;
          continue;
        }
        if (tok === "unique") {
          unique = true;
          i++;
          continue;
        }
        if (tok === "default") {
          // skip default value
          i++;
          // consume until next known keyword or end
          while (i < tokens.length) {
            const next = normalizeKeyword(tokens[i]);
            if (["not", "null", "primary", "key", "unique", "references", "auto_increment"].includes(next)) break;
            i++;
          }
          continue;
        }
        if (tok === "references" && i + 1 < tokens.length) {
          const refMatch = tokens[i + 1].match(/^(\w+)\((\w+)\)$/i);
          if (refMatch) {
            hasRef = true;
            refTable = refMatch[1];
            refColumn = refMatch[2];
          }
          i += 2;
          continue;
        }
        if (tok === "auto_increment" || tok === "autoincrement") {
          i++;
          continue;
        }

        i++;
      }

      const col: SchemaColumn = {
        name: colName,
        type: type.toUpperCase(),
        pk,
        notNull: notNull || pk,
        unique: unique || pk,
      };
      columnIndexByName.set(colName, columns.length);
      columns.push(col);

      if (hasRef) {
        refs.push({ fromTable: tableName, fromColumn: colName, toTable: refTable, toColumn: refColumn });
      }
    }

    if (columns.length > 0) {
      tables.push({ name: tableName, columns });
    }
  }

  return { tables, refs };
}
