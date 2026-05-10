import { describe, it, expect } from "bun:test";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { MemoryRouter } from "react-router";
import { EREditor } from "~/components/EREditor";

describe("EREditor server render", () => {
  it("renders without crashing", () => {
    // Mock window/localStorage for server render
    globalThis.window = {
      matchMedia: () => ({ matches: false }),
      addEventListener: () => {},
      removeEventListener: () => {},
    } as any;
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {},
    } as any;
    globalThis.document = {
      documentElement: { setAttribute: () => {} },
    } as any;

    const html = renderToString(createElement(MemoryRouter, {}, createElement(EREditor)));
    expect(html).toContain("ER Maker");
  });
});
