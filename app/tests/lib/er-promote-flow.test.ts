/**
 * TDD: erToFlow projection for promoted (associative) entities
 * RED phase — tests for new associative entity projection behavior.
 */
import { describe, it, expect } from "bun:test";
import { erToFlow } from "~/lib/er-to-flow";
import { promoteToAssociativeEntity } from "~/lib/er-promote";
import type { ERDiagram, ERRelationship } from "~/types/er-model";

const rel: ERRelationship = {
  type: "relationship",
  id: "rel-enroll",
  name: "Enrollment",
  participants: [
    { entityId: "ent-student", cardinality: "N", participation: "partial" },
    { entityId: "ent-course", cardinality: "M", participation: "partial" },
  ],
  attributes: [
    { id: "attr-grade", name: "grade", kind: "simple" },
  ],
  source: { origin: "dbml", sourceId: "enrollments" },
  inference: {
    confidence: 0.75,
    reasons: ["has own PK"],
    inferredKind: "nm-relationship",
    joinTableKind: "associative-entity-candidate",
  },
};

const diagram: ERDiagram = {
  id: "diag-1",
  name: "Test",
  entities: [
    { type: "entity", id: "ent-student", name: "Student", attributes: [] },
    { type: "entity", id: "ent-course", name: "Course", attributes: [] },
  ],
  relationships: [rel],
};

describe("erToFlow — promoted associative entity", () => {
  it("promoted entity node carries associative=true in data", () => {
    const promoted = promoteToAssociativeEntity(diagram, "rel-enroll");
    const { nodes } = erToFlow(promoted);
    const entityNode = nodes.find(
      (n) => n.type === "erEntity" && (n.data as { name: string }).name === "Enrollment"
    );
    expect(entityNode).toBeDefined();
    expect((entityNode!.data as { associative?: boolean }).associative).toBe(true);
  });

  it("non-promoted entities do NOT carry associative flag", () => {
    const promoted = promoteToAssociativeEntity(diagram, "rel-enroll");
    const { nodes } = erToFlow(promoted);
    const studentNode = nodes.find(
      (n) => n.type === "erEntity" && (n.data as { name: string }).name === "Student"
    );
    expect(studentNode).toBeDefined();
    expect((studentNode!.data as { associative?: boolean }).associative).toBeFalsy();
  });

  it("connecting relationship nodes are created for each participant", () => {
    const promoted = promoteToAssociativeEntity(diagram, "rel-enroll");
    const { nodes } = erToFlow(promoted);
    const relNodes = nodes.filter((n) => n.type === "erRelationship");
    // 2 connecting rels (one per original participant)
    expect(relNodes).toHaveLength(2);
  });

  it("attribute nodes of the promoted entity are rendered on the canvas", () => {
    const promoted = promoteToAssociativeEntity(diagram, "rel-enroll");
    const { nodes } = erToFlow(promoted);
    const gradeAttr = nodes.find((n) => n.id === "attr-grade");
    expect(gradeAttr).toBeDefined();
  });
});
