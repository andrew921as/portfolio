// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Footer from "./Footer.astro";

describe("Footer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-26T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("renders the current year in the copyright line", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer);

    expect(html).toContain("© 2026 Andres Felipe develop");
  });
});
