import { reducedMotion } from './main.js';

export function init() {
  const header = document.querySelector('[data-hdr]');
  if (!header) return;
  const burger = header.querySelector('[data-burger]');
  const scrim = header.querySelector('[data-scrim]');
  const desktop = window.matchMedia('(min-width: 900px)');

  // shadow after 8 px of scroll
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // phone menu
  function setOpen(open) {
    // closing while focus is inside the (about to be hidden) menu: hand focus back to the burger
    if (!open && !desktop.matches && header.classList.contains('is-open') && header.contains(document.activeElement) && document.activeElement !== burger) burger.focus();
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    scrim.hidden = !open;
  }
  const isOpen = () => header.classList.contains('is-open');
  // keyboard: opening moves focus to the first menu link; Tab cycles inside the open menu (links, Book button, burger)
  const focusables = () => [...header.querySelectorAll('[data-menu] a[href], [data-burger]')];
  burger.addEventListener('click', (e) => {
    const open = !isOpen();
    setOpen(open);
    if (open && e.detail === 0) { const first = header.querySelector('[data-menu] a[href]'); if (first) first.focus(); }   // detail 0 = keyboard activation; mouse/touch leave focus alone
  });
  header.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !isOpen()) return;
    const items = focusables();
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  scrim.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('is-open')) { setOpen(false); burger.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (header.classList.contains('is-open') && !header.contains(e.target)) setOpen(false);
  });
  const reset = () => { if (desktop.matches) setOpen(false); };
  desktop.addEventListener ? desktop.addEventListener('change', reset) : desktop.addListener(reset);

  // in-page links (header, hero, footer, CTA buttons): smooth scroll; offset comes from scroll-margin-top in base.css
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (header.contains(a)) setOpen(false);
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id);
  });
}
