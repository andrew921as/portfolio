import { initParticlesEngine } from "@tsparticles/astro";

export default function initParticles() {
  initParticlesEngine(async (engine) => {
    const { loadFull } = await import("tsparticles");
    await loadFull(engine);
  });
}