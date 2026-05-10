import type { ERRelationship, EREntity, ERParticipant } from "~/types/er-model";
import { InferencePanel } from "~/components/InferencePanel";

export interface SidebarNMDetailProps {
  relationship: ERRelationship;
  entities: EREntity[];
  onToggleAttributes: (relId: string) => void;
  onPromoteRelationship: (relId: string) => void;
}

export interface ParticipantDisplay {
  name: string;
  cardinality: string;
  participation: string;
}

/** Pure helper: resolve display data for a participant. */
export function formatParticipant(
  participant: ERParticipant,
  entities: EREntity[]
): ParticipantDisplay {
  const entity = entities.find((e) => e.id === participant.entityId);
  return {
    name: entity?.name ?? participant.entityId,
    cardinality: participant.cardinality,
    participation: participant.participation,
  };
}

export function SidebarNMDetail({
  relationship,
  entities,
  onToggleAttributes,
  onPromoteRelationship,
}: SidebarNMDetailProps) {
  return (
    <div className="px-4 pb-2 text-xs text-outline">
      <div className="mb-1 text-on-surface-variant">{relationship.name}</div>
      {relationship.participants.map((p) => {
        const display = formatParticipant(p, entities);
        return (
          <div key={p.entityId} className="mb-0.5">
            {display.name}{" "}
            <span className="text-primary">{display.cardinality}</span>
            <span className="ml-1 text-2xs text-outline-variant">
              {display.participation}
            </span>
          </div>
        );
      })}
      {relationship.attributes.length > 0 && (
        <div className="mt-1.5">
          <div className="text-2xs text-outline-variant uppercase tracking-[0.04em] mb-1">
            Atributos
          </div>
          {relationship.attributes.map((a) => (
            <div key={a.id} className="mb-0.5 text-on-surface-variant">
              {a.name}
            </div>
          ))}
          <button
            onClick={() => onToggleAttributes(relationship.id)}
            className="mt-1.5 text-2xs text-primary bg-transparent border border-outline-variant cursor-pointer px-1.5 py-0.5 rounded-sm uppercase tracking-[0.04em] hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            {relationship.attributesExpanded ? "Colapsar" : "Expandir"}
          </button>
        </div>
      )}
      {relationship.source && (
        <InferencePanel rel={relationship} onPromote={onPromoteRelationship} />
      )}
    </div>
  );
}
