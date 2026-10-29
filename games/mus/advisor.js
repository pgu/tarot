/* El Mus Hand Advisor: enter your four cards. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const B = S.MusBots;

  function advisorScreen(root) {
    const picked = [];
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});

    function refreshPicker() {
      picker.innerHTML = '';
      const g = S.deckGuide();
      g.querySelectorAll('.card').forEach(n => {
        const id = n.getAttribute('data-id');
        if (picked.includes(id)) n.classList.add('picked');
        n.style.cursor = 'pointer';
        n.addEventListener('click', () => {
          const k = picked.indexOf(id);
          if (k >= 0) picked.splice(k, 1); else if (picked.length < 4) picked.push(id);
          update();
        });
      });
      picker.append(g);
    }

    function renderResults() {
      results.innerHTML = '';
      if (picked.length !== 4) { results.append(el('p', { class: 'muted' }, 'Pick your four cards.')); return; }
      const h = S.sortCards(picked.map(S.card));
      const g = { hands: [h], musRounds: 0 };
      const m = B.musDecision(g, 0, { deterministic: true });
      const x = B.chooseDiscard(g, 0);
      const rows = [['grande', 'Grande'], ['chica', 'Chica'], ['pares', 'Pares'], ['juego', S.juegoSum(h) >= 31 ? 'Juego' : 'Punto']];
      const d = S.musDescribe(h);
      const pctRows = rows.map(([k, l]) => {
        const kind = k === 'juego' && !S.hasJuego(h) ? 'punto' : k;
        const val = S.lanceValue(kind, h);
        const p = val < 0 ? null : S.musPercentile(kind, h, 1500);
        return el('tr', {}, el('th', {}, l), el('td', {}, d[k === 'juego' ? 'juego' : k]), el('td', {}, p == null ? '—' : `better than ${Math.round(p * 100)}% of random hands`));
      });
      results.append(el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, 'Your hand'),
        el('table', { class: 't' }, pctRows),
        el('div', { class: 'coach-box' }, el('strong', {}, m.mus ? 'Ask for mus' : '¡No hay mus! (cut)'), el('div', {}, m.reason)),
        m.mus ? el('div', { class: 'coach-box' }, el('strong', {}, x.discard.length ? `If everybody says mus, discard: ${x.discard.map(c => c.text).join(' ')}` : 'Keep everything'), el('div', {}, x.reason)) : null,
        el('p', { class: 'muted' }, 'Percentages compare your hand with random four-card hands; they do not know what your partner or the rivals hold.')));
    }

    function update() {
      status.textContent = `Cards: ${picked.length}/4`;
      refreshPicker(); renderResults();
    }

    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Hand Advisor · El Mus'),
      el('p', { class: 'muted' }, 'Playing with a real deck? Tap your four cards: you see what they are worth in each lance and whether to ask for mus or cut.'),
      el('div', { class: 'btn-row' },
        el('button', { class: 'btn', onclick: () => { picked.length = 0; S.shuffle(S.DECK.slice()).slice(0, 4).forEach(c => picked.push(c.id)); update(); } }, '🎲 Random hand'),
        el('button', { class: 'btn', onclick: () => { picked.length = 0; update(); } }, 'Clear')),
      status, picker), results);
    update();
  }

  S.MusScreens = Object.assign(S.MusScreens || {}, { advisor: advisorScreen });
  void cardEl;
})(window.Spanish = window.Spanish || {});
