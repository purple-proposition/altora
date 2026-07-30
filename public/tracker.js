const STORAGE_KEY = 'job-tracker-cards';
const STATUSES = ['todo', 'sent', 'interview', 'rejected'];
const STAGE_LABELS = { '1': '1er entretien', '2': '2e entretien', final: 'Entretien final' };
const STATUS_LABELS = { todo: 'À postuler', sent: 'Envoyé', interview: 'Entretien', rejected: 'Refus' };
const STATUS_ICONS = { todo: 'circle-dashed', sent: 'hourglass', interview: 'target', rejected: 'folder-x' };

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

function renderColumnList(status) {
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
}

// Rebuilds only the given columns' card lists (cheaper than a full render —
// used when a drag only touches one or two statuses) then refreshes stats/digest.
function renderPartial(statuses) {
  statuses.forEach(renderColumnList);
  renderStats();
  renderSummaryDigest(currentPeriod);
  lucide.createIcons();
}

function render() {
  STATUSES.forEach(renderColumnList);

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

  if (card.status === 'interview' && card.interviewStage) {
    const stageTag = document.createElement('div');
    stageTag.className = 'card-stage-tag';
    stageTag.textContent = STAGE_LABELS[card.interviewStage] || '';
    el.appendChild(stageTag);
  }

  if (card.deadline) {
    const isOverdue = new Date(card.deadline + 'T00:00:00') < startOfDay(new Date());
    const deadlineRow = document.createElement('div');
    deadlineRow.className = 'card-deadline' + (isOverdue ? ' card-deadline--overdue' : '');
    const d = new Date(card.deadline + 'T00:00:00');
    const dStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    deadlineRow.innerHTML = `<i data-lucide="alarm-clock"></i> Sans réponse après le ${dStr}`;
    el.appendChild(deadlineRow);
  }

  if (card.contacts && card.contacts.length) {
    card.contacts.forEach(contact => {
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
      if (!name && !contact.value) return;
      const block = document.createElement('div');
      block.className = 'card-contact-block';
      if (name) {
        block.innerHTML += `<div class="card-contact"><i data-lucide="user"></i>${name}</div>`;
      }
      if (contact.value) {
        const icon = contact.type === 'phone' ? 'phone' : 'mail';
        block.innerHTML += `<div class="card-contact"><i data-lucide="${icon}"></i>${contact.value}</div>`;
      }
      el.appendChild(block);
    });
  }

  const linkRow = document.createElement('div');
  linkRow.className = 'card-link-row';

  if (card.url) {
    const link = document.createElement('a');
    link.className = 'card-link';
    link.href = card.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.innerHTML = '<i data-lucide="external-link"></i> Voir l\'offre';
    link.addEventListener('click', e => e.stopPropagation());
    linkRow.appendChild(link);
  }

  const genLink = document.createElement('a');
  genLink.className = 'card-link card-link--generate';
  const jobParam = card.url || [card.title, card.company].filter(Boolean).join(' chez ');
  genLink.href = `/generate?job=${encodeURIComponent(jobParam)}&cardId=${encodeURIComponent(card.id)}`;
  genLink.innerHTML = '<i data-lucide="sparkles"></i> Générer CV';
  genLink.addEventListener('click', e => e.stopPropagation());
  linkRow.appendChild(genLink);

  el.appendChild(linkRow);

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

  el.addEventListener('contextmenu', e => {
    e.preventDefault();
    openCardContextMenu(card, e.clientX, e.clientY);
  });

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
  const container = el.closest('.summary-text');
  const startHeight = container ? container.getBoundingClientRect().height : 0;

  // Text reflow (a word jumping to/from another line) is a discrete layout
  // event that CSS can't ease — no width/timing curve makes it look smooth.
  // So instead of easing the label's width (which exposes that snap mid-
  // transition), we fade the whole sentence out, swap + reflow while fully
  // invisible, then fade the settled result back in. The snap still happens,
  // but nobody sees it.
  if (container) {
    container.style.transition = `opacity 150ms ease`;
    container.style.opacity = '0';
  }

  setTimeout(() => {
    el.textContent = newText;

    if (container) {
      const endHeight = container.getBoundingClientRect().height;
      container.style.transition = '';
      container.style.height = `${startHeight}px`;
      container.style.overflow = 'hidden';
      container.getBoundingClientRect();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          container.style.transition = `height ${duration}ms ${PREMIUM_EASE}, opacity 200ms ease`;
          container.style.height = `${endHeight}px`;
          container.style.opacity = '1';
        });
      });
      setTimeout(() => {
        container.style.height = '';
        container.style.overflow = '';
        container.style.transition = '';
      }, duration + 40);
    }
  }, 160);
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
  const startHeight = el.offsetHeight;
  const endWidth = measureTextWidth(el, String(to));

  el.innerHTML = '';
  el.style.position = 'relative';
  el.style.display = 'inline-block';
  el.style.overflow = 'hidden';
  el.style.verticalAlign = 'bottom';
  el.style.height = `${startHeight}px`;
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
      const fromColumn = document.querySelector(`.column[data-status="${card.status}"]`);
      const toColumn = list.closest('.column');
      const fromStatus = card.status;
      card.status = status;
      saveCards();
      animateHeightChange([fromColumn, toColumn], () => renderPartial([fromStatus, status]));
    }
  });
});

// FLIP-style height ease: measure before/after so the columns whose card
// counts changed grow/shrink smoothly instead of snapping.
let columnAnimTick = 0;

function animateHeightChange(columns, mutate, duration = 320) {
  const startHeights = columns.map(col => col.getBoundingClientRect().height);
  mutate();
  columns.forEach((col, i) => {
    const endHeight = col.getBoundingClientRect().height;
    // Tags this run so a stale cleanup/transition from an earlier, still-pending
    // animation on the same column (e.g. two quick consecutive drags) can't
    // clobber a newer one mid-flight.
    const myTick = ++columnAnimTick;
    col.dataset.animTick = myTick;
    col.style.height = `${startHeights[i]}px`;
    col.style.overflow = 'hidden';
    col.getBoundingClientRect(); // force layout so the browser registers the start height first
    const cleanup = () => {
      if (Number(col.dataset.animTick) !== myTick) return;
      col.style.height = '';
      col.style.overflow = '';
      col.style.transition = '';
      delete col.dataset.animTick;
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (Number(col.dataset.animTick) !== myTick) return;
        col.style.transition = `height ${duration}ms ${PREMIUM_EASE}`;
        col.style.height = `${endHeight}px`;
        col.addEventListener('transitionend', function onEnd(e) {
          if (e.propertyName !== 'height') return;
          col.removeEventListener('transitionend', onEnd);
          cleanup();
        });
      });
    });
    // Safety net in case the height didn't actually change (no transition fires).
    setTimeout(cleanup, duration + 60);
  });
}

// --- Card context menu (right-click) ---

const contextMenu = document.createElement('div');
contextMenu.className = 'context-menu hidden';
document.body.appendChild(contextMenu);

function closeContextMenu() {
  contextMenu.classList.remove('visible');
  setTimeout(() => contextMenu.classList.add('hidden'), 200);
}

function openCardContextMenu(card, x, y) {
  contextMenu.innerHTML = '';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'context-item';
  editBtn.innerHTML = '<i data-lucide="pencil"></i>Modifier';
  editBtn.addEventListener('click', () => { closeContextMenu(); openModal('edit', card); });
  contextMenu.appendChild(editBtn);

  const moveRow = document.createElement('div');
  moveRow.className = 'context-move-row';
  STATUSES.filter(s => s !== card.status).forEach(status => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `context-move-btn status-btn--${{todo:'slate',sent:'amber',interview:'green',rejected:'rose'}[status]}`;
    btn.innerHTML = `<i data-lucide="${STATUS_ICONS[status]}"></i>${STATUS_LABELS[status]}`;
    btn.addEventListener('click', () => {
      closeContextMenu();
      const fromColumn = document.querySelector(`.column[data-status="${card.status}"]`);
      const toColumn = document.querySelector(`.column[data-status="${status}"]`);
      const fromStatus = card.status;
      card.status = status;
      saveCards();
      animateHeightChange([fromColumn, toColumn], () => renderPartial([fromStatus, status]));
    });
    moveRow.appendChild(btn);
  });
  const moveLabel = document.createElement('div');
  moveLabel.className = 'context-label';
  moveLabel.textContent = 'Déplacer vers';
  contextMenu.appendChild(moveLabel);
  contextMenu.appendChild(moveRow);

  if (card.url) {
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'context-item';
    openBtn.innerHTML = '<i data-lucide="external-link"></i>Ouvrir l\'offre';
    openBtn.addEventListener('click', () => { closeContextMenu(); window.open(card.url, '_blank', 'noopener'); });
    contextMenu.appendChild(openBtn);
  }

  const divider = document.createElement('div');
  divider.className = 'context-divider';
  contextMenu.appendChild(divider);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'context-item context-item--danger';
  deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>Supprimer';
  deleteBtn.addEventListener('click', () => {
    closeContextMenu();
    cards = cards.filter(c => c.id !== card.id);
    saveCards();
    render();
  });
  contextMenu.appendChild(deleteBtn);

  contextMenu.classList.remove('hidden');
  contextMenu.style.left = '0px';
  contextMenu.style.top = '0px';
  lucide.createIcons();

  const rect = contextMenu.getBoundingClientRect();
  const clampedX = Math.min(x, window.innerWidth - rect.width - 12);
  const clampedY = Math.min(y, window.innerHeight - rect.height - 12);
  contextMenu.style.left = `${Math.max(12, clampedX)}px`;
  contextMenu.style.top = `${Math.max(12, clampedY)}px`;

  requestAnimationFrame(() => contextMenu.classList.add('visible'));
}

document.addEventListener('click', e => {
  if (!contextMenu.contains(e.target)) closeContextMenu();
});
document.addEventListener('contextmenu', e => {
  if (!e.target.closest('.card')) closeContextMenu();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeContextMenu();
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
const fieldDeadline = document.getElementById('field-deadline');
const contactsList = document.getElementById('contacts-list');
const btnAddContact = document.getElementById('btn-add-contact');
const statusPicker = document.getElementById('status-picker');
const statusButtons = statusPicker.querySelectorAll('.status-btn');
const interviewStageGroup = document.getElementById('interview-stage-group');
const interviewStagePicker = document.getElementById('interview-stage-picker');
const stageButtons = interviewStagePicker.querySelectorAll('.stage-btn');
let currentStatus = 'todo';
let currentStage = null;
let formContacts = [];

// Groups digits by 2 ("06 06 95 41 26") as the user types a phone number.
function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 15);
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

function renderContactsList() {
  contactsList.innerHTML = '';
  formContacts.forEach((contact, i) => {
    const block = document.createElement('div');
    block.className = 'contact-block';

    const nameRow = document.createElement('div');
    nameRow.className = 'contact-name-row';

    const firstName = document.createElement('input');
    firstName.type = 'text';
    firstName.placeholder = 'Prénom';
    firstName.value = contact.firstName || '';
    firstName.addEventListener('input', () => { contact.firstName = firstName.value; });

    const lastName = document.createElement('input');
    lastName.type = 'text';
    lastName.placeholder = 'Nom';
    lastName.value = contact.lastName || '';
    lastName.addEventListener('input', () => { contact.lastName = lastName.value; });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'contact-remove-btn';
    removeBtn.innerHTML = '<i data-lucide="x"></i>';
    removeBtn.addEventListener('click', () => {
      formContacts.splice(i, 1);
      animateHeightChange([contactsList], renderContactsList);
    });

    nameRow.appendChild(firstName);
    nameRow.appendChild(lastName);
    nameRow.appendChild(removeBtn);

    const detailRow = document.createElement('div');
    detailRow.className = 'contact-detail-row';

    const typeBtn = document.createElement('button');
    typeBtn.type = 'button';
    typeBtn.className = 'contact-type-btn';

    const valueInput = document.createElement('input');
    valueInput.value = contact.value || '';

    function setType(type) {
      contact.type = type;
      typeBtn.innerHTML = `<i data-lucide="${type === 'phone' ? 'phone' : 'mail'}"></i>`;
      typeBtn.title = type === 'phone' ? 'Téléphone (cliquer pour passer en email)' : 'Email (cliquer pour passer en téléphone)';
      valueInput.type = 'text';
      valueInput.placeholder = type === 'phone' ? '06 12 34 56 78' : 'email@exemple.com';
      valueInput.value = type === 'phone' ? formatPhone(contact.value || '') : (contact.value || '').toLowerCase();
      contact.value = valueInput.value;
      lucide.createIcons();
    }

    typeBtn.addEventListener('click', () => setType(contact.type === 'phone' ? 'email' : 'phone'));

    valueInput.addEventListener('input', () => {
      const caretAtEnd = valueInput.selectionEnd === valueInput.value.length;
      valueInput.value = contact.type === 'phone' ? formatPhone(valueInput.value) : valueInput.value.toLowerCase();
      contact.value = valueInput.value;
      if (caretAtEnd) valueInput.setSelectionRange(valueInput.value.length, valueInput.value.length);
    });

    setType(contact.type || 'email');

    detailRow.appendChild(typeBtn);
    detailRow.appendChild(valueInput);

    block.appendChild(nameRow);
    block.appendChild(detailRow);
    contactsList.appendChild(block);
  });
  lucide.createIcons();
}

btnAddContact.addEventListener('click', () => {
  formContacts.push({ firstName: '', lastName: '', type: 'email', value: '' });
  animateHeightChange([contactsList], renderContactsList);
});

function setStatusPicker(status) {
  currentStatus = status;
  statusButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
  interviewStageGroup.classList.toggle('hidden', status !== 'interview');
  if (status !== 'interview') setInterviewStage(null);
}

function setInterviewStage(stage) {
  currentStage = stage;
  stageButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.stage === stage);
  });
}

statusButtons.forEach(btn => {
  btn.addEventListener('click', () => setStatusPicker(btn.dataset.status));
});

stageButtons.forEach(btn => {
  btn.addEventListener('click', () => setInterviewStage(currentStage === btn.dataset.stage ? null : btn.dataset.stage));
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
  setInterviewStage(null);
  formContacts = [];
  btnDelete.classList.add('hidden');
  modalHint.classList.add('hidden');

  if (mode === 'edit') {
    editingId = card.id;
    modalTitle.textContent = 'Modifier la candidature';
    fieldUrl.value = card.url || '';
    fieldTitle.value = card.title || '';
    fieldCompany.value = card.company || '';
    setStatusPicker(card.status);
    setInterviewStage(card.interviewStage || null);
    fieldNotes.value = card.notes || '';
    fieldDeadline.value = card.deadline || '';
    formContacts = card.contacts ? card.contacts.map(c => ({ ...c })) : [];
    btnDelete.classList.remove('hidden');
  } else if (mode === 'import') {
    modalTitle.textContent = 'Importer une offre';
    modalHint.classList.remove('hidden');
    setStatusPicker('todo');
  } else {
    modalTitle.textContent = 'Nouvelle candidature';
    setStatusPicker(presetStatus || 'todo');
  }

  renderContactsList();
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('visible'));
  (mode === 'import' ? fieldUrl : fieldTitle).focus();
}

function closeModal() {
  overlay.classList.remove('visible');
  setTimeout(() => overlay.classList.add('hidden'), 300);
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
    interviewStage: currentStatus === 'interview' ? currentStage : null,
    deadline: fieldDeadline.value || null,
    contacts: formContacts
      .map(c => ({ ...c, firstName: c.firstName.trim(), lastName: c.lastName.trim(), value: c.value.trim() }))
      .filter(c => c.firstName || c.lastName || c.value),
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
