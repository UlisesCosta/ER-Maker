import type { ERRelationship } from "~/types/er-model";

export function InferencePanel({
  rel,
  onPromote,
}: {
  rel: ERRelationship;
  onPromote?: (relId: string) => void;
}) {
  const conf = rel.inference?.confidence;
  const confidencePct = conf !== undefined ? Math.round(conf * 100) : null;
  const confidenceColor =
    conf === undefined
      ? "text-outline-variant"
      : conf >= 0.9
      ? "text-success"
      : conf >= 0.7
      ? "text-warning"
      : "text-error";

  return (
    <div className="mt-2.5 pt-2 border-t border-surface-container text-2xs text-outline leading-relaxed">
      <div className="text-outline-variant uppercase tracking-[0.04em] mb-1">Origen</div>
      <div className="mb-0.5">
        <span className="text-on-surface-variant">{rel.source?.origin ?? "—"}</span>
        {rel.source?.sourceId && (
          <span className="ml-1 font-mono text-primary text-2xs">
            {rel.source.sourceId}
          </span>
        )}
      </div>

      {rel.inference && (
        <>
          <div className="text-outline-variant uppercase tracking-[0.04em] mb-1 mt-1.5">
            Inferencia
          </div>
          <div className="mb-1">
            <span className="text-outline-variant">confianza </span>
            <span className={`tabular-nums ${confidenceColor}`}>{confidencePct}%</span>
          </div>

          {rel.inference.joinTableKind && (
            <div className="mb-1">
              <span className="text-outline-variant">tipo de unión </span>
              <span
                className={`font-mono text-2xs ${
                  rel.inference.joinTableKind === "associative-entity-candidate"
                    ? "text-warning"
                    : rel.inference.joinTableKind === "enriched-simple"
                    ? "text-primary"
                    : "text-success"
                }`}
              >
                {rel.inference.joinTableKind}
              </span>
              {rel.inference.joinTableKind === "associative-entity-candidate" && (
                <div className="mt-0.5 text-warning text-2xs italic">
                  ⚠ puede justificar promoción a entidad
                </div>
              )}
              {rel.inference.joinTableKind === "associative-entity-candidate" && onPromote && (
                <button
                  onClick={() => onPromote(rel.id)}
                  className="mt-1.5 block text-2xl text-primary bg-transparent border border-primary cursor-pointer px-1.5 py-0.5 rounded-sm uppercase tracking-[0.04em] hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  Promover a Entidad
                </button>
              )}
            </div>
          )}

          {rel.inference.reasons.length > 0 && (
            <div className="text-outline-variant uppercase tracking-[0.04em] mb-1 mt-1.5">
              Razones
            </div>
          )}
          {rel.inference.reasons.map((r, i) => (
            <div key={i} className="mb-0.5 text-outline italic">
              · {r}
            </div>
          ))}
        </>
      )}

      {rel.override && (
        <div className="mt-1.5 text-warning text-2xs">
          ✎ sobrescrito · {rel.override.appliedAt}
        </div>
      )}
    </div>
  );
}
