import { describe, it, expect } from "bun:test";
import { Window } from "happy-dom";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { EREditor } from "~/components/EREditor";
import { act } from "react";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

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

describe("EREditor DOM integration", () => {
  it("after import, RECETA shows + ATRIB", async () => {
    const window = new Window({ url: "http://localhost" });
    (window as any).SyntaxError = SyntaxError;
    globalThis.window = window as any;
    globalThis.document = window.document as any;
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {},
    } as any;
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    const container = window.document.createElement("div");
    window.document.body.appendChild(container);

    const root = createRoot(container as any);

    // Render EREditor wrapped in MemoryRouter
    await act(async () => {
      root.render(
        createElement(MemoryRouter, {}, createElement(EREditor))
      );
    });

    // Find the import button and click it
    const importButton = container.querySelector("button");
    expect(importButton).toBeDefined();

    // The initial render shows the demo. We need to open the import panel.
    // Find "Importar Esquema" button
    const importPanelButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Importar")
    );
    expect(importPanelButton).toBeDefined();

    // Click to open panel
    await act(async () => {
      (importPanelButton as any).click();
    });

    // Find textarea and paste schema
    const textarea = container.querySelector("textarea");
    expect(textarea).toBeDefined();

    await act(async () => {
      const ta = textarea as any;
      ta.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;
      nativeSetter?.call(ta, HOSPITAL_DBML);
      ta.dispatchEvent(new window.Event("input", { bubbles: true }) as any);
      ta.dispatchEvent(new window.Event("change", { bubbles: true }) as any);
    });

    // Find "Cargar al Canvas" button
    const loadButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Cargar")
    );
    expect(loadButton).toBeDefined();

    // Click to import
    await act(async () => {
      (loadButton as any).click();
    });

    // Wait for React Flow to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Find all relationship nodes
    const relNodes = container.querySelectorAll(".er-relationship-node");
    console.log(`Found ${relNodes.length} relationship nodes`);

    for (const node of relNodes) {
      const name = node.querySelector("span")?.textContent;
      const button = node.querySelector("button");
      console.log(`Relationship: ${name}, button: ${button?.textContent}`);
    }

    // Find RECETA node
    const recetaNode = Array.from(relNodes).find((n) =>
      n.querySelector("span")?.textContent?.includes("RECETA")
    );
    expect(recetaNode).toBeDefined();

    const recetaButton = recetaNode?.querySelector("button");
    expect(recetaButton?.textContent?.trim()).toBe("+ atrib");

    root.unmount();
  });
});
