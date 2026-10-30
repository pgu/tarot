/* La Podrida Play screen: you vs 2-4 bots. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const B = S.PodridaBots;
  const Settings = S.makeSettings('podrida.settings', { hints: true, explain: true, legal: true, players: 4, maxCards: 5 });

  function playScreen(root) {
    const settings = Settings.get();
    let game;
    let timer = null;
    let alive = true;
    let endLogged = false;
    const logLines = [];

    const tableEl = el('div', { class: 'table podrida' });
    const sideEl = el('div', { class: 'side' });
    root.append(el('div', { class: 'play' }, tableEl, sideEl));

    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 200) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const nm = i => game.names[i];

    function newGame() { game = new S.Podrida({ players: settings.players, maxCards: settings.maxCards }); logLines.length = 0; startRound(); }
    function startRound() {
      endLogged = false;
      log(`— Round ${game.roundIdx + 1}/${game.rounds.length}: ${game.cards} card${game.cards > 1 ? 's' : ''}, triumph ${game.triumphCard.text} (${S.SUIT_INFO[game.triumph].name}). Dealer: ${nm(game.dealer)}. —`);
      advance();
    }

    function advance() {
      clearTimeout(timer);
      render();
      if (!alive) return;
      if (game.phase === 'roundover' || game.phase === 'gameover') {
        if (!endLogged) { endLogged = true; log('Round over: ' + game.names.map((n, i) => `${n} ${game.points[i] >= 0 ? '+' : ''}${game.points[i]}`).join(', ') + '.'); render(); }
        return;
      }
      if (game.phase === 'bidding') {
        if (game.bidder === 0) return;
        later(800, () => { const p = game.bidder; const b = B.chooseBid(game, p); game.bid(p, b.bid); log(`${nm(p)} bids ${b.bid}.`, settings.explain ? b.reason : null); advance(); });
        return;
      }
      if (game.trickComplete) {
        later(1300, () => { const rec = game.collectTrick(); log(`→ ${nm(rec.winner)} wins the trick.`); advance(); });
        return;
      }
      if (game.turn === 0) return;
      later(800, () => {
        const p = game.turn; const c = B.choosePlay(game.ctxFor(p));
        game.play(p, c.card);
        log(`${nm(p)} plays ${c.card.text}.`, settings.explain ? c.reason : null);
        advance();
      });
    }

    function humanBid(k) { try { game.bid(0, k); log(`You bid ${k}.`); advance(); } catch (e) { log('⚠ ' + e.message); render(); } }
    function humanPlay(card) { try { game.play(0, card); log(`You play ${card.text}.`); advance(); } catch (e) { log('⚠ ' + e.message); render(); } }

    function seat(i) {
      const g = game;
      const chips = [];
      if (g.dealer === i) chips.push(el('span', { class: 'chip' }, 'dealer'));
      if (g.mano === i) chips.push(el('span', { class: 'chip' }, 'mano'));
      if (g.turn === i || (g.phase === 'bidding' && g.bidder === i)) chips.push(el('span', { class: 'chip turn' }, g.phase === 'bidding' ? 'bids' : 'plays'));
      return el('div', { class: 'opp' + (g.turn === i ? ' active' : '') },
        el('div', { class: 'name' }, nm(i), ' ', chips),
        el('div', { class: 'backs rami-backs' }, g.hands[i].map(() => cardEl(null, { back: true }))),
        el('div', { class: 'muted', style: 'color:#cfe' }, g.bids[i] == null ? `${g.totals[i]} pts` : `bid ${g.bids[i]} · won ${g.won[i]} · ${g.totals[i]} pts`));
    }

    function centerArea() {
      const g = game;
      const msg = g.phase === 'bidding' ? (g.bidder === 0 ? 'Your turn to bid.' : `${nm(g.bidder)} is bidding…`) : g.phase === 'play' ? (g.turn === 0 ? 'Your turn.' : g.trickComplete ? '…' : `${nm(g.turn)} is playing…`) : '';
      return el('div', { class: 'center-area', style: 'min-height:0' },
        el('div', { class: 'row-piles' },
          el('div', { class: 'pile' }, cardEl(g.triumphCard), el('div', { class: 'muted', style: 'color:#cfe' }, `Triunfo ${S.SUIT_INFO[g.triumph].name}`)),
          el('div', { class: 'pile trick-pair', style: 'flex-wrap:wrap;justify-content:center;max-width:420px' }, g.trick.map(t => el('div', { class: 'slot', style: 'text-align:center;color:#cfe;font-size:.75rem' }, cardEl(t.card, { cls: g.trickComplete && g.trick[S.podridaWinner(g.trick, g.triumph)] === t ? 'winner' : '' }), nm(t.player))))),
        el('div', { class: 'msg' }, msg));
    }

    function actions() {
      const g = game;
      const box = el('div', { class: 'south-actions' });
      if (g.phase === 'roundover' || g.phase === 'gameover') {
        const last = g.history[g.history.length - 1];
        const best = Math.max(...g.totals);
        box.append(el('div', { class: 'panel', style: 'text-align:left;color:var(--ink);max-width:620px;margin:0 auto 10px' },
          el('h3', {}, g.phase === 'gameover' ? (g.totals[0] === best ? '🏆 You win the game!' : `${nm(g.totals.indexOf(best))} wins the game.`) : `Round ${g.roundIdx + 1} over`),
          el('table', { class: 't' }, el('tr', {}, el('th', {}, 'Player'), el('th', {}, 'Bid'), el('th', {}, 'Won'), el('th', {}, 'Round'), el('th', {}, 'Total')),
            g.names.map((n, i) => el('tr', {}, el('td', {}, n), el('td', {}, String(last.bids[i])), el('td', {}, String(last.won[i])), el('td', { class: last.points[i] < 0 ? 'bad' : 'ok' }, (last.points[i] > 0 ? '+' : '') + last.points[i]), el('td', {}, String(g.totals[i]))))),
          g.phase === 'gameover' ? el('button', { class: 'btn primary', onclick: newGame }, 'New game') : el('button', { class: 'btn primary', onclick: () => { g.nextRoundStart(); startRound(); } }, 'Next round')));
        return box;
      }
      if (g.phase === 'bidding' && g.bidder === 0) {
        const forb = g.forbiddenBid(0);
        box.append(el('div', { style: 'margin-bottom:6px' }, `How many tricks will you win? (0 to ${g.cards})${forb != null ? ` — you are the dealer: you cannot bid ${forb}` : ''}`));
        for (let k = 0; k <= g.cards; k++) box.append(el('button', { class: 'btn primary', disabled: k === forb, onclick: () => humanBid(k) }, String(k)));
      }
      return box;
    }

    function handEl() {
      const g = game;
      const mine = g.phase === 'play' && g.turn === 0 && !g.trickComplete;
      const legal = mine ? g.legal(0).cards : [];
      return el('div', { class: 'hand flat' }, g.hands[0].map(c => {
        const cls = mine && settings.legal ? (legal.includes(c) ? 'legal' : 'dim') : '';
        return cardEl(c, { cls, onclick: mine && legal.includes(c) ? humanPlay : null });
      }));
    }

    function coachPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Coach is off. Enable it below.')); return box; }
      if (g.phase === 'bidding' && g.bidder === 0) {
        const b = B.chooseBid(g, 0);
        box.append(el('div', { class: 'coach-box' }, el('strong', {}, `Suggested bid: ${b.bid}`), el('div', {}, b.reason),
          el('ul', {}, b.parts.map(p => el('li', {}, p.card ? `${p.card.text}: ≈ ${p.w.toFixed(2)}` : `${p.note}: +${p.w.toFixed(1)}`)))));
      } else if (g.phase === 'play' && g.turn === 0 && !g.trickComplete) {
        const need = g.bids[0] - g.won[0];
        const c = B.choosePlay(g.ctxFor(0));
        box.append(el('p', {}, `You bid ${g.bids[0]}, you have won ${g.won[0]}: ` + (need > 0 ? `${need} more to go (${g.hands[0].length} card${g.hands[0].length > 1 ? 's' : ''} left).` : need === 0 ? 'you have made your bid: avoid winning more.' : 'you already won too many.')),
          el('div', { class: 'coach-box' }, el('strong', {}, c.card.text), ' – ', c.reason));
      } else box.append(el('p', { class: 'muted' }, 'Advice appears on your turn.'));
      return box;
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      tableEl.append(el('div', { class: 'opp-row' }, [...Array(game.n - 1).keys()].map(k => seat(k + 1))), centerArea(), el('div', { class: 'actions' }, actions(),
        el('div', { class: 'seat south' }, el('div', { class: 'name' }, 'You ', game.dealer === 0 ? el('span', { class: 'chip' }, 'dealer') : null, game.mano === 0 ? el('span', { class: 'chip' }, 'mano') : null,
          game.turn === 0 || (game.phase === 'bidding' && game.bidder === 0) ? el('span', { class: 'chip turn' }, 'your turn') : null),
        el('div', { class: 'stack' }, game.bids[0] == null ? `${game.totals[0]} pts` : `bid ${game.bids[0]} · won ${game.won[0]} · ${game.totals[0]} pts`)),
        handEl()));
      sideEl.innerHTML = '';
      sideEl.append(infoPanel(), coachPanel(), settingsPanel(), logPanel());
    }

    function infoPanel() {
      const total = game.names.map((n, i) => [n, game.totals[i]]);
      return el('div', { class: 'panel' }, el('h3', {}, `Round ${game.roundIdx + 1} of ${game.rounds.length}`),
        el('p', {}, `${game.cards} card${game.cards > 1 ? 's' : ''} · triumph ${game.triumphCard.text}`),
        el('table', {}, total.map(([n, v]) => el('tr', {}, el('td', {}, n + ' '), el('td', {}, String(v))))));
    }

    function settingsPanel() {
      const defs = [['hints', 'Coach: bids and plays'], ['legal', 'Highlight legal cards'], ['explain', "Explain the bots' choices in the log"]];
      return el('div', { class: 'panel' }, el('h3', {}, 'Learning aids'),
        defs.map(([k, label]) => el('label', { class: 'switch' }, el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => { settings[k] = e.target.checked; Settings.set(settings); render(); } }), ' ' + label)),
        el('label', { class: 'switch' }, 'Players: ', el('select', { onchange: e => { settings.players = +e.target.value; Settings.set(settings); newGame(); } }, [3, 4, 5].map(n => el('option', { value: n, selected: n === settings.players ? true : null }, n)))),
        el('label', { class: 'switch' }, 'Length: ', el('select', { onchange: e => { settings.maxCards = +e.target.value; Settings.set(settings); newGame(); } },
          [[5, 'Short (up to 5 cards)'], [9, 'Full (up to 9 cards)']].map(([v, l]) => el('option', { value: v, selected: v === settings.maxCards ? true : null }, l)))));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l => el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, 'Log'), box);
    }

    newGame();
    return () => { alive = false; clearTimeout(timer); };
  }

  S.PodridaScreens = Object.assign(S.PodridaScreens || {}, { play: playScreen });
})(window.Spanish = window.Spanish || {});
