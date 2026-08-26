# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page personal portfolio site built with Astro + React islands. It renders one page (`src/pages/index.astro`) composed of stacked sections: Header, Hero (w/ tsparticles background), ProjectsSection, TechnologiesSection, ContactSection (form), Footer.

## Commands

Package manager is pnpm (`packageManager: pnpm@11.5.2` in package.json; both `pnpm-lock.yaml` and `package-lock.json` exist, but prefer pnpm).

- `pnpm dev` / `pnpm start` — run the Astro dev server
- `pnpm build` — production build (outputs to `dist/`, runs type checks as part of `astro check`/build)
- `pnpm preview` — preview the production build locally
- `pnpm astro ...` — run arbitrary Astro CLI commands (e.g. `pnpm astro check`)

There is no test suite and no lint script configured in this repo.

## Architecture

- **Astro + React integration**: Astro is the base framework (`.astro` components render server-side/static by default). React is used only where interactivity is needed, via the `@astrojs/react` integration. The only React tree lives under `src/components/**/react/`, with `ContactForm.jsx` mounted via `client:load` inside `ContactSection.astro` — this is the client-hydration boundary.
- **Global styles/theme**: `src/layouts/Layout.astro` defines global CSS variables (`--accent`, `--accent-gray`, etc.) and imports the Poppins font. These variables are consumed by components via `var(--accent-gray)` etc.
- **Responsive design**: handled per-component via `@media` queries in each component's own `<style>` block (see `NavList.astro`'s hamburger/sidebar variant at `max-width: 750px`, most section organisms at `max-width: 768px`) rather than a shared breakpoint system.

### Atomic Design

This project follows **Atomic Design** (Atoms → Molecules → Organisms → Templates → Pages). All new UI work must be placed in the correct layer — do not add one-off markup directly inside a page or an organism when it duplicates something an existing/new atom or molecule should own.

```
src/
├── components/
│   ├── atoms/          # smallest building blocks, no internal composition
│   │   ├── icons/       # one .astro per tech/brand SVG icon (Git.astro, HTML.astro, ...); '*White.astro' = light-on-dark variant
│   │   ├── Logo.astro
│   │   ├── NavLink.astro
│   │   ├── SectionTitle.astro
│   │   └── react/       # interactive atoms (form controls)
│   │       ├── TextInput.jsx / TextArea.jsx / SubmitButton.jsx
│   │       └── *.module.css (co-located, one per component)
│   ├── molecules/       # small groups of atoms functioning as a unit
│   │   ├── SocialLink.astro     # single <a target=_blank> wrapping one icon atom
│   │   ├── SocialLinks.astro    # Git/LinkedIn/Gmail trio; prop variant="light"|"dark"
│   │   ├── NavList.astro        # <ul> of NavLink built from utils/constants/navItems.js; prop variant="desktop"|"sidebar"|"footer"
│   │   ├── ProjectCard.astro    # project card: image + title + description + slotted tech icons
│   │   └── react/
│   │       └── FormField.jsx    # label + TextInput/TextArea + error message (one form row)
│   └── organisms/       # full page sections composed of molecules/atoms
│       ├── Header.astro, Hero.astro, ProjectsSection.astro, TechnologiesSection.astro,
│       │   ContactSection.astro, Footer.astro
│       └── react/
│           └── ContactForm.jsx  # Formik + emailjs, composes FormField + SubmitButton
├── layouts/             # Templates layer (Astro convention keeps this at src/layouts/, not under components/)
│   └── Layout.astro
└── pages/               # Pages layer (Astro convention keeps this at src/pages/)
    └── index.astro      # composes the organisms in order
```

**Layer rules:**

- A layer may only import from its own layer or a layer below it (organisms → molecules/atoms; molecules → atoms; atoms → nothing internal). Never import an organism from a molecule/atom, or a molecule from an atom.
- Purely presentational components → `.astro`. Anything needing client interactivity (state, event handlers) → `.jsx`, colocated in a `react/` subfolder inside the matching atomic layer, and hydrated with a `client:*` directive at the point where it's mounted (as `ContactForm` is today).
- **Scoped CSS caveat**: Astro's per-component style scoping only applies to elements written directly in that `.astro` file — it does *not* reach into a child component's markup. So when a molecule/organism renders shared elements (e.g. `NavList`'s `<ul>/<li>/<a>`, `SocialLink`'s `<a>`), the relevant CSS must live inside that shared component itself (often behind a `variant` prop), not in the parent that consumes it. Check how `NavList.astro` (variants: `desktop`/`sidebar`/`footer`) and `SocialLink.astro` (variants: `light`/`dark`) do this before adding a new shared component.
- Icons live under `atoms/icons/`; import them directly where needed. Add new tech/brand icons there as one `.astro` file per icon, following the existing `size` prop pattern.
- Shared static data (e.g. nav items) belongs in `src/utils/constants/` and should be imported by the molecule/organism that needs it, not duplicated (see `navItems.js`, consumed by `NavList.astro`).
- To add a project card: add another `<ProjectCard>` block in `ProjectsSection.astro` with images placed in `public/img/`.
- **Particles background**: `Hero.astro` configures `@tsparticles/astro`'s `<Particles>` component with a large inline `ISourceOptions` object, and initializes the particles engine via `src/utils/scripts/particles-init.ts` (loaded through an Astro `<script>` tag, using `initParticlesEngine` + dynamic `loadFull` import from `tsparticles`).
- **Contact form**: `ContactForm.jsx` (organism) uses Formik for form state and `@emailjs/browser` to send messages client-side directly from the browser (no backend), composing `FormField` (molecule) and `SubmitButton` (atom). It reads `PUBLIC_EMAIL_KEY`, `PUBLIC_SERVICE_ID`, `PUBLIC_TEMPLATE_ID` from `import.meta.env` — these must be set in a local `.env` (gitignored, not present in the repo) for the form to work. Each React component's styling lives in its own co-located CSS module (element/tag selectors in these modules — e.g. `input`, `button`, `form` — are NOT scoped by CSS Modules and apply globally by design; only class selectors like `.formGroup` are hashed).
