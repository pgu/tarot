/* Poker Play screen: you (South) vs 3 bots at a no-limit Hold'em table. */
(function (P) {
  'use strict';
  const { el, cardEl, money } = P;
  const SEAT_CLASS = ['south', 'west', 'north', 'east'];
  const pct = P.Bots.pct;

  function playScreen(root) {
    const settings = P.Settings.get();
    let table;
    const logLines = [];
    let timer = null;
    let alive = true;
    let raiseTo = 0;
    let coachCache = null;
    let loggedResult = false;

    const tableEl = el('div', { class: 'table poker' });
    const sideEl = el('div', { class: 'side' });
    root.append(el('div', { class: 'play' }, tableEl, sideEl));

    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 120) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const nm = i => table.players[i].name;
    const roundTo = (x, u) => Math.round(x / u) * u;
    const winVerb = ids => (ids.length === 1 && ids[0] !== 0 ? 'wins' : 'win');

    function newGame() {
      table = new P.Table({ names: ['You', 'Ada', 'Bruno', 'Chloé'], chips: 1000, sb: 10, bb: 20 });
      table.players.forEach((p, i) => { p.style = P.STYLES[i]; });
      logLines.length = 0;
      nextHand();
    }

    function nextHand() {
      loggedResult = false; coachCache = null; raiseTo = 0;
      if (!table.startHand()) { render(); return; }
      log(`— Hand ${table.handNo} — button: ${nm(table.button)}; blinds: ${nm(table.sbSeat)} ${money(table.sb)}, ${nm(table.bbSeat)} ${money(table.bb)}.`);
      advance();
    }

    /* ---------- flow ---------- */
    function advance() {
      clearTimeout(timer);
      render();
      if (!alive) return;
      if (table.phase === 'done') {
        if (!loggedResult) { loggedResult = true; logResult(); render(); }
        return;
      }
      if (table.pendingRunout) {
        later(1300, () => { const n = table.board.length; table.runoutStep(); logBoard(n); advance(); });
        return;
      }
      if (table.toAct === 0) return;
      const human = table.players[0];
      later(human.folded || human.allIn ? 450 : 950, () => {
        const i = table.toAct;
        const d = P.Bots.decide(table, i, { iters: 300 });
        doAct(i, d, settings.explain ? d.reason : null);
      });
    }

    function actionText(i, a) {
      const lg = table.legal(i);
      const p = table.players[i];
      if (a.type === 'fold') return 'folds';
      if (a.type === 'check') return 'checks';
      if (a.type === 'call') return `calls ${money(lg.callAmount)}` + (lg.callAmount >= p.chips ? ' (all-in)' : '');
      const to = Math.min(a.to, lg.maxRaiseTo);
      return (table.currentBet === 0 ? 'bets ' : 'raises to ') + money(to) + (to >= lg.maxRaiseTo ? ' (all-in)' : '');
    }

    function doAct(i, a, why) {
      const txt = i === 0 ? actionText(i, a).replace(/^(\w+?)s\b/, '$1') : actionText(i, a);
      const before = table.board.length;
      log(`${nm(i)} ${txt}.`, why);
      table.act(i, a);
      logBoard(before);
      raiseTo = 0; coachCache = null;
      advance();
    }

    function logBoard(before) {
      if (table.board.length > before) {
        const names = { 3: 'Flop', 4: 'Turn', 5: 'River' };
        log(`${names[table.board.length]}: ${table.board.slice(before).map(c => c.text).join(' ')}`);
      }
    }

    function logResult() {
      const r = table.result;
      if (r.uncontested) {
        log(`${nm(r.pots[0].winners[0])} ${winVerb(r.pots[0].winners)} ${money(r.pots[0].amount)} (everyone else folded).`);
        return;
      }
      r.pots.forEach((pot, k) => {
        const who = pot.winners.map(nm).join(' & ');
        const hand = r.hands[pot.winners[0]].name;
        log(`${r.pots.length > 1 ? (k === 0 ? 'Main pot' : 'Side pot ' + k) + ': ' : ''}${who} ${winVerb(pot.winners)} ${money(pot.amount)}${pot.winners.length > 1 ? ' (split)' : ''} with ${hand}.`);
      });
    }

    /* ---------- coach ---------- */
    function coach() {
      const t = table;
      const key = [t.handNo, t.phase, t.board.length, t.currentBet, t.players[0].chips, t.remaining().length].join('-');
      if (coachCache && coachCache.key === key) return coachCache.data;
      const me = t.players[0];
      const opps = t.remaining().length - 1;
      const desc = P.Bots.describe(me.hole, t.board);
      const eq = P.equity(me.hole, t.board, opps, 1200);
      const lg = t.legal(0);
      const d = P.Bots.decide(t, 0, { deterministic: true, iters: 1200 });
      const data = { desc, eq, opps, lg, d, potOdds: lg.toCall > 0 ? lg.toCall / (t.pot + lg.toCall) : 0 };
      coachCache = { key, data };
      return data;
    }

    function coachPanel() {
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Coach is off. Enable it below.')); return box; }
      if (table.toAct !== 0) { box.append(el('p', { class: 'muted' }, 'The analysis appears when it is your turn.')); return box; }
      const c = coach();
      const rows = [
        ['Your hand', c.desc.text],
        ['Win chance', `≈ ${pct(c.eq.equity)} against ${c.opps} random hand${c.opps > 1 ? 's' : ''}`],
      ];
      if (c.lg.toCall > 0) rows.push(['Pot odds', `Call ${money(c.lg.callAmount)} to win ${money(table.pot + c.lg.callAmount)}: you need ${pct(c.potOdds)}`]);
      const sug = c.d.type === 'raise' ? `${table.currentBet === 0 ? 'Bet' : 'Raise'} to ${money(c.d.to)}` : c.d.type[0].toUpperCase() + c.d.type.slice(1);
      box.append(el('table', {}, rows.map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))),
        el('div', { class: 'coach-box' }, el('strong', {}, 'Suggestion: ' + sug), el('div', {}, c.d.reason)));
      if (c.desc.chen) {
        box.append(el('details', {}, el('summary', {}, 'How is the Chen score computed?'),
          el('ul', {}, c.desc.chen.steps.map(s => el('li', {}, `${s[0]}: ${s[1] >= 0 ? '+' : ''}${s[1]}`)))));
      }
      return box;
    }

    /* ---------- rendering ---------- */
    function seat(i) {
      const p = table.players[i];
      const t = table;
      const isOut = !p.inHand;
      const chips = [];
      if (t.button === i) chips.push(el('span', { class: 'chip taker' }, 'D'));
      if (p.inHand && t.sbSeat === i) chips.push(el('span', { class: 'chip' }, 'SB'));
      if (p.inHand && t.bbSeat === i) chips.push(el('span', { class: 'chip' }, 'BB'));
      if (t.toAct === i) chips.push(el('span', { class: 'chip turn' }, 'to act'));
      if (p.allIn && !p.folded && p.inHand) chips.push(el('span', { class: 'chip' }, 'all-in'));
      const done = t.phase === 'done';
      const reveal = p.inHand && !p.folded && (i === 0 || settings.showAll || (done && t.result && !t.result.uncontested));
      const winners = done && t.result ? new Set(t.result.pots.flatMap(x => x.winners)) : new Set();
      let cards;
      if (isOut) cards = el('div', { class: 'muted', style: 'color:#cfe' }, p.chips === 0 && t.handNo > 0 ? 'Out of chips' : '');
      else if (p.folded) cards = el('div', { style: 'color:#cfe' }, 'Folded');
      else cards = el('div', { class: 'pcards' + (i === 0 ? ' mine' : '') + (winners.has(i) ? ' won' : '') },
        reveal ? P.sortHand(p.hole).map(c => cardEl(c)) : [cardEl(null, { back: true }), cardEl(null, { back: true })]);
      const hn = done && t.result && !t.result.uncontested && t.result.hands[i] ? t.result.hands[i].name : null;
      return el('div', { class: 'seat ' + SEAT_CLASS[i] + (p.folded ? ' folded' : '') },
        el('div', { class: 'name' }, p.name, ' ', chips),
        el('div', { class: 'stack' }, money(p.chips)),
        cards,
        hn ? el('div', { class: 'handname' }, hn) : null,
        p.bet > 0 ? el('div', { class: 'bet' }, 'bet ' + money(p.bet)) : null);
    }

    function message() {
      const t = table;
      if (t.phase === 'gameover') return 'Game over.';
      if (t.phase === 'done') {
        const r = t.result;
        const w = r.pots[0].winners;
        return r.uncontested ? `${nm(w[0])} ${winVerb(w)} ${money(r.pots[0].amount)}: everyone else folded.`
          : r.pots.length === 1 ? `${w.map(nm).join(' & ')} ${winVerb(w)} ${money(r.pots[0].amount)} with ${r.hands[w[0]].name}.`
            : 'Showdown. See the log for the pots.';
      }
      if (t.pendingRunout) return 'Everybody is all-in: dealing the rest…';
      if (t.toAct === 0) return 'Your turn.';
      return `${nm(t.toAct)} is thinking…`;
    }

    function center() {
      const t = table;
      const slots = [0, 1, 2, 3, 4].map(k => t.board[k] ? cardEl(t.board[k]) : el('div', { class: 'empty', style: 'width:var(--cw);height:calc(var(--cw)*1.55);border:2px dashed rgba(255,255,255,.18);border-radius:7px' }));
      return el('div', { class: 'center-area' },
        el('div', { class: 'pot' }, 'Pot ', el('strong', {}, money(t.pot))),
        el('div', { class: 'board' }, slots),
        el('div', { class: 'msg' }, message()));
    }

    function controls() {
      const t = table;
      const box = el('div', { class: 'south-actions' });
      if (t.phase === 'done' || t.phase === 'gameover') {
        const me = t.players[0];
        if (me.chips === 0) box.append(el('div', {}, 'You are out of chips. '), el('button', { class: 'btn primary', onclick: newGame }, 'New game'));
        else if (t.activeCount() < 2) box.append(el('div', {}, '🏆 You busted everybody! '), el('button', { class: 'btn primary', onclick: newGame }, 'New game'));
        else box.append(el('button', { class: 'btn primary', onclick: nextHand }, 'Next hand'));
        return box;
      }
      if (t.toAct !== 0) return box;
      const lg = t.legal(0);
      const me = t.players[0];
      if (lg.toCall > 0) box.append(el('button', { class: 'btn', onclick: () => doAct(0, { type: 'fold' }) }, 'Fold'));
      box.append(lg.canCheck
        ? el('button', { class: 'btn primary', onclick: () => doAct(0, { type: 'check' }) }, 'Check')
        : el('button', { class: 'btn primary', onclick: () => doAct(0, { type: 'call' }) }, `Call ${money(lg.callAmount)}` + (lg.callAmount >= me.chips ? ' (all-in)' : '')));
      if (lg.canRaise) {
        if (!raiseTo) raiseTo = lg.minRaiseTo;
        const clamp = x => Math.max(lg.minRaiseTo, Math.min(lg.maxRaiseTo, roundTo(x, t.sb)));
        const verb = t.currentBet === 0 ? 'Bet' : 'Raise to';
        const btn = el('button', { class: 'btn primary', onclick: () => doAct(0, { type: 'raise', to: raiseTo }) });
        const slider = el('input', { type: 'range', min: lg.minRaiseTo, max: lg.maxRaiseTo, step: 1, value: raiseTo });
        const upd = () => { btn.textContent = raiseTo >= lg.maxRaiseTo ? `All-in ${money(raiseTo)}` : `${verb} ${money(raiseTo)}`; slider.value = raiseTo; };
        const set = x => { raiseTo = x >= lg.maxRaiseTo ? lg.maxRaiseTo : clamp(x); upd(); };
        slider.addEventListener('input', () => set(+slider.value));
        const potRaise = f => t.currentBet + (t.pot + lg.toCall) * f;
        upd();
        box.append(el('div', { class: 'raise-box' },
          slider,
          el('div', {}, [['Min', lg.minRaiseTo], ['½ pot', potRaise(0.5)], ['¾ pot', potRaise(0.75)], ['Pot', potRaise(1)], ['All-in', lg.maxRaiseTo]]
            .map(([l, v]) => el('button', { class: 'btn small', onclick: () => set(v) }, l))), btn));
      }
      return box;
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      tableEl.append(seat(2), seat(1), center(), seat(3),
        el('div', { class: 'actions' }, controls(), seat(0)));
      sideEl.innerHTML = '';
      sideEl.append(infoPanel(), coachPanel(), settingsPanel(), stacksPanel(), logPanel());
    }

    function infoPanel() {
      const t = table;
      return el('div', { class: 'panel' }, el('h3', {}, `Hand ${t.handNo}`),
        el('table', {}, [
          ['Blinds', `${money(t.sb)} / ${money(t.bb)}`],
          ['Round', t.phase === 'done' ? 'showdown' : t.phase],
          ['Pot', money(t.pot)],
          ['To call', t.toAct === 0 ? money(t.legal(0).callAmount) : '–'],
        ].map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))));
    }

    function settingsPanel() {
      const defs = [['hints', 'Coach: odds & suggestions'], ['explain', "Explain bots' choices in the log"], ['showAll', "Show opponents' cards (training)"]];
      return el('div', { class: 'panel' }, el('h3', {}, 'Learning aids'), defs.map(([k, label]) =>
        el('label', { class: 'switch' }, el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => {
          settings[k] = e.target.checked; P.Settings.set(settings); coachCache = null; render();
        } }), ' ' + label)));
    }

    function stacksPanel() {
      return el('div', { class: 'panel' }, el('h3', {}, 'Chips'),
        el('table', {}, table.players.map(p => el('tr', {}, el('td', {}, p.name + ' '), el('td', { class: p.chips > table.startChips ? 'ok' : p.chips < table.startChips ? 'bad' : '' }, money(p.chips))))));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l => el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, 'Log'), box);
    }

    newGame();
    return () => { alive = false; clearTimeout(timer); };
  }

  P.Screens = Object.assign(P.Screens || {}, { play: playScreen });
})(window.Poker = window.Poker || {});
