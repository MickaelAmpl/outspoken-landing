// FAQ accordion: each question is a button; answers are real text, hidden with hidden="until-found" when closed (Ctrl+F opens them). No height animation.
export function init() {
  const root = document.querySelector('.faq');
  if (!root) return;

  function set(q, open) {
    const btn = q.querySelector('.faq-row');
    const ans = q.querySelector('.faq-a');
    q.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) ans.removeAttribute('hidden');
    else ans.setAttribute('hidden', 'until-found');
  }

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-row');
    if (!btn || !root.contains(btn)) return;
    const q = btn.closest('.faq-q');
    set(q, !q.classList.contains('open'));
  });

  // find-in-page reveals a closed answer: keep the button state in sync
  root.addEventListener('beforematch', (e) => {
    const q = e.target.closest('.faq-q');
    if (q) {
      q.classList.add('open');
      q.querySelector('.faq-row').setAttribute('aria-expanded', 'true');
    }
  });
}
