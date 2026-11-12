// Booking popup built on the site itself (no Cal.com iframe).
// Why: Cal.com's embedded app is ~1.3 MB / 76 files; a first-time visitor waited ~4–7 s for the calendar (measured 11 Nov).
// Here we fetch free slots from Cal.com's public API (~10 KB) when the page loads and draw the calendar ourselves,
// so the popup opens instantly. The booking is still created in Cal.com: confirmation e-mails, the Zoho calendar
// event and the Cal Video link work exactly as on cal.com.
// Fallback: every button keeps its href to cal.com. If the slots can't be loaded, the click simply goes there.

const API = 'https://api.cal.com/v2';
const USERNAME = 'outspoken';
const EVENT_SLUG = 'intro-call';
const SLOTS_VERSION = '2024-09-04';
const BOOKINGS_VERSION = '2026-02-25';
const DAYS_AHEAD = 45;              // Cal.com itself limits booking to 30 business days ahead
const STALE_MS = 5 * 60 * 1000;     // refetch slots if older than 5 minutes when the popup opens

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Vienna';
const fmtTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz });
const fmtDayLong = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz });
const fmtMonth = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const state = {
  slots: null,          // { 'YYYY-MM-DD': ['ISO start', ...] } in the visitor's time zone
  loadedAt: 0,
  loading: null,        // Promise while fetching
  failed: false,
  month: null,          // 'YYYY-MM' shown in the grid
  day: null,            // selected 'YYYY-MM-DD'
  slot: null,           // selected ISO start
  fallbackUrl: '',
};

let dlg;                // <dialog>
let els = {};

/* ---------- data ---------- */

function ymd(d) { return d.toISOString().slice(0, 10); }

function fetchSlots() {
  const start = new Date();
  const end = new Date(Date.now() + DAYS_AHEAD * 864e5);
  const url = `${API}/slots?username=${USERNAME}&eventTypeSlug=${EVENT_SLUG}&start=${ymd(start)}&end=${ymd(end)}&timeZone=${encodeURIComponent(tz)}`;
  state.loading = fetch(url, { headers: { 'cal-api-version': SLOTS_VERSION } })
    .then((r) => { if (!r.ok) throw new Error('slots ' + r.status); return r.json(); })
    .then((json) => {
      const out = {};
      for (const [day, list] of Object.entries(json.data || {})) {
        const starts = list.map((s) => s.start).filter(Boolean);
        if (starts.length) out[day] = starts;
      }
      state.slots = out;
      state.loadedAt = Date.now();
      state.failed = false;
    })
    .catch((err) => { console.warn('[booking] slots not loaded:', err.message); state.failed = true; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

async function createBooking(fields) {
  const body = {
    start: new Date(state.slot).toISOString(),
    eventTypeSlug: EVENT_SLUG,
    username: USERNAME,
    attendee: { name: fields.name, email: fields.email, timeZone: tz, language: 'en' },
    bookingFieldsResponses: { linkedin: fields.linkedin, company: fields.company, role: fields.role },
  };
  if (fields.goal) body.bookingFieldsResponses.goal = fields.goal;
  const r = await fetch(`${API}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cal-api-version': BOOKINGS_VERSION },
    body: JSON.stringify(body),
  });
  let json = null;
  try { json = await r.json(); } catch (e) { /* empty body */ }
  if (!r.ok || (json && json.status === 'error')) {
    const msg = (json && (json.error?.message || json.message)) || `HTTP ${r.status}`;
    const err = new Error(String(msg));
    err.taken = /unavailable|no available|already|not available|taken|conflict/i.test(String(msg)) || r.status === 409;
    throw err;
  }
  return json && json.data;
}

/* ---------- markup ---------- */

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}

function field(id, label, opts = {}) {
  const input = opts.textarea
    ? h('textarea', { id, name: id, rows: 3, maxlength: 1000, placeholder: opts.placeholder || null })
    : h('input', { id, name: id, type: opts.type || 'text', required: !opts.optional, autocomplete: opts.autocomplete || null,
        inputmode: opts.inputmode || null, placeholder: opts.placeholder || null, maxlength: 300 });
  return h('div', { class: 'bk-field' },
    h('label', { for: id }, label, opts.optional ? h('span', { class: 'bk-opt' }, ' (optional)') : null),
    input);
}

function build() {
  els.close = h('button', { type: 'button', class: 'bk-close', 'aria-label': 'Close', onclick: () => dlg.close() }, '×');

  // step 1: date + time
  els.monthLabel = h('span', { class: 'bk-month' });
  els.prev = h('button', { type: 'button', class: 'bk-nav', 'aria-label': 'Previous month', onclick: () => shiftMonth(-1) }, '‹');
  els.next = h('button', { type: 'button', class: 'bk-nav', 'aria-label': 'Next month', onclick: () => shiftMonth(1) }, '›');
  els.grid = h('div', { class: 'bk-grid', role: 'group', 'aria-label': 'Available days' });
  els.dayTitle = h('p', { class: 'bk-day-title' });
  els.times = h('div', { class: 'bk-times', role: 'list' });
  els.status = h('p', { class: 'bk-status', role: 'status', 'aria-live': 'polite' });
  els.pick = h('section', { class: 'bk-pick' },
    h('div', { class: 'bk-cal' },
      h('div', { class: 'bk-cal-head' }, els.monthLabel, h('span', { class: 'bk-navs' }, els.prev, els.next)),
      h('div', { class: 'bk-wd', 'aria-hidden': 'true' }, WEEKDAYS.map((d) => h('span', {}, d))),
      els.grid),
    h('div', { class: 'bk-slots' }, els.dayTitle, els.times),
    els.status);

  // step 2: details
  els.chosen = h('p', { class: 'bk-chosen' });
  els.form = h('form', { class: 'bk-form', novalidate: true, onsubmit: onSubmit },
    h('div', { class: 'bk-chosen-row' }, els.chosen,
      h('button', { type: 'button', class: 'bk-link', onclick: () => show('pick') }, 'Change')),
    h('div', { class: 'bk-fields' },
      field('bk-name', 'Name', { autocomplete: 'name' }),
      field('bk-email', 'Work email', { type: 'email', autocomplete: 'email', inputmode: 'email' }),
      field('bk-linkedin', 'LinkedIn profile URL', { inputmode: 'url', placeholder: 'linkedin.com/in/…', autocomplete: 'url' }),
      field('bk-company', 'Company', { placeholder: 'Company name and website', autocomplete: 'organization' }),
      field('bk-role', 'Your role', { placeholder: 'e.g. Founder & CEO', autocomplete: 'organization-title' }),
      field('bk-goal', 'What would you like to get from the call?', { textarea: true, optional: true })),
    els.formError = h('p', { class: 'bk-error', role: 'alert' }),
    els.submit = h('button', { type: 'submit', class: 'btn bk-submit' }, 'Confirm booking'));
  els.details = h('section', { class: 'bk-details', hidden: true }, els.form);
  els.form.addEventListener('input', (e) => { const f = e.target.closest('.bk-field'); if (f) f.classList.remove('is-bad'); });

  // step 3: done
  els.doneWhen = h('p', { class: 'bk-done-when' });
  els.doneMail = h('p', { class: 'bk-done-mail' });
  els.done = h('section', { class: 'bk-done', hidden: true },
    h('p', { class: 'bk-done-title' }, 'You’re booked.'),
    els.doneWhen, els.doneMail,
    h('button', { type: 'button', class: 'btn', onclick: () => dlg.close() }, 'Done'));

  dlg = h('dialog', { class: 'bk', 'aria-labelledby': 'bk-title' },
    h('div', { class: 'bk-card' },
      h('header', { class: 'bk-head' },
        h('div', {},
          h('h2', { id: 'bk-title', class: 'bk-title' }, 'Book an intro call'),
          h('p', { class: 'bk-meta' }, '45 min · Video call · Times in ', h('span', { class: 'bk-tz' }, tz.replace(/_/g, ' ')))),
        els.close),
      els.pick, els.details, els.done));

  dlg.addEventListener('close', () => document.documentElement.classList.remove('bk-lock'));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });   // click on the backdrop
  document.body.append(dlg);
}

/* ---------- rendering ---------- */

function availableDays() { return Object.keys(state.slots || {}).sort(); }

function shiftMonth(step) {
  const [y, m] = state.month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + step, 1));
  state.month = d.toISOString().slice(0, 7);
  renderGrid();
}

function renderGrid() {
  const days = availableDays();
  const months = [...new Set(days.map((d) => d.slice(0, 7)))];
  const [y, m] = state.month.split('-').map(Number);
  els.monthLabel.textContent = fmtMonth.format(new Date(Date.UTC(y, m - 1, 1)));
  els.prev.disabled = !months.length || state.month <= months[0];
  els.next.disabled = !months.length || state.month >= months[months.length - 1];

  els.grid.replaceChildren();
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;                 // Monday-first
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  for (let i = 0; i < lead; i++) els.grid.append(h('span', { class: 'bk-d bk-empty', 'aria-hidden': 'true' }));
  for (let n = 1; n <= count; n++) {
    const key = `${state.month}-${String(n).padStart(2, '0')}`;
    const open = !!(state.slots && state.slots[key]);
    const label = fmtDayLong.format(new Date(`${key}T12:00:00Z`));
    els.grid.append(open
      ? h('button', { type: 'button', class: 'bk-d' + (key === state.day ? ' is-on' : ''), 'aria-pressed': key === state.day ? 'true' : 'false',
          'aria-label': `${label}, ${state.slots[key].length} times`, onclick: () => selectDay(key) }, n)
      : h('span', { class: 'bk-d bk-off', 'aria-label': `${label}, no times` }, n));
  }
}

function renderTimes() {
  els.times.replaceChildren();
  if (!state.day) { els.dayTitle.textContent = 'Pick a day'; return; }
  els.dayTitle.textContent = fmtDayLong.format(new Date(`${state.day}T12:00:00Z`));
  for (const iso of state.slots[state.day] || []) {
    els.times.append(h('button', { type: 'button', class: 'bk-t', role: 'listitem', onclick: () => selectSlot(iso) }, fmtTime.format(new Date(iso))));
  }
}

function selectDay(key) {
  state.day = key;
  renderGrid();
  renderTimes();
  const firstTime = els.times.querySelector('button');
  if (firstTime && window.matchMedia('(max-width: 899.98px)').matches) firstTime.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function selectSlot(iso) {
  state.slot = iso;
  const d = new Date(iso);
  els.chosen.textContent = `${fmtDayLong.format(d)}, ${fmtTime.format(d)}`;
  els.formError.textContent = '';
  show('details');
  const firstEmpty = [...els.form.querySelectorAll('input, textarea')].find((i) => !i.value);
  (firstEmpty || els.submit).focus();
}

function show(step) {
  els.pick.hidden = step !== 'pick';
  els.details.hidden = step !== 'details';
  els.done.hidden = step !== 'done';
  dlg.querySelector('.bk-card').scrollTop = 0;
}

function renderPick() {
  const days = availableDays();
  els.status.textContent = '';
  if (!days.length) {
    els.status.replaceChildren('No free times in the next weeks. ', h('a', { href: state.fallbackUrl, class: 'bk-link' }, 'See the full calendar'));
  }
  if (!state.day || !(state.slots && state.slots[state.day])) state.day = days[0] || null;
  state.month = (state.day || ymd(new Date())).slice(0, 7);
  renderGrid();
  renderTimes();
}

/* ---------- actions ---------- */

async function open(fallbackUrl) {
  state.fallbackUrl = fallbackUrl;
  if (!dlg) build();
  document.documentElement.classList.add('bk-lock');
  show('pick');
  dlg.showModal();
  if (!state.slots || Date.now() - state.loadedAt > STALE_MS) {
    els.grid.replaceChildren();
    els.times.replaceChildren();
    els.dayTitle.textContent = '';
    els.status.textContent = 'Loading free times…';
    await (state.loading || fetchSlots());
    if (state.failed) { window.location.href = fallbackUrl; return; }
  }
  renderPick();
  const firstDay = els.grid.querySelector('.is-on') || els.grid.querySelector('button');
  if (firstDay) firstDay.focus();
}

function normalizeUrl(v) {
  const s = v.trim();
  if (!s) return s;
  return /^https?:\/\//i.test(s) ? s : 'https://' + s.replace(/^\/+/, '');
}

async function onSubmit(e) {
  e.preventDefault();
  const get = (id) => els.form.querySelector('#' + id).value.trim();
  const fields = { name: get('bk-name'), email: get('bk-email'), linkedin: normalizeUrl(get('bk-linkedin')), company: get('bk-company'), role: get('bk-role'), goal: get('bk-goal') };

  const invalid = [...els.form.querySelectorAll('input[required]')].find((i) => !i.value.trim())
    || (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) && els.form.querySelector('#bk-email'));
  els.form.querySelectorAll('.bk-field').forEach((f) => f.classList.remove('is-bad'));
  if (invalid) {
    invalid.closest('.bk-field').classList.add('is-bad');
    els.formError.textContent = invalid.id === 'bk-email' && invalid.value.trim() ? 'Please check the email address.' : 'Please fill in the highlighted field.';
    invalid.focus();
    return;
  }

  els.submit.disabled = true;
  els.submit.textContent = 'Booking…';
  els.formError.textContent = '';
  try {
    await createBooking(fields);
    const d = new Date(state.slot);
    els.doneWhen.textContent = `${fmtDayLong.format(d)}, ${fmtTime.format(d)} (${tz.replace(/_/g, ' ')}), 45 min.`;
    els.doneMail.textContent = `The calendar invite with the video link is on its way to ${fields.email}.`;
    show('done');
    state.loadedAt = 0;                                        // the slot is gone: refetch next time
    fetchSlots();
  } catch (err) {
    console.warn('[booking] booking failed:', err.message);
    if (err.taken) {
      els.formError.textContent = 'That time was just taken. Please pick another one.';
      await fetchSlots();
      renderPick();
      show('pick');
      els.status.textContent = 'That time was just taken. Please pick another one.';
    } else {
      els.formError.replaceChildren('Something went wrong on our side. ', h('a', { href: state.fallbackUrl, class: 'bk-link' }, 'Book on Cal.com instead'), '.');
    }
  } finally {
    els.submit.disabled = false;
    els.submit.textContent = 'Confirm booking';
  }
}

export function init() {
  const links = [...document.querySelectorAll('a[href^="https://cal.com/"]')];
  if (!links.length) return;
  fetchSlots();                                                // ~10 KB, so the calendar is ready before anyone clicks
  for (const a of links) {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;   // let "open in new tab" work
      if (state.failed && !state.loading) return;                             // API down: plain link to cal.com
      if (typeof HTMLDialogElement !== 'function') return;                    // very old browser: plain link
      e.preventDefault();
      open(a.href);
    });
  }
}
