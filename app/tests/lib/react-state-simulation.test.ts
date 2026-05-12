import { describe, it, expect } from "bun:test";
import { useState, useCallback, useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";
import { demoDiagram } from "~/lib/demo-diagram";
import { erToFlow } from "~/lib/er-to-flow";
import { parseDbml } from "~/lib/dbml-parser";
import { schemaToEr } from "~/lib/dbml-to-er";
import { withToggleCallback } from "~/lib/with-toggle-callback";
import type { ERDiagram } from "~/types/er-model";

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
 * Simulates EREditor's state machine in a pure function.
 * This lets us verify the EXACT state transitions without a DOM.
 */
function simulateEditorImport(): {
  diagram: ERDiagram;
  nodes: Node[];
  edges: Edge[];
} {
  // Initial state (like useState(demoDiagram))
  let diagram = demoDiagram;

  // Simulate useNodesState/useEdgesState initial values
  let nodes = withToggleCallback(erToFlow(demoDiagram).nodes, () => {});
  let edges = erToFlow(demoDiagram).edges;

  // Simulate handleImport
  const schema = parseDbml(HOSPITAL_DBML);
  const imported = schemaToEr(schema, "dbml");

  // setDiagram(imported)
  diagram = imported;

  // syncDiagram(imported, toggleRelAttributes)
  const { nodes: projectedNodes, edges: newEdges } = erToFlow(imported);

  const posMap = new Map(nodes.map((n) => [n.id, n.position]));
  const prevIdSet = new Set(nodes.map((n) => n.id));

  const merged = projectedNodes.map((node) => ({
    ...node,
    position: posMap.get(node.id) ?? node.position,
  }));

  // withToggleCallback(merged, toggleCb)
  nodes = withToggleCallback(merged, () => {});
  edges = newEdges;

  return { diagram, nodes, edges };
}

describe("React state simulation: hospital schema import", () => {
  it("after import, RECETA node has attributesExpanded false", () => {
    const { nodes } = simulateEditorImport();
    const recetaNode = nodes.find((n) => n.id === "rel-prescriptions-appointments-medications");
    expect(recetaNode).toBeDefined();
    const data = recetaNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(true);
  });

  it("after import, RECETA relationship in diagram has attributesExpanded false", () => {
    const { diagram } = simulateEditorImport();
    const receta = diagram.relationships.find((r) => r.name === "RECETA");
    expect(receta!.attributesExpanded).toBe(false);
    expect(receta!.attributes.length).toBe(1);
  });

  it("after import, no attribute nodes exist for RECETA", () => {
    const { nodes } = simulateEditorImport();
    const attrNodes = nodes.filter((n) => n.type === "erAttribute");
    expect(attrNodes.some((n) => n.id === "attr-prescriptions-dosage")).toBe(false);
  });

  it("after import from toggled demo, RECETA data is NOT corrupted", () => {
    // Start with demo where ENROLLS is expanded
    let diagram: ERDiagram = {
      ...demoDiagram,
      relationships: demoDiagram.relationships.map((r) =>
        r.id === "rel-enrollment" ? { ...r, attributesExpanded: true } : r
      ),
    };

    let nodes = withToggleCallback(erToFlow(diagram).nodes, () => {});
    let edges = erToFlow(diagram).edges;

    // Import hospital schema
    const schema = parseDbml(HOSPITAL_DBML);
    const imported = schemaToEr(schema, "dbml");

    diagram = imported;
    const { nodes: projectedNodes, edges: newEdges } = erToFlow(imported);

    const posMap = new Map(nodes.map((n) => [n.id, n.position]));
    const merged = projectedNodes.map((node) => ({
      ...node,
      position: posMap.get(node.id) ?? node.position,
    }));

    nodes = withToggleCallback(merged, () => {});
    edges = newEdges;

    const recetaNode = nodes.find((n) => n.id === "rel-prescriptions-appointments-medications");
    expect(recetaNode).toBeDefined();
    const data = recetaNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(true);
  });
});
