import type { Node, Edge } from "@xyflow/react";
import type { ERDiagram, EREntity, ERRelationship, ERAttribute } from "~/types/er-model";

export interface ERFlowResult {
  nodes: Node[];
  edges: Edge[];
}

// ── Edge style constants ──────────────────────────────────────────────────────
const EDGE_STROKE = "var(--color-outline)";
const ATTR_EDGE_STROKE = "var(--color-outline-variant)";

// ── Layout constants ──────────────────────────────────────────────────────────
const ENTITY_W = 140;
const ENTITY_H = 50;
const REL_W = 88;
const REL_H = 88;
const ATTR_W = 110;
const ATTR_H = 36;

const ENTITY_COL_X = 120;
const ENTITY_ROW_GAP = 220;
const REL_COL_X = 400;
const ATTR_OFFSET_X = 200;
const ATTR_ROW_GAP = 50;

/**
 * Pure projection: ER diagram → React Flow nodes + edges.
 * Layout is deterministic (no Dagre/ELK dependency for now).
 */
export function erToFlow(diagram: ERDiagram): ERFlowResult {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // ── Entity positions ─────────────────────────────────────────────────────
  const entityPositions = new Map<string, { x: number; y: number }>();
  diagram.entities.forEach((entity, i) => {
    const y = 80 + i * ENTITY_ROW_GAP;
    entityPositions.set(entity.id, { x: ENTITY_COL_X, y });

    nodes.push({
      id: entity.id,
      type: "erEntity",
      position: { x: ENTITY_COL_X, y },
      data: {
          name: entity.name,
          weak: entity.weak ?? false,
          associative: entity.id.endsWith("__assoc") ? true : undefined,
        },
    });

    // Entity attributes — always shown
    addAttributeNodes(nodes, edges, entity.attributes, entity.id, ENTITY_COL_X - ATTR_OFFSET_X, y, "left");
  });

  // ── Relationship positions ────────────────────────────────────────────────
  diagram.relationships.forEach((rel, i) => {
    // Compute a y midpoint between first two participants
    const p0 = rel.participants[0] ? entityPositions.get(rel.participants[0].entityId) : null;
    const p1 = rel.participants[1] ? entityPositions.get(rel.participants[1].entityId) : null;
    const relY = p0 && p1 ? (p0.y + p1.y) / 2 : 80 + i * ENTITY_ROW_GAP;
    const relX = REL_COL_X + Math.floor(i / 2) * 280;

    const hasAttrs = rel.attributes.length > 0;
    nodes.push({
      id: rel.id,
      type: "erRelationship",
      position: { x: relX, y: relY },
      data: {
        name: rel.name,
        attributesExpanded: hasAttrs ? (rel.attributesExpanded ?? false) : false,
        hasHiddenAttributes: hasAttrs ? !(rel.attributesExpanded ?? false) : false,
      },
    });

    // Participant edges
    for (const participant of rel.participants) {
      const edgeId = `edge-${rel.id}-${participant.entityId}`;
      edges.push({
        id: edgeId,
        source: participant.entityId,
        target: rel.id,
        type: "erParticipant",
        data: {
          cardinality: formatCardinality(participant.cardinality, participant.participation),
          style: { stroke: EDGE_STROKE, strokeWidth: 1 },
        },
      });
    }

    // Relationship attributes — only if expanded
    if (rel.attributesExpanded && rel.attributes.length > 0) {
      addAttributeNodes(nodes, edges, rel.attributes, rel.id, relX + ATTR_OFFSET_X, relY, "right");
    }
  });

  return { nodes, edges };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function addAttributeNodes(
  nodes: Node[],
  edges: Edge[],
  attributes: ERAttribute[],
  parentId: string,
  baseX: number,
  baseY: number,
  side: "left" | "right"
): void {
  attributes.forEach((attr, i) => {
    const attrY = baseY + (i - Math.floor(attributes.length / 2)) * ATTR_ROW_GAP;
    nodes.push({
      id: attr.id,
      type: "erAttribute",
      position: { x: baseX, y: attrY },
      data: { name: attr.name, kind: attr.kind },
    });
    edges.push({
      id: `edge-${parentId}-${attr.id}`,
      source: parentId,
      target: attr.id,
      type: "erAttribute",
      style: { stroke: ATTR_EDGE_STROKE, strokeWidth: 1 },
    });
  });
}

function formatCardinality(cardinality: string, participation: string): string {
  const participationMark = participation === "total" ? "=" : "-";
  return `${participationMark}${cardinality}`;
}
