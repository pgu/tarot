/* Play screen: you (South) against three bots, with optional coaching. */
(function (T) {
  'use strict';
  const { el, cardEl, fmt, contractName } = T;
  const NAMES = T.SEAT_NAMES;
  const SEAT_CLASS = ['south', 'east', 'north', 'west'];

  function playScreen(root) {
    let settings = T.Settings.get();
    const game = new T.Game({ dealer: Math.floor(Math.random() * 4) });
    const scores = [0, 0, 0, 0];
    const logLines = [];
    let timer = null;
    let alive = true;
    let selected = new Set();
    let hint = null; // {card, reason}
    let scored = false;
    let modalOpen = false;
    let dealNo = 1;

    const tableEl = el('div', { class: 'table' });
    const sideEl = el('div', { class: 'side' });
    const modalHost = el('div', {});
    root.append(el('div', { class: 'play' }, tableEl, sideEl), modalHost);

    /* ---------- helpers ---------- */
    const humanToAct = () =>
      (game.phase === 'bidding' && game.bidder === 0) ||
      ((game.phase === 'dog' || game.phase === 'discard') && game.taker === 0) ||
      (game.phase === 'play' && game.turn === 0);

    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 80) logLines.shift(); };

    function logEvent(ev) {
      const n = NAMES[ev.player];
      const why = settings.explain && ev.player !== 0 ? ev.reason : null;
      if (ev.kind === 'bid') log(`${n}: ${ev.contract ? 'bids ' + contractName(ev.contract) : 'passes'}.`, why);
      else if (ev.kind === 'dog') log(`${n} takes the dog.`);
      else if (ev.kind === 'discard') {
        const tr = ev.cards.filter(c => c.suit === 'T');
        log(`${n} discards 6 cards` + (tr.length ? ` (including trumps: ${tr.map(c => c.rank).join(', ')})` : '') + '.', why);
      } else if (ev.kind === 'play') log(`${n} plays ${ev.card.text}.`, why);
    }

    function later(ms, fn) { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); }

    /* ---------- flow ---------- */
    function advance() {
      clearTimeout(timer);
      render();
      if (!alive) return;
      if (game.phase === 'passed') return;
      if (game.phase === 'done') {
        if (!scored) {
          scored = true;
          game.result.totals.forEach((t, i) => { scores[i] += t; });
          log(`Deal over. ${NAMES[game.taker]} ${game.result.win ? 'made' : 'failed'} the contract.`);
          render();
        }
        later(900, showResult);
        return;
      }
      if (game.phase === 'play' && game.trickComplete) {
        later(1400, () => {
          const rec = game.collectTrick();
          log(`→ ${NAMES[rec.winner]} wins trick ${rec.no + 1} (${fmt(rec.points)} pts).`);
          advance();
        });
        return;
      }
      if (humanToAct()) return;
      later(game.phase === 'dog' ? 1800 : 750, () => { logEvent(game.botStep()); advance(); });
    }

    function newDeal() {
      game.dealer = (game.dealer + 1) % 4;
      game.newDeal();
      selected = new Set(); hint = null; scored = false; dealNo++;
      logLines.length = 0;
      log(`Deal ${dealNo}. ${NAMES[game.dealer]} deals; ${NAMES[(game.dealer + 1) % 4]} speaks first.`);
      modalHost.innerHTML = '';
      modalOpen = false;
      advance();
    }

    /* ---------- human actions ---------- */
    function humanBid(contract) {
      logEvent({ kind: 'bid', player: 0, contract });
      game.bid(0, contract);
      advance();
    }

    function humanPlay(card) {
      hint = null;
      game.play(0, card);
      log(`You play ${card.text}.`);
      advance();
    }

    function toggleDiscard(card) {
      if (selected.has(card.id)) selected.delete(card.id);
      else if (selected.size < 6) selected.add(card.id);
      render();
    }

    function confirmDiscard() {
      const cards = game.hands[0].filter(c => selected.has(c.id));
      game.discard(cards);
      const tr = cards.filter(c => c.suit === 'T');
      log('You discard 6 cards' + (tr.length ? ` (including trumps: ${tr.map(c => c.rank).join(', ')})` : '') + '.');
      selected = new Set();
      advance();
    }

    function suggestDiscard() {
      const r = T.Bots.chooseDiscard(game.hands[0]);
      selected = new Set(r.cards.map(c => c.id));
      hint = { reason: r.reason };
      render();
    }

    function showHint() {
      hint = game.suggest(0);
      render();
    }

    /* ---------- rendering ---------- */
    function seat(p) {
      const chips = [];
      if (game.taker === p) chips.push(el('span', { class: 'chip taker' }, 'Taker · ' + contractName(game.contract)));
      else if (game.phase === 'bidding') {
        const b = game.bids.find(x => x.player === p);
        if (b) chips.push(el('span', { class: 'chip' }, contractName(b.contract)));
      }
      const myTurn = (game.phase === 'bidding' && game.bidder === p) || (game.phase === 'play' && game.turn === p);
      if (myTurn) chips.push(el('span', { class: 'chip turn' }, 'to play'));
      const n = game.hands[p].length;
      return el('div', { class: 'seat ' + SEAT_CLASS[p] },
        el('div', { class: 'name' }, NAMES[p], ' ', chips),
        p === 0 ? null : el('div', { class: 'backs' }, [...Array(Math.min(n, p === 2 ? 12 : 7))].map(() => cardEl(null, { back: true }))),
        p === 0 ? null : el('div', { class: 'muted', style: 'color:#cfe' }, `${n} cards`));
    }

    function message() {
      const g = game;
      if (g.phase === 'bidding') return g.bidder === 0 ? 'Your turn to bid.' : `${NAMES[g.bidder]} is thinking…`;
      if (g.phase === 'passed') return 'Everybody passed. Nobody takes the contract.';
      if (g.phase === 'dog') return g.taker === 0 ? `You won the bidding with ${contractName(g.contract)}. This is the dog:` : `${NAMES[g.taker]} takes ${contractName(g.contract)}. The dog is turned over:`;
      if (g.phase === 'discard') {
        if (g.taker !== 0) return `${NAMES[g.taker]} is choosing the discards…`;
        const err = selected.size === 6 ? T.validateDiscard(g.hands[0], g.hands[0].filter(c => selected.has(c.id))) : null;
        return err || `Select 6 cards to discard (${selected.size}/6).`;
      }
      if (g.phase === 'play') {
        if (g.trickComplete) return `${NAMES[g.trick[T.trickWinnerIndex(g.trick)].player]} wins the trick.`;
        if (g.turn === 0) return g.trick.length ? 'Your turn. Follow the rules of the trick.' : 'You lead the trick.';
        return `${NAMES[g.turn]} to play…`;
      }
      return '';
    }

    function centerArea() {
      const g = game;
      const area = el('div', { class: 'center-area' });
      if (g.phase === 'dog' || (g.phase === 'discard' && g.taker !== 0)) {
        area.append(el('div', { class: 'dog-row' }, g.dog.map(c => cardEl(c))));
      } else if (g.phase === 'play' || g.phase === 'done') {
        const wi = g.trickComplete ? T.trickWinnerIndex(g.trick) : -1;
        const grid = el('div', { class: 'trick-grid' });
        for (let p = 0; p < 4; p++) {
          const idx = g.trick.findIndex(x => x.player === p);
          const slot = idx >= 0
            ? cardEl(g.trick[idx].card, { cls: 'p' + p + (idx === wi ? ' winner' : '') })
            : el('div', { class: 'empty p' + p });
          grid.append(slot);
        }
        area.append(grid);
      }
      area.append(el('div', { class: 'msg' }, message()));
      return area;
    }

    function southActions() {
      const g = game;
      const box = el('div', { class: 'south-actions' });
      if (g.phase === 'bidding' && g.bidder === 0) {
        box.append(el('button', { class: 'btn', onclick: () => humanBid(null) }, 'Pass'));
        T.CONTRACT_ORDER.forEach(k => {
          box.append(el('button', { class: 'btn primary', disabled: !g.canBid(k), onclick: () => humanBid(k) }, `${T.CONTRACTS[k].name} (×${T.CONTRACTS[k].mult})`));
        });
        if (g.highest) box.append(el('div', { class: 'muted', style: 'color:#cfe' }, `Current bid: ${contractName(g.highest.contract)} by ${NAMES[g.highest.player]}`));
      } else if (g.phase === 'dog' && g.taker === 0) {
        box.append(el('button', { class: 'btn primary', onclick: () => { g.takeDog(); log('You take the dog.'); advance(); } }, 'Take the dog into your hand'));
      } else if (g.phase === 'discard' && g.taker === 0) {
        const err = selected.size === 6 ? T.validateDiscard(g.hands[0], g.hands[0].filter(c => selected.has(c.id))) : 'x';
        box.append(el('button', { class: 'btn primary', disabled: !!err, onclick: confirmDiscard }, 'Discard these 6 cards'));
        if (settings.hints) box.append(el('button', { class: 'btn', onclick: suggestDiscard }, '💡 Suggest discards'));
      } else if (g.phase === 'passed' || g.phase === 'done') {
        box.append(el('button', { class: 'btn primary', onclick: newDeal }, g.phase === 'done' ? 'Next deal' : 'Deal again'));
      }
      return box;
    }

    function handEl() {
      const g = game;
      const hand = el('div', { class: 'hand' });
      const legal = g.phase === 'play' && g.turn === 0 ? g.legalFor(0).cards : null;
      g.hands[0].forEach(c => {
        let cls = '';
        let onclick = null;
        if (g.phase === 'discard' && g.taker === 0) {
          cls = selected.has(c.id) ? 'selected' : '';
          onclick = toggleDiscard;
        } else if (legal) {
          const ok = legal.includes(c);
          if (settings.highlight) cls = ok ? 'legal' : 'dim';
          if (hint && hint.card === c) cls += ' hint';
          onclick = ok ? humanPlay : () => { log(`✘ ${c.text} is not legal here: ${T.RULE_TEXT[g.legalFor(0).rule]}`); render(); };
        }
        hand.append(cardEl(c, { cls, onclick }));
      });
      return hand;
    }

    function coachPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Hints are off. Enable them below.')); return box; }
      if (g.phase === 'bidding' && g.bidder === 0) {
        const ev = T.Bots.evaluateHand(g.hands[0]);
        const higher = !g.highest || (ev.level && T.CONTRACTS[ev.level].level > T.CONTRACTS[g.highest.contract].level);
        box.append(el('div', { class: 'coach-box' },
          el('div', {}, 'Hand strength: ', el('strong', {}, fmt(ev.score))),
          el('div', {}, 'Suggestion: ', el('strong', {}, ev.level && higher ? contractName(ev.level) : 'Pass')),
          T.Drills.evalTable(ev)),
          el('p', { class: 'muted' }, '15+ → Petite, 22+ → Garde, 30+ → Garde Sans. A rough guide only.'));
      } else if (g.phase === 'discard' && g.taker === 0) {
        box.append(el('p', {}, 'Discard 6 cards: no kings, no oudlers, and trumps only if you have no other choice. Aim to empty your short suits.'),
          hint && hint.reason ? el('div', { class: 'coach-box' }, hint.reason) : null);
      } else if (g.phase === 'play' && g.turn === 0) {
        const info = g.legalFor(0);
        box.append(el('p', {}, el('strong', {}, 'Rule: '), T.RULE_TEXT[info.rule]),
          el('button', { class: 'btn small', onclick: showHint }, '💡 Suggest a card'),
          hint && hint.card ? el('div', { class: 'coach-box' }, el('strong', {}, hint.card.text), ' – ', hint.reason) : null);
      } else {
        box.append(el('p', { class: 'muted' }, 'Hints appear when it is your turn.'));
      }
      return box;
    }

    function infoPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, `Deal ${dealNo}`));
      const rows = [];
      if (g.contract) {
        rows.push(['Contract', `${contractName(g.contract)} by ${NAMES[g.taker]}`]);
        rows.push(['Trick', `${Math.min(g.trickNo + (g.trickComplete ? 0 : 1), 18)} / 18`]);
        if (settings.count) {
          const o = g.takerOudlersSoFar();
          rows.push(['Taker pts so far', `${fmt(g.takerPointsSoFar())}`]);
          rows.push(['Taker oudlers', `${o} → needs ${T.requiredPoints(o)}`]);
        } else {
          rows.push(['Needs', 'depends on oudlers: 56 / 51 / 41 / 36']);
        }
      } else rows.push(['Phase', 'Bidding']);
      box.append(el('table', { class: 'score-pill' }, rows.map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))));
      return box;
    }

    function settingsPanel() {
      const defs = [
        ['highlight', 'Highlight playable cards'],
        ['hints', 'Coach: hints & bid advice'],
        ['explain', "Explain bots' choices in the log"],
        ['count', 'Show live point count'],
      ];
      return el('div', { class: 'panel' }, el('h3', {}, 'Learning aids'), defs.map(([k, label]) =>
        el('label', { class: 'switch' },
          el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => {
            settings[k] = e.target.checked; T.Settings.set(settings); hint = null; render();
          } }), ' ' + label)));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l =>
        el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, 'Log'), box);
    }

    function scorePanel() {
      return el('div', { class: 'panel' }, el('h3', {}, 'Total score'),
        el('table', { class: 'score-pill' }, [0, 1, 2, 3].map(p =>
          el('tr', {}, el('td', {}, NAMES[p] + ' '), el('td', { class: scores[p] < 0 ? 'bad' : '' }, (scores[p] > 0 ? '+' : '') + scores[p])))));
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      tableEl.append(seat(2), seat(3), centerArea(), seat(1),
        el('div', { class: 'actions' }, southActions(), seat(0), handEl()));
      sideEl.innerHTML = '';
      sideEl.append(infoPanel(), coachPanel(), settingsPanel(), scorePanel(), logPanel());
    }

    function showResult() {
      if (!alive || modalOpen) return;
      const r = game.result;
      const me = r.totals[0];
      const takerName = NAMES[r.taker];
      const close = () => { modalHost.innerHTML = ''; modalOpen = false; };
      const formula = `(25 + ${r.gap})${r.petit ? (r.petit > 0 ? ' + 10' : ' − 10') + ' (Petit au bout)' : ''}`;
      modalOpen = true;
      modalHost.append(el('div', { class: 'modal-back' }, el('div', { class: 'modal' },
        el('h2', {}, r.win ? `${takerName === 'You' ? 'You make' : takerName + ' makes'} the contract!` : `${takerName === 'You' ? 'You fail' : takerName + ' fails'} the contract.`),
        el('table', { class: 't' },
          el('tr', {}, el('th', {}, 'Contract'), el('td', {}, `${contractName(r.contract)} (×${r.mult})`)),
          el('tr', {}, el('th', {}, 'Taker\'s oudlers'), el('td', {}, `${r.oudlers} → needs ${r.required} points`)),
          el('tr', {}, el('th', {}, 'Taker\'s points'), el('td', {}, `${fmt(r.takerPoints)} (defenders ${fmt(r.defPoints)})`)),
          el('tr', {}, el('th', {}, 'Difference'), el('td', {}, `${r.diff >= 0 ? '+' : ''}${fmt(r.diff)} → rounded ${r.gap}`)),
          el('tr', {}, el('th', {}, 'Score'), el('td', {}, `${r.win ? '' : '−'}${formula} × ${r.mult} = ${r.perDefender >= 0 ? '+' : ''}${r.perDefender}`))),
        el('p', {}, `The taker gets ${fmt(r.perDefender * 3)}, each defender gets ${fmt(-r.perDefender)}. `,
          el('strong', {}, `Your result: ${me > 0 ? '+' : ''}${me}`)),
        el('div', { class: 'btn-row' },
          el('button', { class: 'btn primary', onclick: newDeal }, 'Next deal'),
          el('button', { class: 'btn', onclick: close }, 'Review the table'),
          el('a', { class: 'btn', href: '#/' }, 'Home')))));
    }

    log(`Deal 1. ${NAMES[game.dealer]} deals; ${NAMES[(game.dealer + 1) % 4]} speaks first.`);
    advance();

    return () => { alive = false; clearTimeout(timer); };
  }

  T.Screens = Object.assign(T.Screens || {}, { play: playScreen });
})(window.Tarot = window.Tarot || {});
