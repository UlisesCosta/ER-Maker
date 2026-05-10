import { describe, it, expect, mock } from "bun:test";
import { withToggleCallback } from "~/lib/with-toggle-callback";
import type { Node } from "@xyflow/react";

const makeNode = (id: string, type: string, extra?: object): Node =>
  ({
    id,
    type,
    position: { x: 0, y: 0 },
    data: { label: id, ...extra },
  } as Node);

describe("withToggleCallback", () => {
  it("leaves non-relationship nodes unchanged", () => {
    const nodes: Node[] = [makeNode("e1", "erEntity"), makeNode("a1", "erAttribute")];
    const onToggle = mock(() => {});
    const result = withToggleCallback(nodes, onToggle);
    expect(result[0].data).toEqual({ label: "e1" });
    expect(result[1].data).toEqual({ label: "a1" });
    expect(result).toHaveLength(2);
  });

  it("injects onToggleExpand callback into relationship nodes", () => {
    const nodes: Node[] = [makeNode("r1", "erRelationship")];
    const onToggle = mock((_id: string) => {});
    const result = withToggleCallback(nodes, onToggle);
    expect(typeof result[0].data.onToggleExpand).toBe("function");
  });

  it("calling onToggleExpand triggers onToggle with the node id", () => {
    const nodes: Node[] = [makeNode("r1", "erRelationship")];
    const onToggle = mock((_id: string) => {});
    const result = withToggleCallback(nodes, onToggle);
    (result[0].data.onToggleExpand as () => void)();
    expect(onToggle).toHaveBeenCalledWith("r1");
  });

  it("preserves existing data fields on relationship nodes", () => {
    const nodes: Node[] = [makeNode("r1", "erRelationship", { name: "enrolls", count: 2 })];
    const onToggle = mock((_id: string) => {});
    const result = withToggleCallback(nodes, onToggle);
    expect(result[0].data.name).toBe("enrolls");
    expect(result[0].data.count).toBe(2);
  });

  it("handles mixed node types correctly", () => {
    const nodes: Node[] = [
      makeNode("e1", "erEntity"),
      makeNode("r1", "erRelationship"),
      makeNode("a1", "erAttribute"),
    ];
    const onToggle = mock((_id: string) => {});
    const result = withToggleCallback(nodes, onToggle);
    expect(result[0].data.onToggleExpand).toBeUndefined();
    expect(typeof result[1].data.onToggleExpand).toBe("function");
    expect(result[2].data.onToggleExpand).toBeUndefined();
  });
});
