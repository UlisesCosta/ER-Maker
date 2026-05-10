import {
  BaseEdge,
  EdgeLabelRenderer,
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

function getShapeIntersection(
  nodeType: string | undefined,
  nodeCenter: Point,
  otherCenter: Point,
  width: number,
  height: number
): Point {
  switch (nodeType) {
    case "erEntity":
      return intersectRectangle(nodeCenter, otherCenter, {
        x: nodeCenter.x - width / 2,
        y: nodeCenter.y - height / 2,
        width,
        height,
      });
    case "erAttribute":
      return intersectOval(nodeCenter, otherCenter, nodeCenter, width / 2, height / 2);
    case "erRelationship":
      return intersectDiamond(nodeCenter, otherCenter, nodeCenter, DIAMOND_HALF, DIAMOND_HALF);
    default:
      return nodeCenter;
  }
}

export function ErParticipantEdge({
  id,
  source,
  target,
  data,
  style,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const sourceRect = {
    x: sourceNode.internals.positionAbsolute.x,
    y: sourceNode.internals.positionAbsolute.y,
    width: sourceNode.measured.width ?? sourceNode.width ?? 140,
    height: sourceNode.measured.height ?? sourceNode.height ?? 50,
  };

  const targetRect = {
    x: targetNode.internals.positionAbsolute.x,
    y: targetNode.internals.positionAbsolute.y,
    width: targetNode.measured.width ?? targetNode.width ?? 88,
    height: targetNode.measured.height ?? targetNode.height ?? 88,
  };

  const sourceCenter = {
    x: sourceRect.x + sourceRect.width / 2,
    y: sourceRect.y + sourceRect.height / 2,
  };

  const targetCenter = {
    x: targetRect.x + targetRect.width / 2,
    y: targetRect.y + targetRect.height / 2,
  };

  const sourceIntersection = getShapeIntersection(
    sourceNode.type,
    sourceCenter,
    targetCenter,
    sourceRect.width,
    sourceRect.height
  );

  const targetIntersection = getShapeIntersection(
    targetNode.type,
    targetCenter,
    sourceCenter,
    targetRect.width,
    targetRect.height
  );

  const [edgePath] = getStraightPath({
    sourceX: sourceIntersection.x,
    sourceY: sourceIntersection.y,
    targetX: targetIntersection.x,
    targetY: targetIntersection.y,
  });

  const cardinality = data?.cardinality as string | undefined;
  const edgeStyle = (data?.style as React.CSSProperties | undefined) ?? style;

  // Position label ~70% toward target
  const labelX = sourceIntersection.x + (targetIntersection.x - sourceIntersection.x) * 0.7;
  const labelY = sourceIntersection.y + (targetIntersection.y - sourceIntersection.y) * 0.7;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={edgeStyle} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: "var(--color-surface-container)",
            padding: "2px 6px",
            borderRadius: 3,
            fontSize: 10,
            color: "var(--color-on-surface-variant)",
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          {cardinality}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
