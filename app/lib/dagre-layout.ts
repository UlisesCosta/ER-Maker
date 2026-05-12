import type { Node, Edge } from "@xyflow/react";

// ── Node dimensions (must match rendered sizes) ───────────────────────────────
const DIM = {
  entity:       { w: 140, h: 50  },
  relationship: { w: 88,  h: 88  },
  attribute:    { w: 110, h: 36  },
};

// ── Spacing ───────────────────────────────────────────────────────────────────
const ATTR_GAP      = 46;   // vertical distance between attribute centers
const ATTR_MARGIN   = 20;   // gap: parent edge → attribute oval
const ROW_GAP       = 50;   // extra vertical padding between entity rows
const REL_H_MARGIN  = 80;   // horizontal gap: entity edge → relationship diamond
const REL_MIN_VGAP  = 108;  // minimum vertical distance between relationship centers

type Pos = { x: number; y: number };

// ─────────────────────────────────────────────────────────────────────────────

function fanHeight(attrCount: number): number {
  if (attrCount === 0) return DIM.entity.h + ROW_GAP;
  return Math.max(DIM.entity.h, attrCount * ATTR_GAP) + ROW_GAP;
}

/**
 * Hybrid layout:
 *
 *  1. Entities are split into LEFT and RIGHT columns (≈ half each).
 *     Row heights adapt to the tallest attribute fan per row.
 *
 *  2. Each relationship is placed at the centroid of its participant entities,
 *     with a horizontal offset that keeps it close to those entities:
 *       - Both participants left  → diamond just right of the left column
 *       - Both participants right → diamond just left of the right column
 *       - Mixed (L + R)          → diamond at horizontal midpoint of participants
 *     A greedy vertical-nudge pass resolves overlapping diamonds.
 *
 *  3. Attributes fan LEFT of left-column entities, RIGHT of right-column entities
 *     and right-column relationships.
 */
export function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {

  // ── 1. Attribute-parent map ────────────────────────────────────────────────
  const parentOf = new Map<string, string>();
  for (const edge of edges) {
    const tgt = nodes.find((n) => n.id === edge.target);
    if (tgt?.type === "erAttribute") parentOf.set(edge.target, edge.source);
  }
  const attrsByParent = new Map<string, Node[]>();
  for (const n of nodes) {
    if (n.type !== "erAttribute") continue;
    const pid = parentOf.get(n.id);
    if (!pid) continue;
    const list = attrsByParent.get(pid) ?? [];
    list.push(n);
    attrsByParent.set(pid, list);
  }

  // ── 2. Participant map ─────────────────────────────────────────────────────
  const participantsOf = new Map<string, string[]>(); // relId → entityId[]
  for (const edge of edges) {
    const src = nodes.find((n) => n.id === edge.source);
    const tgt = nodes.find((n) => n.id === edge.target);
    if (!src || !tgt) continue;
    if (src.type === "erEntity" && tgt.type === "erRelationship") {
      const list = participantsOf.get(tgt.id) ?? [];
      list.push(src.id);
      participantsOf.set(tgt.id, list);
    } else if (src.type === "erRelationship" && tgt.type === "erEntity") {
      const list = participantsOf.get(src.id) ?? [];
      list.push(tgt.id);
      participantsOf.set(src.id, list);
    }
  }

  // ── 3. Split entities into L / R columns ──────────────────────────────────
  const entityNodes = nodes.filter((n) => n.type === "erEntity");
  const relNodes    = nodes.filter((n) => n.type === "erRelationship");

  const half      = Math.ceil(entityNodes.length / 2);
  const leftEnt   = entityNodes.slice(0, half);
  const rightEnt  = entityNodes.slice(half);

  const leftIds  = new Set(leftEnt.map((e) => e.id));
  const rightIds = new Set(rightEnt.map((e) => e.id));

  // ── 4. Compute row tops (variable height per row) ─────────────────────────
  const numRows  = Math.max(leftEnt.length, rightEnt.length);
  const rowTops: number[] = [];
  let curY = 60;
  for (let r = 0; r < numRows; r++) {
    rowTops.push(curY);
    const lh = leftEnt[r]  ? fanHeight(attrsByParent.get(leftEnt[r].id)?.length  ?? 0) : 0;
    const rh = rightEnt[r] ? fanHeight(attrsByParent.get(rightEnt[r].id)?.length ?? 0) : 0;
    curY += Math.max(lh, rh, DIM.entity.h + ROW_GAP);
  }

  // ── 5. Position entities ───────────────────────────────────────────────────
  // xLeft/xRight are set so attribute fans don't go off-screen.
  const xLeft  = DIM.attribute.w + ATTR_MARGIN + 40;
  // Right column: placed far enough from left that there's a clear center gap.
  // We'll compute the right-column X after deciding the relationship zone width.
  // For now use a fixed offset; relationships will be placed relative to their
  // actual participants so this doesn't constrain them.
  const xRight = xLeft + DIM.entity.w + REL_H_MARGIN * 2 + DIM.relationship.w + REL_H_MARGIN * 2 + DIM.entity.w + 60;

  const posMap = new Map<string, Pos>();

  function entityCenterY(entId: string, row: number): number {
    const attrCount = attrsByParent.get(entId)?.length ?? 0;
    const fh = fanHeight(attrCount);
    return rowTops[row] + (fh - DIM.entity.h) / 2 - ROW_GAP / 2;
  }

  leftEnt.forEach((ent, r) => {
    posMap.set(ent.id, { x: xLeft, y: entityCenterY(ent.id, r) });
  });
  rightEnt.forEach((ent, r) => {
    posMap.set(ent.id, { x: xRight, y: entityCenterY(ent.id, r) });
  });

  // ── 6. Position relationships close to their participants ──────────────────
  // For each rel, compute ideal (x, y) from participant positions.
  // Then nudge vertically to avoid overlap with already-placed rels.

  type RelSlot = { id: string; x: number; y: number };
  const placedRels: RelSlot[] = [];

  function nudgeFreeY(idealY: number, relX: number): number {
    // Only avoid diamonds whose X overlaps this diamond's X band
    const relHalfW = DIM.relationship.w / 2 + 10;
    let candidate = idealY;
    let safety = 0;
    while (safety++ < 500) {
      const conflict = placedRels.find((r) => {
        const xOverlap = Math.abs(r.x - relX) < DIM.relationship.w + 20;
        return xOverlap && Math.abs(r.y - candidate) < REL_MIN_VGAP;
      });
      if (!conflict) break;
      // Nudge below the conflicting rel
      candidate = conflict.y + REL_MIN_VGAP;
    }
    return candidate;
  }

  for (const rel of relNodes) {
    const pids = participantsOf.get(rel.id) ?? [];
    const pPositions = pids
      .map((id) => posMap.get(id))
      .filter(Boolean) as Pos[];

    let relX: number;
    let idealY: number;

    if (pPositions.length === 0) {
      relX   = xLeft + DIM.entity.w + REL_H_MARGIN;
      idealY = 60;
    } else {
      const avgY = pPositions.reduce((s, p) => s + p.y, 0) / pPositions.length;
      idealY = avgY + DIM.entity.h / 2 - DIM.relationship.h / 2;

      const allLeft  = pids.every((id) => leftIds.has(id));
      const allRight = pids.every((id) => rightIds.has(id));

      if (allLeft) {
        // Diamond sits to the right of the left-entity column
        relX = xLeft + DIM.entity.w + REL_H_MARGIN;
      } else if (allRight) {
        // Diamond sits to the left of the right-entity column
        relX = xRight - DIM.relationship.w - REL_H_MARGIN;
      } else {
        // Mixed: midpoint between left-entity right edge and right-entity left edge
        const leftX  = xLeft  + DIM.entity.w;
        const rightX = xRight;
        relX = (leftX + rightX) / 2 - DIM.relationship.w / 2;
      }
    }

    const relY = nudgeFreeY(idealY, relX);
    posMap.set(rel.id, { x: relX, y: relY });
    placedRels.push({ id: rel.id, x: relX, y: relY });
  }

  // ── 7. Place attribute fans ────────────────────────────────────────────────
  for (const [parentId, attrs] of attrsByParent) {
    const parentPos = posMap.get(parentId);
    if (!parentPos) continue;

    const parentNode = nodes.find((n) => n.id === parentId);
    const pType      = parentNode?.type ?? "";
    const pDim       = pType === "erRelationship" ? DIM.relationship : DIM.entity;

    const centerY   = parentPos.y + pDim.h / 2;
    const totalFanH = (attrs.length - 1) * ATTR_GAP;
    const startY    = centerY - totalFanH / 2;

    // Decide side: left-column entities go left; everything else goes right
    const goLeft = pType === "erEntity" && leftIds.has(parentId);
    const attrX  = goLeft
      ? parentPos.x - DIM.attribute.w - ATTR_MARGIN
      : parentPos.x + pDim.w + ATTR_MARGIN;

    attrs.forEach((attr, i) => {
      posMap.set(attr.id, {
        x: attrX,
        y: startY + i * ATTR_GAP - DIM.attribute.h / 2,
      });
    });
  }

  // ── 8. Apply ───────────────────────────────────────────────────────────────
  return nodes.map((n) => {
    const pos = posMap.get(n.id);
    return pos ? { ...n, position: pos } : n;
  });
}
