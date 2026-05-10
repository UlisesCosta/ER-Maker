/**
 * applyOverrides — apply a manual correction to a relationship or entity
 * without mutating the original diagram.
 */
import type { ERDiagram, OverrideMeta } from "~/types/er-model";
import type { Cardinality, Participation } from "~/types/er-model";

export interface RelationshipOverride {
  kind: "relationship";
  id: string;
  fields: Partial<{
    name: string;
    cardinality: Cardinality;
    participation: Participation;
  }>;
}

export type DiagramOverride = RelationshipOverride;

export function applyOverrides(
  diagram: ERDiagram,
  override: DiagramOverride
): ERDiagram {
  if (override.kind === "relationship") {
    const rel = diagram.relationships.find((r) => r.id === override.id);
    if (!rel) return diagram;

    const overrideMeta: OverrideMeta = {
      appliedAt: new Date().toISOString().slice(0, 10),
      fields: override.fields,
    };

    return {
      ...diagram,
      relationships: diagram.relationships.map((r) =>
        r.id === override.id
          ? { ...r, ...override.fields, override: overrideMeta }
          : r
      ),
    };
  }
  return diagram;
}
