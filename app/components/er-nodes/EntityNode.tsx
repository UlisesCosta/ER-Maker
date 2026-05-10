import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

interface EntityNodeData extends Record<string, unknown> {
  name: string;
  weak?: boolean;
  /** Promoted associative entity — renders with an embedded diamond indicator */
  associative?: boolean;
}

export function EntityNode({ data }: NodeProps) {
  const d = data as EntityNodeData;
  return (
    <div
      className={[
        "er-entity-node",
        "flex items-center justify-center",
        "min-w-30 min-h-11 px-4 py-2",
        "bg-transparent",
        "text-on-surface font-medium tracking-[-0.01em] uppercase",
        "transition-colors duration-200",
        d.weak
          ? "border border-outline  outline-[3px] outline-outline-variant outline-offset-2"
          : d.associative
          ? "border border-primary  outline-2 outline-primary outline-offset-4"
          : "border border-outline",
      ].join(" ")}
      style={{ borderRadius: 2, fontSize: "var(--text-node)" }}
    >
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
        position={Position.Left}
        style={{ left: 0, top: "50%", transform: "translateY(-50%)", opacity: 0 }}
      />
      <Handle
        type="target"
        id="attr"
        position={Position.Left}
        style={{ left: 0, top: "50%", transform: "translateY(-50%)", opacity: 0 }}
      />
      <span>{d.name}</span>
    </div>
  );
}
