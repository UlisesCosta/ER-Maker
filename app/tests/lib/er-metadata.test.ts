/**
 * Tests for ER model metadata: source trace, inference, and manual overrides.
 * TDD RED — these reference types and functions that don't exist yet.
 */
import { describe, it, expect } from "bun:test";
import type {
  SourceTrace,
  InferenceMeta,
  OverrideMeta,
  EREntity,
  ERRelationship,
  ERAttribute,
} from "~/types/er-model";
import { applyOverrides } from "~/lib/er-overrides";
import { schemaToEr } from "~/lib/dbml-to-er";
import type { NeutralSchema } from "~/types/dbml-schema";

// ── SourceTrace ───────────────────────────────────────────────────────────────

describe("SourceTrace shape", () => {
  it("a DBML entity trace has origin dbml and the table name", () => {
    const trace: SourceTrace = {
      origin: "dbml",
      sourceId: "users",
    };
    expect(trace.origin).toBe("dbml");
    expect(trace.sourceId).toBe("users");
  });

  it("a manual trace has origin manual", () => {
    const trace: SourceTrace = { origin: "manual" };
    expect(trace.origin).toBe("manual");
  });
});

// ── InferenceMeta ─────────────────────────────────────────────────────────────

describe("InferenceMeta shape", () => {
  it("captures confidence and reasons", () => {
    const meta: InferenceMeta = {
      confidence: 0.9,
      reasons: ["pure join table: exactly 2 FK refs, no business columns"],
      inferredKind: "nm-relationship",
    };
    expect(meta.confidence).toBe(0.9);
    expect(meta.reasons).toHaveLength(1);
    expect(meta.inferredKind).toBe("nm-relationship");
  });
});

// ── OverrideMeta ──────────────────────────────────────────────────────────────

describe("OverrideMeta shape", () => {
  it("captures the overridden cardinality", () => {
    const override: OverrideMeta = {
      appliedAt: "2026-01-01",
      fields: { cardinality: "1" },
    };
    expect(override.fields.cardinality).toBe("1");
  });
});

// ── schemaToEr populates source traces ───────────────────────────────────────

const simpleSchema: NeutralSchema = {
  tables: [
    {
      name: "users",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true },
        { name: "email", type: "varchar", pk: false, notNull: false },
      ],
    },
    {
      name: "posts",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true },
        { name: "user_id", type: "int", pk: false, notNull: true },
        { name: "title", type: "varchar", pk: false, notNull: false },
      ],
    },
  ],
  refs: [{ fromTable: "posts", fromColumn: "user_id", toTable: "users", toColumn: "id" }],
};

describe("schemaToEr — source traces on entities", () => {
  it("entity has a source trace with origin dbml", () => {
    const diagram = schemaToEr(simpleSchema);
    const usersEntity = diagram.entities.find((e) => e.name === "USERS")!;
    expect(usersEntity.source).toBeDefined();
    expect(usersEntity.source!.origin).toBe("dbml");
  });

  it("entity source trace carries the original table name", () => {
    const diagram = schemaToEr(simpleSchema);
    const usersEntity = diagram.entities.find((e) => e.name === "USERS")!;
    expect(usersEntity.source!.sourceId).toBe("users");
  });
});

describe("schemaToEr — source traces on relationships", () => {
  it("1:N relationship has a source trace with origin dbml", () => {
    const diagram = schemaToEr(simpleSchema);
    expect(diagram.relationships[0].source).toBeDefined();
    expect(diagram.relationships[0].source!.origin).toBe("dbml");
  });
});

// ── schemaToEr populates inference metadata ───────────────────────────────────

const pureJoinSchema: NeutralSchema = {
  tables: [
    { name: "students", columns: [{ name: "id", type: "int", pk: true, notNull: true }] },
    { name: "courses", columns: [{ name: "id", type: "int", pk: true, notNull: true }] },
    {
      name: "student_courses",
      columns: [
        { name: "student_id", type: "int", pk: false, notNull: true },
        { name: "course_id", type: "int", pk: false, notNull: true },
      ],
    },
  ],
  refs: [
    { fromTable: "student_courses", fromColumn: "student_id", toTable: "students", toColumn: "id" },
    { fromTable: "student_courses", fromColumn: "course_id", toTable: "courses", toColumn: "id" },
  ],
};

describe("schemaToEr — inference metadata on 1:N relationship", () => {
  it("1:N relationship has inference metadata", () => {
    const diagram = schemaToEr(simpleSchema);
    const rel = diagram.relationships[0];
    expect(rel.inference).toBeDefined();
  });

  it("1:N confidence is between 0 and 1", () => {
    const diagram = schemaToEr(simpleSchema);
    const rel = diagram.relationships[0];
    expect(rel.inference!.confidence).toBeGreaterThan(0);
    expect(rel.inference!.confidence).toBeLessThanOrEqual(1);
  });

  it("1:N inference has at least one reason string", () => {
    const diagram = schemaToEr(simpleSchema);
    const rel = diagram.relationships[0];
    expect(rel.inference!.reasons.length).toBeGreaterThan(0);
    expect(typeof rel.inference!.reasons[0]).toBe("string");
  });

  it("1:N inferredKind is 1n-relationship", () => {
    const diagram = schemaToEr(simpleSchema);
    const rel = diagram.relationships[0];
    expect(rel.inference!.inferredKind).toBe("1n-relationship");
  });
});

describe("schemaToEr — inference metadata on N:M relationship from pure join", () => {
  it("N:M relationship has inference metadata", () => {
    const diagram = schemaToEr(pureJoinSchema);
    expect(diagram.relationships[0].inference).toBeDefined();
  });

  it("N:M inferredKind is nm-relationship", () => {
    const diagram = schemaToEr(pureJoinSchema);
    expect(diagram.relationships[0].inference!.inferredKind).toBe("nm-relationship");
  });

  it("N:M from pure join has higher confidence than 1:N", () => {
    const nm = schemaToEr(pureJoinSchema).relationships[0];
    const oneN = schemaToEr(simpleSchema).relationships[0];
    expect(nm.inference!.confidence).toBeGreaterThanOrEqual(oneN.inference!.confidence);
  });
});

// ── applyOverrides helper ─────────────────────────────────────────────────────

describe("applyOverrides", () => {
  it("applies a name override to a relationship", () => {
    const diagram = schemaToEr(simpleSchema);
    const rel = diagram.relationships[0];
    const updated = applyOverrides(diagram, {
      kind: "relationship",
      id: rel.id,
      fields: { name: "WROTE" },
    });
    const updatedRel = updated.relationships.find((r) => r.id === rel.id)!;
    expect(updatedRel.name).toBe("WROTE");
  });

  it("records override metadata on the relationship", () => {
    const diagram = schemaToEr(simpleSchema);
    const rel = diagram.relationships[0];
    const updated = applyOverrides(diagram, {
      kind: "relationship",
      id: rel.id,
      fields: { name: "AUTHORED" },
    });
    const updatedRel = updated.relationships.find((r) => r.id === rel.id)!;
    expect(updatedRel.override).toBeDefined();
    expect(updatedRel.override!.fields.name).toBe("AUTHORED");
  });

  it("does not mutate the original diagram", () => {
    const diagram = schemaToEr(simpleSchema);
    const originalName = diagram.relationships[0].name;
    applyOverrides(diagram, {
      kind: "relationship",
      id: diagram.relationships[0].id,
      fields: { name: "DIFFERENT" },
    });
    expect(diagram.relationships[0].name).toBe(originalName);
  });

  it("applying override to unknown id returns diagram unchanged", () => {
    const diagram = schemaToEr(simpleSchema);
    const updated = applyOverrides(diagram, {
      kind: "relationship",
      id: "nonexistent-id",
      fields: { name: "FOO" },
    });
    expect(updated.relationships.length).toBe(diagram.relationships.length);
  });
});
