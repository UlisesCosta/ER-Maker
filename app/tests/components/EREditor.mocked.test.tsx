import { describe, it, expect, mock, beforeAll } from "bun:test";
import { Window } from "happy-dom";
import { createElement, useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { Node, Edge } from "@xyflow/react";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Track nodes passed to ReactFlow
let lastReactFlowNodes: Node[] = [];
let lastReactFlowEdges: Edge[] = [];

mock.module("@xyflow/react", () => {
  return {
    ReactFlow: function MockReactFlow({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
      useEffect(() => {
        lastReactFlowNodes = nodes;
        lastReactFlowEdges = edges;
      }, [nodes, edges]);
      return createElement("div", { "data-testid": "mock-react-flow" },
        nodes.map((n) => createElement("div", { key: n.id, "data-id": n.id, "data-type": n.type },
          n.type === "erRelationship" && (n.data as any).hasHiddenAttributes
            ? createElement("button", { className: "toggle-btn", onClick: (n.data as any).onToggleExpand }, "+ atrib")
            : null,
          n.type === "erRelationship" && (n.data as any).attributesExpanded && !(n.data as any).hasHiddenAttributes
            ? createElement("button", { className: "toggle-btn", onClick: (n.data as any).onToggleExpand }, "− atrib")
            : null
        ))
      );
    },
    useNodesState: function useNodesState(initialNodes: Node[]) {
      const [nodes, setNodes] = useState(initialNodes);
      const onNodesChange = useCallback(
        (changes: any[]) => setNodes((nds: Node[]) => {
          let result = [...nds];
          for (const change of changes) {
            if (change.type === "replace") {
              const idx = result.findIndex((n) => n.id === change.id);
              if (idx >= 0) result[idx] = change.item;
            }
          }
          return result;
        }),
        []
      );
      return [nodes, setNodes, onNodesChange];
    },
    useEdgesState: function useEdgesState(initialEdges: Edge[]) {
      const [edges, setEdges] = useState(initialEdges);
      const onEdgesChange = useCallback(
        (changes: any[]) => setEdges((eds: Edge[]) => [...eds]),
        []
      );
      return [edges, setEdges, onEdgesChange];
    },
    Background: function Background() { return null; },
    Controls: function Controls() { return null; },
    Handle: function Handle() { return null; },
    Position: { Top: "top", Bottom: "bottom", Left: "left", Right: "right" },
    BackgroundVariant: { Dots: "dots" },
    applyNodeChanges: function applyNodeChanges(changes: any[], nodes: Node[]) { return nodes; },
    applyEdgeChanges: function applyEdgeChanges(changes: any[], edges: Edge[]) { return edges; },
  };
});

// Import EREditor AFTER mocking
let EREditor: any;
beforeAll(async () => {
  const mod = await import("~/components/EREditor");
  EREditor = mod.EREditor;
});

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

describe("EREditor with mocked ReactFlow", () => {
  it("after import, RECETA node data is correct in ReactFlow props", async () => {
    const window = new Window({ url: "http://localhost" });
    (window as any).SyntaxError = SyntaxError;
    globalThis.window = window as any;
    globalThis.document = window.document as any;
    globalThis.localStorage = { getItem: () => null, setItem: () => {} } as any;

    const container = window.document.createElement("div");
    window.document.body.appendChild(container);

    const root = createRoot(container as any);
    root.render(
      createElement(MemoryRouter, {}, createElement(EREditor))
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Open import panel
    const importPanelBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Importar")
    );
    (importPanelBtn as any).click();
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Paste hospital schema
    const textarea = container.querySelector("textarea");
    const ta = textarea as any;
    ta.focus();
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;
    nativeSetter?.call(ta, HOSPITAL_DBML);
    ta.dispatchEvent(new window.Event("input", { bubbles: true }) as any);
    ta.dispatchEvent(new window.Event("change", { bubbles: true }) as any);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Click import
    const loadBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Cargar")
    );
    (loadBtn as any).click();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const recetaNode = lastReactFlowNodes.find((n) => n.id === "rel-prescriptions");
    expect(recetaNode).toBeDefined();
    const data = recetaNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(true);

    root.unmount();
  });

  it("clicking + ATRIB toggles and shows − ATRIB", async () => {
    const window = new Window({ url: "http://localhost" });
    (window as any).SyntaxError = SyntaxError;
    globalThis.window = window as any;
    globalThis.document = window.document as any;
    globalThis.localStorage = { getItem: () => null, setItem: () => {} } as any;

    const container = window.document.createElement("div");
    window.document.body.appendChild(container);

    const root = createRoot(container as any);
    root.render(
      createElement(MemoryRouter, {}, createElement(EREditor))
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Import hospital schema
    const importPanelBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Importar")
    );
    (importPanelBtn as any).click();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const textarea = container.querySelector("textarea");
    const ta2 = textarea as any;
    ta2.focus();
    const nativeSetter2 = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;
    nativeSetter2?.call(ta2, HOSPITAL_DBML);
    ta2.dispatchEvent(new window.Event("input", { bubbles: true }) as any);
    ta2.dispatchEvent(new window.Event("change", { bubbles: true }) as any);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const loadBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Cargar")
    );
    (loadBtn as any).click();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Click + ATRIB
    const recetaDom = Array.from(container.querySelectorAll("[data-id]")).find(
      (el) => el.getAttribute("data-id") === "rel-prescriptions"
    );
    const toggleBtn = recetaDom?.querySelector(".toggle-btn") as any;
    expect(toggleBtn?.textContent).toBe("+ atrib");

    toggleBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // After toggle, should show − ATRIB
    const recetaNode = lastReactFlowNodes.find((n) => n.id === "rel-prescriptions");
    expect((recetaNode!.data as any).attributesExpanded).toBe(true);
    expect((recetaNode!.data as any).hasHiddenAttributes).toBe(false);

    const updatedRecetaDom = Array.from(container.querySelectorAll("[data-id]")).find(
      (el) => el.getAttribute("data-id") === "rel-prescriptions"
    );
    const updatedToggleBtn = updatedRecetaDom?.querySelector(".toggle-btn");
    expect(updatedToggleBtn?.textContent).toBe("− atrib");

    root.unmount();
  });
});
