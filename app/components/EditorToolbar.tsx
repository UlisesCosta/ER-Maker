export interface EditorToolbarProps {
  name: string;
  entityCount: number;
  relationshipCount: number;
  onAIPromptClick?: () => void;
}

export function EditorToolbar({
  name,
  entityCount,
  relationshipCount,
  onAIPromptClick,
}: EditorToolbarProps) {
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
