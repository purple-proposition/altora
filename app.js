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

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = card.title || 'Offre sans titre';
  el.appendChild(title);

  if (card.company) {
    const company = document.createElement('div');
    company.className = 'card-company';
    company.textContent = card.company;
    el.appendChild(company);
  }

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

  animateValue(document.getElementById('summary-todo'), todo);
  animateValue(document.getElementById('summary-sent'), sent);
  animateValue(document.getElementById('summary-interview'), interview);
  animateValue(document.getElementById('summary-rejected'), rejected);
  crossfadeText(document.getElementById('period-label'), PERIOD_LABELS[period]);

  document.querySelectorAll('.period-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });
}

// Fades text out, swaps it, then fades back in — used whenever the main
// container's copy changes, so it never just snaps to the new value.
function crossfadeText(el, newText, duration = 200) {
  if (el.textContent === newText) return;
  el.style.transition = `opacity ${duration}ms ease`;
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = newText;
    el.style.opacity = '1';
  }, duration);
}

// --- Period popup (Apple-style: scale/opacity spring in, fade out) ---

const periodTrigger = document.getElementById('period-trigger');
const periodPopup = document.getElementById('period-popup');

function openPeriodPopup() {
  periodPopup.classList.remove('hidden');
  requestAnimationFrame(() => periodPopup.classList.add('visible'));
}

function closePeriodPopup() {
  periodPopup.classList.remove('visible');
  setTimeout(() => periodPopup.classList.add('hidden'), 300);
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

// Counts up or down from the currently displayed number to the new one
// (standard behaviour: rises when the value increases, falls when it drops).
function animateValue(el, to, duration = 400) {
  const from = parseInt(el.textContent, 10) || 0;
  if (from === to) {
    el.textContent = to;
    return;
  }
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = to;
  }
  requestAnimationFrame(step);
}

function setStat(key, value, pct) {
  const valueEl = document.getElementById(`stat-${key}`);
  const barEl = document.getElementById(`bar-${key}`);
  const pctEl = document.getElementById(`pct-${key}`);
  const cardEl = document.querySelector(`.column[data-status="${key}"]`);

  const changed = valueEl.textContent !== String(value);

  animateValue(valueEl, value);
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
}

function closeThemePopup() {
  themePopup.classList.remove('visible');
  setTimeout(() => themePopup.classList.add('hidden'), 300);
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
