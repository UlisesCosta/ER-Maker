import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { XYPosition } from "@xyflow/react";
import type { ERDiagram } from "~/types/er-model";

// ── Saved snapshot ─────────────────────────────────────────────────────────────

export interface SavedDiagram {
  id: string;
  name: string;           // user-editable name (defaults to diagram.name)
  savedAt: string;        // ISO timestamp
  diagram: ERDiagram;
  nodePositions: Record<string, XYPosition>; // serializable (no Map in JSON)
}

// ── Store shape ────────────────────────────────────────────────────────────────

interface DiagramStore {
  // ── Saved diagrams list ────────────────────────────────────────────────────
  savedDiagrams: SavedDiagram[];

  saveDiagram: (
    diagram: ERDiagram,
    nodePositions: Map<string, XYPosition>,
    name?: string,
  ) => SavedDiagram;

  deleteDiagram: (id: string) => void;
  renameDiagram: (id: string, name: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return `saved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function positionsToRecord(map: Map<string, XYPosition>): Record<string, XYPosition> {
  return Object.fromEntries(map.entries());
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useDiagramStore = create<DiagramStore>()(
  persist(
    (set) => ({
      savedDiagrams: [],

      saveDiagram: (diagram, nodePositions, name) => {
        const snapshot: SavedDiagram = {
          id: generateId(),
          name: name ?? diagram.name,
          savedAt: new Date().toISOString(),
          diagram,
          nodePositions: positionsToRecord(nodePositions),
        };
        set((state) => ({
          savedDiagrams: [snapshot, ...state.savedDiagrams],
        }));
        return snapshot;
      },

      deleteDiagram: (id) =>
        set((state) => ({
          savedDiagrams: state.savedDiagrams.filter((d) => d.id !== id),
        })),

      renameDiagram: (id, name) =>
        set((state) => ({
          savedDiagrams: state.savedDiagrams.map((d) =>
            d.id === id ? { ...d, name } : d,
          ),
        })),
    }),
    {
      name: "er-maker-diagrams", // localStorage key
      version: 1,
    },
  ),
);
