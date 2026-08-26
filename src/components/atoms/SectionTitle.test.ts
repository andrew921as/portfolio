// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import SectionTitle from "./SectionTitle.astro";

describe("SectionTitle", () => {
  test("renders the slotted heading text with no inline style by default", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionTitle, {
      slots: { default: "My Projects" },
    });

    expect(html).toContain("My Projects");
    expect(html).not.toContain("style=");
  });

  test("applies margin-bottom as an inline style when provided", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionTitle, {
      props: { marginBottom: "50px" },
      slots: { default: "Get in touch" },
    });

    expect(html).toContain('style="margin-bottom: 50px"');
  });
});
