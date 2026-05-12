import { describe, it, expect } from "bun:test";
import { createElement, useState, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Window } from "happy-dom";
import { demoDiagram } from "~/lib/demo-diagram";
import { erToFlow } from "~/lib/er-to-flow";
import { parseDbml } from "~/lib/dbml-parser";
import { schemaToEr } from "~/lib/dbml-to-er";
import { withToggleCallback } from "~/lib/with-toggle-callback";
import type { ERDiagram } from "~/types/er-model";
import type { Node, Edge } from "@xyflow/react";

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
 * A minimal React component that replicates EREditor's core state logic
 * without ReactFlow or react-router dependencies.
 */
function TestEditor({ onNodes }: { onNodes: (nodes: Node[]) => void }) {
  const [diagram, setDiagram] = useState<ERDiagram>(demoDiagram);
  const [nodes, setNodes] = useState<Node[]>(
    withToggleCallback(erToFlow(demoDiagram).nodes, () => {})
  );

  const syncDiagram = useCallback(
    (nextDiagram: ERDiagram) => {
      const { nodes: projectedNodes } = erToFlow(nextDiagram);
      const posMap = new Map(nodes.map((n) => [n.id, n.position]));
      const merged = projectedNodes.map((node) => ({
        ...node,
        position: posMap.get(node.id) ?? node.position,
      }));
      setNodes(withToggleCallback(merged, () => {}));
      onNodes(merged);
    },
    [nodes, onNodes]
  );

  const handleImport = useCallback(() => {
    const schema = parseDbml(HOSPITAL_DBML);
    const imported = schemaToEr(schema, "dbml");
    setDiagram(imported);
    syncDiagram(imported);
  }, [syncDiagram]);

  return createElement("div", {},
    createElement("button", { onClick: handleImport, id: "import-btn" }, "Import"),
    createElement("div", { id: "nodes-state" }, JSON.stringify(nodes.map((n) => ({
      id: n.id,
      type: n.type,
      data: n.data,
    }))))
  );
}

describe("TestEditor import simulation", () => {
  it("after import, RECETA node has attributesExpanded false", async () => {
    const window = new Window({ url: "http://localhost" });
    globalThis.window = window as any;
    globalThis.document = window.document as any;
    globalThis.localStorage = { getItem: () => null, setItem: () => {} } as any;

    const container = window.document.createElement("div");
    window.document.body.appendChild(container);

    let capturedNodes: Node[] = [];
    const root = createRoot(container as any);

    root.render(createElement(TestEditor, { onNodes: (n) => { capturedNodes = n; } }));

    // Wait for initial render
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Click import
    const btn = window.document.getElementById("import-btn") as any;
    btn.click();

    // Wait for React to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    const recetaNode = capturedNodes.find((n) => n.id === "rel-prescriptions-appointments-medications");
    expect(recetaNode).toBeDefined();

    const data = recetaNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(true);

    root.unmount();
  });
});
