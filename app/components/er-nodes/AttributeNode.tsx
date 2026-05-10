import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

interface AttributeNodeData extends Record<string, unknown> {
  name: string;
  kind: "simple" | "key" | "derived" | "multivalued" | "composite";
}

export function AttributeNode({ data }: NodeProps) {
  const d = data as AttributeNodeData;

  const isDerived = d.kind === "derived";
  const isMultivalued = d.kind === "multivalued";
  const isKey = d.kind === "key";

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 96,
        minHeight: 30,
        paddingLeft: 14,
        paddingRight: 14,
        borderRadius: "50%",
        border: `1px ${isDerived ? "dashed" : "solid"} var(--color-outline)`,
        outline: isMultivalued ? "1px solid var(--color-outline-variant)" : "none",
        outlineOffset: isMultivalued ? 3 : 0,
        background: "transparent",
        transition: "border-color 0.2s ease, outline-color 0.2s ease",
      }}
      className="er-attribute-node"
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
        id="left"
        position={Position.Left}
        style={{ left: 0, top: "50%", transform: "translateY(-50%)", opacity: 0 }}
      />
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        style={{ left: 0, top: "50%", transform: "translateY(-50%)", opacity: 0 }}
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        style={{ right: 0, top: "50%", transform: "translateY(-50%)", opacity: 0 }}
      />
      <Handle
        type="target"
        id="right"
        position={Position.Right}
        style={{ right: 0, top: "50%", transform: "translateY(-50%)", opacity: 0 }}
      />
      <span
        className="text-on-surface-variant whitespace-nowrap"
        style={{
          fontSize: "var(--text-sm-er)",
          fontWeight: isKey ? 600 : 400,
          letterSpacing: "-0.01em",
          textDecoration: isKey ? "underline" : "none",
          textUnderlineOffset: 2,
        }}
      >
        {d.name}
      </span>
    </div>
  );
}
