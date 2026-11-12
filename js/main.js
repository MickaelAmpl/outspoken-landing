// Entry point. Section modules are loaded independently so a missing or broken one never takes the page down.
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function load(name) {
  try {
    const mod = await import(`./${name}.js`);
    if (typeof mod.init === 'function') mod.init();
  } catch (err) {
    console.warn(`[main] ${name}.js not loaded:`, err && err.message ? err.message : err);
  }
}

load('header');
load('hero');
load('how');
load('faq');
load('booking');
