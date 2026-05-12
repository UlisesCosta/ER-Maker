import { useState } from "react";

export interface EditorToolbarProps {
  name: string;
  entityCount: number;
  relationshipCount: number;
  onAIPromptClick?: () => void;
  onAutoLayout?: () => void;
  onSavedDiagrams?: () => void;
  onCopyDbml?: () => void;
}

export function EditorToolbar({
  name,
  entityCount,
  relationshipCount,
  onAIPromptClick,
  onAutoLayout,
  onSavedDiagrams,
  onCopyDbml,
}: EditorToolbarProps) {
  const [copied, setCopied] = useState(false);

  function handleCopyDbml() {
    onCopyDbml?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="h-12 border-b border-outline-variant flex items-center px-4 gap-3 transition-colors duration-200">
      <span className="font-medium text-on-surface-variant tracking-[-0.01em] text-base-er">
        {name}
      </span>
      <span className="text-outline-variant tracking-[0.02em] text-xs">·</span>
      <span className="text-outline tracking-[0.02em] text-xs">
        {entityCount} entidades · {relationshipCount} relaciones
      </span>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={handleCopyDbml}
          className="p-1.5 rounded-sm text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
          title={copied ? "¡DBML copiado!" : "Copiar DBML"}
          aria-label="Copiar DBML"
        >
          {copied ? (
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          )}
        </button>
        <button
          onClick={onSavedDiagrams}
          className="p-1.5 rounded-sm text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
          title="Diagramas guardados"
          aria-label="Diagramas guardados"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </button>
        <button
          onClick={onAutoLayout}
          className="p-1.5 rounded-sm text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
          title="Auto Layout"
          aria-label="Auto Layout"
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
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <rect x="15" y="3" width="6" height="6" rx="1" />
            <rect x="9" y="15" width="6" height="6" rx="1" />
            <line x1="6" y1="9" x2="12" y2="15" />
            <line x1="18" y1="9" x2="12" y2="15" />
          </svg>
        </button>
        <button
          onClick={onAIPromptClick}
          className="p-1.5 rounded-sm text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
          title="Generar esquema con IA"
          aria-label="Generar esquema con IA"
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
            <path d="M12 3L14.5 8.5L20 9L16 13L17.5 18.5L12 15.5L6.5 18.5L8 13L4 9L9.5 8.5L12 3Z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
