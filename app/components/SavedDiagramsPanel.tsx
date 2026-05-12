import { useState } from "react";
import { useDiagramStore, type SavedDiagram } from "~/store/diagramStore";
import type { XYPosition } from "@xyflow/react";
import type { ERDiagram } from "~/types/er-model";

interface SavedDiagramsPanelProps {
  open: boolean;
  currentDiagram: ERDiagram;
  currentPositions: Map<string, XYPosition>;
  onLoad: (snapshot: SavedDiagram) => void;
  onClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function SavedDiagramsPanel({
  open,
  currentDiagram,
  currentPositions,
  onLoad,
  onClose,
}: SavedDiagramsPanelProps) {
  const { savedDiagrams, saveDiagram, deleteDiagram, renameDiagram } =
    useDiagramStore();

  const [saveName, setSaveName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (!open) return null;

  function handleSave() {
    const name = saveName.trim() || currentDiagram.name;
    saveDiagram(currentDiagram, currentPositions, name);
    setSaveName("");
  }

  function handleStartRename(d: SavedDiagram) {
    setEditingId(d.id);
    setEditingName(d.name);
  }

  function handleConfirmRename(id: string) {
    const trimmed = editingName.trim();
    if (trimmed) renameDiagram(id, trimmed);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    if (deleteConfirm === id) {
      deleteDiagram(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col bg-surface-container-low border-l border-outline-variant shadow-xl"
        role="dialog"
        aria-label="Diagramas guardados"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-outline-variant shrink-0">
          <span className="text-sm font-medium text-on-surface">
            Diagramas guardados
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Save current */}
        <div className="px-4 py-3 border-b border-outline-variant shrink-0">
          <p className="text-xs text-outline mb-2">Guardar diagrama actual</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={currentDiagram.name}
              className="flex-1 min-w-0 px-2 py-1.5 text-xs rounded-sm border border-outline-variant bg-surface text-on-surface placeholder-outline focus:outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs rounded-sm bg-primary text-on-primary font-medium hover:opacity-90 transition-opacity"
            >
              Guardar
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {savedDiagrams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-outline">
              <svg className="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="17 21 17 13 7 13 7 21" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="7 3 7 8 15 8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs">No hay diagramas guardados</p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {savedDiagrams.map((d) => (
                <li key={d.id} className="px-4 py-3 hover:bg-surface-container transition-colors">
                  {/* Name row */}
                  <div className="flex items-center gap-2 mb-1">
                    {editingId === d.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleConfirmRename(d.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleConfirmRename(d.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="flex-1 min-w-0 text-xs font-medium px-1 py-0.5 rounded-sm border border-primary bg-surface text-on-surface focus:outline-none"
                      />
                    ) : (
                      <span
                        className="flex-1 min-w-0 text-xs font-medium text-on-surface truncate cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleStartRename(d)}
                        title="Clic para renombrar"
                      >
                        {d.name}
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <p className="text-[10px] text-outline mb-2">
                    {formatDate(d.savedAt)} · {d.diagram.entities.length} entidades
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onLoad(d); onClose(); }}
                      className="flex-1 py-1 text-[11px] rounded-sm bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition-colors font-medium"
                    >
                      Cargar
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className={`px-2 py-1 text-[11px] rounded-sm transition-colors font-medium ${
                        deleteConfirm === d.id
                          ? "bg-error text-on-error"
                          : "bg-surface-container-high text-outline hover:text-error"
                      }`}
                      title={deleteConfirm === d.id ? "Confirmar eliminación" : "Eliminar"}
                    >
                      {deleteConfirm === d.id ? "¿Eliminar?" : "✕"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
