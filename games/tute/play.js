/* El Tute Play screen: you vs a bot (tute arrastrado, 2 players). */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const B = S.TuteBots;
  const fmt = B.fmt;
  const Settings = S.makeSettings('tute.settings', { hints: true, explain: true, legal: true, count: false });
  const names = ['You', 'Bot'];
  const suitName = s => S.SUIT_INFO[s].name.toLowerCase();

  function playScreen(root) {
    const settings = Settings.get();
    let game = new S.Tute({ names });
    let hint = null;
    let timer = null;
    let alive = true;
    const logLines = [];

    const tableEl = el('div', { class: 'table tute' });
    const sideEl = el('div', { class: 'side' });
    root.append(el('div', { class: 'play' }, tableEl, sideEl));

    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 120) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const livePts = p => S.tuteSum(game.piles[p]) + game.bonus[p];

    function newHand(first) {
      if (!first) game.nextHand();
      hint = null;
      log(`— Mano ${game.matches[0] + game.matches[1] + 1 + (first ? 0 : 0)} — Triunfo: ${game.pinta.text} (${S.SUIT_INFO[game.triumph].name}). ${names[game.leader]} lead${game.leader === 0 ? '' : 's'}.`);
      advance();
    }

    function advance() {
      clearTimeout(timer);
      render();
      if (!alive) return;
      if (game.phase === 'done') { logEnd(); render(); return; }
      if (game.trickComplete) {
        later(1500, () => {
          const rec = game.collectTrick();
          log(`→ ${names[rec.winner]} win${rec.winner === 0 ? '' : 's'} the trick (${rec.points} pts).`);
          if (game.phase === 'play' && !game.stock.length && game.history.length === 14) log('El monte se ha acabado: ¡arrastre! You must now follow suit, beat the card, or trump.');
          advance();
        });
        return;
      }
      if (game.turn === 1) later(1100, botTurn);
    }

    let endLogged = false;
    function logEnd() {
      if (endLogged) return;
      endLogged = true;
      const r = game.result;
      log(r.tute ? `¡TUTE! ${names[r.winner]} had four ${r.rank === 12 ? 'reyes' : 'caballos'}.` : `Hand over: you ${r.points[0]}, bot ${r.points[1]}.`);
    }

    function botTurn() {
      const ctx = game.ctxFor(1);
      const pl = B.plan(ctx);
      if (pl.tute) { game.tute(1); log('Bot: ¡TUTE! Four ' + (pl.tute === 12 ? 'reyes' : 'caballos') + '.'); advance(); return; }
      if (pl.swap) { log(`Bot cambia el 7 por el ${game.pinta.text}.`); game.swap(1); }
      if (pl.sing) { const pts = game.sing(1, pl.sing); log(`Bot canta ${pts === 40 ? 'las cuarenta' : 'las veinte'} en ${suitName(pl.sing)} (+${pts}).`); }
      const pick = B.chooseCard(game.ctxFor(1));
      game.play(1, pick.card);
      log(`Bot plays ${pick.card.text}.`, settings.explain ? pick.reason : null);
      advance();
    }

    /* ---- human actions ---- */
    function humanPlay(card) {
      hint = null;
      try { game.play(0, card); log(`You play ${card.text}.`); advance(); }
      catch (e) { log('⚠ ' + e.message); render(); }
    }
    function sing(suit) { const pts = game.sing(0, suit); log(`You sing ${pts === 40 ? 'las cuarenta' : 'las veinte'} en ${suitName(suit)} (+${pts}).`); hint = null; advance(); }
    function swap() { log(`You swap your 7 for the ${game.pinta.text}.`); game.swap(0); hint = null; advance(); }
    function tute() { game.tute(0); log('You declare ¡TUTE!'); advance(); }

    /* ---- rendering ---- */
    function oppPanel() {
      const sung = game.cantes[1];
      return el('div', { class: 'seat north' }, el('div', { class: 'name' }, 'Bot ', game.turn === 1 ? el('span', { class: 'chip turn' }, 'turn') : null,
        ...sung.map(s => el('span', { class: 'chip' }, 'cantó ' + (s === game.triumph ? '40' : '20') + ' ' + suitName(s)))),
        el('div', { class: 'backs' }, game.hands[1].map(() => cardEl(null, { back: true }))),
        settings.count ? el('div', { class: 'stack' }, `${livePts(1)} pts so far`) : null);
    }

    function centerArea() {
      const g = game;
      const slot = p => { const t = g.trick.find(x => x.player === p); return t ? cardEl(t.card, { cls: g.trickComplete && S.tuteWinner(g.trick[0].card, g.trick[1].card, g.triumph) === (g.trick[0].player === p ? 0 : 1) ? 'winner' : '' }) : el('div', { class: 'empty-slot' }); };
      const msg = g.phase === 'done' ? '' : g.trickComplete ? '…' : g.turn === 0 ? (g.trick.length ? 'Your turn to reply.' : 'You lead.') : 'Bot is thinking…';
      return el('div', { class: 'center-area' },
        el('div', { class: 'row-piles' },
          el('div', { class: 'pile' }, el('div', { class: 'trick-pair' },
            g.stock.length ? cardEl(null, { back: true }) : el('div', { class: 'empty-slot' }),
            g.stock.length ? cardEl(g.pinta) : el('div', { class: 'empty-slot' })),
            el('div', { class: 'muted', style: 'color:#cfe' }, g.stock.length ? `Monte (${g.stock.length}) · pinta ${g.pinta.text}` : `Arrastre · triunfo ${S.SUIT_INFO[g.triumph].name}`)),
          el('div', { class: 'pile trick-pair' }, slot(1), slot(0))),
        el('div', { class: 'msg' }, msg));
    }

    function actions() {
      const g = game;
      const box = el('div', { class: 'south-actions' });
      if (g.phase === 'done') {
        const r = g.result;
        box.append(el('div', { class: 'panel', style: 'text-align:left;color:var(--ink);max-width:560px;margin:0 auto 10px' },
          el('h3', {}, r.tute ? `¡TUTE! ${r.winner === 0 ? 'You win' : 'The bot wins'} the hand` : r.winner == null ? 'Empate: nobody wins this hand' : r.winner === 0 ? '🏆 You win the hand!' : 'The bot wins the hand.'),
          r.tute ? el('p', {}, `Four ${r.rank === 12 ? 'reyes' : 'caballos'}: the hand ends at once.`) : el('table', { class: 't' },
            el('tr', {}, el('th', {}), el('th', {}, 'You'), el('th', {}, 'Bot')),
            [['Cards won', r.cardPts], ['Cantes', r.cantes], ['Diez de últimas', r.last]].map(([n, v]) => el('tr', {}, el('td', {}, n), el('td', {}, String(v[0])), el('td', {}, String(v[1])))),
            el('tr', {}, el('th', {}, 'Total'), el('th', {}, String(r.points[0])), el('th', {}, String(r.points[1])))),
          el('p', {}, `Hands won: you ${g.matches[0]} – bot ${g.matches[1]}`),
          el('button', { class: 'btn primary', onclick: () => { endLogged = false; logLines.length = 0; newHand(false); } }, 'Next hand')));
        return box;
      }
      if (g.turn !== 0 || g.trickComplete) return box;
      if (g.canTute(0)) box.append(el('button', { class: 'btn primary', onclick: tute }, '¡TUTE! (four ' + (g.canTute(0) === 12 ? 'reyes' : 'caballos') + ')'));
      g.singable(0).forEach(s => box.append(el('button', { class: 'btn primary', onclick: () => sing(s) }, `Cantar ${s === g.triumph ? 'las cuarenta' : 'las veinte'} (${suitName(s)}, ${s === g.triumph ? 40 : 20})`)));
      if (g.canSwap(0)) box.append(el('button', { class: 'btn', onclick: swap }, `Cambiar el 7 por el ${g.pinta.text}`));
      return box;
    }

    function handEl() {
      const g = game;
      const mine = g.turn === 0 && g.phase === 'play' && !g.trickComplete;
      const legal = mine ? g.legal(0).cards : null;
      return el('div', { class: 'hand flat' }, g.hands[0].map(c => {
        let cls = '';
        if (legal && settings.legal && g.arrastre && g.trick.length) cls = legal.includes(c) ? 'legal' : 'dim';
        if (hint && hint.card === c) cls += ' hint';
        return cardEl(c, { cls, onclick: mine ? (legal.includes(c) ? humanPlay : () => { log(`✘ ${c.text} is not allowed: ${S.TUTE_RULES[g.legal(0).rule]}`); render(); }) : null });
      }));
    }

    function coachPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Coach is off. Enable it below.')); return box; }
      if (g.phase !== 'play' || g.turn !== 0 || g.trickComplete) { box.append(el('p', { class: 'muted' }, 'Advice appears on your turn.')); return box; }
      const ctx = g.ctxFor(0);
      const pl = B.plan(ctx);
      box.append(el('p', {}, el('strong', {}, 'Rule: '), S.TUTE_RULES[g.legal(0).rule]));
      if (pl.acts.length) box.append(el('div', { class: 'coach-box' }, el('strong', {}, 'Before you play:'), el('ul', {}, pl.acts.map(a => el('li', {}, a)))));
      box.append(el('button', { class: 'btn small', onclick: () => { hint = B.chooseCard(ctx); render(); } }, '💡 Suggest a card'));
      if (hint) box.append(el('div', { class: 'coach-box' }, el('strong', {}, hint.card.text), ' – ', hint.reason));
      return box;
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      tableEl.append(oppPanel(), centerArea(), el('div', { class: 'actions' }, actions(),
        el('div', { class: 'seat south' }, el('div', { class: 'name' }, 'You ', game.turn === 0 && game.phase === 'play' ? el('span', { class: 'chip turn' }, 'your turn') : null,
          ...game.cantes[0].map(s => el('span', { class: 'chip' }, 'cantaste ' + (s === game.triumph ? '40' : '20') + ' ' + suitName(s)))),
          el('div', { class: 'stack' }, `${livePts(0)} pts so far (cards + cantes)`)),
        handEl()));
      sideEl.innerHTML = '';
      sideEl.append(infoPanel(), coachPanel(), settingsPanel(), logPanel());
    }

    function infoPanel() {
      return el('div', { class: 'panel' }, el('h3', {}, 'Mano'),
        el('table', {}, [['Triunfo', `${game.pinta.text} ${S.SUIT_INFO[game.triumph].name}`], ['Baza', `${Math.min(game.trickNo + 1, 20)} / 20`], ['Manos ganadas', `you ${game.matches[0]} – bot ${game.matches[1]}`]]
          .map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))));
    }

    function settingsPanel() {
      const defs = [['hints', 'Coach: hints & advice'], ['legal', 'Highlight legal cards in the arrastre'], ['explain', "Explain the bot's choices in the log"], ['count', "Show the bot's live points (training)"]];
      return el('div', { class: 'panel' }, el('h3', {}, 'Learning aids'), defs.map(([k, label]) =>
        el('label', { class: 'switch' }, el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => { settings[k] = e.target.checked; Settings.set(settings); hint = null; render(); } }), ' ' + label)));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l => el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, 'Log'), box);
    }

    newHand(true);
    return () => { alive = false; clearTimeout(timer); };
  }

  S.TuteScreens = Object.assign(S.TuteScreens || {}, { play: playScreen });
  void fmt;
})(window.Spanish = window.Spanish || {});
