
# ER Maker

Lightweight SQL/DBML → Entity Relationship Diagram generator.

ER Maker transforms relational schemas into cleaner and more semantic **Entity-Relationship diagrams**, automatically inferring:

- Entities
- Relationships
- Cardinalities
- Associative entities
- N:M bridge tables
- Conceptual relationship names

Unlike traditional database diagram tools, ER Maker focuses on the **conceptual model**, not only the physical schema.

---

# Features

## Automatic Relationship Inference

ER Maker detects:

- `1:1`
- `1:N`
- `N:M`

relationships directly from:
- primary keys
- foreign keys
- references

---

## Conceptual Relationship Names

### N:M Relationships

Bridge tables automatically become relationship nodes.

```dbml
Table post_tags [alias: "CONTIENE"] {
  post_id int
  tag_id int
}
````

Result:

```text
POST --- CONTIENE --- TAG
```

---

### Direct 1:N Relationships

Refs can define business verbs using aliases.

```dbml
Ref: posts.user_id > users.id [alias: "ESCRIBE"]
```

Result:

```text
USER --- ESCRIBE --- POST
```

---

## Associative Entity Detection

ER Maker can detect when a join table may actually represent a real business entity.

Example:

```dbml
Table appointments {
  id int [pk]
  patient_id int
  doctor_id int
  diagnosis varchar
  appointment_date timestamp
}
```

Inference:

```text
associative-entity-candidate
```

The engine can suggest promoting the relationship into a standalone entity.

---

# Example

```dbml
Table users {
  id int [pk]
  username varchar
}

Table posts {
  id int [pk]
  user_id int
  title varchar
}

Table tags {
  id int [pk]
  label varchar
}

Table post_tags [alias: "CONTIENE"] {
  post_id int
  tag_id int
}

Ref: posts.user_id > users.id [alias: "ESCRIBE"]

Ref: post_tags.post_id > posts.id
Ref: post_tags.tag_id > tags.id
```

Generated conceptual ER:

```text
USER --- ESCRIBE --- POST
POST --- CONTIENE --- TAG
```

---

# Philosophy

Most schema visualizers render tables directly as entities.

ER Maker instead tries to infer the **semantic conceptual model** behind the schema:

* hide technical join tables
* infer business relationships
* detect associative entities
* generate cleaner ER diagrams

---

# Planned Features

* Weak entities
* Identifying relationships
* Derived attributes
* Conceptual vs physical view modes
* Export to SVG
* Auto-layout engine
* SQL parser support
* Interactive editing

---

# Why ER Maker?

Traditional tools:

```text
TABLES + LINES
```

ER Maker aims for:

```text
ENTITIES + BUSINESS RELATIONSHIPS
```

---

# Installation

```bash
  bun install
```

# Usage

```bash
  bun run dev
```


 

