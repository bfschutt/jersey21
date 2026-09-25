// Fetches data/athletes.json and renders athlete cards into any page
// that has a <div id="athlete-grid" data-category="..."></div>.
// data-category="hall-of-fame" or "current" filters which records show;
// omit it (or use "all") to show everything.

async function loadAthletes() {
  const grid = document.getElementById('athlete-grid');
  if (!grid) return;

  const category = grid.dataset.category || 'all';
  const statusEl = document.getElementById('athlete-status');

  try {
    const res = await fetch('data/athletes.json');
    if (!res.ok) throw new Error('Network response was not ok');
    const athletes = await res.json();

    const filtered = category === 'all'
      ? athletes
      : athletes.filter(a => a.category === category);

    renderFilterBar(filtered, athletes, category);
    renderCards(filtered);

    if (statusEl) {
      statusEl.textContent = filtered.length === 0
        ? 'No athletes here yet — check back soon.'
        : '';
    }
  } catch (err) {
    console.error('Could not load athlete data:', err);
    if (statusEl) {
      statusEl.textContent = 'Could not load athlete data right now. Please try again later.';
    }
  }
}

function renderFilterBar(filtered, all, category) {
  const bar = document.getElementById('sport-filter');
  if (!bar) return;

  const base = category === 'all' ? all : all.filter(a => a.category === category);
  const sports = Array.from(new Set(base.map(a => a.sport))).sort();

  bar.innerHTML = '';
  const allBtn = makeFilterButton('All sports', 'all', true);
  bar.appendChild(allBtn);
  sports.forEach(sport => bar.appendChild(makeFilterButton(sport, sport, false)));

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-sport]');
    if (!btn) return;
    [...bar.querySelectorAll('button')].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const sport = btn.dataset.sport;
    const toShow = sport === 'all' ? base : base.filter(a => a.sport === sport);
    renderCards(toShow);
  });
}

function makeFilterButton(label, sport, active) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.dataset.sport = sport;
  btn.className = 'filter-btn' + (active ? ' active' : '');
  return btn;
}

function renderCards(list) {
  const grid = document.getElementById('athlete-grid');
  grid.innerHTML = '';

  list.forEach(a => {
    const card = document.createElement('article');
    card.className = 'athlete-card';
    card.innerHTML = `
      <div class="athlete-card-num">21</div>
      <h3>${escapeHtml(a.name)}</h3>
      <p class="athlete-meta">${escapeHtml(a.sport)} &middot; ${escapeHtml(a.teams.join(', '))} &middot; ${escapeHtml(a.position)}</p>
      <p class="athlete-years">${escapeHtml(a.yearsActive)}</p>
      <p class="athlete-blurb">${escapeHtml(a.blurb)}</p>
      <ul class="athlete-achievements">
        ${a.achievements.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
      <a class="card-link" href="${a.sourceUrl}" target="_blank" rel="noopener">Source &rarr;</a>
    `;
    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', loadAthletes);
