import { reducedMotion } from './main.js';

const POSTS = [
  { n: 'Lena Hartmann', i: 'LH', c: '#2f4c9b', d: '2nd', h: 'Co-founder & CEO · AI for freight claims · Berlin', t: '1d', l: 86, k: 14, x: 'We killed our most-requested feature last month.' },
  { n: 'Amélie Laurent', i: 'AL', c: '#4671d3', d: '3rd+', h: 'Founder · AI quality checks for support teams · Paris', t: '1w', l: 118, k: 23, x: 'We removed “AI-powered” from our homepage.' },
  { n: 'Sanna Virtanen', i: 'SV', c: '#007d58', d: '2nd', h: 'CTO & co-founder · Document AI for insurers · Helsinki', t: '2d', l: 63, k: 9, x: 'Our first ten customers didn’t come from ads.' },
  { n: 'Ingrid Solberg', i: 'IS', c: '#398268', d: '2nd', h: 'COO & co-founder · AI energy audits · Oslo', t: '1d', l: 95, k: 17, x: 'We lost a deal to a competitor with a weaker product.' },
  { n: 'Elena Rossi', i: 'ER', c: '#ac6600', d: '3rd+', h: 'CEO · AI demand forecasting for retail · Milan', t: '6h', l: 74, k: 12, x: 'Investors ask about our model. Customers ask something else.' },
  { n: 'Piotr Kowalski', i: 'PK', c: '#676d7a', d: '2nd', h: 'Co-founder · Voice AI for field service · Warsaw', t: '4d', l: 37, k: 5, x: 'I spent a full shift with a technician last Tuesday.' },
  { n: 'Jonas Weber', i: 'JW', c: '#a20030', d: '2nd', h: 'CEO · AI copilot for procurement · Munich', t: '5h', l: 52, k: 11, x: 'Every procurement team we’ve met keeps the same spreadsheet.' },
  { n: 'Tomás Navarro', i: 'TN', c: '#8a4c00', d: '3rd+', h: 'Founder · AI scheduling for private clinics · Madrid', t: '3h', l: 41, k: 6, x: 'A clinic manager told me why she finally trusted our model.' },
  { n: 'Mark de Vries', i: 'MV', c: '#223a7e', d: '2nd', h: 'Founder · AI contract review · Amsterdam', t: '2d', l: 29, k: 4, x: 'Selling AI to lawyers isn’t about accuracy.' }
];
const IC = {
  globe: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="1.2"><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#0a66c2" stroke-width="1.8" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  caret: '<svg width="12" height="12" viewBox="0 0 12 12" fill="rgba(0,0,0,.6)"><path d="M2 4h8L6 9z"/></svg>',
  like: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="1.5" stroke-linejoin="round"><path d="M6 9l3.5-6c1.2 0 2 1 1.7 2.3L10.6 8H16a1.5 1.5 0 011.5 1.8l-1.2 6A1.5 1.5 0 0114.8 17H6zM3 9h3v8H3z"/></svg>',
  comment: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="1.5" stroke-linejoin="round"><path d="M4 4h12a1 1 0 011 1v8a1 1 0 01-1 1H9l-4 3v-3H4a1 1 0 01-1-1V5a1 1 0 011-1z"/></svg>',
  repost: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8V6a1 1 0 011-1h9l-2-2M15 12v2a1 1 0 01-1 1H5l2 2"/></svg>',
  send: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="1.5" stroke-linejoin="round"><path d="M3 9.5L17 3l-5 14-2.5-6z"/></svg>'
};

function card(p) {
  return '<div class="li"><div class="li-actor"><span class="li-av" style="background:' + p.c + '">' + p.i + '</span>' +
    '<div class="li-meta"><div class="li-name"><b>' + p.n + '</b><span class="li-deg"> • ' + p.d + '</span></div>' +
    '<div class="li-head">' + p.h + '</div><div class="li-time">' + p.t + ' • ' + IC.globe + '</div></div>' +
    '<span class="li-follow">' + IC.plus + 'Follow</span></div>' +
    '<div class="li-text">' + p.x + ' <span class="li-more">… more</span></div>' +
    '<div class="li-bar"><span class="li-me"><i></i>' + IC.caret + '</span><span>' + IC.like + p.l + '</span><span>' + IC.comment + p.k + '</span><span>' + IC.repost + '</span><span>' + IC.send + '</span>' +
    '<span class="li-reacts"><i style="background:#378fe9"></i><i style="background:#df704d"></i><i style="background:#f5bb5c"></i></span></div></div>';
}

function build(plane, cols, durs) {
  plane.innerHTML = cols.map((items, c) => {
    const cells = items.concat(items).map((i) => '<div class="cell">' + card(POSTS[i]) + '</div>').join('');
    return '<div class="col"><div class="track" style="--dur:' + durs[c] + 's">' + cells + '</div></div>';
  }).join('');
}

// card height probe (cells are sized from it)
function measure(hero) {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:-9999px;top:0';
  probe.className = 'hero';
  probe.innerHTML = card(POSTS[0]);
  document.body.appendChild(probe);
  const h = probe.firstChild.offsetHeight || 145;
  document.body.removeChild(probe);
  hero.style.setProperty('--h', h + 'px');
}

export function init() {
  const hero = document.getElementById('top');
  const plane = hero && hero.querySelector('[data-plane]');
  if (!plane) return;
  const desktop = window.matchMedia('(min-width: 900px)');

  function render() {
    if (desktop.matches) build(plane, [[0, 1, 2, 3], [4, 5, 6, 7], [8, 0, 4, 2], [3, 7, 1, 5], [6, 8, 2, 0]], [50, 44, 56, 48, 52]);
    else build(plane, [[0, 1, 2], [3, 4, 5], [6, 7, 8]], [0, 0, 0]);
    measure(hero);
  }
  render();
  desktop.addEventListener ? desktop.addEventListener('change', render) : desktop.addListener(render);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => measure(hero));

  // pause the animation while the hero is off-screen
  if (!reducedMotion && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      hero.classList.toggle('is-paused', !entries[entries.length - 1].isIntersecting);
    }).observe(hero);
  }
}
