import { describe, it, expect } from "bun:test";
import { schemaToEr } from "~/lib/dbml-to-er";
import { parseDbml } from "~/lib/dbml-parser";
import type { NeutralSchema } from "~/types/dbml-schema";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const singleTable: NeutralSchema = {
  tables: [
    {
      name: "users",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true },
        { name: "username", type: "varchar", pk: false, notNull: true },
        { name: "email", type: "varchar", pk: false, notNull: false },
      ],
    },
  ],
  refs: [],
};

const oneToManySchema: NeutralSchema = {
  tables: [
    {
      name: "users",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true },
        { name: "username", type: "varchar", pk: false, notNull: false },
      ],
    },
    {
      name: "posts",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true },
        { name: "user_id", type: "int", pk: false, notNull: true },
        { name: "title", type: "varchar", pk: false, notNull: false },
      ],
    },
  ],
  refs: [{ fromTable: "posts", fromColumn: "user_id", toTable: "users", toColumn: "id" }],
};

// 1:N with explicit alias on the Ref
const aliasedRefSchema: NeutralSchema = {
  tables: [
    {
      name: "users",
      columns: [{ name: "id", type: "int", pk: true, notNull: true }],
    },
    {
      name: "posts",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true },
        { name: "user_id", type: "int", pk: false, notNull: true },
      ],
    },
  ],
  refs: [{ fromTable: "posts", fromColumn: "user_id", toTable: "users", toColumn: "id", alias: "ESCRIBE" }],
};

// Pure join table (no business columns beyond FKs)
const pureJoinSchema: NeutralSchema = {
  tables: [
    {
      name: "students",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true },
        { name: "name", type: "varchar", pk: false, notNull: false },
      ],
    },
    {
      name: "courses",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true },
        { name: "title", type: "varchar", pk: false, notNull: false },
      ],
    },
    {
      name: "student_courses",
      columns: [
        { name: "student_id", type: "int", pk: false, notNull: true },
        { name: "course_id", type: "int", pk: false, notNull: true },
      ],
    },
  ],
  refs: [
    { fromTable: "student_courses", fromColumn: "student_id", toTable: "students", toColumn: "id" },
    { fromTable: "student_courses", fromColumn: "course_id", toTable: "courses", toColumn: "id" },
  ],
};

// Join table with extra business columns
const richJoinSchema: NeutralSchema = {
  tables: [
    {
      name: "students",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true },
        { name: "name", type: "varchar", pk: false, notNull: false },
      ],
    },
    {
      name: "courses",
      columns: [
        { name: "id", type: "int", pk: true, notNull: true },
        { name: "title", type: "varchar", pk: false, notNull: false },
      ],
    },
    {
      name: "enrollments",
      columns: [
        { name: "student_id", type: "int", pk: false, notNull: true },
        { name: "course_id", type: "int", pk: false, notNull: true },
        { name: "grade", type: "varchar", pk: false, notNull: false },
        { name: "enrolled_at", type: "varchar", pk: false, notNull: false },
      ],
    },
  ],
  refs: [
    { fromTable: "enrollments", fromColumn: "student_id", toTable: "students", toColumn: "id" },
    { fromTable: "enrollments", fromColumn: "course_id", toTable: "courses", toColumn: "id" },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("schemaToEr — normal tables become entities", () => {
  it("creates one entity per non-join table", () => {
    const diagram = schemaToEr(singleTable);
    expect(diagram.entities).toHaveLength(1);
    expect(diagram.entities[0].name).toBe("USERS");
  });

  it("maps pk column to key attribute", () => {
    const diagram = schemaToEr(singleTable);
    const pkAttr = diagram.entities[0].attributes.find((a) => a.kind === "key");
    expect(pkAttr).toBeDefined();
    expect(pkAttr!.name).toBe("id");
  });

  it("maps non-pk columns to simple attributes", () => {
    const diagram = schemaToEr(singleTable);
    const simpleAttrs = diagram.entities[0].attributes.filter((a) => a.kind === "simple");
    expect(simpleAttrs).toHaveLength(2); // username and email
  });
});

describe("schemaToEr — FK columns hidden in conceptual view", () => {
  it("FK column does not appear as entity attribute", () => {
    const diagram = schemaToEr(oneToManySchema);
    const postsEntity = diagram.entities.find((e) => e.name === "POSTS")!;
    const fkAttr = postsEntity.attributes.find((a) => a.name === "user_id");
    expect(fkAttr).toBeUndefined();
  });

  it("non-FK columns still appear on entity", () => {
    const diagram = schemaToEr(oneToManySchema);
    const postsEntity = diagram.entities.find((e) => e.name === "POSTS")!;
    const titleAttr = postsEntity.attributes.find((a) => a.name === "title");
    expect(titleAttr).toBeDefined();
  });
});

describe("schemaToEr — 1:N relationships from FK", () => {
  it("creates a relationship for a simple FK ref", () => {
    const diagram = schemaToEr(oneToManySchema);
    expect(diagram.relationships).toHaveLength(1);
  });

  it("relationship links the correct entities", () => {
    const diagram = schemaToEr(oneToManySchema);
    const rel = diagram.relationships[0];
    const entityIds = new Set(diagram.entities.map((e) => e.id));
    for (const p of rel.participants) {
      expect(entityIds.has(p.entityId)).toBe(true);
    }
  });

  it("relationship has N and 1 cardinality for 1:N", () => {
    const diagram = schemaToEr(oneToManySchema);
    const rel = diagram.relationships[0];
    const cardinalities = rel.participants.map((p) => p.cardinality);
    expect(cardinalities).toContain("N");
    expect(cardinalities).toContain("1");
  });

  it("uses alias for relationship name when provided", () => {
    const diagram = schemaToEr(aliasedRefSchema);
    expect(diagram.relationships).toHaveLength(1);
    expect(diagram.relationships[0].name).toBe("ESCRIBE");
  });

  it("falls back to auto-generated name when no alias", () => {
    const diagram = schemaToEr(oneToManySchema);
    expect(diagram.relationships[0].name).toBe("POSTS_USERS");
  });
});

describe("schemaToEr — pure join table collapses to N:M", () => {
  it("pure join table does NOT produce an entity", () => {
    const diagram = schemaToEr(pureJoinSchema);
    const joinEntity = diagram.entities.find((e) => e.name === "STUDENT_COURSES");
    expect(joinEntity).toBeUndefined();
  });

  it("pure join table produces an N:M relationship", () => {
    const diagram = schemaToEr(pureJoinSchema);
    expect(diagram.relationships).toHaveLength(1);
    const rel = diagram.relationships[0];
    const cardinalities = rel.participants.map((p) => p.cardinality);
    expect(cardinalities).toContain("N");
    expect(cardinalities).toContain("M");
  });

  it("N:M relationship has no attributes for pure join", () => {
    const diagram = schemaToEr(pureJoinSchema);
    expect(diagram.relationships[0].attributes).toHaveLength(0);
  });
});

describe("schemaToEr — join table with business columns → N:M with attributes", () => {
  it("enriched join table does NOT produce an entity", () => {
    const diagram = schemaToEr(richJoinSchema);
    const joinEntity = diagram.entities.find((e) => e.name === "ENROLLMENTS");
    expect(joinEntity).toBeUndefined();
  });

  it("enriched join table produces a N:M relationship", () => {
    const diagram = schemaToEr(richJoinSchema);
    const rel = diagram.relationships[0];
    const cardinalities = rel.participants.map((p) => p.cardinality);
    expect(cardinalities).toContain("N");
    expect(cardinalities).toContain("M");
  });

  it("business columns surface as relationship attributes", () => {
    const diagram = schemaToEr(richJoinSchema);
    const rel = diagram.relationships[0];
    const attrNames = rel.attributes.map((a) => a.name);
    expect(attrNames).toContain("grade");
    expect(attrNames).toContain("enrolled_at");
  });

  it("FK columns are NOT included as relationship attributes", () => {
    const diagram = schemaToEr(richJoinSchema);
    const rel = diagram.relationships[0];
    const attrNames = rel.attributes.map((a) => a.name);
    expect(attrNames).not.toContain("student_id");
    expect(attrNames).not.toContain("course_id");
  });

  it("enriched relationship starts with attributesExpanded false", () => {
    const diagram = schemaToEr(richJoinSchema);
    expect(diagram.relationships[0].attributesExpanded).toBe(false);
  });
});

describe("schemaToEr — empty/invalid input", () => {
  it("returns valid empty diagram for empty schema", () => {
    const diagram = schemaToEr({ tables: [], refs: [] });
    expect(diagram.entities).toHaveLength(0);
    expect(diagram.relationships).toHaveLength(0);
  });
});

describe("schemaToEr — end-to-end with DEMO_DBML", () => {
  const DEMO_DBML = `Table users {
  id int [pk]
  username varchar [not null]
  email varchar
}

Table posts {
  id int [pk]
  user_id int [not null]
  title varchar
  body varchar
}

Table tags {
  id int [pk]
  label varchar [not null]
}

Table post_tags {
  post_id int [not null]
  tag_id int [not null]
}

Ref: posts.user_id > users.id [alias: "ESCRIBE"]
Ref: post_tags.post_id > posts.id
Ref: post_tags.tag_id > tags.id
`;

  it("produces the aliased relationship name for direct 1:N refs", () => {
    const schema = parseDbml(DEMO_DBML);
    const diagram = schemaToEr(schema);
    const directRel = diagram.relationships.find((r) => r.name === "ESCRIBE");
    expect(directRel).toBeDefined();
    expect(directRel!.participants).toHaveLength(2);
  });

  it("falls back to auto-generated name when no alias on direct 1:N ref", () => {
    const schemaNoAlias = parseDbml(`
Table users {
  id int [pk]
}
Table posts {
  id int [pk]
  user_id int
}
Ref: posts.user_id > users.id
`);
    const diagram = schemaToEr(schemaNoAlias);
    expect(diagram.relationships[0].name).toBe("POSTS_USERS");
  });
});

describe("schemaToEr — critical bug: medications + ref aliases", () => {
  const MEDICAL_DBML = `Table patients {
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

  it("medications entity exists", () => {
    const schema = parseDbml(MEDICAL_DBML);
    const diagram = schemaToEr(schema);
    const medEntity = diagram.entities.find((e) => e.name === "MEDICATIONS");
    expect(medEntity).toBeDefined();
  });

  it("medications connects to a relationship via enriched join table prescriptions", () => {
    const schema = parseDbml(MEDICAL_DBML);
    const diagram = schemaToEr(schema);
    const medEntity = diagram.entities.find((e) => e.name === "MEDICATIONS")!;
    const relsWithMed = diagram.relationships.filter((r) =>
      r.participants.some((p) => p.entityId === medEntity.id)
    );
    expect(relsWithMed.length).toBeGreaterThan(0);
  });

  it("ref aliases AGENDA and ATIENDE are used as relationship names", () => {
    const schema = parseDbml(MEDICAL_DBML);
    const diagram = schemaToEr(schema);
    const agendaRel = diagram.relationships.find((r) => r.name === "AGENDA");
    const atiendeRel = diagram.relationships.find((r) => r.name === "ATIENDE");
    expect(agendaRel).toBeDefined();
    expect(atiendeRel).toBeDefined();
  });
});
