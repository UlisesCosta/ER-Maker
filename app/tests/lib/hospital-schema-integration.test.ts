import { describe, it, expect } from "bun:test";
import { parseDbml } from "~/lib/dbml-parser";
import { schemaToEr } from "~/lib/dbml-to-er";
import { erToFlow } from "~/lib/er-to-flow";

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

describe("Integration: hospital schema trace", () => {
  const schema = parseDbml(HOSPITAL_DBML);
  const diagram = schemaToEr(schema, "dbml");
  const { nodes, edges } = erToFlow(diagram);

  it("step 1: parseDbml produces 5 tables", () => {
    expect(schema.tables).toHaveLength(5);
  });

  it("step 2: schemaToEr produces 4 entities (prescriptions is join table)", () => {
    expect(diagram.entities).toHaveLength(4);
    const entityNames = diagram.entities.map((e) => e.name);
    expect(entityNames).toContain("PATIENTS");
    expect(entityNames).toContain("DOCTORS");
    expect(entityNames).toContain("APPOINTMENTS");
    expect(entityNames).toContain("MEDICATIONS");
  });

  it("step 3: schemaToEr produces 3 relationships", () => {
    expect(diagram.relationships).toHaveLength(3);
  });

  it("step 3a: RECETA is an N:M relationship with dosage attribute", () => {
    const receta = diagram.relationships.find((r) => r.name === "RECETA");
    expect(receta).toBeDefined();
    expect(receta!.attributes.map((a) => a.name)).toContain("dosage");
  });

  it("step 3b: RECETA starts with attributesExpanded FALSE", () => {
    const receta = diagram.relationships.find((r) => r.name === "RECETA");
    expect(receta!.attributesExpanded).toBe(false);
  });

  it("step 3c: AGENDA and ATIENDE are 1:N with no attributes", () => {
    const agenda = diagram.relationships.find((r) => r.name === "AGENDA");
    const atiende = diagram.relationships.find((r) => r.name === "ATIENDE");
    expect(agenda!.attributes).toHaveLength(0);
    expect(atiende!.attributes).toHaveLength(0);
    expect(agenda!.attributesExpanded).toBe(true);
    expect(atiende!.attributesExpanded).toBe(true);
  });

  it("step 4: erToFlow creates a relationship node for RECETA", () => {
    const recetaNode = nodes.find((n) => n.id === "rel-prescriptions-appointments-medications");
    expect(recetaNode).toBeDefined();
    expect(recetaNode!.type).toBe("erRelationship");
  });

  it("step 5: RECETA node data has attributesExpanded false and hasHiddenAttributes true", () => {
    const recetaNode = nodes.find((n) => n.id === "rel-prescriptions-appointments-medications");
    const data = recetaNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(true);
  });

  it("step 6: no attribute nodes exist for RECETA when collapsed", () => {
    const attrNodes = nodes.filter((n) => n.type === "erAttribute");
    const recetaAttr = attrNodes.find((n) => n.id === "attr-prescriptions-dosage");
    expect(recetaAttr).toBeUndefined();
  });

  it("step 7: edges connect RECETA to its participant entities", () => {
    const recetaEdges = edges.filter(
      (e) => e.source === "rel-prescriptions-appointments-medications" || e.target === "rel-prescriptions-appointments-medications"
    );
    expect(recetaEdges.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Integration: +ATRIB bug reproduction", () => {
  it("simulates importing the hospital schema and checking React node data", () => {
    const schema = parseDbml(HOSPITAL_DBML);
    const diagram = schemaToEr(schema, "dbml");
    const { nodes } = erToFlow(diagram);

    // Find the RECETA relationship node
    const recetaNode = nodes.find((n) => n.id === "rel-prescriptions-appointments-medications");
    expect(recetaNode).toBeDefined();

    // The bug report says: button shows as "- ATRIB" immediately
    // In RelationshipNode.tsx:
    //   + atrib shown when hasHiddenAttributes is true
    //   - atrib shown when attributesExpanded is true AND hasHiddenAttributes is false
    const data = recetaNode!.data as {
      attributesExpanded: boolean;
      hasHiddenAttributes: boolean;
    };

    // The button should show "+ ATRIB" (hasHiddenAttributes true)
    // NOT "- ATRIB" (attributesExpanded true && !hasHiddenAttributes)
    expect(data.attributesExpanded).toBe(false);
    expect(data.hasHiddenAttributes).toBe(true);
  });
});
