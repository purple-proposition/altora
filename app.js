const STORAGE_KEY = 'job-tracker-cards';
const STATUSES = ['todo', 'sent', 'interview', 'rejected'];

let cards = loadCards();
let editingId = null;
let draggingId = null;

function loadCards() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCards() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- Rendering ---

function render() {
  STATUSES.forEach(status => {
    const list = document.getElementById(`list-${status}`);
    const items = cards.filter(c => c.status === status);

    list.innerHTML = '';
    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'card-empty';
      empty.textContent = 'Aucune candidature ici';
      list.appendChild(empty);
      return;
    }

    items.forEach(card => list.appendChild(renderCard(card)));
  });

  renderStats();
  renderSummaryDigest(currentPeriod);
  lucide.createIcons();
}

function renderCard(card) {
  const el = document.createElement('div');
  el.className = 'card';
  el.draggable = true;
  el.dataset.id = card.id;

  const heading = document.createElement('div');
  heading.className = 'card-heading';
  const title = document.createElement('span');
  title.className = 'card-title';
  title.textContent = card.title || 'Offre sans titre';
  heading.appendChild(title);

  if (card.company) {
    const sep = document.createElement('span');
    sep.className = 'card-heading-sep';
    sep.textContent = ' chez ';
    heading.appendChild(sep);

    const company = document.createElement('span');
    company.className = 'card-company';
    company.textContent = card.company;
    heading.appendChild(company);
  }
  el.appendChild(heading);

  if (card.url) {
    const link = document.createElement('a');
    link.className = 'card-link';
    link.href = card.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.innerHTML = '<i data-lucide="external-link"></i> Voir l\'offre';
    link.addEventListener('click', e => e.stopPropagation());
    el.appendChild(link);
  }

  if (card.createdAt) {
    const dateRow = document.createElement('div');
    dateRow.className = 'card-date-row';
    const added = new Date(card.createdAt);
    const dateStr = added.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = added.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    dateRow.innerHTML = `
      <span class="card-date"><i data-lucide="calendar"></i>${dateStr}</span>
      <span class="card-date"><i data-lucide="clock"></i>${timeStr}</span>
    `;
    el.appendChild(dateRow);
  }

  el.addEventListener('click', () => openModal('edit', card));

  el.addEventListener('dragstart', () => {
    draggingId = card.id;
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => {
    draggingId = null;
    el.classList.remove('dragging');
  });

  return el;
}

function renderStats() {
  const total = cards.length;
  const todo = cards.filter(c => c.status === 'todo').length;
  const sent = cards.filter(c => c.status === 'sent').length;
  const interview = cards.filter(c => c.status === 'interview').length;
  const rejected = cards.filter(c => c.status === 'rejected').length;

  setStat('todo', todo, total ? Math.round((todo / total) * 100) : 0);
  setStat('sent', sent, total ? Math.round((sent / total) * 100) : 0);
  setStat('interview', interview, total ? Math.round((interview / total) * 100) : 0);
  setStat('rejected', rejected, total ? Math.round((rejected / total) * 100) : 0);
}

// --- Summary digest (time-scoped: today / this week / this month) ---

const PERIOD_LABELS = { today: "aujourd'hui", week: 'cette semaine', month: 'ce mois-ci' };

let currentPeriod = 'today';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPeriodStart(period) {
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - (days - 1));
  return start;
}

function renderSummaryDigest(period) {
  currentPeriod = period;

  const startTime = getPeriodStart(period).getTime();
  const inRange = cards.filter(c => c.createdAt >= startTime);

  const todo = inRange.filter(c => c.status === 'todo').length;
  const sent = inRange.filter(c => c.status === 'sent').length;
  const interview = inRange.filter(c => c.status === 'interview').length;
  const rejected = inRange.filter(c => c.status === 'rejected').length;

  rollNumber(document.getElementById('summary-todo'), todo);
  rollNumber(document.getElementById('summary-sent'), sent);
  rollNumber(document.getElementById('summary-interview'), interview);
  rollNumber(document.getElementById('summary-rejected'), rejected);
  animateLabelSwap(document.getElementById('period-label'), PERIOD_LABELS[period]);

  document.querySelectorAll('.period-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });
}

const PREMIUM_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // smooth decelerate, no overshoot jank

// Measures how wide `text` would render inside `el` without touching the DOM.
function measureTextWidth(el, text) {
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute; visibility:hidden; white-space:nowrap; top:-9999px;';
  probe.className = el.className;
  const computed = getComputedStyle(el);
  probe.style.font = computed.font;
  probe.style.letterSpacing = computed.letterSpacing;
  probe.textContent = text;
  document.body.appendChild(probe);
  const width = probe.offsetWidth;
  document.body.removeChild(probe);
  return width;
}

// Fades a text swap (e.g. "aujourd'hui" -> "cette semaine") while easing the
// element's width, so the rest of the sentence reflows smoothly instead of
// jumping to the new length.
function animateLabelSwap(el, newText, duration = 280) {
  if (el.textContent === newText) return;
  const startWidth = el.offsetWidth;
  const endWidth = measureTextWidth(el, newText);

  el.style.display = 'inline-block';
  el.style.overflow = 'hidden';
  el.style.verticalAlign = 'bottom';
  el.style.width = `${startWidth}px`;
  el.style.opacity = '1';

  requestAnimationFrame(() => {
    el.style.transition = `opacity 130ms ease`;
    el.style.opacity = '0';
  });

  setTimeout(() => {
    el.textContent = newText;
    el.style.transition = `width ${duration}ms ${PREMIUM_EASE}, opacity 150ms ease`;
    el.style.width = `${endWidth}px`;
    el.style.opacity = '1';
  }, 140);

  setTimeout(() => {
    el.style.width = '';
    el.style.overflow = '';
    el.style.display = '';
    el.style.verticalAlign = '';
    el.style.transition = '';
  }, 140 + duration + 20);
}

// Odometer-style roll: the old number slides fully out (up if the value rose,
// down if it fell) while the new one slides in from the opposite edge —
// "comes from the top or bottom like a counter" — plus an eased width tween
// so the surrounding sentence reflows smoothly instead of jumping.
function rollNumber(el, to, duration = 450) {
  const from = parseInt(el.textContent, 10) || 0;
  if (from === to) {
    el.textContent = to;
    return;
  }
  const risingValue = to > from;
  const startWidth = el.offsetWidth;
  const endWidth = measureTextWidth(el, String(to));

  el.innerHTML = '';
  el.style.position = 'relative';
  el.style.display = 'inline-block';
  el.style.overflow = 'hidden';
  el.style.verticalAlign = 'bottom';
  el.style.height = '1em';
  el.style.width = `${startWidth}px`;

  const oldSpan = document.createElement('span');
  oldSpan.textContent = from;
  oldSpan.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center;';

  const newSpan = document.createElement('span');
  newSpan.textContent = to;
  newSpan.style.cssText = `position:absolute; inset:0; display:flex; align-items:center; transform: translateY(${risingValue ? '100%' : '-100%'});`;

  el.appendChild(oldSpan);
  el.appendChild(newSpan);

  requestAnimationFrame(() => {
    const t = `transform ${duration}ms ${PREMIUM_EASE}`;
    oldSpan.style.transition = t;
    newSpan.style.transition = t;
    el.style.transition = `width ${duration}ms ${PREMIUM_EASE}`;
    oldSpan.style.transform = `translateY(${risingValue ? '-100%' : '100%'})`;
    newSpan.style.transform = 'translateY(0)';
    el.style.width = `${endWidth}px`;
  });

  setTimeout(() => {
    el.textContent = to;
    el.style.position = '';
    el.style.display = '';
    el.style.overflow = '';
    el.style.height = '';
    el.style.width = '';
    el.style.verticalAlign = '';
    el.style.transition = '';
  }, duration + 30);
}

// --- Period popup (Apple-style: scale/opacity spring in, fade out) ---

const periodTrigger = document.getElementById('period-trigger');
const periodPopup = document.getElementById('period-popup');

function openPeriodPopup() {
  periodPopup.classList.remove('hidden');
  requestAnimationFrame(() => periodPopup.classList.add('visible'));
  periodTrigger.classList.add('active');
}

function closePeriodPopup() {
  periodPopup.classList.remove('visible');
  setTimeout(() => periodPopup.classList.add('hidden'), 300);
  periodTrigger.classList.remove('active');
}

periodTrigger.addEventListener('click', e => {
  e.stopPropagation();
  periodPopup.classList.contains('visible') ? closePeriodPopup() : openPeriodPopup();
});

document.querySelectorAll('.period-option').forEach(btn => {
  btn.addEventListener('click', () => {
    renderSummaryDigest(btn.dataset.period);
    closePeriodPopup();
  });
});

document.addEventListener('click', e => {
  if (!periodPopup.classList.contains('visible')) return;
  if (!e.target.closest('.period-trigger-wrap')) closePeriodPopup();
});

function setStat(key, value, pct) {
  const valueEl = document.getElementById(`stat-${key}`);
  const barEl = document.getElementById(`bar-${key}`);
  const pctEl = document.getElementById(`pct-${key}`);
  const cardEl = document.querySelector(`.column[data-status="${key}"]`);

  const changed = valueEl.textContent !== String(value);

  rollNumber(valueEl, value);
  barEl.style.width = `${pct}%`;
  pctEl.textContent = `${pct}%`;

  if (changed) {
    cardEl.classList.remove('pulse');
    void cardEl.offsetWidth;
    cardEl.classList.add('pulse');
  }
}

// --- Drag and drop ---

STATUSES.forEach(status => {
  const list = document.getElementById(`list-${status}`);

  list.addEventListener('dragover', e => {
    e.preventDefault();
    list.classList.add('drag-over');
  });

  list.addEventListener('dragleave', () => {
    list.classList.remove('drag-over');
  });

  list.addEventListener('drop', e => {
    e.preventDefault();
    list.classList.remove('drag-over');
    if (!draggingId) return;
    const card = cards.find(c => c.id === draggingId);
    if (card && card.status !== status) {
      card.status = status;
      saveCards();
      render();
    }
  });
});

// --- Modal ---

const overlay = document.getElementById('modal-overlay');
const form = document.getElementById('card-form');
const modalTitle = document.getElementById('modal-title');
const modalHint = document.getElementById('modal-hint');
const btnDelete = document.getElementById('btn-delete');
const fieldUrl = document.getElementById('field-url');
const fieldTitle = document.getElementById('field-title');
const fieldCompany = document.getElementById('field-company');
const fieldNotes = document.getElementById('field-notes');
const statusPicker = document.getElementById('status-picker');
const statusButtons = statusPicker.querySelectorAll('.status-btn');
let currentStatus = 'todo';

function setStatusPicker(status) {
  currentStatus = status;
  statusButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
}

statusButtons.forEach(btn => {
  btn.addEventListener('click', () => setStatusPicker(btn.dataset.status));
});

// --- Best-effort guess of job title / company from the URL itself ---
// (no network request, so no CORS/backend needed — just reads the slug)

const KNOWN_JOB_BOARD_HOSTS = new Set([
  'linkedin.com', 'indeed.com', 'fr.indeed.com', 'welcometothejungle.com',
  'glassdoor.com', 'fr.glassdoor.com', 'monster.com', 'apec.fr',
  'pole-emploi.fr', 'francetravail.fr', 'boards.greenhouse.io',
  'jobs.lever.co', 'jobs.smartrecruiters.com', 'apply.workable.com',
  'careers.google.com',
]);

const SKIP_SLUG_WORDS = new Set([
  'jobs', 'job', 'view', 'careers', 'companies', 'apply', 'j',
  'positions', 'vacancies', 'offres', 'offre',
]);

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function slugToWords(slug) {
  return decodeURIComponent(slug)
    .replace(/^\d+[-_]?/, '')
    .replace(/[-_]?\d{4,}$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

function guessFromUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch (e) {
    return { title: null, company: null };
  }

  const host = u.hostname.replace(/^www\./, '');
  const segments = u.pathname.split('/').filter(Boolean).map(decodeURIComponent);

  let company = null;

  if (['jobs.lever.co', 'boards.greenhouse.io', 'jobs.smartrecruiters.com', 'apply.workable.com'].includes(host)) {
    if (segments[0]) company = titleCase(slugToWords(segments[0]));
  } else if (host.endsWith('welcometothejungle.com')) {
    const idx = segments.indexOf('companies');
    if (idx !== -1 && segments[idx + 1]) company = titleCase(slugToWords(segments[idx + 1]));
  } else if (host.includes('myworkdayjobs.com')) {
    const sub = u.hostname.split('.')[0];
    if (sub && sub !== 'www') company = titleCase(slugToWords(sub));
  } else if (!KNOWN_JOB_BOARD_HOSTS.has(host)) {
    // Not a known job board — likely the company's own careers page/domain
    const rootLabel = host.split('.')[0];
    if (rootLabel && !['jobs', 'careers', 'apply', 'boards'].includes(rootLabel)) {
      company = titleCase(rootLabel);
    }
  }

  let title = null;
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (/^\d+$/.test(seg) || SKIP_SLUG_WORDS.has(seg.toLowerCase())) continue;
    const words = slugToWords(seg);
    if (words && words.length > 2) {
      title = titleCase(words);
      break;
    }
  }

  return { title, company };
}

let lastAutoTitle = '';
let lastAutoCompany = '';

function applyGuess(guess) {
  if (!guess) return;
  if (guess.title && (fieldTitle.value.trim() === '' || fieldTitle.value === lastAutoTitle)) {
    fieldTitle.value = guess.title;
    lastAutoTitle = guess.title;
  }
  if (guess.company && (fieldCompany.value.trim() === '' || fieldCompany.value === lastAutoCompany)) {
    fieldCompany.value = guess.company;
    lastAutoCompany = guess.company;
  }
}

fieldUrl.addEventListener('blur', () => {
  const url = fieldUrl.value.trim();
  if (!url) return;

  applyGuess(guessFromUrl(url));

  // Upgrade with a real server-side scrape once it lands (slower, more accurate —
  // reads schema.org JobPosting / Open Graph tags from the actual page).
  parseJobOffer(url).then(applyGuess);
});

function openModal(mode, card, presetStatus) {
  form.reset();
  editingId = null;
  lastAutoTitle = '';
  lastAutoCompany = '';
  btnDelete.classList.add('hidden');
  modalHint.classList.add('hidden');

  if (mode === 'edit') {
    editingId = card.id;
    modalTitle.textContent = 'Modifier la candidature';
    fieldUrl.value = card.url || '';
    fieldTitle.value = card.title || '';
    fieldCompany.value = card.company || '';
    setStatusPicker(card.status);
    fieldNotes.value = card.notes || '';
    btnDelete.classList.remove('hidden');
  } else if (mode === 'import') {
    modalTitle.textContent = 'Importer une offre';
    modalHint.classList.remove('hidden');
    setStatusPicker('todo');
  } else {
    modalTitle.textContent = 'Nouvelle candidature';
    setStatusPicker(presetStatus || 'todo');
  }

  overlay.classList.remove('hidden');
  (mode === 'import' ? fieldUrl : fieldTitle).focus();
}

function closeModal() {
  overlay.classList.add('hidden');
  editingId = null;
}

document.getElementById('btn-cancel').addEventListener('click', closeModal);
document.getElementById('btn-close').addEventListener('click', closeModal);
overlay.addEventListener('click', e => {
  if (e.target === overlay) closeModal();
});

form.addEventListener('submit', e => {
  e.preventDefault();

  const data = {
    url: fieldUrl.value.trim(),
    title: fieldTitle.value.trim() || (fieldUrl.value.trim() ? 'Nouvelle offre (à compléter)' : ''),
    company: fieldCompany.value.trim(),
    status: currentStatus,
    notes: fieldNotes.value.trim(),
  };

  if (editingId) {
    const card = cards.find(c => c.id === editingId);
    Object.assign(card, data);
  } else {
    cards.push({ id: uid(), createdAt: Date.now(), ...data });
  }

  saveCards();
  render();
  closeModal();
});

btnDelete.addEventListener('click', () => {
  if (!editingId) return;
  cards = cards.filter(c => c.id !== editingId);
  saveCards();
  render();
  closeModal();
});

document.querySelectorAll('.add-card-btn').forEach(btn => {
  btn.addEventListener('click', () => openModal('create', null, btn.dataset.status));
});

document.getElementById('fab-import').addEventListener('click', () => openModal('import'));

// Real server-side scrape via the /api/parse-offer serverless function
// (only available once deployed to Vercel — no-ops during local static preview).
async function parseJobOffer(url) {
  try {
    const res = await fetch(`/api/parse-offer?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// --- Grid overlay ---

const gridOverlay = document.getElementById('grid-overlay');
for (let i = 0; i < 12; i++) {
  gridOverlay.appendChild(document.createElement('span'));
}

document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.key.toLowerCase() === 'g') {
    gridOverlay.classList.toggle('visible');
  }
});

// --- Greeting (based on the visitor's local system time) ---

const hour = new Date().getHours();
document.getElementById('greeting').textContent = (hour >= 5 && hour < 18) ? 'Bonjour' : 'Bonsoir';

// --- Theme (system / light / dark) ---

const THEME_KEY = 'altora-theme';
const settingsBtn = document.getElementById('settings-btn');
const themePopup = document.getElementById('theme-popup');

function applyTheme(theme) {
  if (theme === 'dark' || theme === 'light') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

applyTheme(localStorage.getItem(THEME_KEY) || 'system');

function openThemePopup() {
  themePopup.classList.remove('hidden');
  requestAnimationFrame(() => themePopup.classList.add('visible'));
  settingsBtn.classList.add('active');
}

function closeThemePopup() {
  themePopup.classList.remove('visible');
  setTimeout(() => themePopup.classList.add('hidden'), 300);
  settingsBtn.classList.remove('active');
}

settingsBtn.addEventListener('click', e => {
  e.stopPropagation();
  themePopup.classList.contains('visible') ? closeThemePopup() : openThemePopup();
});

document.querySelectorAll('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
});

document.addEventListener('click', e => {
  if (!themePopup.classList.contains('visible')) return;
  if (!e.target.closest('.settings-trigger-wrap')) closeThemePopup();
});

render();
