/* Poker Hand Advisor: describe your real spot, get odds and advice. */
(function (P) {
  'use strict';
  const { el, cardEl, money } = P;
  const pct = P.Bots.pct;

  function advisorScreen(root) {
    const hole = [];
    const board = [];
    let target = 'hole';
    let opps = 3;
    let pot = 100;
    let toCall = 0;
    let facing = 'none';
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const modeRow = el('div', { class: 'btn-row' });

    function refreshPicker() {
      picker.innerHTML = '';
      const g = P.deckGuide();
      g.querySelectorAll('.card').forEach(n => {
        const id = n.getAttribute('data-id');
        if (hole.includes(id)) n.classList.add('picked');
        if (board.includes(id)) n.classList.add('in-dog');
        n.style.cursor = 'pointer';
        n.addEventListener('click', () => {
          const mine = target === 'hole' ? hole : board;
          const max = target === 'hole' ? 2 : 5;
          const other = target === 'hole' ? board : hole;
          if (other.includes(id)) return;
          const k = mine.indexOf(id);
          if (k >= 0) mine.splice(k, 1); else if (mine.length < max) mine.push(id);
          update();
        });
      });
      picker.append(g);
    }

    function numberField(label, get, set, min) {
      return el('label', { style: 'margin-right:16px' }, label + ' ',
        el('input', { type: 'number', min, value: get(), style: 'width:80px;font:inherit;padding:4px', onchange: e => { set(Math.max(min, +e.target.value || 0)); renderResults(); } }));
    }

    function controls() {
      return el('div', { class: 'btn-row', style: 'align-items:center' },
        el('label', { style: 'margin-right:16px' }, 'Opponents still in ',
          el('select', { style: 'font:inherit;padding:4px', onchange: e => { opps = +e.target.value; renderResults(); } },
            [1, 2, 3, 4, 5, 6, 7, 8].map(n => el('option', { value: n, selected: n === opps ? true : null }, n)))),
        numberField('Pot ($)', () => pot, v => { pot = v; }, 0),
        numberField('To call ($)', () => toCall, v => { toCall = v; }, 0),
        el('label', {}, 'Preflop facing ',
          el('select', { style: 'font:inherit;padding:4px', onchange: e => { facing = e.target.value; renderResults(); } },
            [['none', 'no raise'], ['small', 'a small raise'], ['big', 'a big raise']].map(([v, l]) => el('option', { value: v, selected: v === facing ? true : null }, l)))));
    }

    function renderResults() {
      results.innerHTML = '';
      if (hole.length !== 2) { results.append(el('p', { class: 'muted' }, 'Pick your 2 hole cards to get advice.')); return; }
      if (board.length === 1 || board.length === 2) { results.append(el('p', { class: 'muted' }, 'The board has 0, 3, 4 or 5 cards. Add or remove cards.')); return; }
      const h = hole.map(P.card);
      const b = board.map(P.card);
      const a = P.Bots.adviseSpot({ hole: h, board: b, opps, pot, toCall, facing, iters: 4000 });
      const d = P.Bots.describe(h, b);
      const rows = [['Your hand', d.text], ['Win chance', `≈ ${pct(a.equity)} against ${opps} random hand${opps > 1 ? 's' : ''}`]];
      if (toCall > 0) rows.push(['Pot odds', `You need ${pct(a.potOdds)} to call ${money(toCall)} into ${money(pot)}`]);
      results.append(el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, 'Advice'),
        el('table', {}, rows.map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))),
        el('div', { class: 'coach-box' }, el('strong', {}, 'Suggestion: ' + a.action), el('div', {}, a.reason)),
        a.chen ? el('ul', {}, a.chen.steps.map(s => el('li', {}, `${s[0]}: ${s[1] >= 0 ? '+' : ''}${s[1]}`))) : null,
        el('p', { class: 'muted' }, 'Win chance is computed against random hands; real opponents who bet usually hold better than random, so be a bit more careful than the number suggests.')));
    }

    function update() {
      status.textContent = `Hole cards: ${hole.length}/2 · Board: ${board.length}/5`;
      modeRow.querySelectorAll('button[data-mode]').forEach(x => x.classList.toggle('primary', x.dataset.mode === target));
      refreshPicker();
      renderResults();
    }

    modeRow.append(
      el('button', { class: 'btn', 'data-mode': 'hole', onclick: () => { target = 'hole'; update(); } }, 'Marking: my 2 cards'),
      el('button', { class: 'btn', 'data-mode': 'board', onclick: () => { target = 'board'; update(); } }, 'Marking: the board'),
      el('button', { class: 'btn', onclick: () => { const d = P.shuffle(P.DECK.slice()); hole.length = 0; board.length = 0; d.slice(0, 2).forEach(c => hole.push(c.id)); d.slice(2, 5).forEach(c => board.push(c.id)); update(); } }, '🎲 Random flop'),
      el('button', { class: 'btn', onclick: () => { hole.length = 0; board.length = 0; target = 'hole'; update(); } }, 'Clear'));

    root.append(el('div', { class: 'panel' },
      el('h2', {}, 'Hand Advisor'),
      el('p', { class: 'muted' }, 'Playing with real cards? Mark your two hole cards and the community cards, tell me the pot and the bet you face, and get your win chance, pot odds and a suggested action.'),
      modeRow, status, el('p', { class: 'muted' }, 'Blue outline = your cards · orange outline = the board.'), controls(), picker), results);
    update();
  }

  P.Screens = Object.assign(P.Screens || {}, { advisor: advisorScreen });
})(window.Poker = window.Poker || {});
