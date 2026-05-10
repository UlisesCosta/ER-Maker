import { useRef } from "react";

export type ImportFormat = "dbml" | "sql";

export interface SchemaImportPanelProps {
  value: string;
  error: string | null;
  format: ImportFormat;
  onChange: (value: string) => void;
  onFormatChange: (format: ImportFormat) => void;
  onImport: (text?: string) => void;
  onResetDemo: () => void;
}

function InfoTooltip() {
  return (
    <div className="group relative flex items-center">
      <svg
        className="w-3.5 h-3.5 text-outline-variant cursor-help"
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
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-[300px] px-3 py-2 bg-surface-container-high border border-outline-variant rounded-sm text-2xs text-on-surface-variant opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity pointer-events-none z-10 leading-relaxed whitespace-pre-line">
        Extensión de ER Maker: Asigna nombres conceptuales a tablas y relaciones.

1) Tablas puente N:M:
Por defecto, &apos;enrollments&apos; genera la relación ENROLLMENTS.
Con alias puedes nombrarla conceptualmente:

Table enrollments [alias: &quot;INSCRIBE&quot;] {'{'} ... {'}'}

→ Crea la relación INSCRIBE

2) Relaciones directas 1:N:
Por defecto, un Ref genera el nombre POSTS_USERS.
Con alias defines el verbo de negocio:

Ref: posts.user_id &gt; users.id [alias: &quot;ESCRIBE&quot;]

→ Crea la relación ESCRIBE

Úsalo cuando el nombre físico no refleje el concepto de negocio.
      </div>
    </div>
  );
}

export function SchemaImportPanel({
  value,
  error,
  format,
  onChange,
  onFormatChange,
  onImport,
  onResetDemo,
}: SchemaImportPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImport = () => {
    onImport(textareaRef.current?.value ?? value);
  };

  return (
    <div className="border-t border-outline-variant py-3 px-3 flex flex-col gap-2 bg-surface-inset">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="text-2xs text-outline-variant uppercase tracking-[0.04em]">
            Entrada de Esquema
          </div>
          <InfoTooltip />
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onFormatChange("dbml")}
            className={`text-2xs px-1.5 py-0.5 rounded-sm border cursor-pointer uppercase tracking-[0.04em] ${
              format === "dbml"
                ? "bg-primary-container text-white border-primary-container"
                : "bg-transparent text-outline border-outline-variant hover:text-on-surface"
            }`}
          >
            DBML
          </button>
          <button
            type="button"
            onClick={() => onFormatChange("sql")}
            className={`text-2xs px-1.5 py-0.5 rounded-sm border cursor-pointer uppercase tracking-[0.04em] ${
              format === "sql"
                ? "bg-primary-container text-white border-primary-container"
                : "bg-transparent text-outline border-outline-variant hover:text-on-surface"
            }`}
          >
            SQL
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        rows={10}
        className="w-full text-xs font-mono text-on-surface-variant bg-surface-container-low border border-outline-variant rounded-sm px-2 py-1.5 resize-y outline-none leading-relaxed focus:ring-1 focus:ring-primary box-border"
      />
      {error && (
        <div className="text-xs text-error-text">{error}</div>
      )}
      <div className="flex gap-1.5">
        <button
          onClick={handleImport}
          className="flex-1 text-2xs text-white bg-primary-container border-none cursor-pointer px-2 py-1 rounded-sm uppercase tracking-[0.04em] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary"
        >
          Cargar al Canvas
        </button>
        <button
          onClick={onResetDemo}
          className="text-2xs text-outline bg-transparent border border-outline-variant cursor-pointer px-2 py-1 rounded-sm uppercase tracking-[0.04em] hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
        >
          Restablecer Demo
        </button>
      </div>
    </div>
  );
}
