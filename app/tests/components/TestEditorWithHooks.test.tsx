import { describe, it, expect } from "bun:test";
import { useState, useCallback, useMemo } from "react";
import { createElement } from "react";
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
 * A component that replicates EREditor's EXACT hook pattern:
 * - useState for diagram
 * - useState for nodes (mimicking useNodesState)
 * - useState for edges (mimicking useEdgesState)
 * - useCallback for syncDiagram
 * - useCallback for toggleRelAttributes
 * - useMemo for displayNodes
 * - Renders plain divs to inspect data
 */
function TestEditorWithHooks({ onRender, onToggle }: { onRender: (nodes: Node[]) => void; onToggle?: (relId: string, diagram: ERDiagram) => void }) {
  const [diagram, setDiagram] = useState<ERDiagram>(demoDiagram);
  const [nodes, setNodes] = useState<Node[]>(withToggleCallback(erToFlow(demoDiagram).nodes, () => {}));
  const [edges, setEdges] = useState<Edge[]>(erToFlow(demoDiagram).edges);

  const syncDiagram = useCallback(
    (nextDiagram: ERDiagram, toggleCb: (relId: string) => void) => {
      const { nodes: projectedNodes, edges: newEdges } = erToFlow(nextDiagram);
      const posMap = new Map(nodes.map((n) => [n.id, n.position]));
      const merged = projectedNodes.map((node) => ({
        ...node,
        position: posMap.get(node.id) ?? node.position,
      }));
      setNodes(withToggleCallback(merged, toggleCb));
      setEdges(newEdges);
    },
    [nodes, setNodes, setEdges]
  );

  const toggleRelAttributes = useCallback(
    (relId: string) => {
      const updatedDiagram = {
        ...diagram,
        relationships: diagram.relationships.map((r) =>
          r.id === relId ? { ...r, attributesExpanded: !r.attributesExpanded } : r
        ),
      };
      setDiagram(updatedDiagram);
      syncDiagram(updatedDiagram, toggleRelAttributes);
      onToggle?.(relId, updatedDiagram);
    },
    [diagram, syncDiagram, onToggle]
  );

  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        if (n.type === "erRelationship") {
          return {
            ...n,
            data: {
              ...n.data,
              onToggleExpand: () => toggleRelAttributes(n.id),
            },
          };
        }
        return n;
      }),
    [nodes, toggleRelAttributes]
  );

  // Call onRender so tests can inspect nodes
  onRender(displayNodes);

  return createElement(
    "div",
    {},
    createElement("button", { id: "import-btn", onClick: () => {
      const schema = parseDbml(HOSPITAL_DBML);
      const imported = schemaToEr(schema, "dbml");
      setDiagram(imported);
      syncDiagram(imported, toggleRelAttributes);
    }}, "Import"),
    createElement(
      "div",
      { id: "nodes" },
      displayNodes.map((n) =>
        createElement("div", { key: n.id, "data-id": n.id, "data-type": n.type },
          createElement("span", { className: "node-name" }, (n.data as any).name || ""),
          n.type === "erRelationship" && (n.data as any).hasHiddenAttributes
            ? createElement("button", { className: "toggle-btn", onClick: (n.data as any).onToggleExpand }, "+ atrib")
            : null,
          n.type === "erRelationship" && (n.data as any).attributesExpanded && !(n.data as any).hasHiddenAttributes
            ? createElement("button", { className: "toggle-btn", onClick: (n.data as any).onToggleExpand }, "− atrib")
            : null
        )
      )
    )
  );
}

describe("TestEditorWithHooks import simulation", () => {
  it("after import, RECETA shows + ATRIB and data is correct", async () => {
    const window = new Window({ url: "http://localhost" });
    globalThis.window = window as any;
    globalThis.document = window.document as any;

    const container = window.document.createElement("div");
    window.document.body.appendChild(container);

    let capturedNodes: Node[] = [];
    const root = createRoot(container as any);

    root.render(
      createElement(TestEditorWithHooks, {
        onRender: (n) => {
          capturedNodes = n;
        },
      })
    );

    // Wait for initial render
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Click import
    const btn = window.document.getElementById("import-btn") as any;
    btn.click();

    // Wait for React to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    const recetaNode = capturedNodes.find((n) => n.id === "rel-prescriptions");
    expect(recetaNode).toBeDefined();

    const data = recetaNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(true);

    // Check DOM
    const nodesContainer = window.document.getElementById("nodes");
    const recetaDom = nodesContainer?.children
      ? Array.from(nodesContainer.children).find(
          (el) => (el as any).getAttribute("data-id") === "rel-prescriptions"
        )
      : undefined;
    expect(recetaDom).toBeDefined();
    const toggleBtn = recetaDom
      ? Array.from((recetaDom as any).children).find(
          (el) => (el as any).className === "toggle-btn"
        )
      : undefined;
    expect((toggleBtn as any)?.textContent).toBe("+ atrib");

    root.unmount();
  });

  it("clicking + ATRIB expands and shows − ATRIB", async () => {
    const window = new Window({ url: "http://localhost" });
    globalThis.window = window as any;
    globalThis.document = window.document as any;

    const container = window.document.createElement("div");
    window.document.body.appendChild(container);

    let capturedNodes: Node[] = [];
    let toggleCalls: { relId: string; diagram: ERDiagram }[] = [];
    const root = createRoot(container as any);

    root.render(
      createElement(TestEditorWithHooks, {
        onRender: (n) => {
          capturedNodes = n;
        },
        onToggle: (relId, diagram) => {
          toggleCalls.push({ relId, diagram });
        },
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Import
    const importBtn = window.document.getElementById("import-btn") as any;
    importBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Click + ATRIB on RECETA
    const nodesContainer2 = window.document.getElementById("nodes");
    const recetaDom = nodesContainer2?.children
      ? Array.from(nodesContainer2.children).find(
          (el) => (el as any).getAttribute("data-id") === "rel-prescriptions"
        )
      : undefined;
    const toggleBtn = recetaDom
      ? Array.from((recetaDom as any).children).find(
          (el) => (el as any).className === "toggle-btn"
        )
      : undefined;
    expect((toggleBtn as any)?.textContent).toBe("+ atrib");

    (toggleBtn as any).click();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // After toggle, should show − ATRIB
    expect(toggleCalls.length).toBeGreaterThan(0);
    const lastToggle = toggleCalls[toggleCalls.length - 1];
    const toggledRel = lastToggle.diagram.relationships.find((r) => r.id === "rel-prescriptions");
    expect(toggledRel?.attributesExpanded).toBe(true);

    const recetaNode = capturedNodes.find((n) => n.id === "rel-prescriptions");
    expect((recetaNode!.data as any).attributesExpanded).toBe(true);
    expect((recetaNode!.data as any).hasHiddenAttributes).toBe(false);

    const nodesContainer3 = window.document.getElementById("nodes");
    const updatedRecetaDom = nodesContainer3?.children
      ? Array.from(nodesContainer3.children).find(
          (el) => (el as any).getAttribute("data-id") === "rel-prescriptions"
        )
      : undefined;
    const updatedToggleBtn = updatedRecetaDom
      ? Array.from((updatedRecetaDom as any).children).find(
          (el) => (el as any).className === "toggle-btn"
        )
      : undefined;
    expect((updatedToggleBtn as any)?.textContent).toBe("− atrib");

    root.unmount();
  });
});
