import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

interface RelationshipNodeData extends Record<string, unknown> {
  name: string;
  attributesExpanded?: boolean;
  hasHiddenAttributes?: boolean;
  onToggleExpand?: () => void;
  onHover?: () => void;
  onUnhover?: () => void;
}

const DIAMOND_SIZE = 88;
const DIAMOND_TIP_INSET = 2;
const TIP = DIAMOND_TIP_INSET;

export function RelationshipNode({ data }: NodeProps) {
  const d = data as RelationshipNodeData;

  const half = DIAMOND_SIZE / 2;
  const edge = DIAMOND_SIZE - TIP;

  return (
    <div
      className="er-relationship-node"
      style={{ width: DIAMOND_SIZE, height: DIAMOND_SIZE, position: "relative" }}
      onMouseEnter={d.onHover}
      onMouseLeave={d.onUnhover}
    >
      {/* Diamond SVG */}
      <svg
        width={DIAMOND_SIZE}
        height={DIAMOND_SIZE}
        style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
        aria-hidden
      >
        <polygon
          points={`${half},${TIP} ${edge},${half} ${half},${edge} ${TIP},${half}`}
          fill="transparent"
          stroke="var(--color-outline)"
          strokeWidth={1}
        />
      </svg>

      {/* Label centered */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <span className="text-on-surface font-medium uppercase text-2xs tracking-[0.02em] leading-none">
          {d.name}
        </span>
        {d.hasHiddenAttributes && (
          <button
            onClick={d.onToggleExpand}
            className="text-primary bg-transparent border-none cursor-pointer p-0 uppercase text-2xs tracking-[0.02em]"
            title="Mostrar atributos de relación"
          >
            + atrib
          </button>
        )}
        {d.attributesExpanded && !d.hasHiddenAttributes && (
          <button
            onClick={d.onToggleExpand}
            className="text-outline bg-transparent border-none cursor-pointer p-0 uppercase text-2xs tracking-[0.02em]"
            title="Ocultar atributos de relación"
          >
            − atrib
          </button>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Top}
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", opacity: 0 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", opacity: 0 }}
      />
      {/* Perimeter handles for attribute edges */}
      <Handle
        type="source"
        id="attr"
        position={Position.Right}
        style={{ right: `${DIAMOND_TIP_INSET}px`, top: "50%", transform: "translateY(-50%)", opacity: 0 }}
      />
      <Handle
        type="target"
        id="attr"
        position={Position.Right}
        style={{ right: `${DIAMOND_TIP_INSET}px`, top: "50%", transform: "translateY(-50%)", opacity: 0 }}
      />
    </div>
  );
}
