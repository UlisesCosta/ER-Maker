import { describe, it, expect } from "bun:test";
import { formatParticipant } from "~/components/SidebarNMDetail";

describe("formatParticipant", () => {
  it("returns entity name when entity is found", () => {
    const result = formatParticipant(
      { entityId: "e1", cardinality: "N", participation: "total" },
      [{ type: "entity", id: "e1", name: "Student", attributes: [], weak: false }]
    );
    expect(result.name).toBe("Student");
  });

  it("falls back to entityId when entity is not found", () => {
    const result = formatParticipant(
      { entityId: "e99", cardinality: "1", participation: "partial" },
      []
    );
    expect(result.name).toBe("e99");
  });

  it("returns correct entity when multiple entities exist", () => {
    const entities = [
      { type: "entity" as const, id: "e1", name: "Student", attributes: [], weak: false },
      { type: "entity" as const, id: "e2", name: "Course", attributes: [], weak: false },
    ];
    const result = formatParticipant(
      { entityId: "e2", cardinality: "N", participation: "partial" },
      entities
    );
    expect(result.name).toBe("Course");
  });

  it("returns cardinality and participation from participant", () => {
    const result = formatParticipant(
      { entityId: "e1", cardinality: "M", participation: "total" },
      [{ type: "entity" as const, id: "e1", name: "Course", attributes: [], weak: false }]
    );
    expect(result.cardinality).toBe("M");
    expect(result.participation).toBe("total");
  });
});
