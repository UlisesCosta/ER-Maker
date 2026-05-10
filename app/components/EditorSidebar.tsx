import { Link } from "react-router";
import type { ERDiagram, ERRelationship } from "~/types/er-model";
import type { Theme } from "~/lib/useTheme";
import { SidebarSection } from "~/components/SidebarSection";
import { SidebarItem } from "~/components/SidebarItem";
import { SidebarNMDetail } from "~/components/SidebarNMDetail";
import { SchemaImportPanel, type ImportFormat } from "~/components/SchemaImportPanel";

export interface EditorSidebarProps {
  diagram: ERDiagram;
  selectedRelationship?: ERRelationship;
  importPanelOpen: boolean;
  importText: string;
  importError: string | null;
  importFormat: ImportFormat;
  theme: Theme;
  onToggleTheme: () => void;
  onToggleImportPanel: () => void;
  onImportTextChange: (value: string) => void;
  onImportFormatChange: (format: ImportFormat) => void;
  onImport: (text?: string) => void;
  onResetDemo: () => void;
  onToggleAttributes: (relId: string) => void;
  onPromoteRelationship: (relId: string) => void;
}

export function EditorSidebar({
  diagram,
  selectedRelationship,
  importPanelOpen,
  importText,
  importError,
  importFormat,
  theme,
  onToggleTheme,
  onToggleImportPanel,
  onImportTextChange,
  onImportFormatChange,
  onImport,
  onResetDemo,
  onToggleAttributes,
  onPromoteRelationship,
}: EditorSidebarProps) {
  return (
    <aside className="w-72 shrink-0 border-r border-outline-variant flex flex-col overflow-hidden h-full transition-colors duration-200">
      {/* Product title */}
      <div className="shrink-0 h-12 border-b border-outline-variant flex items-center px-3 gap-2 justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-[-0.02em] text-on-surface text-base-er">
            ER Maker
          </span>
          <span className="text-outline uppercase tracking-[0.04em] text-2xs">
            Chen
          </span>
        </div>
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-sm text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {theme === "dark" ? (
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Entities section */}
        <SidebarSection label="Entidades" defaultCollapsed={diagram.entities.length > 5}>
          {diagram.entities.map((e) => (
            <SidebarItem key={e.id} label={e.name} count={e.attributes.length} />
          ))}
        </SidebarSection>

        {/* Relationships section */}
        <SidebarSection label="Relaciones" defaultCollapsed={diagram.relationships.length > 5}>
          {diagram.relationships.map((r) => (
            <SidebarItem
              key={r.id}
              label={r.name}
              count={r.attributes.length}
              meta={r.participants.map((p) => `${p.cardinality}`).join(":")}
            />
          ))}
        </SidebarSection>

        {/* Selected relationship details */}
        {selectedRelationship && (
          <SidebarSection label="Detalle N:M">
            <SidebarNMDetail
              relationship={selectedRelationship}
              entities={diagram.entities}
              onToggleAttributes={onToggleAttributes}
              onPromoteRelationship={onPromoteRelationship}
            />
          </SidebarSection>
        )}
      </div>

      {/* Bottom area — always visible */}
      <div className="shrink-0 border-t border-outline-variant">
        <div className="py-2.5 px-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-outline-variant uppercase tracking-[0.04em] text-2xs">
                Vista Conceptual
              </div>
              <div className="text-outline mt-0.5 text-xs">
                No se muestran claves foráneas
              </div>
            </div>
            <Link
              to="/docs"
              className="p-1.5 rounded-sm text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors focus-visible:outline-2 focus-visible:outline-primary"
              title="Documentación"
              aria-label="Documentación"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </Link>
          </div>

          <button
            onClick={onToggleImportPanel}
            className="mt-2.5 w-full text-primary bg-transparent border border-outline-variant cursor-pointer px-2 py-1 rounded-sm uppercase tracking-[0.04em] text-left hover:border-primary focus-visible:outline-2 focus-visible:outline-primary text-2xs"
          >
            {importPanelOpen ? "Cerrar Importación" : "Importar Esquema"}
          </button>
        </div>

        {/* Schema import panel */}
        {importPanelOpen && (
          <SchemaImportPanel
            value={importText}
            error={importError}
            format={importFormat}
            onChange={onImportTextChange}
            onFormatChange={onImportFormatChange}
            onImport={onImport}
            onResetDemo={onResetDemo}
          />
        )}
      </div>
    </aside>
  );
}
