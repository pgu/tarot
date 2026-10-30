/* El Cinquillo Play screen: you vs 2-3 bots. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const B = S.CinquilloBots;
  const Settings = S.makeSettings('cinquillo.settings', { hints: true, explain: true, legal: true, players: 4 });
  const POS = { 3: ['south', 'east', 'west'], 4: ['south', 'east', 'north', 'west'] };

  function playScreen(root) {
    const settings = Settings.get();
    let game;
    let hint = null;
    let timer = null;
    let alive = true;
    let endLogged = false;
    const logLines = [];

    const tableEl = el('div', { class: 'table cinquillo' });
    const sideEl = el('div', { class: 'side' });
    root.append(el('div', { class: 'play' }, tableEl, sideEl));

    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 150) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const nm = i => game.names[i];

    function newGame() {
      game = new S.Cinquillo({ players: settings.players });
      logLines.length = 0;
      startRound();
    }
    function startRound() {
      hint = null; endLogged = false;
      log(`— Round ${game.round} — ${nm(game.turn)} holds the 5 de oros and starts. —`);
      advance();
    }

    function advance() {
      clearTimeout(timer);
      render();
      if (!alive) return;
      if (game.phase === 'roundover' || game.phase === 'gameover') {
        if (!endLogged) { endLogged = true; log(`${nm(game.result.winner)} went out! +${game.result.gained} points.`); render(); }
        return;
      }
      if (game.turn === 0) return;
      later(750, () => {
        const p = game.turn;
        const c = B.choose({ hand: game.hands[p], table: game.table, first: game.first });
        if (c.card) { game.play(p, c.card); log(`${nm(p)} plays ${c.card.text}.`, settings.explain ? c.reason : null); }
        else { game.pass(p); log(`${nm(p)}: paso.`, settings.explain ? c.reason : null); }
        advance();
      });
    }

    function humanPlay(card) {
      hint = null;
      try { game.play(0, card); log(`You play ${card.text}.`); advance(); } catch (e) { log('⚠ ' + e.message); render(); }
    }
    function humanPass() { try { game.pass(0); log('You: paso.'); hint = null; advance(); } catch (e) { log('⚠ ' + e.message); render(); } }

    function seat(i) {
      return el('div', { class: 'seat ' + POS[game.n][i] },
        el('div', { class: 'name' }, nm(i), ' ', game.turn === i ? el('span', { class: 'chip turn' }, 'turn') : null, el('span', { class: 'chip' }, `${game.scores[i]} pts`)),
        el('div', { class: 'backs' }, game.hands[i].map(() => cardEl(null, { back: true }))),
        el('div', { class: 'muted', style: 'color:#cfe' }, `${game.hands[i].length} cards`));
    }

    function center() {
      const mine = game.turn === 0 && game.phase === 'play';
      const msg = game.phase !== 'play' ? '' : mine ? (game.legal(0).length ? (game.first ? 'You hold the 5 de oros: play it to start.' : 'Your turn: play a highlighted card.') : 'You cannot play: pass.') : `${nm(game.turn)} is playing…`;
      return el('div', { class: 'center-area', style: 'min-height:0' }, S.cinquilloTableView(game.table), el('div', { class: 'msg' }, msg));
    }

    function actions() {
      const g = game;
      const box = el('div', { class: 'south-actions' });
      if (g.phase === 'roundover' || g.phase === 'gameover') {
        const r = g.result;
        box.append(el('div', { class: 'panel', style: 'text-align:left;color:var(--ink);max-width:520px;margin:0 auto 10px' },
          el('h3', {}, g.phase === 'gameover' ? (g.winner === 0 ? '🏆 You win the game!' : `${nm(g.winner)} wins the game.`) : r.winner === 0 ? 'You went out! 🎉' : `${nm(r.winner)} went out`),
          el('table', { class: 't' }, el('tr', {}, el('th', {}, 'Player'), el('th', {}, 'Cards left'), el('th', {}, 'Total')), g.names.map((n, i) => el('tr', {}, el('td', {}, n), el('td', {}, String(r.left[i])), el('td', {}, String(g.scores[i]))))),
          el('p', { class: 'muted' }, `The winner scores one point per card left in the others' hands (+${r.gained}); first to ${g.target} wins.`),
          g.phase === 'gameover' ? el('button', { class: 'btn primary', onclick: newGame }, 'New game') : el('button', { class: 'btn primary', onclick: () => { g.nextRound(); startRound(); } }, 'Next round')));
        return box;
      }
      if (g.turn === 0 && !g.legal(0).length) box.append(el('button', { class: 'btn primary', onclick: humanPass }, 'Paso'));
      return box;
    }

    function handEl() {
      const mine = game.turn === 0 && game.phase === 'play';
      const legal = mine ? game.legal(0) : [];
      return el('div', { class: 'hand flat' }, game.hands[0].map(c => {
        let cls = '';
        if (mine && settings.legal) cls = legal.includes(c) ? 'legal' : 'dim';
        if (hint && hint.card === c) cls += ' hint';
        return cardEl(c, { cls, onclick: mine && legal.includes(c) ? humanPlay : null });
      }));
    }

    function coachPanel() {
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Coach is off. Enable it below.')); return box; }
      if (game.phase !== 'play' || game.turn !== 0) { box.append(el('p', { class: 'muted' }, 'Advice appears on your turn.')); return box; }
      const legal = game.legal(0);
      box.append(el('p', {}, legal.length ? `${legal.length} playable card${legal.length > 1 ? 's' : ''}. A 5 opens a suit; the others continue it one step up or down.` : 'No playable card: pass (it is free).'));
      if (legal.length) box.append(el('button', { class: 'btn small', onclick: () => { hint = B.choose({ hand: game.hands[0], table: game.table, first: game.first }); render(); } }, '💡 Suggest a card'));
      if (hint && hint.card) box.append(el('div', { class: 'coach-box' }, el('strong', {}, hint.card.text), ' – ', hint.reason));
      return box;
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      const others = [...Array(game.n - 1).keys()].map(k => seat(k + 1));
      tableEl.append(el('div', { class: 'opp-row' }, others), center(), el('div', { class: 'actions' }, actions(),
        el('div', { class: 'seat south' }, el('div', { class: 'name' }, 'You ', game.turn === 0 && game.phase === 'play' ? el('span', { class: 'chip turn' }, 'your turn') : null, el('span', { class: 'chip' }, `${game.scores[0]} pts`))),
        handEl()));
      sideEl.innerHTML = '';
      sideEl.append(scorePanel(), coachPanel(), settingsPanel(), logPanel());
    }

    function scorePanel() {
      return el('div', { class: 'panel' }, el('h3', {}, `Points (to ${game.target})`),
        el('table', {}, game.names.map((n, i) => el('tr', {}, el('td', {}, n + ' '), el('td', {}, String(game.scores[i]))))));
    }

    function settingsPanel() {
      const defs = [['hints', 'Coach: hints & advice'], ['legal', 'Highlight playable cards'], ['explain', "Explain the bots' choices in the log"]];
      return el('div', { class: 'panel' }, el('h3', {}, 'Learning aids'),
        defs.map(([k, label]) => el('label', { class: 'switch' }, el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => { settings[k] = e.target.checked; Settings.set(settings); hint = null; render(); } }), ' ' + label)),
        el('label', { class: 'switch' }, 'Players: ', el('select', { onchange: e => { settings.players = +e.target.value; Settings.set(settings); newGame(); } }, [3, 4].map(n => el('option', { value: n, selected: n === settings.players ? true : null }, n)))));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l => el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, 'Log'), box);
    }

    newGame();
    return () => { alive = false; clearTimeout(timer); };
  }

  S.CinquilloScreens = Object.assign(S.CinquilloScreens || {}, { play: playScreen });
})(window.Spanish = window.Spanish || {});
