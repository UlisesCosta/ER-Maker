/**
 * V2 heuristic tests — strict TDD RED phase.
 * These reference new behaviour that does NOT exist yet in the implementation.
 *
 * Covers:
 *   1. Parser: [unique] flag captured in SchemaColumn
 *   2. Interpreter: participation total/partial from nullability
 *   3. Interpreter: 1:1 cardinality from unique FK
 *   4. Interpreter: joinTableKind classification in InferenceMeta
 *   5. Interpreter: confidence calibration for each classification
 */
import { describe, it, expect } from "bun:test";
import { parseDbml } from "~/lib/dbml-parser";
import { schemaToEr } from "~/lib/dbml-to-er";
import type { NeutralSchema } from "~/types/dbml-schema";

// ── 1. Parser: unique flag ─────────────────────────────────────────────────────

describe("parseDbml — unique flag", () => {
  it("parses [unique] annotation on a column", () => {
    const input = `
Table users {
  id int [pk]
  email varchar [unique]
  username varchar
}
`;
    const schema = parseDbml(input);
    const emailCol = schema.tables[0].columns.find((c) => c.name === "email");
    expect(emailCol?.unique).toBe(true);
  });

  it("columns without [unique] have unique=false", () => {
    const input = `
Table users {
  id int [pk]
  email varchar [unique]
  username varchar
}
`;
    const schema = parseDbml(input);
    const usernameCol = schema.tables[0].columns.find((c) => c.name === "username");
    expect(usernameCol?.unique).toBe(false);
  });

  it("pk column has unique implied (unique=true)", () => {
    const input = `
Table users {
  id int [pk]
}
`;
    const schema = parseDbml(input);
    const idCol = schema.tables[0].columns.find((c) => c.name === "id");
    expect(idCol?.unique).toBe(true);
  });

  it("parses [not null, unique] compound annotation", () => {
    const input = `
Table accounts {
  code varchar [not null, unique]
}
`;
    const schema = parseDbml(input);
    const codeCol = schema.tables[0].columns.find((c) => c.name === "code");
    expect(codeCol?.notNull).toBe(true);
    expect(codeCol?.unique).toBe(true);
  });
});

// ── 2. Interpreter: participation from nullability ─────────────────────────────

const nullableFK: NeutralSchema = {
  tables: [
    {
      name: "employees",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true, unique: true },
        { name: "dept_id", type: "int", pk: false, notNull: false, unique: false }, // nullable FK
      ],
    },
    {
      name: "departments",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true, unique: true },
        { name: "name", type: "varchar", pk: false, notNull: true, unique: false },
      ],
    },
  ],
  refs: [{ fromTable: "employees", fromColumn: "dept_id", toTable: "departments", toColumn: "id" }],
};

const notNullFK: NeutralSchema = {
  tables: [
    {
      name: "posts",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true, unique: true },
        { name: "user_id", type: "int", pk: false, notNull: true, unique: false }, // NOT NULL FK
        { name: "title", type: "varchar", pk: false, notNull: false, unique: false },
      ],
    },
    {
      name: "users",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true, unique: true },
        { name: "username", type: "varchar", pk: false, notNull: false, unique: false },
      ],
    },
  ],
  refs: [{ fromTable: "posts", fromColumn: "user_id", toTable: "users", toColumn: "id" }],
};

describe("schemaToEr — participation from nullability", () => {
  it("nullable FK column → partial participation on the FK side", () => {
    const diagram = schemaToEr(nullableFK);
    const rel = diagram.relationships[0];
    // employees.dept_id is nullable → EMPLOYEES side is partial
    const empParticipant = rel.participants.find((p) =>
      p.entityId.includes("employees")
    );
    expect(empParticipant?.participation).toBe("partial");
  });

  it("nullable FK column → inference reason mentions nullable", () => {
    const diagram = schemaToEr(nullableFK);
    const rel = diagram.relationships[0];
    const allReasons = rel.inference!.reasons.join(" ");
    expect(allReasons).toMatch(/nullable|null/i);
  });

  it("NOT NULL FK column → total participation on FK side", () => {
    const diagram = schemaToEr(notNullFK);
    const rel = diagram.relationships[0];
    // posts.user_id is NOT NULL → POSTS side is total
    const postsParticipant = rel.participants.find((p) =>
      p.entityId.includes("posts")
    );
    expect(postsParticipant?.participation).toBe("total");
  });

  it("NOT NULL FK → inference reason mentions not null", () => {
    const diagram = schemaToEr(notNullFK);
    const rel = diagram.relationships[0];
    const allReasons = rel.inference!.reasons.join(" ");
    expect(allReasons).toMatch(/not null|required/i);
  });
});

// ── 3. Interpreter: 1:1 from unique FK ────────────────────────────────────────

const uniqueFKSchema: NeutralSchema = {
  tables: [
    {
      name: "users",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true, unique: true },
        { name: "username", type: "varchar", pk: false, notNull: false, unique: false },
      ],
    },
    {
      name: "user_profiles",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true, unique: true },
        { name: "user_id", type: "int", pk: false, notNull: true, unique: true }, // UNIQUE FK → 1:1
        { name: "bio", type: "text", pk: false, notNull: false, unique: false },
      ],
    },
  ],
  refs: [{ fromTable: "user_profiles", fromColumn: "user_id", toTable: "users", toColumn: "id" }],
};

const nonUniqueFKSchema: NeutralSchema = {
  tables: [
    {
      name: "users",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true, unique: true },
      ],
    },
    {
      name: "orders",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true, unique: true },
        { name: "user_id", type: "int", pk: false, notNull: true, unique: false }, // non-unique → 1:N
      ],
    },
  ],
  refs: [{ fromTable: "orders", fromColumn: "user_id", toTable: "users", toColumn: "id" }],
};

describe("schemaToEr — 1:1 vs 1:N from FK uniqueness", () => {
  it("unique FK column → 1:1 cardinality (both participants cardinality=1)", () => {
    const diagram = schemaToEr(uniqueFKSchema);
    const rel = diagram.relationships[0];
    const cardinalities = rel.participants.map((p) => p.cardinality);
    expect(cardinalities).not.toContain("N");
    expect(cardinalities.every((c) => c === "1")).toBe(true);
  });

  it("unique FK → inferredKind is 11-relationship", () => {
    const diagram = schemaToEr(uniqueFKSchema);
    const rel = diagram.relationships[0];
    expect(rel.inference!.inferredKind).toBe("11-relationship");
  });

  it("unique FK → inference reason mentions unique", () => {
    const diagram = schemaToEr(uniqueFKSchema);
    const rel = diagram.relationships[0];
    const allReasons = rel.inference!.reasons.join(" ");
    expect(allReasons).toMatch(/unique/i);
  });

  it("non-unique FK → 1:N cardinality preserved", () => {
    const diagram = schemaToEr(nonUniqueFKSchema);
    const rel = diagram.relationships[0];
    const cardinalities = rel.participants.map((p) => p.cardinality);
    expect(cardinalities).toContain("N");
    expect(cardinalities).toContain("1");
  });
});

// ── 4. Interpreter: joinTableKind classification ───────────────────────────────

// Pure join: only FK cols, no PK of its own
const pureJoinSchema: NeutralSchema = {
  tables: [
    { name: "students", columns: [{ name: "id", type: "int", pk: true, notNull: true, unique: true }] },
    { name: "courses", columns: [{ name: "id", type: "int", pk: true, notNull: true, unique: true }] },
    {
      name: "student_courses",
      columns: [
        { name: "student_id", type: "int", pk: false, notNull: true, unique: false },
        { name: "course_id", type: "int", pk: false, notNull: true, unique: false },
      ],
    },
  ],
  refs: [
    { fromTable: "student_courses", fromColumn: "student_id", toTable: "students", toColumn: "id" },
    { fromTable: "student_courses", fromColumn: "course_id", toTable: "courses", toColumn: "id" },
  ],
};

// Enriched simple: FK cols + a couple of attributes, no own PK
const enrichedSimpleSchema: NeutralSchema = {
  tables: [
    { name: "students", columns: [{ name: "id", type: "int", pk: true, notNull: true, unique: true }] },
    { name: "courses", columns: [{ name: "id", type: "int", pk: true, notNull: true, unique: true }] },
    {
      name: "enrollments",
      columns: [
        { name: "student_id", type: "int", pk: false, notNull: true, unique: false },
        { name: "course_id", type: "int", pk: false, notNull: true, unique: false },
        { name: "grade", type: "varchar", pk: false, notNull: false, unique: false },
        { name: "enrolled_at", type: "varchar", pk: false, notNull: false, unique: false },
      ],
    },
  ],
  refs: [
    { fromTable: "enrollments", fromColumn: "student_id", toTable: "students", toColumn: "id" },
    { fromTable: "enrollments", fromColumn: "course_id", toTable: "courses", toColumn: "id" },
  ],
};

// Associative entity candidate: FK cols + own PK + multiple substantial attributes
const associativeEntityCandidateSchema: NeutralSchema = {
  tables: [
    { name: "doctors", columns: [{ name: "id", type: "int", pk: true, notNull: true, unique: true }] },
    { name: "patients", columns: [{ name: "id", type: "int", pk: true, notNull: true, unique: true }] },
    {
      name: "appointments",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true, unique: true },    // own PK
        { name: "doctor_id", type: "int", pk: false, notNull: true, unique: false },
        { name: "patient_id", type: "int", pk: false, notNull: true, unique: false },
        { name: "scheduled_at", type: "timestamp", pk: false, notNull: true, unique: false },
        { name: "notes", type: "text", pk: false, notNull: false, unique: false },
        { name: "status", type: "varchar", pk: false, notNull: true, unique: false },
      ],
    },
  ],
  refs: [
    { fromTable: "appointments", fromColumn: "doctor_id", toTable: "doctors", toColumn: "id" },
    { fromTable: "appointments", fromColumn: "patient_id", toTable: "patients", toColumn: "id" },
  ],
};

describe("schemaToEr — joinTableKind classification", () => {
  it("pure join table has joinTableKind = pure", () => {
    const diagram = schemaToEr(pureJoinSchema);
    expect(diagram.relationships[0].inference!.joinTableKind).toBe("pure");
  });

  it("enriched join with few extra cols has joinTableKind = enriched-simple", () => {
    const diagram = schemaToEr(enrichedSimpleSchema);
    expect(diagram.relationships[0].inference!.joinTableKind).toBe("enriched-simple");
  });

  it("join table with own PK + many business cols has joinTableKind = associative-entity-candidate", () => {
    const diagram = schemaToEr(associativeEntityCandidateSchema);
    expect(diagram.relationships[0].inference!.joinTableKind).toBe("associative-entity-candidate");
  });

  it("non-join 1:N relationship has no joinTableKind", () => {
    const diagram = schemaToEr(notNullFK);
    expect(diagram.relationships[0].inference!.joinTableKind).toBeUndefined();
  });

  it("associative-entity-candidate has lower confidence than pure join", () => {
    const pure = schemaToEr(pureJoinSchema).relationships[0];
    const assoc = schemaToEr(associativeEntityCandidateSchema).relationships[0];
    // Associative entity candidates are more ambiguous → lower confidence
    expect(assoc.inference!.confidence).toBeLessThan(pure.inference!.confidence);
  });

  it("associative-entity-candidate inference mentions ambiguity", () => {
    const diagram = schemaToEr(associativeEntityCandidateSchema);
    const allReasons = diagram.relationships[0].inference!.reasons.join(" ");
    expect(allReasons).toMatch(/ambiguous|candidate|own pk|own PK/i);
  });
});
