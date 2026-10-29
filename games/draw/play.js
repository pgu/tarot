/* Five-card draw Play screen: you (South) vs 3 bots. */
(function (P) {
  'use strict';
  const { el, cardEl, money } = P;
  const D = P.DrawBots;
  const SEAT_CLASS = ['south', 'west', 'north', 'east'];
  const pct = P.Bots.pct;

  const Settings = {
    defaults: { hints: true, explain: true, showAll: false },
    get() {
      try { return Object.assign({}, this.defaults, JSON.parse(localStorage.getItem('draw.settings') || '{}')); }
      catch (e) { return Object.assign({}, this.defaults); }
    },
    set(s) { try { localStorage.setItem('draw.settings', JSON.stringify(s)); } catch (e) { /* ignore */ } },
  };

  function playScreen(root) {
    const settings = Settings.get();
    let table;
    const logLines = [];
    let timer = null;
    let alive = true;
    let raiseTo = 0;
    let coachCache = null;
    let loggedResult = false;
    let discards = new Set();

    const tableEl = el('div', { class: 'table poker' });
    const sideEl = el('div', { class: 'side' });
    root.append(el('div', { class: 'play' }, tableEl, sideEl));

    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 120) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const nm = i => table.players[i].name;
    const roundTo = (x, u) => Math.round(x / u) * u;
    const winVerb = ids => (ids.length === 1 && ids[0] !== 0 ? 'wins' : 'win');

    function newGame() {
      table = new P.DrawTable({ names: ['You', 'Ada', 'Bruno', 'Chloé'], chips: 1000, sb: 10, bb: 20 });
      table.players.forEach((p, i) => { p.style = P.STYLES[i]; });
      logLines.length = 0;
      nextHand();
    }

    function nextHand() {
      loggedResult = false; coachCache = null; raiseTo = 0; discards = new Set();
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
      if (table.toAct === 0) return;
      const human = table.players[0];
      later(human.folded ? 450 : 950, () => {
        const i = table.toAct;
        if (table.phase === 'draw') {
          const c = D.chooseDiscards(table.players[i].hole);
          table.drawCards(i, c.discard);
          log(c.discard.length ? `${nm(i)} draws ${c.discard.length} card${c.discard.length > 1 ? 's' : ''}.` : `${nm(i)} stands pat (keeps all 5 cards).`, settings.explain ? c.reason : null);
          coachCache = null;
          advance();
          return;
        }
        const d = D.decide(table, i, { iters: 300 });
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
      log(`${nm(i)} ${txt}.`, why);
      table.act(i, a);
      raiseTo = 0; coachCache = null;
      advance();
    }

    function humanDraw() {
      const idx = [...discards];
      table.drawCards(0, idx);
      log(idx.length ? `You draw ${idx.length} card${idx.length > 1 ? 's' : ''}.` : 'You stand pat.');
      discards = new Set(); coachCache = null;
      advance();
    }

    function logResult() {
      const r = table.result;
      if (r.uncontested) { log(`${nm(r.pots[0].winners[0])} ${winVerb(r.pots[0].winners)} ${money(r.pots[0].amount)} (everyone else folded).`); return; }
      r.pots.forEach((pot, k) => {
        log(`${r.pots.length > 1 ? (k === 0 ? 'Main pot' : 'Side pot ' + k) + ': ' : ''}${pot.winners.map(nm).join(' & ')} ${winVerb(pot.winners)} ${money(pot.amount)}${pot.winners.length > 1 ? ' (split)' : ''} with ${r.hands[pot.winners[0]].name}.`);
      });
    }

    /* ---------- coach ---------- */
    function coachPanel() {
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Coach is off. Enable it below.')); return box; }
      if (table.toAct !== 0) { box.append(el('p', { class: 'muted' }, 'The analysis appears when it is your turn.')); return box; }
      const t = table;
      const me = t.players[0];
      const key = [t.handNo, t.phase, t.currentBet, me.chips, t.remaining().length].join('-');
      if (!coachCache || coachCache.key !== key) {
        const best = P.bestHand(me.hole);
        const data = { best };
        if (t.phase === 'draw') {
          data.disc = D.chooseDiscards(me.hole);
          data.odds = D.drawOdds(me.hole, data.disc.keep, 3000);
        } else {
          const opps = t.remaining().length - 1;
          data.opps = opps;
          data.d = D.decide(t, 0, { deterministic: true, iters: 1000, coach: true });
          data.lg = t.legal(0);
        }
        coachCache = { key, data };
      }
      const c = coachCache.data;
      if (t.phase === 'draw') {
        const rows = c.odds.map((p, cat) => [P.CATEGORIES[cat], p]).filter(r => r[1] >= 0.01).reverse();
        const pat = Object.entries(t.drawn).map(([id, n]) => `${nm(+id)} drew ${n}`).join(', ');
        box.append(el('p', {}, 'Your hand: ', el('strong', {}, c.best.name)),
          pat ? el('p', { class: 'muted' }, 'So far: ' + pat) : null,
          el('div', { class: 'coach-box' }, el('strong', {}, c.disc.discard.length ? `Swap ${c.disc.discard.length}` : 'Stand pat'), el('div', {}, c.disc.reason)),
          c.disc.discard.length ? el('details', { open: true }, el('summary', {}, 'What you will probably end up with'),
            el('table', { class: 'score-pill' }, rows.map(r => el('tr', {}, el('td', {}, r[0] + ' '), el('td', {}, pct(r[1])))))) : null);
        return box;
      }
      const rows = [['Your hand', c.best.name], ['Win chance', `≈ ${pct(c.d.info.equity != null ? c.d.info.equity : 0)} against ${c.opps} random hand${c.opps > 1 ? 's' : ''}`]];
      if (t.phase === 'predraw') { rows.pop(); rows.push(['Strength', c.d.info.tier ? c.d.info.tier.label : '']); }
      if (c.lg.toCall > 0) rows.push(['Pot odds', `Call ${money(c.lg.callAmount)} to win ${money(t.pot + c.lg.callAmount)}: need ${pct(c.d.info.potOdds)}`]);
      if (t.phase === 'postdraw') {
        const pats = t.remaining().filter(q => q.id !== 0 && t.drawn[q.id] === 0).map(q => q.name);
        if (pats.length) rows.push(['Careful', `${pats.join(', ')} stood pat: likely a made hand`]);
      }
      const sug = c.d.type === 'raise' ? `${t.currentBet === 0 ? 'Bet' : 'Raise'} to ${money(c.d.to)}` : c.d.type[0].toUpperCase() + c.d.type.slice(1);
      box.append(el('table', {}, rows.map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))),
        el('div', { class: 'coach-box' }, el('strong', {}, 'Suggestion: ' + sug), el('div', {}, c.d.reason)));
      return box;
    }

    /* ---------- rendering ---------- */
    function seat(i) {
      const p = table.players[i];
      const t = table;
      const chips = [];
      if (t.button === i) chips.push(el('span', { class: 'chip taker' }, 'D'));
      if (p.inHand && t.sbSeat === i) chips.push(el('span', { class: 'chip' }, 'SB'));
      if (p.inHand && t.bbSeat === i) chips.push(el('span', { class: 'chip' }, 'BB'));
      if (t.toAct === i) chips.push(el('span', { class: 'chip turn' }, t.phase === 'draw' ? 'to draw' : 'to act'));
      if (p.allIn && !p.folded && p.inHand) chips.push(el('span', { class: 'chip' }, 'all-in'));
      if (p.inHand && !p.folded && t.drawn[i] != null) chips.push(el('span', { class: 'chip' }, t.drawn[i] === 0 ? 'stood pat' : `drew ${t.drawn[i]}`));
      const done = t.phase === 'done';
      const reveal = p.inHand && !p.folded && (i === 0 || settings.showAll || (done && t.result && !t.result.uncontested));
      const winners = done && t.result ? new Set(t.result.pots.flatMap(x => x.winners)) : new Set();
      let cards;
      if (!p.inHand) cards = el('div', { style: 'color:#cfe' }, p.chips === 0 && t.handNo > 0 ? 'Out of chips' : '');
      else if (p.folded) cards = el('div', { style: 'color:#cfe' }, 'Folded');
      else {
        const selecting = i === 0 && t.phase === 'draw' && t.toAct === 0;
        cards = el('div', { class: 'pcards five' + (i === 0 ? ' mine' : '') + (winners.has(i) ? ' won' : '') },
          reveal ? p.hole.map((c, k) => cardEl(c, {
            cls: selecting && discards.has(k) ? 'selected' : '',
            onclick: selecting ? () => {
              if (discards.has(k)) discards.delete(k); else if (discards.size < P.DrawTable.MAX_DRAW) discards.add(k);
              render();
            } : null,
          })) : p.hole.map(() => cardEl(null, { back: true })));
      }
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
        const r = t.result; const w = r.pots[0].winners;
        return r.uncontested ? `${nm(w[0])} ${winVerb(w)} ${money(r.pots[0].amount)}: everyone else folded.`
          : r.pots.length === 1 ? `${w.map(nm).join(' & ')} ${winVerb(w)} ${money(r.pots[0].amount)} with ${r.hands[w[0]].name}.` : 'Showdown. See the log for the pots.';
      }
      if (t.phase === 'draw') return t.toAct === 0 ? `Click the cards to swap (max ${P.DrawTable.MAX_DRAW}), then draw.` : `${nm(t.toAct)} is drawing…`;
      if (t.toAct === 0) return 'Your turn.';
      return `${nm(t.toAct)} is thinking…`;
    }

    function center() {
      const t = table;
      const names = { predraw: 'Before the draw', draw: 'The draw', postdraw: 'After the draw', done: 'Showdown' };
      return el('div', { class: 'center-area' },
        el('div', { class: 'pot' }, 'Pot ', el('strong', {}, money(t.pot))),
        el('div', { class: 'muted', style: 'color:#cfe' }, names[t.phase] || ''),
        el('div', { class: 'msg' }, message()));
    }

    function controls() {
      const t = table;
      const box = el('div', { class: 'south-actions' });
      if (t.phase === 'done' || t.phase === 'gameover') {
        if (t.players[0].chips === 0) box.append(el('div', {}, 'You are out of chips. '), el('button', { class: 'btn primary', onclick: newGame }, 'New game'));
        else if (t.activeCount() < 2) box.append(el('div', {}, '🏆 You busted everybody! '), el('button', { class: 'btn primary', onclick: newGame }, 'New game'));
        else box.append(el('button', { class: 'btn primary', onclick: nextHand }, 'Next hand'));
        return box;
      }
      if (t.toAct !== 0) return box;
      if (t.phase === 'draw') {
        const n = discards.size;
        box.append(el('button', { class: 'btn primary', onclick: humanDraw }, n ? `Draw ${n} card${n > 1 ? 's' : ''}` : 'Stand pat (keep all)'));
        if (settings.hints) box.append(el('button', { class: 'btn', onclick: () => { discards = new Set(D.chooseDiscards(t.players[0].hole).discard); render(); } }, '💡 Select the coach\'s swaps'));
        return box;
      }
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
        box.append(el('div', { class: 'raise-box' }, slider,
          el('div', {}, [['Min', lg.minRaiseTo], ['½ pot', potRaise(0.5)], ['Pot', potRaise(1)], ['All-in', lg.maxRaiseTo]]
            .map(([l, v]) => el('button', { class: 'btn small', onclick: () => set(v) }, l))), btn));
      }
      return box;
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      tableEl.append(seat(2), seat(1), center(), seat(3), el('div', { class: 'actions' }, controls(), seat(0)));
      sideEl.innerHTML = '';
      sideEl.append(infoPanel(), coachPanel(), settingsPanel(), stacksPanel(), logPanel());
    }

    function infoPanel() {
      const t = table;
      return el('div', { class: 'panel' }, el('h3', {}, `Hand ${t.handNo}`),
        el('table', {}, [['Blinds', `${money(t.sb)} / ${money(t.bb)}`], ['Pot', money(t.pot)], ['To call', t.toAct === 0 && t.phase !== 'draw' ? money(t.legal(0).callAmount) : '–']]
          .map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))));
    }

    function settingsPanel() {
      const defs = [['hints', 'Coach: advice & odds'], ['explain', "Explain bots' choices in the log"], ['showAll', "Show opponents' cards (training)"]];
      return el('div', { class: 'panel' }, el('h3', {}, 'Learning aids'), defs.map(([k, label]) =>
        el('label', { class: 'switch' }, el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => {
          settings[k] = e.target.checked; Settings.set(settings); coachCache = null; render();
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

  P.DrawScreens = Object.assign(P.DrawScreens || {}, { play: playScreen });
})(window.Poker = window.Poker || {});
