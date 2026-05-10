import type { ERDiagram } from "~/types/er-model";

/**
 * Seeded demo ER diagram: University enrollment domain.
 * Demonstrates entities, attributes (key, simple, derived, multivalued),
 * and an N:M relationship (ENROLLMENT) with its own attributes.
 */
export const demoDiagram: ERDiagram = {
  id: "demo-university",
  name: "University Enrollment",
  entities: [
    {
      type: "entity",
      id: "entity-student",
      name: "STUDENT",
      attributes: [
        { id: "attr-student-id", name: "StudentID", kind: "key" },
        { id: "attr-student-name", name: "Name", kind: "simple" },
        { id: "attr-student-dob", name: "DateOfBirth", kind: "simple" },
        { id: "attr-student-age", name: "Age", kind: "derived" },
        { id: "attr-student-phone", name: "Phone", kind: "multivalued" },
      ],
    },
    {
      type: "entity",
      id: "entity-course",
      name: "COURSE",
      attributes: [
        { id: "attr-course-code", name: "CourseCode", kind: "key" },
        { id: "attr-course-title", name: "Title", kind: "simple" },
        { id: "attr-course-credits", name: "Credits", kind: "simple" },
      ],
    },
    {
      type: "entity",
      id: "entity-instructor",
      name: "INSTRUCTOR",
      attributes: [
        { id: "attr-inst-id", name: "InstructorID", kind: "key" },
        { id: "attr-inst-name", name: "Name", kind: "simple" },
        { id: "attr-inst-rank", name: "Rank", kind: "simple" },
      ],
    },
  ],
  relationships: [
    {
      type: "relationship",
      id: "rel-enrollment",
      name: "ENROLLS",
      participants: [
        { entityId: "entity-student", cardinality: "N", participation: "partial" },
        { entityId: "entity-course", cardinality: "M", participation: "partial" },
      ],
      attributes: [
        { id: "attr-enroll-grade", name: "Grade", kind: "simple" },
        { id: "attr-enroll-date", name: "EnrollDate", kind: "simple" },
        { id: "attr-enroll-semester", name: "Semester", kind: "simple" },
      ],
      attributesExpanded: false,
    },
    {
      type: "relationship",
      id: "rel-teaches",
      name: "TEACHES",
      participants: [
        { entityId: "entity-instructor", cardinality: "1", participation: "partial" },
        { entityId: "entity-course", cardinality: "N", participation: "total" },
      ],
      attributes: [],
      attributesExpanded: false,
    },
  ],
};
