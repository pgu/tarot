/* El Siete y medio Hand Advisor. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const M = S.SM;
  const fmt = S.smFmt;

  function advisorScreen(root) {
    const picked = [];
    let isBank = false;
    let alive = 2;
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
        n.addEventListener('click', () => { const k = picked.indexOf(id); if (k >= 0) picked.splice(k, 1); else if (picked.length < 8) picked.push(id); update(); });
      });
      picker.append(g);
    }

    function renderResults() {
      results.innerHTML = '';
      if (!picked.length) { results.append(el('p', { class: 'muted' }, 'Pick your cards.')); return; }
      const hand = picked.map(S.card);
      const t = S.smTotal(hand);
      const h = Math.round(t * 2);
      if (t > 7.5) { results.append(el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, `Total ${fmt(t)}: you went over`), el('p', {}, '¡Me paso! More than 7½ is out.'))); return; }
      const bust = M.bustProb(h); const exact = M.PROB[M.HMAX - h] || 0;
      const fake = { total: () => t, bank: isBank ? 0 : 1, survivors: () => alive, limits: [11], n: 4 };
      const d = S.SMBots.decide(fake, 0);
      results.append(el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, `Total ${fmt(t)}${S.smNatural(hand) ? ' — ¡siete y medio real!' : t === 7.5 ? ' — ¡siete y medio!' : ''}`),
        el('table', { class: 't' }, el('tr', {}, el('th', {}, 'Risk of going over on the next card'), el('td', {}, `${Math.round(bust * 100)}%`)), el('tr', {}, el('th', {}, 'Chance of exactly 7½'), el('td', {}, `${Math.round(exact * 100)}%`))),
        el('div', { class: 'coach-box' }, el('strong', {}, t === 7.5 ? 'Me planto' : d.hit ? 'Carta' : 'Me planto'), el('div', {}, t === 7.5 ? '7½ cannot be improved: stand.' : d.reason))));
    }

    function update() {
      status.textContent = `Cards: ${picked.length}${picked.length ? ` · total ${fmt(S.smTotal(picked.map(S.card)))}` : ''}`;
      refreshPicker(); renderResults();
    }

    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Hand Advisor · El Siete y medio'),
      el('p', { class: 'muted' }, 'Playing with a real deck? Tap the cards you hold: you see your total, the risk of going over and whether to ask for a card.'),
      el('div', { class: 'btn-row', style: 'align-items:center' },
        el('label', {}, el('input', { type: 'checkbox', onchange: e => { isBank = e.target.checked; renderResults(); } }), ' I am the bank'), ' ',
        el('label', {}, 'Players still in: ', el('select', { onchange: e => { alive = +e.target.value; renderResults(); } }, [0, 1, 2, 3].map(n => el('option', { value: n, selected: n === alive ? true : null }, n)))),
        el('button', { class: 'btn', onclick: () => { picked.length = 0; S.shuffle(S.DECK.slice()).slice(0, 2).forEach(c => picked.push(c.id)); update(); } }, '🎲 Random'),
        el('button', { class: 'btn', onclick: () => { picked.length = 0; update(); } }, 'Clear')),
      status, picker), results);
    update();
  }

  S.SMScreens = Object.assign(S.SMScreens || {}, { advisor: advisorScreen });
  void cardEl;
})(window.Spanish = window.Spanish || {});
