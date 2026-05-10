import { describe, it, expect } from "bun:test";
import { parseDbml } from "~/lib/dbml-parser";

// ── V1 supported subset ───────────────────────────────────────────────────────
// Table { columns with types, [pk], [not null] }
// Ref: table.col > table.col  (many-to-one direction marker)
// Line comments (//)
// Table-level Note: "..."
// ─────────────────────────────────────────────────────────────────────────────

const SIMPLE_TABLE = `
Table users {
  id int [pk]
  username varchar [not null]
  email varchar
}
`;

const TWO_TABLES_WITH_REF = `
Table posts {
  id int [pk]
  user_id int [not null]
  title varchar
}

Table users {
  id int [pk]
  username varchar
}

Ref: posts.user_id > users.id
`;

const JOIN_TABLE = `
Table students {
  id int [pk]
  name varchar
}

Table courses {
  id int [pk]
  title varchar
}

Table enrollments {
  student_id int [not null]
  course_id int [not null]
  grade varchar
  enrolled_at varchar
}

Ref: enrollments.student_id > students.id
Ref: enrollments.course_id > courses.id
`;

describe("parseDbml", () => {
  it("parses a single table with columns", () => {
    const schema = parseDbml(SIMPLE_TABLE);
    expect(schema.tables).toHaveLength(1);
    expect(schema.tables[0].name).toBe("users");
    expect(schema.tables[0].columns).toHaveLength(3);
  });

  it("marks pk columns correctly", () => {
    const schema = parseDbml(SIMPLE_TABLE);
    const idCol = schema.tables[0].columns.find((c) => c.name === "id");
    expect(idCol?.pk).toBe(true);
  });

  it("marks not null columns correctly", () => {
    const schema = parseDbml(SIMPLE_TABLE);
    const usernameCol = schema.tables[0].columns.find((c) => c.name === "username");
    expect(usernameCol?.notNull).toBe(true);
  });

  it("plain columns have pk=false and notNull=false", () => {
    const schema = parseDbml(SIMPLE_TABLE);
    const emailCol = schema.tables[0].columns.find((c) => c.name === "email");
    expect(emailCol?.pk).toBe(false);
    expect(emailCol?.notNull).toBe(false);
  });

  it("parses two tables", () => {
    const schema = parseDbml(TWO_TABLES_WITH_REF);
    expect(schema.tables).toHaveLength(2);
  });

  it("parses Ref: directives", () => {
    const schema = parseDbml(TWO_TABLES_WITH_REF);
    expect(schema.refs).toHaveLength(1);
    expect(schema.refs[0].fromTable).toBe("posts");
    expect(schema.refs[0].fromColumn).toBe("user_id");
    expect(schema.refs[0].toTable).toBe("users");
    expect(schema.refs[0].toColumn).toBe("id");
  });

  it("parses a join table scenario with multiple refs", () => {
    const schema = parseDbml(JOIN_TABLE);
    expect(schema.refs).toHaveLength(2);
    const tableNames = schema.tables.map((t) => t.name);
    expect(tableNames).toContain("enrollments");
    expect(tableNames).toContain("students");
    expect(tableNames).toContain("courses");
  });

  it("returns empty schema for empty input", () => {
    const schema = parseDbml("");
    expect(schema.tables).toHaveLength(0);
    expect(schema.refs).toHaveLength(0);
  });

  it("ignores line comments", () => {
    const input = `
// This is a comment
Table users {
  // another comment
  id int [pk]
}
`;
    const schema = parseDbml(input);
    expect(schema.tables).toHaveLength(1);
    expect(schema.tables[0].columns).toHaveLength(1);
  });

  it("captures column type", () => {
    const schema = parseDbml(SIMPLE_TABLE);
    const idCol = schema.tables[0].columns.find((c) => c.name === "id");
    expect(idCol?.type).toBe("int");
  });

  it("captures alias on Ref lines", () => {
    const input = `
Table users {
  id int [pk]
}
Table posts {
  id int [pk]
  user_id int
}
Ref: posts.user_id > users.id [alias: "ESCRIBE"]
`;
    const schema = parseDbml(input);
    expect(schema.refs).toHaveLength(1);
    expect(schema.refs[0].alias).toBe("ESCRIBE");
  });

  it("falls back to undefined alias when not present on Ref", () => {
    const input = `
Table users {
  id int [pk]
}
Table posts {
  id int [pk]
  user_id int
}
Ref: posts.user_id > users.id
`;
    const schema = parseDbml(input);
    expect(schema.refs[0].alias).toBeUndefined();
  });
});
