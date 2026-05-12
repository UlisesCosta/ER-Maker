import { describe, it, expect } from "bun:test";
import { parseDbml } from "~/lib/dbml-parser";
import { schemaToEr } from "~/lib/dbml-to-er";
import { erToFlow } from "~/lib/er-to-flow";
import { demoDiagram } from "~/lib/demo-diagram";
import { withToggleCallback } from "~/lib/with-toggle-callback";
import type { Node } from "@xyflow/react";

const HOSPITAL_DBML = `Table patients {
  id int [pk]
  full_name varchar [not null]
  birth_date date
}

Table doctors {
  id int [pk]
  full_name varchar [not null]
  specialty varchar
}

Table appointments {
  id int [pk]
  patient_id int [not null]
  doctor_id int [not null]
  appointment_date timestamp
  diagnosis varchar
}

Table medications {
  id int [pk]
  name varchar [not null]
}

Table prescriptions [alias: "RECETA"] {
  appointment_id int [not null]
  medication_id int [not null]
  dosage varchar
}

Ref: appointments.patient_id > patients.id [alias: "AGENDA"]
Ref: appointments.doctor_id > doctors.id [alias: "ATIENDE"]

Ref: prescriptions.appointment_id > appointments.id
Ref: prescriptions.medication_id > medications.id
`;

/**
 * Simulates syncDiagram's merge logic (first pass only, no callback injection)
 */
function simulateSyncMerge(prevNodes: Node[], nextDiagram: ReturnType<typeof schemaToEr>): Node[] {
  const { nodes: projectedNodes } = erToFlow(nextDiagram);
  const posMap = new Map(prevNodes.map((n) => [n.id, n.position]));
  return projectedNodes.map((node) => ({
    ...node,
    position: posMap.get(node.id) ?? node.position,
  }));
}

describe("Integration: full import pipeline", () => {
  it("data layer: prescriptions is enriched join with attributesExpanded false", () => {
    const schema = parseDbml(HOSPITAL_DBML);
    const diagram = schemaToEr(schema, "dbml");
    const receta = diagram.relationships.find((r) => r.name === "RECETA");
    expect(receta).toBeDefined();
    expect(receta!.attributesExpanded).toBe(false);
    expect(receta!.attributes.length).toBe(1);
    expect(receta!.attributes[0].name).toBe("dosage");
  });

  it("erToFlow: RECETA node has hasHiddenAttributes true", () => {
    const schema = parseDbml(HOSPITAL_DBML);
    const diagram = schemaToEr(schema, "dbml");
    const { nodes } = erToFlow(diagram);
    const recetaNode = nodes.find((n) => n.id === "rel-prescriptions-appointments-medications");
    expect(recetaNode).toBeDefined();
    const data = recetaNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(true);
  });

  it("erToFlow: no attribute nodes for RECETA when collapsed", () => {
    const schema = parseDbml(HOSPITAL_DBML);
    const diagram = schemaToEr(schema, "dbml");
    const { nodes } = erToFlow(diagram);
    const attrNodes = nodes.filter((n) => n.type === "erAttribute");
    expect(attrNodes.some((n) => n.id === "attr-receta-dosage")).toBe(false);
  });

  it("sync merge from demo to hospital: RECETA node data is correct", () => {
    // Start with demo nodes (simulating prev state)
    const demoNodes = erToFlow(demoDiagram).nodes;
    expect(demoNodes.some((n) => n.id === "rel-enrollment")).toBe(true);

    // Import hospital schema
    const schema = parseDbml(HOSPITAL_DBML);
    const imported = schemaToEr(schema, "dbml");
    const merged = simulateSyncMerge(demoNodes, imported);

    // Old demo nodes should be gone
    expect(merged.some((n) => n.id === "rel-enrollment")).toBe(false);

    // New RECETA node should exist with correct data
    const recetaNode = merged.find((n) => n.id === "rel-prescriptions-appointments-medications");
    expect(recetaNode).toBeDefined();
    const data = recetaNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(true);
  });

  it("withToggleCallback preserves attributesExpanded and hasHiddenAttributes", () => {
    const schema = parseDbml(HOSPITAL_DBML);
    const diagram = schemaToEr(schema, "dbml");
    const { nodes } = erToFlow(diagram);
    const withCb = withToggleCallback(nodes, () => {});
    const recetaNode = withCb.find((n) => n.id === "rel-prescriptions-appointments-medications");
    expect(recetaNode).toBeDefined();
    const data = recetaNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(true);
  });

  it("simulated toggle then import: imported node data is NOT corrupted by old state", () => {
    // Simulate: user expands ENROLLS in demo
    const toggledDemo = {
      ...demoDiagram,
      relationships: demoDiagram.relationships.map((r) =>
        r.id === "rel-enrollment" ? { ...r, attributesExpanded: true } : r
      ),
    };
    const demoNodes = erToFlow(toggledDemo).nodes;
    const enrollmentNode = demoNodes.find((n) => n.id === "rel-enrollment");
    expect(enrollmentNode).toBeDefined();
    expect((enrollmentNode!.data as any).attributesExpanded).toBe(true);

    // Now import hospital schema
    const schema = parseDbml(HOSPITAL_DBML);
    const imported = schemaToEr(schema, "dbml");
    const merged = simulateSyncMerge(demoNodes, imported);

    // RECETA should still be collapsed
    const recetaNode = merged.find((n) => n.id === "rel-prescriptions-appointments-medications");
    expect(recetaNode).toBeDefined();
    const data = recetaNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(true);
  });
});
