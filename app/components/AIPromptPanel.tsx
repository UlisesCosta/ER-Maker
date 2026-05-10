export interface AIPromptPanelProps {
  open: boolean;
  onClose: () => void;
}

const PROMPT_TEXT = `Genera un esquema de base de datos en formato DBML para un [describe tu sistema aquí].

Instrucciones:
- Usa la sintaxis DBML estándar con las siguientes extensiones de ER Maker:
- Para tablas puente N:M, usa: Table nombre [alias: "NOMBRE_CONCEPTUAL"] { ... }
- Para relaciones 1:N, usa: Ref: tabla.col > tabla.col [alias: "VERBO"]
- Incluye claves primarias [pk] y foráneas implícitas via Ref
- Asegúrate de que las tablas puente N:M tengan exactamente dos columnas de referencia

Ejemplo:
Table users {
  id int [pk]
  name varchar
}
Table posts {
  id int [pk]
  user_id int [not null]
  title varchar
}
Ref: posts.user_id > users.id [alias: "ESCRIBE"]`;

export function AIPromptPanel({ open, onClose }: AIPromptPanelProps) {
  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_TEXT);
    } catch {
      // Fallback for older browsers or denied permission
      const textarea = document.createElement("textarea");
      textarea.value = PROMPT_TEXT;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-full max-w-lg mx-4 bg-surface-container-high border border-outline-variant rounded-sm shadow-lg flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-prompt-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant shrink-0">
          <h2
            id="ai-prompt-title"
            className="text-sm font-medium text-on-surface tracking-[-0.01em]"
          >
            Generar Esquema con IA
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Cerrar"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 flex-1 overflow-y-auto">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Copia este prompt y pégalo en ChatGPT, Claude, o tu IA favorita.
            Luego pega el DBML generado en el importador.
          </p>

          <textarea
            readOnly
            value={PROMPT_TEXT}
            rows={16}
            className="mt-3 w-full text-xs font-mono text-on-surface-variant bg-surface-inset border border-outline-variant rounded-sm px-2.5 py-2 resize-none outline-none leading-relaxed focus:ring-1 focus:ring-primary box-border"
            aria-label="Prompt para IA"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-outline-variant shrink-0 flex gap-2 justify-end">
          <button
            onClick={handleCopy}
            className="text-2xs text-white bg-primary-container border-none cursor-pointer px-3 py-1.5 rounded-sm uppercase tracking-[0.04em] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary"
          >
            Copiar
          </button>
          <button
            onClick={onClose}
            className="text-2xs text-outline bg-transparent border border-outline-variant cursor-pointer px-3 py-1.5 rounded-sm uppercase tracking-[0.04em] hover:text-on-surface hover:border-on-surface-variant focus-visible:outline-2 focus-visible:outline-primary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
