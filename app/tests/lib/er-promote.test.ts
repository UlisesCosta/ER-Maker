/**
 * TDD: promoteToAssociativeEntity transformation
 * RED phase — these tests reference code that does not exist yet.
 */
import { describe, it, expect } from "bun:test";
import { promoteToAssociativeEntity } from "~/lib/er-promote";
import type { ERDiagram, ERRelationship } from "~/types/er-model";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseRelationship: ERRelationship = {
  type: "relationship",
  id: "rel-enroll",
  name: "Enrollment",
  participants: [
    { entityId: "ent-student", cardinality: "N", participation: "partial" },
    { entityId: "ent-course", cardinality: "M", participation: "partial" },
  ],
  attributes: [
    { id: "attr-grade", name: "grade", kind: "simple" },
    { id: "attr-date", name: "enrollment_date", kind: "simple" },
  ],
  source: { origin: "dbml", sourceId: "enrollments" },
  inference: {
    confidence: 0.75,
    reasons: ["has own PK", "has 2 non-FK attrs"],
    inferredKind: "nm-relationship",
    joinTableKind: "associative-entity-candidate",
  },
};

const baseDiagram: ERDiagram = {
  id: "diag-1",
  name: "Test",
  entities: [
    { type: "entity", id: "ent-student", name: "Student", attributes: [] },
    { type: "entity", id: "ent-course", name: "Course", attributes: [] },
  ],
  relationships: [baseRelationship],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("promoteToAssociativeEntity", () => {
  it("removes the original relationship from the diagram", () => {
    const result = promoteToAssociativeEntity(baseDiagram, "rel-enroll");
    const stillExists = result.relationships.some((r) => r.id === "rel-enroll");
    expect(stillExists).toBe(false);
  });

  it("creates a new entity with the relationship name", () => {
    const result = promoteToAssociativeEntity(baseDiagram, "rel-enroll");
    const newEntity = result.entities.find((e) => e.name === "Enrollment");
    expect(newEntity).toBeDefined();
    expect(newEntity!.type).toBe("entity");
  });

  it("moves relationship attributes onto the new entity", () => {
    const result = promoteToAssociativeEntity(baseDiagram, "rel-enroll");
    const newEntity = result.entities.find((e) => e.name === "Enrollment");
    const attrNames = newEntity!.attributes.map((a) => a.name);
    expect(attrNames).toContain("grade");
    expect(attrNames).toContain("enrollment_date");
  });

  it("creates two new identifying relationships connecting the new entity back to participants", () => {
    const result = promoteToAssociativeEntity(baseDiagram, "rel-enroll");
    // The two new relationships should connect the promoted entity to each original participant
    const newEntity = result.entities.find((e) => e.name === "Enrollment")!;
    const rels = result.relationships.filter((r) =>
      r.participants.some((p) => p.entityId === newEntity.id)
    );
    expect(rels).toHaveLength(2);
  });

  it("each connecting relationship has exactly 2 participants: promoted entity and original entity", () => {
    const result = promoteToAssociativeEntity(baseDiagram, "rel-enroll");
    const newEntity = result.entities.find((e) => e.name === "Enrollment")!;
    const rels = result.relationships.filter((r) =>
      r.participants.some((p) => p.entityId === newEntity.id)
    );
    for (const rel of rels) {
      expect(rel.participants).toHaveLength(2);
    }
    // One rel connects to Student, other to Course
    const participantIds = rels.flatMap((r) =>
      r.participants.map((p) => p.entityId)
    );
    expect(participantIds).toContain("ent-student");
    expect(participantIds).toContain("ent-course");
  });

  it("records promotion override metadata on the new entity", () => {
    const result = promoteToAssociativeEntity(baseDiagram, "rel-enroll");
    const newEntity = result.entities.find((e) => e.name === "Enrollment")!;
    expect(newEntity.override).toBeDefined();
    expect(newEntity.override!.fields).toHaveProperty("name", "Enrollment");
  });

  it("preserves original entities untouched", () => {
    const result = promoteToAssociativeEntity(baseDiagram, "rel-enroll");
    const student = result.entities.find((e) => e.id === "ent-student");
    const course = result.entities.find((e) => e.id === "ent-course");
    expect(student).toBeDefined();
    expect(course).toBeDefined();
    expect(student!.name).toBe("Student");
    expect(course!.name).toBe("Course");
  });

  it("returns diagram unchanged if relationship id is not found", () => {
    const result = promoteToAssociativeEntity(baseDiagram, "nonexistent");
    expect(result).toBe(baseDiagram); // same reference = no mutation
  });

  it("returns diagram unchanged if relationship has no participants", () => {
    const noParticipantsDiagram: ERDiagram = {
      ...baseDiagram,
      relationships: [{ ...baseRelationship, participants: [] }],
    };
    const result = promoteToAssociativeEntity(noParticipantsDiagram, "rel-enroll");
    expect(result).toBe(noParticipantsDiagram);
  });
});
