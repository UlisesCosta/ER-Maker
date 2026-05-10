import { describe, it, expect } from "bun:test";
import { demoDiagram } from "~/lib/demo-diagram";

describe("demoDiagram fixture", () => {
  it("has at least two entities", () => {
    expect(demoDiagram.entities.length).toBeGreaterThanOrEqual(2);
  });

  it("has at least one relationship", () => {
    expect(demoDiagram.relationships.length).toBeGreaterThanOrEqual(1);
  });

  it("has an N:M relationship", () => {
    const nm = demoDiagram.relationships.find((r) =>
      r.participants.some((p) => p.cardinality === "N") &&
      r.participants.some((p) => p.cardinality === "M")
    );
    expect(nm).toBeDefined();
  });

  it("N:M relationship has at least one attribute", () => {
    const nm = demoDiagram.relationships.find((r) =>
      r.participants.some((p) => p.cardinality === "N") &&
      r.participants.some((p) => p.cardinality === "M")
    )!;
    expect(nm.attributes.length).toBeGreaterThanOrEqual(1);
  });

  it("N:M relationship starts with attributesExpanded false", () => {
    const nm = demoDiagram.relationships.find((r) =>
      r.participants.some((p) => p.cardinality === "N") &&
      r.participants.some((p) => p.cardinality === "M")
    )!;
    expect(nm.attributesExpanded).toBe(false);
  });

  it("entities have key attributes", () => {
    for (const entity of demoDiagram.entities) {
      const hasKey = entity.attributes.some((a) => a.kind === "key");
      expect(hasKey).toBe(true);
    }
  });

  it("participants reference existing entity ids", () => {
    const entityIds = new Set(demoDiagram.entities.map((e) => e.id));
    for (const rel of demoDiagram.relationships) {
      for (const p of rel.participants) {
        expect(entityIds.has(p.entityId)).toBe(true);
      }
    }
  });
});
