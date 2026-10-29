/* Chinchón Play screen: you vs 1-3 bots. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const B = S.ChinchonBots;
  const Settings = S.makeSettings('chinchon.settings', { hints: true, explain: true, melds: true, players: 4 });
  // Play goes counter-clockwise: seat positions by number of players (index 0 = you)
  const POS = { 2: ['south', 'north'], 3: ['south', 'east', 'west'], 4: ['south', 'east', 'north', 'west'] };
  const meldName = m => (m.every(c => c.rank === m[0].rank) ? (m.length === 3 ? 'trío' : 'cuarteto') : 'escalera');

  function playScreen(root) {
    const settings = Settings.get();
    let game;
    let selected = null;
    let timer = null;
    let alive = true;
    const logLines = [];

    const tableEl = el('div', { class: 'table chinchon' });
    const sideEl = el('div', { class: 'side' });
    root.append(el('div', { class: 'play' }, tableEl, sideEl));

    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 120) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const nm = i => game.names[i];

    function newGame() {
      game = new S.Chinchon({ players: settings.players });
      logLines.length = 0;
      startRoundLog();
      advance();
    }
    function startRoundLog() {
      selected = null;
      log(`— Ronda ${game.round} — ${nm(game.dealer)} reparte; ${nm(game.turn)} empieza (${game.top().text} en el descarte).`);
    }

    /* ---------- flow ---------- */
    function advance() {
      clearTimeout(timer);
      render();
      if (!alive || game.phase === 'roundover' || game.phase === 'gameover' || game.turn === 0) return;
      const p = game.turn;
      if (game.phase === 'draw') {
        later(900, () => {
          const w = B.wantsDiscard(game.hands[p], game.top());
          if (w.take) { const c = game.top(); game.drawDiscard(p); log(`${nm(p)} takes ${c.text} from the descarte.`, settings.explain ? w.reason : null); }
          else { game.drawStock(p); log(`${nm(p)} draws from the mazo.`, settings.explain ? w.reason : null); }
          advance();
        });
      } else {
        later(900, () => {
          const c = B.decideClose(game.hands[p]);
          if (c) { game.close(p, c.card); log(`${nm(p)} CIERRA! 🔔`, settings.explain ? 'Few enough unmatched points to close.' : null); finishRound(); return; }
          const d = B.chooseDiscard(game.hands[p], game.taken);
          game.discard(p, d.card);
          log(`${nm(p)} discards ${d.card.text}.`, settings.explain ? d.reason : null);
          if (game.phase === 'roundover') log('Tablas: nobody could close, the round is void.');
          advance();
        });
      }
    }

    function finishRound() {
      const r = game.roundResult;
      const parts = Object.keys(r.arrangements).map(i => `${nm(+i)} ${r.deltas[i] >= 0 ? '+' : ''}${r.deltas[i]}`);
      log(r.chinchon ? `¡¡CHINCHÓN!! ${nm(r.closer)} wins the game.` : 'Round over: ' + parts.join(', ') + '.');
      advance();
    }

    /* ---------- human actions ---------- */
    function drawStock() { game.drawStock(0); log('You draw from the mazo.'); advance(); }
    function drawDiscard() { const c = game.top(); game.drawDiscard(0); log(`You take ${c.text} from the descarte.`); advance(); }
    function discard() {
      try { game.discard(0, selected); log(`You discard ${selected.text}.`); selected = null; if (game.phase === 'roundover') log('Tablas: the round is void.'); advance(); }
      catch (e) { log('⚠ ' + e.message); render(); }
    }
    function close() {
      game.close(0, selected); log('You close the round! 🔔'); selected = null; finishRound();
    }

    /* ---------- rendering ---------- */
    function seat(i) {
      const g = game;
      const chips = [];
      if (g.dealer === i) chips.push(el('span', { class: 'chip' }, 'dealer'));
      if (g.turn === i) chips.push(el('span', { class: 'chip turn' }, 'turn'));
      if (g.out[i]) chips.push(el('span', { class: 'chip' }, 'out'));
      return el('div', { class: 'seat ' + POS[g.n][i] + (g.out[i] ? ' folded' : '') },
        el('div', { class: 'name' }, nm(i), ' ', chips),
        el('div', { class: 'stack' }, `${g.scores[i]} pts`),
        el('div', { class: 'backs' }, g.hands[i].map(() => cardEl(null, { back: true }))));
    }

    function centerArea() {
      const g = game;
      const myDraw = g.phase === 'draw' && g.turn === 0;
      const stockCard = cardEl(null, { back: true, cls: myDraw ? 'clickable' : '' });
      if (myDraw) stockCard.addEventListener('click', drawStock);
      const top = g.top();
      const topEl = cardEl(top, { onclick: myDraw ? drawDiscard : null });
      let msg = '';
      if (g.phase === 'draw') msg = g.turn === 0 ? 'Your turn: draw from the mazo or take the top of the descarte.' : `${nm(g.turn)} is playing…`;
      else if (g.phase === 'discard') msg = g.turn === 0 ? 'Choose a card to discard' + (g.taken ? ` (not ${g.taken.text}, which you just took)` : '') + ', or close if you can.' : `${nm(g.turn)} is playing…`;
      return el('div', { class: 'center-area' },
        el('div', { class: 'row-piles' },
          el('div', { class: 'pile' }, stockCard, el('div', { class: 'muted', style: 'color:#cfe' }, `Mazo (${g.stock.length})`)),
          el('div', { class: 'pile' }, topEl, el('div', { class: 'muted', style: 'color:#cfe' }, `Descarte (${g.discardPile.length})`))),
        el('div', { class: 'msg' }, msg));
    }

    function handArea() {
      const g = game;
      const hand = g.hands[0];
      const canPick = g.phase === 'discard' && g.turn === 0;
      const mk = c => cardEl(c, { cls: selected === c ? 'selected' : '', onclick: canPick ? (card => { selected = selected === card ? null : card; render(); }) : null });
      if (!settings.melds || g.out[0]) return el('div', { class: 'hand flat' }, hand.map(mk));
      const arr = S.bestArrangement(hand);
      return el('div', { class: 'groups' },
        arr.melds.map(m => el('div', { class: 'group' }, el('div', { class: 'cap' }, meldName(m)), el('div', { class: 'hand flat' }, m.map(mk)))),
        arr.deadwood.length ? el('div', { class: 'group loose' }, el('div', { class: 'cap' }, `sueltas (${arr.points} pts)`), el('div', { class: 'hand flat' }, arr.deadwood.map(mk))) : null);
    }

    function controls() {
      const g = game;
      const box = el('div', { class: 'south-actions' });
      if (g.phase === 'roundover' || g.phase === 'gameover') return box.append(resultPanel()), box;
      if (g.turn !== 0) return box;
      if (g.phase === 'draw') {
        box.append(el('button', { class: 'btn primary', onclick: drawStock }, 'Draw from the mazo'),
          el('button', { class: 'btn', onclick: drawDiscard }, `Take ${g.top().text} from the descarte`));
      } else {
        const ok = selected && selected !== g.taken;
        box.append(el('button', { class: 'btn primary', disabled: !ok, onclick: discard }, selected ? `Discard ${selected.text}` : 'Discard (select a card)'),
          el('button', { class: 'btn', disabled: !(selected && g.canClose(0, selected)), onclick: close }, 'Cerrar (close)'));
      }
      return box;
    }

    function resultPanel() {
      const g = game; const r = g.roundResult;
      const panel = el('div', { class: 'panel', style: 'text-align:left;color:var(--ink);max-width:640px;margin:0 auto 10px' });
      panel.append(el('h3', {}, g.phase === 'gameover' ? (r.chinchon ? `¡CHINCHÓN! ${g.winner === 0 ? 'You win' : nm(g.winner) + ' wins'} the game` : (g.winner === 0 ? '🏆 You win the game!' : `${nm(g.winner)} wins the game.`)) : r.stalemate ? 'Tablas: round void' : `${nm(r.closer)} closed the round`));
      const rows = Object.keys(r.arrangements).map(k => +k);
      panel.append(el('table', { class: 't' }, el('tr', {}, el('th', {}, 'Player'), el('th', {}, 'Combinations'), el('th', {}, 'Left over'), el('th', {}, 'Round'), el('th', {}, 'Total')),
        rows.map(i => {
          const a = r.arrangements[i];
          return el('tr', {}, el('td', {}, nm(i) + (i === r.closer ? ' 🔔' : '')),
            el('td', {}, a.melds.length ? a.melds.map(m => m.map(c => c.text).join(' ')).join(' | ') : '—'),
            el('td', {}, a.deadwood.map(c => c.text).join(' ') || '—'),
            el('td', {}, r.stalemate ? '0' : (r.deltas[i] > 0 ? '+' : '') + r.deltas[i] + (i === r.closer && r.bonus ? ' (−10 bonus)' : '')),
            el('td', {}, String(g.scores[i]) + (g.out[i] ? ' ✗ out' : '')));
        })));
      if (g.phase === 'gameover') panel.append(el('button', { class: 'btn primary', onclick: newGame }, 'New game'));
      else panel.append(el('button', { class: 'btn primary', onclick: () => { g.newRound(); startRoundLog(); advance(); } }, 'Next round'));
      return panel;
    }

    function coachPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Coach is off. Enable it below.')); return box; }
      if (!['draw', 'discard'].includes(g.phase) || g.turn !== 0) { box.append(el('p', { class: 'muted' }, 'Advice appears on your turn.')); return box; }
      const hand = g.hands[0];
      if (g.phase === 'draw') {
        const w = B.wantsDiscard(hand, g.top());
        const cur = S.bestArrangement(hand);
        box.append(el('p', {}, `Unmatched now: ${cur.points} pts.`), el('div', { class: 'coach-box' }, el('strong', {}, w.take ? `Take ${g.top().text}` : 'Draw from the mazo'), el('div', {}, w.reason)));
      } else {
        const d = B.chooseDiscard(hand, g.taken, 0);
        const opts = S.discardOptions(hand).filter(o => o.card !== g.taken);
        const closing = opts.find(o => o.canClose);
        box.append(el('div', { class: 'coach-box' }, el('strong', {}, closing ? `Cerrar: discard ${closing.card.text} (${closing.points} pts left)` : `Discard ${d.card.text}`), el('div', {}, closing ? 'You can close the round now. Closing early avoids risk.' : d.reason)));
      }
      return box;
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      const others = [1, 2, 3].slice(0, game.n - 1).map(seat);
      tableEl.append(...others, centerArea(), el('div', { class: 'actions' }, controls(),
        el('div', { class: 'seat south' }, el('div', { class: 'name' }, 'You ', game.turn === 0 ? el('span', { class: 'chip turn' }, 'your turn') : null, el('span', { class: 'chip' }, `${game.scores[0]} pts`))),
        handArea()));
      sideEl.innerHTML = '';
      sideEl.append(scorePanel(), coachPanel(), settingsPanel(), logPanel());
    }

    function scorePanel() {
      return el('div', { class: 'panel' }, el('h3', {}, `Puntos (out above ${S.CHINCHON_LIMIT})`),
        el('table', {}, game.names.map((n, i) => el('tr', {}, el('td', {}, n + ' '), el('td', { class: game.out[i] ? 'bad' : '' }, `${game.scores[i]}${game.out[i] ? ' ✗' : ''}`)))));
    }

    function settingsPanel() {
      const defs = [['hints', 'Coach: hints & advice'], ['melds', 'Show my combinations (grouped hand)'], ['explain', "Explain the bots' choices in the log"]];
      return el('div', { class: 'panel' }, el('h3', {}, 'Learning aids'),
        defs.map(([k, label]) => el('label', { class: 'switch' }, el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => { settings[k] = e.target.checked; Settings.set(settings); render(); } }), ' ' + label)),
        el('label', { class: 'switch' }, 'Players: ', el('select', { onchange: e => { settings.players = +e.target.value; Settings.set(settings); newGame(); } },
          [2, 3, 4].map(n => el('option', { value: n, selected: n === settings.players ? true : null }, n)))));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l => el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, 'Log'), box);
    }

    newGame();
    return () => { alive = false; clearTimeout(timer); };
  }

  S.ChinchonScreens = Object.assign(S.ChinchonScreens || {}, { play: playScreen });
})(window.Spanish = window.Spanish || {});
