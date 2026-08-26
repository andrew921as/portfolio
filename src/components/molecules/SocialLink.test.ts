// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import SocialLink from "./SocialLink.astro";

describe("SocialLink", () => {
  test("defaults to the light variant class", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SocialLink, {
      props: { href: "https://example.com" },
    });

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('class="light"');
  });

  test("applies the dark variant class when requested", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SocialLink, {
      props: { href: "https://example.com", variant: "dark" },
    });

    expect(html).toContain('class="dark"');
  });

  test("renders slotted content inside the anchor", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SocialLink, {
      props: { href: "https://example.com" },
      slots: { default: "<span>icon</span>" },
    });

    expect(html).toContain("<span>icon</span>");
  });
});
