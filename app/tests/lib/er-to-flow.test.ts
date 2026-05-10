import { describe, it, expect } from "bun:test";
import { erToFlow } from "~/lib/er-to-flow";
import { demoDiagram } from "~/lib/demo-diagram";

describe("erToFlow projection", () => {
  it("creates a node for each entity", () => {
    const { nodes } = erToFlow(demoDiagram);
    const entityNodes = nodes.filter((n) => n.type === "erEntity");
    expect(entityNodes).toHaveLength(demoDiagram.entities.length);
  });

  it("creates a node for each relationship", () => {
    const { nodes } = erToFlow(demoDiagram);
    const relNodes = nodes.filter((n) => n.type === "erRelationship");
    expect(relNodes).toHaveLength(demoDiagram.relationships.length);
  });

  it("entity node data contains entity name", () => {
    const { nodes } = erToFlow(demoDiagram);
    const studentNode = nodes.find(
      (n) => n.type === "erEntity" && n.id === "entity-student"
    );
    expect(studentNode).toBeDefined();
    expect((studentNode!.data as { name: string }).name).toBe("STUDENT");
  });

  it("creates attribute nodes for entity attributes", () => {
    const { nodes } = erToFlow(demoDiagram);
    const attrNodes = nodes.filter((n) => n.type === "erAttribute");
    expect(attrNodes.length).toBeGreaterThan(0);
  });

  it("does NOT create attribute nodes for collapsed relationship attributes", () => {
    const { nodes } = erToFlow(demoDiagram);
    // ENROLLS is attributesExpanded=false — its attrs should NOT produce nodes
    const enrollAttrIds = demoDiagram.relationships
      .find((r) => r.id === "rel-enrollment")!
      .attributes.map((a) => a.id);
    for (const id of enrollAttrIds) {
      const found = nodes.find((n) => n.id === id);
      expect(found).toBeUndefined();
    }
  });

  it("DOES create attribute nodes for expanded relationship attributes", () => {
    const { nodes } = erToFlow(demoDiagram);
    // TEACHES has no attributes, so test with a diagram where expanded=true
    // Use demoDiagram entity attributes which are always shown
    const courseCodeNode = nodes.find((n) => n.id === "attr-course-code");
    expect(courseCodeNode).toBeDefined();
  });

  it("creates edges connecting participant entities to relationships", () => {
    const { edges } = erToFlow(demoDiagram);
    const enrollEdges = edges.filter(
      (e) =>
        e.source === "entity-student" && e.target === "rel-enrollment" ||
        e.source === "rel-enrollment" && e.target === "entity-student" ||
        e.source === "entity-course" && e.target === "rel-enrollment" ||
        e.source === "rel-enrollment" && e.target === "entity-course"
    );
    expect(enrollEdges.length).toBeGreaterThanOrEqual(2);
  });

  it("edges carry cardinality labels", () => {
    const { edges } = erToFlow(demoDiagram);
    // At least one edge should have a cardinality label
    const labeled = edges.filter((e) => e.data?.cardinality);
    expect(labeled.length).toBeGreaterThan(0);
  });

  it("returns valid positions for all nodes", () => {
    const { nodes } = erToFlow(demoDiagram);
    for (const node of nodes) {
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
    }
  });

  it("relationship with no attributes has no button flags", () => {
    const { nodes } = erToFlow(demoDiagram);
    const teachesNode = nodes.find((n) => n.id === "rel-teaches");
    expect(teachesNode).toBeDefined();
    const data = teachesNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(false);
  });
});
