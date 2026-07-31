// Wrapped in an IIFE so ~15 top-level bindings (cards, editingId, etc.)
// don't leak onto window, where a future inline script/snippet could
// collide with a common name. The try/catch turns "one missing element
// id silently kills the entire script" into a visible console error
// instead of a mysteriously dead page.
(function () {
  // This outer IIFE runs once, ever — but the (tracker) layout it lives in
  // stays mounted across every client-side navigation, while the home
  // page's own content (board, sidebar view-toggle buttons, modals...)
  // fully unmounts and remounts each time the route leaves "/" and comes
  // back. Document-level listeners below (added via trackDocListener) are
  // the only side effect that survives a remount on its own — everything
  // else lives inside the unmounted subtree and is simply discarded with
  // it — so they're tracked here and dropped before initApp() rebinds a
  // fresh set, instead of silently piling up one extra copy per visit home.
  const trackedDocListeners = [];
  function trackDocListener(type, handler) {
    document.addEventListener(type, handler);
    trackedDocListeners.push([type, handler]);
  }
  function clearTrackedDocListeners() {
    trackedDocListeners.forEach(([type, handler]) => document.removeEventListener(type, handler));
    trackedDocListeners.length = 0;
  }

  // Re-entrant: window.altoraInitApp (called by Sidebar.tsx on every route
  // change) re-invokes this so the board/sidebar/modals rebind against
  // whichever DOM instance is actually live, instead of the one that
  // existed the first time this script ever ran.
  function initApp() {
  try {
    const board = document.getElementById('board');
    if (!board) return; // not on the home route — nothing here to (re)initialize
    if (board.dataset.altoraInit === '1') return; // this exact mount is already bound
    board.dataset.altoraInit = '1';
    clearTrackedDocListeners();

    // lucide.js loads as its own afterInteractive script, and Next.js does
    // not guarantee execution order between separate afterInteractive
    // scripts — so window.lucide might not exist yet the first time this
    // runs. Every internal call goes through this instead of the raw
    // lucide.createIcons(), retrying until the library is actually there.
    function safeCreateIcons() {
      if (window.lucide) lucide.createIcons();
      else setTimeout(safeCreateIcons, 50);
    }

    // Named tuning constants (previously bare literals scattered around the file).
    const OVERLAY_CLOSE_MS = 300; // matches the CSS transition on .modal-overlay
    const CONTEXT_MENU_CLOSE_MS = 200; // the context menu is lighter/faster than a full modal
    const CONTEXT_MENU_EDGE_MARGIN_PX = 12; // keeps the menu clear of the viewport edge
    const PHONE_MAX_DIGITS = 15; // ITU E.164 max
    const MIN_SLUG_TITLE_WORDS = 3; // shorter URL-slug segments are too generic to trust as a job title

    // Only allow http(s) as a clickable/hrefable URL — blocks javascript: URIs
    // and other schemes hidden in a pasted job-offer link.
    function safeHref(url) {
      if (!url) return null;
      try {
        const parsed = new URL(url, window.location.origin);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : null;
      } catch {
        return null;
      }
    }

    // --- Shared card-field builders, used by both the kanban card (renderCard)
    // and the read-only detail view (openDetailView) — a field's rendering only
    // needs to be right in one place, and building real DOM nodes (rather than
    // HTML strings) means user text never needs manual escaping to be safe. ---

    function iconEl(name) {
      const i = document.createElement('i');
      i.dataset.lucide = name;
      return i;
    }

    function buildMetaChips(card) {
      const chips = [];
      if (card.contractType) {
        const tag = document.createElement('span');
        tag.className = 'card-meta-tag';
        tag.textContent = card.contractType;
        chips.push(tag);
      }
      if (card.location) {
        // The documented cross-platform "universal" Maps URL — opens the
        // native Maps app on mobile if installed, Google Maps in the
        // browser otherwise, without needing to know which the user has.
        const loc = document.createElement('a');
        loc.className = 'card-meta-item card-meta-item--link';
        loc.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.location)}`;
        loc.target = '_blank';
        loc.rel = 'noopener';
        loc.title = 'Ouvrir dans Maps';
        loc.append(iconEl('map-pin'), card.location);
        loc.addEventListener('click', e => e.stopPropagation());
        chips.push(loc);
      }
      if (card.salary) {
        const sal = document.createElement('span');
        sal.className = 'card-meta-item';
        sal.append(iconEl('banknote'), card.salary);
        chips.push(sal);
      }
      return chips;
    }

    function buildContactBlocks(card) {
      if (!card.contacts || !card.contacts.length) return [];
      return card.contacts.map(contact => {
        const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
        if (!name && !contact.value) return null;
        const block = document.createElement('div');
        block.className = 'card-contact-block';
        if (name) {
          const row = document.createElement('div');
          row.className = 'card-contact';
          row.append(iconEl('user'), name);
          block.appendChild(row);
        }
        if (contact.value) {
          const row = document.createElement('div');
          row.className = 'card-contact';
          row.append(iconEl(contact.type === 'phone' ? 'phone' : 'mail'), contact.value);
          block.appendChild(row);
        }
        return block;
      }).filter(Boolean);
    }

    function buildDeadlineRow(card) {
      if (!card.deadline) return null;
      const d = new Date(card.deadline + 'T00:00:00');
      const isOverdue = d < startOfDay(new Date());
      const dStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      const row = document.createElement('div');
      row.className = 'card-deadline' + (isOverdue ? ' card-deadline--overdue' : '');
      row.append(iconEl('alarm-clock'), ` Sans réponse après le ${dStr}`);
      return row;
    }

    function buildLinkNodes(card) {
      const links = [];
      if (safeHref(card.url)) {
        const link = document.createElement('a');
        link.className = 'card-link';
        link.href = card.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.append(iconEl('external-link'), " Voir l'offre");
        link.addEventListener('click', e => e.stopPropagation());
        links.push(link);
      }
      if (card.status === 'todo') {
        const genLink = document.createElement('a');
        genLink.className = 'card-link card-link--generate';
        const jobParam = card.url || [card.title, card.company].filter(Boolean).join(' chez ');
        genLink.href = `/generate?job=${encodeURIComponent(jobParam)}&cardId=${encodeURIComponent(card.id)}`;
        genLink.append(iconEl('sparkles'), ' Générer CV');
        genLink.addEventListener('click', e => e.stopPropagation());
        links.push(genLink);
      }
      return links;
    }

    // card.interviewAt is a <input type="datetime-local"> value: "YYYY-MM-DDTHH:mm".
    // The date portion doubles as this interview's calendar-day key.
    function interviewDateKey(card) {
      return card.status === 'interview' && card.interviewAt ? card.interviewAt.slice(0, 10) : null;
    }

    function buildInterviewPill(card) {
      if (card.status !== 'interview' || !card.interviewAt) return null;
      const d = new Date(card.interviewAt);
      const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
      const pill = document.createElement('span');
      pill.className = 'card-interview-pill';
      pill.append(iconEl('calendar'), `Entretien le ${dateStr} à ${timeStr}`);
      return pill;
    }

    const STATUSES = ['todo', 'sent', 'interview', 'rejected'];

    // Looked up once instead of re-querying the DOM on every render/drag/drop —
    // a render() runs on every card add/edit/delete/move, so this was 4+ getElementById
    // + querySelector calls repeated on every single board interaction.
    const COLUMN_ELS = Object.fromEntries(STATUSES.map(status => [status, {
      list: document.getElementById(`list-${status}`),
      count: document.getElementById(`count-${status}`),
      column: document.querySelector(`.column[data-status="${status}"]`),
    }]));
    const STAGE_LABELS = { '1': '1er entretien', '2': '2e entretien', final: 'Entretien final' };
    const STATUS_LABELS = { todo: 'À postuler', sent: 'Envoyé', interview: 'Entretien', rejected: 'Refus' };
    const STATUS_ICONS = { todo: 'circle-dashed', sent: 'hourglass', interview: 'target', rejected: 'folder-x' };

    let cards = [];
    let editingId = null;
    let draggingId = null;
    let searchQuery = '';

    const JOB_SOURCES = [
      { match: 'indeed.', label: 'Indeed', icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none"><rect width="24" height="24" rx="5" fill="#2557A7"/><text x="12" y="17" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#fff">in</text></svg>' },
      { match: 'welcometothejungle.', label: 'Welcome to the Jungle', icon: '<i data-lucide="palmtree"></i>' },
      { match: 'linkedin.', label: 'LinkedIn', icon: '<i data-lucide="linkedin"></i>' },
      { match: 'apec.', label: 'Apec', icon: '<i data-lucide="briefcase"></i>' },
      { match: 'glassdoor.', label: 'Glassdoor', icon: '<i data-lucide="briefcase"></i>' },
      { match: 'monster.', label: 'Monster', icon: '<i data-lucide="briefcase"></i>' },
    ];

    function getJobSource(url) {
      if (!url) return null;
      let host;
      try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
      const known = JOB_SOURCES.find(s => host.includes(s.match));
      if (known) return known;
      return { label: host, icon: '<i data-lucide="globe"></i>' };
    }

    async function fetchCards() {
      const res = await fetch('/api/cards');
      if (!res.ok) { cards = []; return; }
      const data = await res.json();
      cards = data.cards || [];
    }

    async function createCardRemote(card) {
      await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });
    }

    async function updateCardRemote(card) {
      await fetch(`/api/cards/${encodeURIComponent(card.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });
    }

    async function deleteCardRemote(id) {
      await fetch(`/api/cards/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }

    function uid() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    // --- Rendering ---

    function renderColumnList(status) {
      const list = COLUMN_ELS[status].list;
      const all = cards.filter(c => c.status === status);

      COLUMN_ELS[status].count.textContent = all.length;

      const query = searchQuery.trim().toLowerCase();
      const items = query
        ? all.filter(c => (c.title || '').toLowerCase().includes(query) || (c.company || '').toLowerCase().includes(query))
        : all;

      list.innerHTML = '';
      if (items.length === 0) return;

      items.forEach(card => list.appendChild(renderCard(card)));
    }

    function updateToolbarCount() {
      document.getElementById('toolbar-count').textContent = cards.length;
      const sidebarBadge = document.getElementById('sidebar-tasks-count');
      if (sidebarBadge) sidebarBadge.textContent = cards.length || '';
    }

    // Rebuilds only the given columns' card lists (cheaper than a full render —
    // used when a drag only touches one or two statuses) then refreshes stats/digest.
    function renderPartial(statuses) {
      statuses.forEach(renderColumnList);
      updateToolbarCount();
      renderSummaryDigest(currentPeriod);
      safeCreateIcons();
    }

    function render() {
      STATUSES.forEach(renderColumnList);

      updateToolbarCount();
      renderSummaryDigest(currentPeriod);
      safeCreateIcons();
    }

    document.getElementById('board-search').addEventListener('input', e => {
      searchQuery = e.target.value;
      STATUSES.forEach(renderColumnList);
      safeCreateIcons();
    });

    function renderCard(card) {
      const el = document.createElement('div');
      el.className = 'card';
      el.draggable = true;
      el.dataset.id = card.id;
      el.tabIndex = 0;
      el.setAttribute('role', 'button');

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

      const metaChips = buildMetaChips(card);
      if (metaChips.length) {
        const metaRow = document.createElement('div');
        metaRow.className = 'card-meta-row';
        metaRow.append(...metaChips);
        el.appendChild(metaRow);
      }

      if (card.status === 'interview' && card.interviewStage) {
        const stageTag = document.createElement('div');
        stageTag.className = 'card-stage-tag';
        stageTag.textContent = STAGE_LABELS[card.interviewStage] || '';
        el.appendChild(stageTag);
      }

      const deadlineRow = buildDeadlineRow(card);
      if (deadlineRow) el.appendChild(deadlineRow);

      el.append(...buildContactBlocks(card));

      const linkRow = document.createElement('div');
      linkRow.className = 'card-link-row';
      linkRow.append(...buildLinkNodes(card));
      el.appendChild(linkRow);

      const interviewPill = buildInterviewPill(card);
      if (interviewPill) el.appendChild(interviewPill);

      el.addEventListener('click', () => openDetailView(card));

      el.addEventListener('keydown', e => {
        if (e.target !== el) return; // let inputs/buttons inside the card handle their own keys
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetailView(card);
        }
      });

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

    // --- Summary digest (time-scoped: today / this week / this month) ---

    const PERIOD_LABELS = { today: "Aujourd'hui", week: 'Cette semaine', month: 'Ce mois-ci' };

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

    const SUMMARY_LABELS = {
      todo: { singular: 'offre à postuler', plural: 'offres à postuler' },
      sent: { singular: 'candidature envoyée', plural: 'candidatures envoyées' },
      interview: { singular: 'entretien planifié', plural: 'entretiens planifiés' },
      rejected: { singular: 'refus reçu', plural: 'refus reçus' },
    };

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

      // Plain textContent swap (not animateLabelSwap) — that helper fades the
      // whole sentence container, and four of these can fire at once here
      // (they'd all fight over the same container's opacity/height).
      const counts = { todo, sent, interview, rejected };
      Object.keys(SUMMARY_LABELS).forEach(key => {
        const forms = SUMMARY_LABELS[key];
        document.getElementById(`label-${key}`).textContent = counts[key] <= 1 ? forms.singular : forms.plural;
      });

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
      setTimeout(() => periodPopup.classList.add('hidden'), OVERLAY_CLOSE_MS);
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

    trackDocListener('click', e => {
      if (!periodPopup.classList.contains('visible')) return;
      if (!e.target.closest('.period-trigger-wrap')) closePeriodPopup();
    });

    // --- Drag and drop ---

    STATUSES.forEach(status => {
      // Listens on the whole column, not just .card-list — an empty list
      // collapses to ~0 height (.card-list:empty), which made dropping into
      // an empty column nearly impossible when the list itself was the target.
      const column = COLUMN_ELS[status].column;

      column.addEventListener('dragover', e => {
        e.preventDefault();
        column.classList.add('drag-over');
      });

      column.addEventListener('dragleave', e => {
        if (!column.contains(e.relatedTarget)) column.classList.remove('drag-over');
      });

      column.addEventListener('drop', e => {
        e.preventDefault();
        column.classList.remove('drag-over');
        if (!draggingId) return;
        const card = cards.find(c => c.id === draggingId);
        if (card && card.status !== status) {
          const fromColumn = COLUMN_ELS[card.status].column;
          const toColumn = column;
          const fromStatus = card.status;
          card.status = status;
          updateCardRemote(card);
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
        let onEnd;
        const cleanup = () => {
          if (onEnd) col.removeEventListener('transitionend', onEnd);
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
            onEnd = e => {
              if (e.propertyName !== 'height') return;
              cleanup();
            };
            col.addEventListener('transitionend', onEnd);
          });
        });
        // Safety net in case the height didn't actually change (no transition fires).
        setTimeout(cleanup, duration + 60);
      });
    }

    // --- Card context menu (right-click) ---

    // Appended straight to document.body, outside React's tree — it survives
    // a home-page remount on its own, so a stale copy from a previous mount
    // has to be removed explicitly instead of just being discarded with it.
    document.querySelectorAll('.context-menu').forEach(el => el.remove());
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu hidden';
    document.body.appendChild(contextMenu);

    function closeContextMenu() {
      contextMenu.classList.remove('visible');
      setTimeout(() => contextMenu.classList.add('hidden'), CONTEXT_MENU_CLOSE_MS);
    }

    function openCardContextMenu(card, x, y) {
      contextMenu.innerHTML = '';

      if (card.url) {
        const openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = 'context-item';
        openBtn.innerHTML = '<i data-lucide="external-link"></i>Ouvrir l\'offre';
        openBtn.addEventListener('click', () => { closeContextMenu(); window.open(card.url, '_blank', 'noopener'); });
        contextMenu.appendChild(openBtn);
      }

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'context-item';
      editBtn.innerHTML = '<i data-lucide="pencil"></i>Modifier';
      editBtn.addEventListener('click', () => { closeContextMenu(); openModal('edit', card); });
      contextMenu.appendChild(editBtn);

      const moveGroup = document.createElement('div');
      moveGroup.className = 'context-item-group';

      const moveToggle = document.createElement('button');
      moveToggle.type = 'button';
      moveToggle.className = 'context-item';
      moveToggle.innerHTML = '<i data-lucide="move"></i>Déplacer vers<i data-lucide="chevron-down" class="context-item-chevron"></i>';
      moveToggle.addEventListener('click', () => moveGroup.classList.toggle('expanded'));
      moveGroup.appendChild(moveToggle);

      const moveSubmenu = document.createElement('div');
      moveSubmenu.className = 'context-submenu';
      STATUSES.filter(s => s !== card.status).forEach(status => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'context-subitem';
        btn.innerHTML = `<i data-lucide="${STATUS_ICONS[status]}"></i>${STATUS_LABELS[status]}`;
        btn.addEventListener('click', () => {
          closeContextMenu();
          const fromColumn = COLUMN_ELS[card.status].column;
          const toColumn = COLUMN_ELS[status].column;
          const fromStatus = card.status;
          card.status = status;
          updateCardRemote(card);
          animateHeightChange([fromColumn, toColumn], () => renderPartial([fromStatus, status]));
        });
        moveSubmenu.appendChild(btn);
      });
      moveGroup.appendChild(moveSubmenu);
      contextMenu.appendChild(moveGroup);

      const duplicateBtn = document.createElement('button');
      duplicateBtn.type = 'button';
      duplicateBtn.className = 'context-item';
      duplicateBtn.innerHTML = '<i data-lucide="copy"></i>Dupliquer';
      duplicateBtn.addEventListener('click', () => {
        closeContextMenu();
        const copy = { ...card, id: uid(), createdAt: Date.now() };
        cards.push(copy);
        createCardRemote(copy);
        render();
      });
      contextMenu.appendChild(duplicateBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'context-item context-item--danger';
      deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>Supprimer';
      deleteBtn.addEventListener('click', () => {
        closeContextMenu();
        cards = cards.filter(c => c.id !== card.id);
        deleteCardRemote(card.id);
        render();
      });
      contextMenu.appendChild(deleteBtn);

      contextMenu.classList.remove('hidden');
      contextMenu.style.left = '0px';
      contextMenu.style.top = '0px';
      safeCreateIcons();

      const rect = contextMenu.getBoundingClientRect();
      const clampedX = Math.min(x, window.innerWidth - rect.width - CONTEXT_MENU_EDGE_MARGIN_PX);
      const clampedY = Math.min(y, window.innerHeight - rect.height - CONTEXT_MENU_EDGE_MARGIN_PX);
      contextMenu.style.left = `${Math.max(12, clampedX)}px`;
      contextMenu.style.top = `${Math.max(12, clampedY)}px`;

      requestAnimationFrame(() => contextMenu.classList.add('visible'));
    }

    trackDocListener('click', e => {
      if (!contextMenu.contains(e.target)) closeContextMenu();
    });
    trackDocListener('contextmenu', e => {
      if (!e.target.closest('.card')) closeContextMenu();
    });
    trackDocListener('keydown', e => {
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
    const fieldInterviewAt = document.getElementById('field-interview-at');
    const fieldLocation = document.getElementById('field-location');
    const fieldSalary = document.getElementById('field-salary');
    const fieldJobDescription = document.getElementById('field-job-description');
    const jobDescriptionDetails = document.getElementById('job-description-details');
    const urlParseStatus = document.getElementById('url-parse-status');
    const contactsList = document.getElementById('contacts-list');
    const btnAddContact = document.getElementById('btn-add-contact');
    const statusPicker = document.getElementById('status-picker');
    const statusButtons = statusPicker.querySelectorAll('.status-btn');
    const interviewStageGroup = document.getElementById('interview-stage-group');
    const interviewStagePicker = document.getElementById('interview-stage-picker');
    const stageButtons = interviewStagePicker.querySelectorAll('.stage-btn');
    const contractPicker = document.getElementById('contract-picker');
    const contractButtons = contractPicker.querySelectorAll('.contract-btn');
    let currentStatus = 'todo';
    let currentStage = null;
    let currentContract = null;
    let formContacts = [];

    function setContractType(contract) {
      currentContract = contract;
      contractButtons.forEach(btn => {
        const checked = btn.dataset.contract === contract;
        btn.classList.toggle('active', checked);
        btn.setAttribute('aria-checked', String(checked));
      });
    }

    contractButtons.forEach(btn => {
      btn.addEventListener('click', () => setContractType(currentContract === btn.dataset.contract ? null : btn.dataset.contract));
    });

    // Groups digits by 2 ("06 06 95 41 26") as the user types a phone number.
    function formatPhone(raw) {
      const digits = raw.replace(/\D/g, '').slice(0, PHONE_MAX_DIGITS);
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

        function setType(type, { skipIconRefresh = false } = {}) {
          // Stash whatever's in the field under its current type before switching,
          // so toggling phone<->email never destroys either value (it used to:
          // e.g. an email reformatted through formatPhone() came out empty/garbled
          // and permanently overwrote contact.value).
          if (contact.type === 'email') contact.emailValue = valueInput.value;
          else if (contact.type === 'phone') contact.phoneValue = valueInput.value;

          contact.type = type;
          typeBtn.innerHTML = `<i data-lucide="${type === 'phone' ? 'phone' : 'mail'}"></i>`;
          typeBtn.title = type === 'phone' ? 'Téléphone (cliquer pour passer en email)' : 'Email (cliquer pour passer en téléphone)';
          valueInput.type = 'text';
          valueInput.placeholder = type === 'phone' ? '06 12 34 56 78' : 'email@exemple.com';

          const stashed = type === 'phone' ? contact.phoneValue : contact.emailValue;
          valueInput.value = stashed !== undefined
            ? stashed
            : (type === 'phone' ? formatPhone(contact.value || '') : (contact.value || '').toLowerCase());
          contact.value = valueInput.value;
          // Skipped during the initial renderContactsList loop, which already does
          // a single createIcons() pass after all contacts are built.
          if (!skipIconRefresh) safeCreateIcons();
        }

        typeBtn.addEventListener('click', () => setType(contact.type === 'phone' ? 'email' : 'phone'));

        valueInput.addEventListener('input', () => {
          const caretAtEnd = valueInput.selectionEnd === valueInput.value.length;
          valueInput.value = contact.type === 'phone' ? formatPhone(valueInput.value) : valueInput.value.toLowerCase();
          contact.value = valueInput.value;
          if (caretAtEnd) valueInput.setSelectionRange(valueInput.value.length, valueInput.value.length);
        });

        setType(contact.type || 'email', { skipIconRefresh: true });

        detailRow.appendChild(typeBtn);
        detailRow.appendChild(valueInput);

        block.appendChild(nameRow);
        block.appendChild(detailRow);
        contactsList.appendChild(block);
      });
      safeCreateIcons();
    }

    btnAddContact.addEventListener('click', () => {
      formContacts.push({ firstName: '', lastName: '', type: 'email', value: '' });
      animateHeightChange([contactsList], renderContactsList);
    });

    function setStatusPicker(status) {
      currentStatus = status;
      statusButtons.forEach(btn => {
        const checked = btn.dataset.status === status;
        btn.classList.toggle('active', checked);
        btn.setAttribute('aria-checked', String(checked));
      });
      interviewStageGroup.classList.toggle('hidden', status !== 'interview');
      if (status !== 'interview') setInterviewStage(null);
    }

    function setInterviewStage(stage) {
      currentStage = stage;
      stageButtons.forEach(btn => {
        const checked = btn.dataset.stage === stage;
        btn.classList.toggle('active', checked);
        btn.setAttribute('aria-checked', String(checked));
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
        if (words && words.length >= MIN_SLUG_TITLE_WORDS) {
          title = titleCase(words);
          break;
        }
      }

      return { title, company };
    }

    let lastAutoTitleBase = '';
    let lastAutoContract = '';
    let lastAutoCompany = '';
    let lastAutoLocation = '';
    let lastAutoSalary = '';
    let lastAutoDescription = '';

    // The contract type reads more naturally folded into the title itself
    // ("Digital Marketing Executive en CDI") than as a separate pill guess,
    // so it's composed here instead of going through setContractType — the
    // manual contract picker in the form is untouched, this only changes
    // what the URL import auto-fills.
    function composeTitle(base, contract) {
      if (!base) return '';
      return contract ? `${base} en ${contract}` : base;
    }

    // Only overwrites a field if it's still empty or still holds a PREVIOUS
    // auto-filled value — once the user edits a field themselves, later
    // guesses (the instant client-side one, then the slower AI one) never
    // clobber what they typed.
    function applyGuess(guess) {
      if (!guess) return;
      if (guess.title || guess.contractType) {
        const currentComposed = composeTitle(lastAutoTitleBase, lastAutoContract);
        if (fieldTitle.value.trim() === '' || fieldTitle.value === currentComposed) {
          if (guess.title) lastAutoTitleBase = guess.title;
          if (guess.contractType) lastAutoContract = guess.contractType;
          fieldTitle.value = composeTitle(lastAutoTitleBase, lastAutoContract);
        }
      }
      if (guess.company && (fieldCompany.value.trim() === '' || fieldCompany.value === lastAutoCompany)) {
        fieldCompany.value = guess.company;
        lastAutoCompany = guess.company;
      }
      if (guess.location && (fieldLocation.value.trim() === '' || fieldLocation.value === lastAutoLocation)) {
        fieldLocation.value = guess.location;
        lastAutoLocation = guess.location;
      }
      if (guess.salary && (fieldSalary.value.trim() === '' || fieldSalary.value === lastAutoSalary)) {
        fieldSalary.value = guess.salary;
        lastAutoSalary = guess.salary;
      }
      if (guess.description && (fieldJobDescription.value.trim() === '' || fieldJobDescription.value === lastAutoDescription)) {
        fieldJobDescription.value = guess.description;
        lastAutoDescription = guess.description;
      }
    }

    let urlParseStatusTimer = null;

    function setUrlParseStatus(text, variant) {
      clearTimeout(urlParseStatusTimer);
      urlParseStatus.textContent = text;
      urlParseStatus.className = 'url-parse-status' + (variant ? ` url-parse-status--${variant}` : '') + (text ? '' : ' hidden');
    }

    fieldUrl.addEventListener('blur', () => {
      const url = fieldUrl.value.trim();
      if (!url) return;

      // Instant, free, client-side guess from the URL's own slug — shows
      // something immediately while the slower AI pass (below) is in flight.
      applyGuess(guessFromUrl(url));

      const aiLoadingFields = [fieldTitle, fieldCompany, fieldLocation, fieldSalary];
      aiLoadingFields.forEach(f => f.classList.add('field-ai-loading'));

      setUrlParseStatus('Analyse de l’offre en cours…');
      parseJobOffer(url).then(result => {
        aiLoadingFields.forEach(f => f.classList.remove('field-ai-loading'));

        if (!result) {
          setUrlParseStatus('');
          return;
        }
        if (result.blocked) {
          setUrlParseStatus('Ce site bloque l’extraction automatique — colle le texte de l’offre ci-dessous.', 'error');
          jobDescriptionDetails.open = true;
          fieldJobDescription.focus();
          return;
        }
        applyGuess(result);
        setUrlParseStatus('Offre analysée automatiquement ✓', 'success');
        urlParseStatusTimer = setTimeout(() => setUrlParseStatus(''), 4000);
      });
    });

    // --- Shared modal a11y: focus trap, Escape-to-close, focus restored to
    // whatever triggered the modal. Used by every .modal-overlay below. ---

    let lastFocusedBeforeModal = null;

    function trapModalFocus(e, containerEl) {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(containerEl.querySelectorAll(
        'button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    // Call right after showing the overlay. `focusEl` is what should receive
    // focus first (defaults to the .modal container itself).
    function trapModalOpen(overlayEl, closeFn, focusEl) {
      lastFocusedBeforeModal = document.activeElement;
      const container = overlayEl.querySelector('.modal') || overlayEl;
      requestAnimationFrame(() => (focusEl || container).focus());
      const onKeydown = e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeFn();
        } else {
          trapModalFocus(e, container);
        }
      };
      overlayEl._a11yKeydown = onKeydown;
      document.addEventListener('keydown', onKeydown);
    }

    // Call right after hiding the overlay.
    function trapModalClose(overlayEl) {
      if (overlayEl._a11yKeydown) {
        document.removeEventListener('keydown', overlayEl._a11yKeydown);
        overlayEl._a11yKeydown = null;
      }
      if (lastFocusedBeforeModal && document.contains(lastFocusedBeforeModal)) {
        lastFocusedBeforeModal.focus();
      }
      lastFocusedBeforeModal = null;
    }

    // --- Read-only offer detail view (opened by clicking a card; editing is
    // only reachable via the right-click context menu, to avoid accidental edits) ---

    const detailOverlay = document.getElementById('detail-overlay');
    const detailContent = document.getElementById('detail-content');
    const detailClose = document.getElementById('detail-close');

    function openDetailView(card) {
      const nodes = [];

      const statusTag = document.createElement('span');
      statusTag.className = `detail-status-tag detail-status-tag--${card.status}`;
      statusTag.append(iconEl(STATUS_ICONS[card.status]), STATUS_LABELS[card.status]);
      nodes.push(statusTag);

      const titleEl = document.createElement('h3');
      titleEl.className = 'detail-title';
      titleEl.append(card.title || 'Offre sans titre');
      if (card.company) {
        const companyEl = document.createElement('span');
        companyEl.className = 'detail-company';
        companyEl.append(' chez ', card.company);
        titleEl.appendChild(companyEl);
      }
      nodes.push(titleEl);

      const metaChips = buildMetaChips(card);
      if (metaChips.length) {
        const metaRow = document.createElement('div');
        metaRow.className = 'detail-meta-row';
        metaRow.append(...metaChips);
        nodes.push(metaRow);
      }

      if (card.status === 'interview' && card.interviewStage) {
        const stageTag = document.createElement('div');
        stageTag.className = 'card-stage-tag';
        stageTag.textContent = STAGE_LABELS[card.interviewStage] || '';
        nodes.push(stageTag);
      }

      const deadlineRow = buildDeadlineRow(card);
      if (deadlineRow) nodes.push(deadlineRow);

      const contactBlocks = buildContactBlocks(card);
      if (contactBlocks.length) {
        const section = document.createElement('div');
        section.className = 'detail-section';
        const label = document.createElement('span');
        label.className = 'detail-label';
        label.textContent = 'Contact';
        section.append(label, ...contactBlocks);
        nodes.push(section);
      }

      if (card.notes) {
        const section = document.createElement('div');
        section.className = 'detail-section';
        const label = document.createElement('span');
        label.className = 'detail-label';
        label.textContent = 'Notes';
        const notes = document.createElement('p');
        notes.className = 'detail-notes';
        notes.textContent = card.notes;
        section.append(label, notes);
        nodes.push(section);
      }

      const linkNodes = buildLinkNodes(card);
      if (linkNodes.length) {
        const linkRow = document.createElement('div');
        linkRow.className = 'card-link-row detail-link-row';
        linkRow.append(...linkNodes);
        nodes.push(linkRow);
      }

      const interviewPill = buildInterviewPill(card);
      if (interviewPill) nodes.push(interviewPill);

      const source = getJobSource(card.url);
      if (source) {
        const pill = document.createElement('span');
        pill.className = 'detail-source-pill';
        pill.insertAdjacentHTML('beforeend', source.icon); // trusted, hardcoded in JOB_SOURCES — never user input
        pill.append(source.label);
        nodes.push(pill);
      }

      detailContent.replaceChildren(...nodes);
      detailOverlay.classList.remove('hidden');
      requestAnimationFrame(() => detailOverlay.classList.add('visible'));
      trapModalOpen(detailOverlay, closeDetailView);
      safeCreateIcons();
    }

    function closeDetailView() {
      detailOverlay.classList.remove('visible');
      setTimeout(() => detailOverlay.classList.add('hidden'), OVERLAY_CLOSE_MS);
      trapModalClose(detailOverlay);
    }

    detailClose.addEventListener('click', closeDetailView);
    detailOverlay.addEventListener('click', e => { if (e.target === detailOverlay) closeDetailView(); });

    function openModal(mode, card, presetStatus) {
      form.reset();
      editingId = null;
      lastAutoTitleBase = '';
      lastAutoCompany = '';
      lastAutoLocation = '';
      lastAutoSalary = '';
      lastAutoContract = '';
      lastAutoDescription = '';
      setUrlParseStatus('');
      jobDescriptionDetails.open = false;
      setInterviewStage(null);
      setContractType(null);
      formContacts = [];
      btnDelete.classList.add('hidden');
      modalHint.classList.add('hidden');

      if (mode === 'edit') {
        editingId = card.id;
        modalTitle.textContent = 'Modifier la candidature';
        fieldUrl.value = card.url || '';
        fieldTitle.value = card.title || '';
        fieldCompany.value = card.company || '';
        fieldLocation.value = card.location || '';
        fieldSalary.value = card.salary || '';
        fieldJobDescription.value = card.jobDescription || '';
        if (card.jobDescription) jobDescriptionDetails.open = true;
        setStatusPicker(card.status);
        setInterviewStage(card.interviewStage || null);
        setContractType(card.contractType || null);
        fieldNotes.value = card.notes || '';
        fieldDeadline.value = card.deadline || '';
        fieldInterviewAt.value = card.interviewAt || '';
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
      trapModalOpen(overlay, closeModal, mode === 'import' ? fieldUrl : fieldTitle);
    }

    function closeModal() {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.classList.add('hidden'), OVERLAY_CLOSE_MS);
      trapModalClose(overlay);
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
        location: fieldLocation.value.trim(),
        salary: fieldSalary.value.trim(),
        contractType: currentContract,
        status: currentStatus,
        interviewStage: currentStatus === 'interview' ? currentStage : null,
        interviewAt: currentStatus === 'interview' ? (fieldInterviewAt.value || null) : null,
        deadline: fieldDeadline.value || null,
        contacts: formContacts
          .map(c => ({ ...c, firstName: c.firstName.trim(), lastName: c.lastName.trim(), value: c.value.trim() }))
          .filter(c => c.firstName || c.lastName || c.value),
        notes: fieldNotes.value.trim(),
        // Kept off the card and detail view on purpose — this is only read
        // back when generating a CV, so that step never has to re-fetch or
        // re-paste the posting.
        jobDescription: fieldJobDescription.value.trim() || null,
      };

      if (editingId) {
        const card = cards.find(c => c.id === editingId);
        Object.assign(card, data);
        updateCardRemote(card);
      } else {
        const card = { id: uid(), createdAt: Date.now(), ...data };
        cards.push(card);
        createCardRemote(card);
      }

      render();
      closeModal();
    });

    btnDelete.addEventListener('click', () => {
      if (!editingId) return;
      const deletedId = editingId;
      cards = cards.filter(c => c.id !== deletedId);
      deleteCardRemote(deletedId);
      render();
      closeModal();
    });

    document.querySelectorAll('.add-card-btn, .add-card-dashed').forEach(btn => {
      btn.addEventListener('click', () => openModal('create', null, btn.dataset.status));
    });


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

    trackDocListener('keydown', e => {
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
    const sidebarProfileBtn = document.getElementById('sidebar-profile-btn');
    const profileOverlay = document.getElementById('profile-overlay');
    const profileClose = document.getElementById('profile-close');

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

    function openProfileModal() {
      profileOverlay.classList.remove('hidden');
      requestAnimationFrame(() => profileOverlay.classList.add('visible'));
      trapModalOpen(profileOverlay, closeProfileModal);
      sidebarProfileBtn.classList.add('active');
    }

    function closeProfileModal() {
      profileOverlay.classList.remove('visible');
      setTimeout(() => profileOverlay.classList.add('hidden'), OVERLAY_CLOSE_MS);
      trapModalClose(profileOverlay);
      sidebarProfileBtn.classList.remove('active');
    }

    document.getElementById('greeting-name-btn').addEventListener('click', () => openProfileModal());
    sidebarProfileBtn.addEventListener('click', () => openProfileModal());
    profileClose.addEventListener('click', () => closeProfileModal());
    profileOverlay.addEventListener('click', e => {
      if (e.target === profileOverlay) closeProfileModal();
    });

    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    // --- Sidebar: Suivi submenu toggle + scroll-to-column ---

    const sidebarSuiviToggle = document.getElementById('sidebar-suivi-toggle');
    const sidebarSuiviChevron = document.getElementById('sidebar-suivi-chevron');

    // Clicking the row itself only navigates — it no longer auto-expands the
    // submenu as a side effect. Only the dedicated chevron button toggles it.
    sidebarSuiviToggle.addEventListener('click', showTasksView);
    sidebarSuiviToggle.addEventListener('keydown', e => {
      if (e.target !== sidebarSuiviToggle) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showTasksView();
      }
    });

    sidebarSuiviChevron.addEventListener('click', e => {
      e.stopPropagation();
      const expanded = sidebarSuiviToggle.closest('.sidebar-item-group').classList.toggle('expanded');
      sidebarSuiviChevron.setAttribute('aria-expanded', String(expanded));
    });

    document.querySelectorAll('.sidebar-subitem').forEach(btn => {
      btn.addEventListener('click', () => {
        showTasksView();
        const list = document.getElementById(btn.dataset.scrollTo);
        list?.closest('.column')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // --- Home / Mes tâches / Calendrier view toggle ---

    const sidebarHomeBtn = document.getElementById('sidebar-home-btn');
    const sidebarCalendarBtn = document.getElementById('sidebar-calendar-btn');
    const viewHome = document.getElementById('view-home');
    const viewCalendar = document.getElementById('view-calendar');
    // `board` is already declared at the top of initApp() (used for the re-init guard).
    const topbarToolbar = document.getElementById('topbar-toolbar');
    const breadcrumbActiveLabel = document.getElementById('breadcrumb-active-label');

    function deactivateAllViews() {
      viewHome.classList.add('hidden');
      viewCalendar.classList.add('hidden');
      board.classList.add('hidden');
      topbarToolbar.classList.add('hidden');
      sidebarHomeBtn.classList.remove('sidebar-item--active');
      sidebarSuiviToggle.classList.remove('sidebar-item--active');
      sidebarCalendarBtn.classList.remove('sidebar-item--active');
    }

    const ACTIVE_VIEW_KEY = 'altora-active-view';

    function showHomeView() {
      deactivateAllViews();
      viewHome.classList.remove('hidden');
      sidebarHomeBtn.classList.add('sidebar-item--active');
      breadcrumbActiveLabel.textContent = 'Accueil';
      localStorage.setItem(ACTIVE_VIEW_KEY, 'home');
    }

    function showTasksView() {
      deactivateAllViews();
      board.classList.remove('hidden');
      topbarToolbar.classList.remove('hidden');
      sidebarSuiviToggle.classList.add('sidebar-item--active');
      breadcrumbActiveLabel.textContent = 'Mes tâches';
      localStorage.setItem(ACTIVE_VIEW_KEY, 'tasks');
    }

    function showCalendarView() {
      deactivateAllViews();
      viewCalendar.classList.remove('hidden');
      sidebarCalendarBtn.classList.add('sidebar-item--active');
      breadcrumbActiveLabel.textContent = 'Calendrier';
      renderCalendarMonth();
      localStorage.setItem(ACTIVE_VIEW_KEY, 'calendar');
    }

    const breadcrumbHomeBtn = document.getElementById('breadcrumb-home-btn');
    sidebarHomeBtn.addEventListener('click', showHomeView);
    sidebarCalendarBtn.addEventListener('click', showCalendarView);
    breadcrumbHomeBtn.addEventListener('click', showHomeView);

    // --- Calendrier : planning de formation en alternance ---
    // Données extraites du planning "Apollo 160 DBD - B3 : REC // ALT - LYON"
    // (Rocket School), du 27/10/2025 au 25/09/2026. Par défaut, un jour de
    // semaine dans la plage est une "semaine en entreprise", sauf exception
    // listée ci-dessous.

    const CALENDAR_EVENT_LABELS = {
      formation: 'Journée de formation',
      conges: 'Congés pédagogique',
      examen: 'Examens écrit/oral',
      examen_oral: 'Examen oral (convocation)',
      ferie: 'Jour férié',
    };

    const CALENDAR_SCHOOL_EVENTS = {
      '2025-10-27': 'formation', '2025-10-28': 'formation', '2025-10-29': 'formation',
      '2025-10-30': 'formation', '2025-10-31': 'formation',
      '2025-11-10': 'formation', '2025-11-11': 'ferie', '2025-11-12': 'formation',
      '2025-11-13': 'formation', '2025-11-14': 'formation', '2025-11-17': 'formation',
      '2025-12-15': 'formation', '2025-12-16': 'formation', '2025-12-17': 'formation',
      '2025-12-18': 'formation', '2025-12-19': 'formation',
      '2025-12-22': 'conges', '2025-12-23': 'conges', '2025-12-25': 'ferie',
      '2025-12-26': 'examen_oral', '2025-12-29': 'conges',
      '2026-01-01': 'ferie',
      '2026-01-26': 'formation', '2026-01-27': 'formation', '2026-01-28': 'formation',
      '2026-01-29': 'formation', '2026-01-30': 'formation',
      '2026-04-06': 'ferie',
      '2026-04-20': 'formation', '2026-04-21': 'formation', '2026-04-22': 'formation',
      '2026-04-23': 'formation', '2026-04-24': 'formation',
      '2026-05-01': 'ferie', '2026-05-08': 'ferie', '2026-05-14': 'ferie',
      '2026-05-25': 'ferie',
      '2026-05-26': 'formation', '2026-05-27': 'formation', '2026-05-28': 'formation',
      '2026-05-29': 'formation',
      '2026-06-01': 'formation',
      '2026-06-08': 'formation', '2026-06-09': 'formation', '2026-06-10': 'formation',
      '2026-06-11': 'formation', '2026-06-12': 'formation',
      '2026-06-22': 'formation', '2026-06-23': 'formation',
      '2026-06-24': 'examen', '2026-06-25': 'examen', '2026-06-26': 'examen',
      '2026-07-14': 'ferie',
      '2026-07-27': 'formation', '2026-07-28': 'formation', '2026-07-29': 'formation',
      '2026-07-30': 'formation', '2026-07-31': 'formation',
      '2026-08-03': 'examen', '2026-08-04': 'examen', '2026-08-05': 'examen',
      '2026-08-06': 'examen', '2026-08-07': 'examen',
      '2026-08-10': 'conges', '2026-08-11': 'conges', '2026-08-12': 'conges',
      '2026-08-13': 'conges', '2026-08-14': 'conges', '2026-08-15': 'examen',
      '2026-08-17': 'formation', '2026-08-18': 'formation', '2026-08-19': 'formation',
      '2026-08-20': 'formation', '2026-08-21': 'formation',
      '2026-09-21': 'examen_oral',
      '2026-09-22': 'formation', '2026-09-23': 'formation', '2026-09-24': 'formation',
      '2026-09-25': 'formation',
    };

    const CALENDAR_RANGE_START = '2025-10-07';
    const CALENDAR_RANGE_END = '2026-09-30';
    const CALENDAR_MONTH_LABELS = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];

    const today = new Date();
    let calendarCursor = { year: today.getFullYear(), month: today.getMonth() };

    function calendarDateKey(y, m, d) {
      return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    function calendarEventFor(key) {
      if (key < CALENDAR_RANGE_START || key > CALENDAR_RANGE_END) return null;
      const type = CALENDAR_SCHOOL_EVENTS[key];
      if (type) return { type, label: CALENDAR_EVENT_LABELS[type] };
      const dow = new Date(key + 'T00:00:00').getDay();
      if (dow === 0 || dow === 6) return null; // weekend, no explicit event -> nothing to show
      return { type: 'entreprise', label: 'Semaine en entreprise' };
    }

    function renderCalendarMonth() {
      const { year, month } = calendarCursor;
      document.getElementById('calendar-title').textContent = `${CALENDAR_MONTH_LABELS[month]} ${year}`;

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startOffset = (firstDay.getDay() + 6) % 7;
      const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
      const todayKey = calendarDateKey(today.getFullYear(), today.getMonth(), today.getDate());

      const weeksEl = document.getElementById('calendar-weeks');
      weeksEl.innerHTML = '';
      const cursor = new Date(year, month, 1 - startOffset);

      for (let w = 0; w < totalCells / 7; w++) {
        const weekEl = document.createElement('div');
        weekEl.className = 'calendar-week';
        for (let d = 0; d < 7; d++) {
          const y = cursor.getFullYear(), m = cursor.getMonth(), day = cursor.getDate();
          const key = calendarDateKey(y, m, day);
          const inMonth = m === month;
          const dow = (cursor.getDay() + 6) % 7;
          const isWeekend = dow >= 5;
          const ev = calendarEventFor(key);

          const dayEl = document.createElement('div');
          dayEl.className = 'calendar-day'
            + (!inMonth ? ' calendar-day--muted' : '')
            + (key === todayKey ? ' calendar-day--today' : '')
            + (ev && inMonth ? ` calendar-day--${ev.type}` : '');
          const dateLabel = `${day} ${CALENDAR_MONTH_LABELS[m].toLowerCase()} ${y}`;
          const dayInterviews = inMonth ? cards.filter(c => interviewDateKey(c) === key) : [];
          const labelParts = [
            ev && inMonth ? ev.label : null,
            ...dayInterviews.map(c => `entretien${c.company ? ' chez ' + c.company : ''}`),
          ].filter(Boolean);
          dayEl.setAttribute('aria-label', labelParts.length ? `${dateLabel} — ${labelParts.join(', ')}` : dateLabel);
          dayEl.innerHTML = `<span class="calendar-day-number">${day}</span>`;
          dayInterviews.forEach(c => {
            const pill = document.createElement('span');
            pill.className = 'calendar-day-interview-pill';
            const timeStr = new Date(c.interviewAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
            pill.append(iconEl('target'), `${timeStr} ${c.company || 'Entretien'}`);
            pill.addEventListener('click', () => openDetailView(c));
            dayEl.appendChild(pill);
          });
          weekEl.appendChild(dayEl);
          cursor.setDate(cursor.getDate() + 1);
        }
        weeksEl.appendChild(weekEl);
      }
    }

    document.getElementById('calendar-prev').addEventListener('click', () => {
      calendarCursor = calendarCursor.month === 0
        ? { year: calendarCursor.year - 1, month: 11 }
        : { year: calendarCursor.year, month: calendarCursor.month - 1 };
      renderCalendarMonth();
    });
    document.getElementById('calendar-next').addEventListener('click', () => {
      calendarCursor = calendarCursor.month === 11
        ? { year: calendarCursor.year + 1, month: 0 }
        : { year: calendarCursor.year, month: calendarCursor.month + 1 };
      renderCalendarMonth();
    });
    document.getElementById('calendar-today').addEventListener('click', () => {
      calendarCursor = { year: today.getFullYear(), month: today.getMonth() };
      renderCalendarMonth();
    });

    // --- Calendar legend popover ---

    const calendarLegendTrigger = document.getElementById('calendar-legend-trigger');
    const calendarLegendPopup = document.getElementById('calendar-legend-popup');

    function openCalendarLegend() {
      calendarLegendPopup.classList.remove('hidden');
      requestAnimationFrame(() => calendarLegendPopup.classList.add('visible'));
      calendarLegendTrigger.setAttribute('aria-expanded', 'true');
    }
    function closeCalendarLegend() {
      calendarLegendPopup.classList.remove('visible');
      setTimeout(() => calendarLegendPopup.classList.add('hidden'), OVERLAY_CLOSE_MS);
      calendarLegendTrigger.setAttribute('aria-expanded', 'false');
    }
    calendarLegendTrigger.addEventListener('click', e => {
      e.stopPropagation();
      calendarLegendPopup.classList.contains('visible') ? closeCalendarLegend() : openCalendarLegend();
    });
    trackDocListener('click', e => {
      if (!calendarLegendPopup.classList.contains('visible')) return;
      if (!e.target.closest('.calendar-legend-trigger-wrap')) closeCalendarLegend();
    });
    trackDocListener('keydown', e => {
      if (e.key === 'Escape' && calendarLegendPopup.classList.contains('visible')) closeCalendarLegend();
    });

    // --- CV upload + inline preview ---

    const cvFileInput = document.getElementById('cv-file-input');
    const cvImportBtn = document.getElementById('cv-import-btn');
    const cvFilenameBtn = document.getElementById('cv-filename-btn');
    const cvFilenameText = document.getElementById('cv-filename-text');
    const cvPreviewOverlay = document.getElementById('cv-preview-overlay');
    const cvPreviewClose = document.getElementById('cv-preview-close');
    const cvPreviewFrame = document.getElementById('cv-preview-frame');

    let currentCv = window.__ALTORA_CV__ || { url: '', filename: '' };

    function renderCvState() {
      if (currentCv.url) {
        cvFilenameText.textContent = currentCv.filename || 'CV.pdf';
        cvFilenameBtn.classList.remove('hidden');
        cvImportBtn.innerHTML = '<i data-lucide="upload"></i>Remplacer';
      } else {
        cvFilenameBtn.classList.add('hidden');
        cvImportBtn.innerHTML = '<i data-lucide="upload"></i>Importer';
      }
      safeCreateIcons();
    }
    renderCvState();

    cvImportBtn.addEventListener('click', () => cvFileInput.click());

    cvFileInput.addEventListener('change', async () => {
      const file = cvFileInput.files[0];
      if (!file) return;

      cvImportBtn.disabled = true;
      cvImportBtn.textContent = 'Envoi…';

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/profile/cv', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
          currentCv = { url: data.url, filename: data.filename };
        } else {
          alert(data.error || "Échec de l'envoi du CV.");
        }
      } catch {
        alert("Échec de l'envoi du CV.");
      } finally {
        cvImportBtn.disabled = false;
        cvFileInput.value = '';
        renderCvState(); // restores the correct label whether the upload succeeded or not
      }
    });

    function openCvPreview() {
      if (!currentCv.url) return;
      cvPreviewFrame.src = currentCv.url;
      cvPreviewOverlay.classList.remove('hidden');
      requestAnimationFrame(() => cvPreviewOverlay.classList.add('visible'));
      trapModalOpen(cvPreviewOverlay, closeCvPreview);
    }

    function closeCvPreview() {
      cvPreviewOverlay.classList.remove('visible');
      setTimeout(() => {
        cvPreviewOverlay.classList.add('hidden');
        cvPreviewFrame.src = '';
      }, OVERLAY_CLOSE_MS);
      trapModalClose(cvPreviewOverlay);
    }

    cvFilenameBtn.addEventListener('click', openCvPreview);
    cvPreviewClose.addEventListener('click', closeCvPreview);
    cvPreviewOverlay.addEventListener('click', e => {
      if (e.target === cvPreviewOverlay) closeCvPreview();
    });

    (async () => {
      await fetchCards();
      render();
    })();

    // --- Restore active view on load: ?view= param (cross-page links) wins over
    // the last view saved in localStorage (page refresh), default is Accueil.

    const initialParams = new URLSearchParams(window.location.search);
    const requestedView = initialParams.get('view');
    const requestedProfile = initialParams.get('profile') === '1';
    if (requestedView || requestedProfile) {
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
    const initialView = requestedView || localStorage.getItem(ACTIVE_VIEW_KEY);

    if (initialView === 'calendar') showCalendarView();
    else if (initialView === 'tasks') showTasksView();
    else showHomeView();

    // The sidebar's profile row is only a real button (that opens this modal
    // in place) when already on "/" — from any other page it's a plain Link
    // to "/?view=home&profile=1", so the modal needs to open itself once
    // that navigation lands here.
    if (requestedProfile) openProfileModal();

  } catch (err) {
    console.error('tracker.js failed to initialize:', err);
  }
  }

  initApp();
  window.altoraInitApp = initApp;
})();
