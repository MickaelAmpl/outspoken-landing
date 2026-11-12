// How it works: the rail runs from the first to the last dot; the fill follows a trigger line at 55% of the viewport height;
// a step lights up (and stays lit) once the fill reaches its dot. Entrance when the section top reaches 85% of the viewport.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function init() {
  const section = document.getElementById('how-it-works');
  if (!section) return;
  const rows = section.querySelector('.rows');
  const stepEls = Array.from(section.querySelectorAll('.row'));
  const dots = stepEls.map((r) => r.querySelector('.dot'));
  if (!rows || !dots.length || dots.some((d) => !d)) return;

  section.classList.add('is-js');
  let centers = [], railTop = 0, railH = 0, ticking = false;

  // dot centres relative to the top of .rows (layout values, unaffected by the entrance transform)
  function layout() {
    const rowsTop = rows.getBoundingClientRect().top;
    centers = dots.map((d) => { const b = d.getBoundingClientRect(); return b.top - rowsTop + b.height / 2; });
    railTop = centers[0]; railH = centers[centers.length - 1] - centers[0];
    rows.style.setProperty('--rt', railTop + 'px');
    rows.style.setProperty('--rh', railH + 'px');
  }

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    if (reduce || section.getBoundingClientRect().top < vh * 0.85) section.classList.add('in');
    if (reduce) {
      rows.style.setProperty('--f', railH + 'px');
      stepEls.forEach((r) => r.classList.add('on'));
      return;
    }
    const rel = vh * 0.55 - rows.getBoundingClientRect().top;
    rows.style.setProperty('--f', Math.max(0, Math.min(railH, rel - railTop)) + 'px');
    stepEls.forEach((r, i) => r.classList.toggle('on', rel >= centers[i] - 1));
  }

  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function relayout() { layout(); update(); }

  layout(); update();
  if (!reduce) window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
}
