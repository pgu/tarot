/* La Brisca Play screen: you vs a bot. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const Settings = S.makeSettings('brisca.settings', { hints: true, explain: true, count: false });
  const names = ['You', 'Bot'];

  function playScreen(root) {
    const settings = Settings.get();
    let game = new S.Brisca({ names });
    let hint = null;
    let timer = null;
    let alive = true;
    let endLogged = false;
    const logLines = [];

    const tableEl = el('div', { class: 'table tute' });
    const sideEl = el('div', { class: 'side' });
    root.append(el('div', { class: 'play' }, tableEl, sideEl));

    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 120) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const livePts = p => S.tuteSum(game.piles[p]);

    function newHand(first) {
      if (!first) game.nextHand();
      hint = null; endLogged = false;
      log(`— Hand ${game.matches[0] + game.matches[1] + 1} — Triunfo: ${game.pinta.text} (${S.SUIT_INFO[game.triumph].name}). ${names[game.leader]} lead${game.leader === 0 ? '' : 's'}.`);
      advance();
    }

    function advance() {
      clearTimeout(timer);
      render();
      if (!alive) return;
      if (game.phase === 'done') { if (!endLogged) { endLogged = true; const r = game.result; log(`Hand over: you ${r.points[0]}, bot ${r.points[1]}.`); render(); } return; }
      if (game.trickComplete) {
        later(1400, () => { const rec = game.collectTrick(); log(`→ ${names[rec.winner]} win${rec.winner === 0 ? '' : 's'} the trick (${rec.points} pts).`); advance(); });
        return;
      }
      if (game.turn === 1) {
        later(1000, () => {
          const pick = S.TuteBots.chooseCard(game.ctxFor(1));
          game.play(1, pick.card);
          log(`Bot plays ${pick.card.text}.`, settings.explain ? pick.reason : null);
          advance();
        });
      }
    }

    function humanPlay(card) { hint = null; game.play(0, card); log(`You play ${card.text}.`); advance(); }

    function oppPanel() {
      return el('div', { class: 'seat north' }, el('div', { class: 'name' }, 'Bot ', game.turn === 1 ? el('span', { class: 'chip turn' }, 'turn') : null),
        el('div', { class: 'backs' }, game.hands[1].map(() => cardEl(null, { back: true }))),
        settings.count ? el('div', { class: 'stack' }, `${livePts(1)} pts so far`) : null);
    }

    function centerArea() {
      const g = game;
      const slot = p => {
        const t = g.trick.find(x => x.player === p);
        const win = g.trickComplete && S.tuteWinner(g.trick[0].card, g.trick[1].card, g.triumph) === (g.trick[0].player === p ? 0 : 1);
        return t ? cardEl(t.card, { cls: win ? 'winner' : '' }) : el('div', { class: 'empty-slot' });
      };
      const msg = g.phase === 'done' ? '' : g.trickComplete ? '…' : g.turn === 0 ? (g.trick.length ? 'Your turn to reply.' : 'You lead.') : 'Bot is thinking…';
      return el('div', { class: 'center-area' },
        el('div', { class: 'row-piles' },
          el('div', { class: 'pile' }, el('div', { class: 'trick-pair' },
            g.stock.length ? cardEl(null, { back: true }) : el('div', { class: 'empty-slot' }),
            g.stock.length ? cardEl(g.pinta) : el('div', { class: 'empty-slot' })),
          el('div', { class: 'muted', style: 'color:#cfe' }, g.stock.length ? `Monte (${g.stock.length}) · pinta ${g.pinta.text}` : `Monte vacío · triunfo ${S.SUIT_INFO[g.triumph].name}`)),
          el('div', { class: 'pile trick-pair' }, slot(1), slot(0))),
        el('div', { class: 'msg' }, msg));
    }

    function actions() {
      const g = game;
      const box = el('div', { class: 'south-actions' });
      if (g.phase !== 'done') return box;
      const r = g.result;
      box.append(el('div', { class: 'panel', style: 'text-align:left;color:var(--ink);max-width:520px;margin:0 auto 10px' },
        el('h3', {}, r.winner == null ? 'Empate: 60–60' : r.winner === 0 ? '🏆 You win the hand!' : 'The bot wins the hand.'),
        el('p', {}, `You: ${r.points[0]} points · Bot: ${r.points[1]} points (more than 60 wins).`),
        el('p', {}, `Hands won: you ${g.matches[0]} – bot ${g.matches[1]}`),
        el('button', { class: 'btn primary', onclick: () => { logLines.length = 0; newHand(false); } }, 'Next hand')));
      return box;
    }

    function handEl() {
      const g = game;
      const mine = g.turn === 0 && g.phase === 'play' && !g.trickComplete;
      return el('div', { class: 'hand flat' }, g.hands[0].map(c =>
        cardEl(c, { cls: hint && hint.card === c ? 'hint' : '', onclick: mine ? humanPlay : null })));
    }

    function coachPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Coach is off. Enable it below.')); return box; }
      if (g.phase !== 'play' || g.turn !== 0 || g.trickComplete) { box.append(el('p', { class: 'muted' }, 'Advice appears on your turn.')); return box; }
      box.append(el('p', {}, 'No obligations: you may play any card.'),
        el('button', { class: 'btn small', onclick: () => { hint = S.TuteBots.chooseCard(g.ctxFor(0)); render(); } }, '💡 Suggest a card'));
      if (hint) box.append(el('div', { class: 'coach-box' }, el('strong', {}, hint.card.text), ' – ', hint.reason));
      return box;
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      tableEl.append(oppPanel(), centerArea(), el('div', { class: 'actions' }, actions(),
        el('div', { class: 'seat south' }, el('div', { class: 'name' }, 'You ', game.turn === 0 && game.phase === 'play' ? el('span', { class: 'chip turn' }, 'your turn') : null),
          el('div', { class: 'stack' }, `${livePts(0)} pts so far`)),
        handEl()));
      sideEl.innerHTML = '';
      sideEl.append(infoPanel(), coachPanel(), settingsPanel(), logPanel());
    }

    function infoPanel() {
      return el('div', { class: 'panel' }, el('h3', {}, 'Mano'),
        el('table', {}, [['Triunfo', `${game.pinta.text} ${S.SUIT_INFO[game.triumph].name}`], ['Baza', `${Math.min(game.trickNo + 1, 20)} / 20`], ['Hands won', `you ${game.matches[0]} – bot ${game.matches[1]}`]]
          .map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))));
    }

    function settingsPanel() {
      const defs = [['hints', 'Coach: hints & advice'], ['explain', "Explain the bot's choices in the log"], ['count', "Show the bot's live points (training)"]];
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

  S.BriscaScreens = Object.assign(S.BriscaScreens || {}, { play: playScreen });
})(window.Spanish = window.Spanish || {});
