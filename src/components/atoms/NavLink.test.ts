// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import NavLink from "./NavLink.astro";

describe("NavLink", () => {
  test("defaults to the desktop variant class", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(NavLink, {
      props: { href: "#about", label: "Me" },
    });

    expect(html).toContain('href="#about"');
    expect(html).toContain('class="desktop"');
    expect(html).toContain(">Me</a>");
  });

  test.each(["desktop", "sidebar", "footer"] as const)(
    "applies the %s variant class",
    async (variant) => {
      const container = await AstroContainer.create();
      const html = await container.renderToString(NavLink, {
        props: { href: "#projects", label: "Projects", variant },
      });

      expect(html).toContain(`class="${variant}"`);
    }
  );
});
