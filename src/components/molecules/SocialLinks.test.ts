// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import SocialLinks from "./SocialLinks.astro";

const HREFS = [
  "https://github.com/andrew921as",
  "https://www.linkedin.com/in/andres-felipe-velasco-coronado-634543288/",
  "mailto:andresfelipecoronado@gmail.com",
];

describe("SocialLinks", () => {
  test("light variant (default) renders dark-fill icons and light-class anchors", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SocialLinks);

    for (const href of HREFS) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html.match(/class="light"/g)).toHaveLength(3);
    expect(html).not.toContain('fill="currentColor"');
  });

  test("dark variant renders currentColor icons and dark-class anchors", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SocialLinks, { props: { variant: "dark" } });

    for (const href of HREFS) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html.match(/class="dark"/g)).toHaveLength(3);
    expect(html.match(/fill="currentColor"/g)).toHaveLength(3);
  });
});
