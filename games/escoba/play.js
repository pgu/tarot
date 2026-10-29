/* La Escoba Play screen: you vs a bot. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const val = S.escobaValue;
  const B = S.EscobaBots;
  const Settings = S.makeSettings('escoba.settings', { hints: true, explain: true, options: true });
  const sumOf = cards => cards.reduce((s, c) => s + val(c), 0);
  const names = ['You', 'Bot'];

  function playScreen(root) {
    const settings = Settings.get();
    let game = new S.Escoba({ target: 15, names });
    let selected = null;
    let chosen = new Set();
    let hint = null;
    let lastMsg = '';
    let timer = null;
    let alive = true;
    const logLines = [];

    const tableEl = el('div', { class: 'table escoba' });
    const sideEl = el('div', { class: 'side' });
    root.append(el('div', { class: 'play' }, tableEl, sideEl));

    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 100) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const lab = cards => cards.map(c => c.text).join(' + ');

    function describeEvent(ev) {
      const who = names[ev.player];
      if (!ev.taken.length) return `${who} ${ev.player === 0 ? 'drop' : 'drops'} ${ev.card.text}.`;
      return `${who} ${ev.player === 0 ? 'play' : 'plays'} ${ev.card.text} and ${ev.player === 0 ? 'take' : 'takes'} ${lab(ev.taken)}${ev.escoba ? ' — ESCOBA! 🧹' : ''}.`;
    }

    function afterMove(ev, why) {
      lastMsg = describeEvent(ev);
      log(lastMsg, why);
      if (ev.dealt) log('New hands dealt: 3 cards each.');
      selected = null; chosen = new Set(); hint = null;
      if (game.phase !== 'play') {
        const r = game.roundResult;
        log(`Round over: you ${r.points[0]}, bot ${r.points[1]}. Total ${game.scores[0]}–${game.scores[1]}.`);
      }
      advance();
    }

    function advance() {
      clearTimeout(timer);
      render();
      if (!alive || game.phase !== 'play') return;
      if (game.turn === 1) {
        later(1100, () => {
          const m = B.choose(game, 1);
          const ev = game.play(1, m.card, m.capture);
          afterMove(ev, settings.explain ? m.reason : null);
        });
      }
    }

    /* ----- human actions ----- */
    function pickHand(card) {
      selected = selected === card ? null : card;
      chosen = new Set(); hint = null;
      render();
    }
    function toggleTable(card) {
      if (!selected) return;
      if (chosen.has(card.id)) chosen.delete(card.id); else chosen.add(card.id);
      render();
    }
    function capture(cards) {
      try { afterMove(game.play(0, selected, cards), null); }
      catch (e) { lastMsg = '⚠ ' + e.message; render(); }
    }

    /* ----- rendering ----- */
    function oppPanel() {
      const p = game.piles[1];
      return el('div', { class: 'seat north' }, el('div', { class: 'name' }, 'Bot ', game.turn === 1 && game.phase === 'play' ? el('span', { class: 'chip turn' }, 'thinking…') : null),
        el('div', { class: 'backs' }, game.hands[1].map(() => cardEl(null, { back: true }))),
        el('div', { class: 'muted', style: 'color:#cfe' }, `Captured: ${p.length} cards · ${p.filter(c => c.suit === 'O').length} oros · ${game.escobas[1]} escoba(s)`));
    }

    function tableArea() {
      const canPick = selected && game.phase === 'play' && game.turn === 0;
      const hintCards = hint && hint.capture ? hint.capture.map(c => c.id) : [];
      const area = el('div', { class: 'center-area' },
        el('div', { class: 'muted', style: 'color:#cfe' }, `Table · sum ${sumOf(game.table)} · deck ${game.deck.length}`),
        el('div', { class: 'board spanish-table' }, game.table.length
          ? game.table.map(c => cardEl(c, { cls: (chosen.has(c.id) ? 'chosen ' : '') + (hintCards.includes(c.id) ? 'capture' : ''), onclick: canPick ? toggleTable : null }))
          : el('div', { class: 'muted', style: 'color:#cfe;padding:30px' }, 'The table is empty.')),
        el('div', { class: 'msg' }, lastMsg || 'Pick a card from your hand.'));
      return area;
    }

    function controls() {
      const box = el('div', { class: 'south-actions' });
      if (game.phase !== 'play') {
        const r = game.roundResult;
        box.append(el('div', { class: 'panel', style: 'text-align:left;color:var(--ink);max-width:560px;margin:0 auto 10px' },
          el('h3', {}, game.phase === 'gameover' ? (game.scores[0] > game.scores[1] ? '🏆 You win the game!' : 'The bot wins the game.') : 'Round over'),
          game.leftover ? el('p', { class: 'muted' }, `Remaining table cards go to ${names[game.leftover.to]} (last capture).`) : null,
          el('table', { class: 't' },
            el('tr', {}, el('th', {}, 'Point'), el('th', {}, 'You'), el('th', {}, 'Bot'), el('th', {}, 'Result')),
            r.categories.map(c => el('tr', {}, el('td', {}, c.name), el('td', {}, String(c.values[0])), el('td', {}, String(c.values[1])),
              el('td', {}, c.each ? '+1 each' : c.winner < 0 ? 'tie' : c.winner === 0 ? 'You +1' : 'Bot +1'))),
            el('tr', {}, el('th', {}, 'This round'), el('th', {}, String(r.points[0])), el('th', {}, String(r.points[1])), el('th', {}, `Total ${game.scores[0]}–${game.scores[1]}`)))),
          game.phase === 'gameover'
            ? el('button', { class: 'btn primary', onclick: () => { game = new S.Escoba({ target: 15, names }); logLines.length = 0; lastMsg = ''; advance(); } }, 'New game')
            : el('button', { class: 'btn primary', onclick: () => { game.nextRound(); lastMsg = ''; log('— New round —'); advance(); } }, 'Next round'));
        return box;
      }
      if (game.turn !== 0) return box;
      if (!selected) { return box; }
      const caps = game.capturesFor(0, selected);
      const chosenCards = game.table.filter(c => chosen.has(c.id));
      const total = val(selected) + sumOf(chosenCards);
      box.append(el('div', { style: 'margin-bottom:6px' }, `${val(selected)}${chosenCards.map(c => ' + ' + val(c)).join('')} = `, el('strong', {}, String(total)), total === 15 ? ' ✓' : ' (need 15)'));
      box.append(el('button', { class: 'btn primary', disabled: total !== 15 || !chosenCards.length, onclick: () => capture(chosenCards) }, 'Capture'));
      if (!caps.length) box.append(el('button', { class: 'btn', onclick: () => capture(null) }, `Drop ${selected.text} on the table`));
      else box.append(el('span', { class: 'muted', style: 'color:#cfe' }, ' A capture is possible: you must take it.'));
      if (settings.options && caps.length) {
        box.append(el('div', { style: 'margin-top:6px' }, caps.map(cp => el('button', { class: 'btn small', onclick: () => capture(cp) }, `Take ${lab(cp)}`))));
      }
      return box;
    }

    function handEl() {
      const mine = game.turn === 0 && game.phase === 'play';
      const best = hint ? hint.card : null;
      return el('div', { class: 'hand flat' }, game.hands[0].map(c => cardEl(c, {
        cls: (selected === c ? 'selected ' : '') + (best === c ? 'hint' : ''),
        onclick: mine ? pickHand : null,
      })));
    }

    function coachPanel() {
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Coach is off. Enable it below.')); return box; }
      if (game.phase !== 'play' || game.turn !== 0) { box.append(el('p', { class: 'muted' }, 'Advice appears on your turn.')); return box; }
      const sum = sumOf(game.table);
      box.append(el('p', {}, `Table sum: ${sum}. ` + (sum < 15 && game.table.length ? `A card worth ${15 - sum} would sweep it!` : 'Look for combinations that reach 15 with one of your cards.')),
        el('button', { class: 'btn small', onclick: () => { hint = B.choose(game, 0); render(); } }, '💡 Suggest a play'));
      if (hint) box.append(el('div', { class: 'coach-box' }, el('strong', {}, S.escobaDescribe(hint)), el('div', {}, hint.reason)));
      return box;
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      tableEl.append(oppPanel(), tableArea(), el('div', { class: 'actions' }, controls(),
        el('div', { class: 'seat south' }, el('div', { class: 'name' }, 'You ', game.turn === 0 && game.phase === 'play' ? el('span', { class: 'chip turn' }, 'your turn') : null),
          el('div', { class: 'muted', style: 'color:#cfe' }, `Captured: ${game.piles[0].length} cards · ${game.piles[0].filter(c => c.suit === 'O').length} oros · ${game.escobas[0]} escoba(s)`)),
        handEl()));
      sideEl.innerHTML = '';
      sideEl.append(scorePanel(), coachPanel(), settingsPanel(), logPanel());
    }

    function scorePanel() {
      return el('div', { class: 'panel' }, el('h3', {}, 'Score (first to 15)'),
        el('table', {}, el('tr', {}, el('td', {}, 'You '), el('td', {}, el('strong', {}, String(game.scores[0])))), el('tr', {}, el('td', {}, 'Bot '), el('td', {}, el('strong', {}, String(game.scores[1]))))));
    }

    function settingsPanel() {
      const defs = [['hints', 'Coach: hints & advice'], ['options', 'Show the possible captures'], ['explain', "Explain the bot's choices in the log"]];
      return el('div', { class: 'panel' }, el('h3', {}, 'Learning aids'), defs.map(([k, label]) =>
        el('label', { class: 'switch' }, el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => { settings[k] = e.target.checked; Settings.set(settings); hint = null; render(); } }), ' ' + label)));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l => el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, 'Log'), box);
    }

    log('Round 1. ' + (game.turn === 0 ? 'You start.' : 'The bot starts.'));
    advance();
    return () => { alive = false; clearTimeout(timer); };
  }

  S.EscobaScreens = Object.assign(S.EscobaScreens || {}, { play: playScreen });
})(window.Spanish = window.Spanish || {});
