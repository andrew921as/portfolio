// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import NavList from "./NavList.astro";
import { navItems } from "../../utils/constants/navItems.js";

describe("NavList", () => {
  test("renders one <li> per nav item, in order", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(NavList);

    expect(html.match(/<li[\s>]/g)).toHaveLength(navItems.length);
    for (const item of navItems) {
      expect(html).toContain(`href="${item.href}"`);
      expect(html).toContain(`>${item.label}</a>`);
    }
  });

  test("defaults the <ul> and links to the desktop variant", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(NavList);

    expect(html).toContain('<ul class="desktop"');
    expect(html.match(/class="desktop"/g)).toHaveLength(navItems.length + 1);
  });

  test("propagates a custom variant to the <ul> and every NavLink", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(NavList, { props: { variant: "footer" } });

    expect(html).toContain('<ul class="footer"');
    expect(html.match(/class="footer"/g)).toHaveLength(navItems.length + 1);
  });
});
