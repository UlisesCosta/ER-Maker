/**
 * promoteToAssociativeEntity — pure transformation.
 *
 * Converts an N:M relationship (especially an associative-entity-candidate)
 * into a proper associative entity in Chen conceptual terms:
 *
 *   Before:  Entity-A ──<RelName>── Entity-B
 *            (with attributes on the relationship)
 *
 *   After:   Entity-A ──<IsPartOf>── RelNameEntity ──<IsPartOf>── Entity-B
 *            (relationship attributes become entity attributes)
 *            (connecting relationships carry 1:N cardinality)
 */
import type { ERDiagram, EREntity, ERRelationship } from "~/types/er-model";

/**
 * Promote a relationship to an associative entity.
 * Returns a new ERDiagram (immutable). Returns the original diagram unchanged
 * if the relationship is not found or has fewer than 2 participants.
 */
export function promoteToAssociativeEntity(
  diagram: ERDiagram,
  relationshipId: string
): ERDiagram {
  const rel = diagram.relationships.find((r) => r.id === relationshipId);
  if (!rel || rel.participants.length < 2) return diagram;

  const today = new Date().toISOString().slice(0, 10);
  const newEntityId = `${rel.id}__assoc`;

  // New associative entity — inherits name and attributes from the relationship
  const newEntity: EREntity = {
    type: "entity",
    id: newEntityId,
    name: rel.name,
    attributes: rel.attributes.map((a) => ({ ...a })),
    source: rel.source ? { ...rel.source } : undefined,
    inference: rel.inference ? { ...rel.inference } : undefined,
    override: {
      appliedAt: today,
      fields: { name: rel.name },
    },
  };

  // Two new binary relationships: promoted entity ↔ each original participant
  const connectingRels: ERRelationship[] = rel.participants.map(
    (participant, i) => {
      const originalEntity = diagram.entities.find(
        (e) => e.id === participant.entityId
      );
      const relName = originalEntity
        ? `${rel.name}_${originalEntity.name}`
        : `${rel.name}_${i}`;

      return {
        type: "relationship" as const,
        id: `${rel.id}__link${i}`,
        name: relName,
        attributes: [],
        participants: [
          // The promoted entity is "N" side (many enrollments per student)
          { entityId: newEntityId, cardinality: "N" as const, participation: "total" as const },
          // Original entity is "1" side
          { entityId: participant.entityId, cardinality: "1" as const, participation: participant.participation },
        ],
        source: rel.source ? { ...rel.source } : undefined,
      };
    }
  );

  return {
    ...diagram,
    entities: [...diagram.entities, newEntity],
    // Remove original relationship, add the two connecting ones
    relationships: [
      ...diagram.relationships.filter((r) => r.id !== relationshipId),
      ...connectingRels,
    ],
  };
}
