import {
  BaseEdge,
  getStraightPath,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";
import {
  intersectRectangle,
  intersectOval,
  intersectDiamond,
  type Point,
} from "~/lib/perimeter-intersection";

const DIAMOND_HALF = 42;

function getPerimeterPoint(
  nodeType: string | undefined,
  nodeCenter: Point,
  toward: Point,
  width: number,
  height: number
): Point {
  switch (nodeType) {
    case "erEntity":
      return intersectRectangle(nodeCenter, toward, {
        x: nodeCenter.x - width / 2,
        y: nodeCenter.y - height / 2,
        width,
        height,
      });
    case "erAttribute":
      return intersectOval(nodeCenter, toward, nodeCenter, width / 2, height / 2);
    case "erRelationship":
      return intersectDiamond(nodeCenter, toward, nodeCenter, DIAMOND_HALF, DIAMOND_HALF);
    default:
      return nodeCenter;
  }
}

export function ErAttributeEdge({ id, source, target, style }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const srcRect = {
    x: sourceNode.internals.positionAbsolute.x,
    y: sourceNode.internals.positionAbsolute.y,
    w: sourceNode.measured.width  ?? sourceNode.width  ?? 140,
    h: sourceNode.measured.height ?? sourceNode.height ?? 50,
  };
  const tgtRect = {
    x: targetNode.internals.positionAbsolute.x,
    y: targetNode.internals.positionAbsolute.y,
    w: targetNode.measured.width  ?? targetNode.width  ?? 110,
    h: targetNode.measured.height ?? targetNode.height ?? 36,
  };

  const srcCenter: Point = { x: srcRect.x + srcRect.w / 2, y: srcRect.y + srcRect.h / 2 };
  const tgtCenter: Point = { x: tgtRect.x + tgtRect.w / 2, y: tgtRect.y + tgtRect.h / 2 };

  const srcPt = getPerimeterPoint(sourceNode.type, srcCenter, tgtCenter, srcRect.w, srcRect.h);
  const tgtPt = getPerimeterPoint(targetNode.type, tgtCenter, srcCenter, tgtRect.w, tgtRect.h);

  const [edgePath] = getStraightPath({
    sourceX: srcPt.x,
    sourceY: srcPt.y,
    targetX: tgtPt.x,
    targetY: tgtPt.y,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: "var(--color-outline-variant)",
        strokeWidth: 1,
        ...style,
      }}
    />
  );
}
