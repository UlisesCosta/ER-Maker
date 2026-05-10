import type { Node } from "@xyflow/react";

/**
 * Pure helper — injects callbacks into relationship nodes.
 * Entity and attribute nodes are returned unchanged.
 */
export function withToggleCallback(
  nodes: Node[],
  onToggle: (relId: string) => void,
  onHover?: (relId: string) => void,
  onUnhover?: (relId: string) => void
): Node[] {
  return nodes.map((n) => {
    if (n.type === "erRelationship") {
      return {
        ...n,
        data: {
          ...n.data,
          onToggleExpand: () => onToggle(n.id),
          onHover: onHover ? () => onHover(n.id) : undefined,
          onUnhover: onUnhover ? () => onUnhover(n.id) : undefined,
        },
      };
    }
    return n;
  });
}
