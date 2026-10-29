/* Play screen: you (South) against three bots, with optional coaching. */
(function (T) {
  'use strict';
  const { el, cardEl, fmt, contractName } = T;
  const tr = window.Core.t;
  const SEAT_CLASS = ['south', 'east', 'north', 'west'];

  function playScreen(root) {
    const NAMES = T.SEAT_NAMES; // localized when the screen is built (re-run on language change)
    const lc = s => String(s).toLowerCase();
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
      const you = ev.player === 0;
      if (ev.kind === 'bid') {
        log(tr(`${n}: ${ev.contract ? 'bids ' + contractName(ev.contract) : 'passes'}.`,
          `${n} ${ev.contract ? (you ? 'annoncez ' : 'annonce ') + contractName(ev.contract) : (you ? 'passez' : 'passe')}.`), why);
      } else if (ev.kind === 'dog') log(tr(`${n} takes the dog.`, `${n} ${you ? 'prenez' : 'prend'} le chien.`));
      else if (ev.kind === 'discard') {
        const trumps = ev.cards.filter(c => c.suit === 'T');
        log(tr(`${n} discards 6 cards` + (trumps.length ? ` (including trumps: ${trumps.map(c => c.rank).join(', ')})` : '') + '.',
          `${n} ${you ? 'écartez' : 'écarte'} 6 cartes` + (trumps.length ? ` (dont des atouts : ${trumps.map(c => c.rank).join(', ')})` : '') + '.'), why);
      } else if (ev.kind === 'play') log(tr(`${n} plays ${ev.card.text}.`, `${n} ${you ? 'jouez' : 'joue'} ${ev.card.text}.`), why);
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
          const tk = NAMES[game.taker]; const tkYou = game.taker === 0;
          log(tr(`Deal over. ${tk} ${game.result.win ? 'made' : 'failed'} the contract.`,
            `Donne terminée. ${tk} ${game.result.win ? (tkYou ? 'remplissez' : 'remplit') + ' le contrat' : (tkYou ? 'chutez' : 'chute')}.`));
          render();
        }
        later(900, showResult);
        return;
      }
      if (game.phase === 'play' && game.trickComplete) {
        later(1400, () => {
          const rec = game.collectTrick();
          log(tr(`→ ${NAMES[rec.winner]} wins trick ${rec.no + 1} (${fmt(rec.points)} pts).`,
            `→ ${NAMES[rec.winner]} ${rec.winner === 0 ? 'remportez' : 'remporte'} le pli ${rec.no + 1} (${fmt(rec.points)} pts).`));
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
      logDealStart();
      modalHost.innerHTML = '';
      modalOpen = false;
      advance();
    }

    function logDealStart() {
      const d = game.dealer; const f = (game.dealer + 1) % 4;
      log(tr(`Deal ${dealNo}. ${NAMES[d]} deals; ${NAMES[f]} speaks first.`,
        `Donne ${dealNo}. ${NAMES[d]} ${d === 0 ? 'donnez' : 'donne'} ; ${NAMES[f]} ${f === 0 ? 'parlez' : 'parle'} en premier.`));
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
      log(tr(`You play ${card.text}.`, `Vous jouez ${card.text}.`));
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
      const trumps = cards.filter(c => c.suit === 'T');
      log(tr('You discard 6 cards' + (trumps.length ? ` (including trumps: ${trumps.map(c => c.rank).join(', ')})` : '') + '.',
        'Vous écartez 6 cartes' + (trumps.length ? ` (dont des atouts : ${trumps.map(c => c.rank).join(', ')})` : '') + '.'));
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
      if (game.taker === p) chips.push(el('span', { class: 'chip taker' }, tr('Taker', 'Preneur') + ' · ' + contractName(game.contract)));
      else if (game.phase === 'bidding') {
        const b = game.bids.find(x => x.player === p);
        if (b) chips.push(el('span', { class: 'chip' }, contractName(b.contract)));
      }
      const myTurn = (game.phase === 'bidding' && game.bidder === p) || (game.phase === 'play' && game.turn === p);
      if (myTurn) chips.push(el('span', { class: 'chip turn' }, tr('to play', 'à jouer')));
      const n = game.hands[p].length;
      return el('div', { class: 'seat ' + SEAT_CLASS[p] },
        el('div', { class: 'name' }, NAMES[p], ' ', chips),
        p === 0 ? null : el('div', { class: 'backs' }, [...Array(Math.min(n, p === 2 ? 12 : 7))].map(() => cardEl(null, { back: true }))),
        p === 0 ? null : el('div', { class: 'muted', style: 'color:#cfe' }, tr(`${n} cards`, `${n} cartes`)));
    }

    function message() {
      const g = game;
      if (g.phase === 'bidding') return g.bidder === 0 ? tr('Your turn to bid.', 'À vous d\'annoncer.') : tr(`${NAMES[g.bidder]} is thinking…`, `${NAMES[g.bidder]} réfléchit…`);
      if (g.phase === 'passed') return tr('Everybody passed. Nobody takes the contract.', 'Tout le monde a passé. Personne ne prend le contrat.');
      if (g.phase === 'dog') return g.taker === 0
        ? tr(`You won the bidding with ${contractName(g.contract)}. This is the dog:`, `Vous avez remporté les enchères avec ${contractName(g.contract)}. Voici le chien :`)
        : tr(`${NAMES[g.taker]} takes ${contractName(g.contract)}. The dog is turned over:`, `${NAMES[g.taker]} prend ${contractName(g.contract)}. Le chien est retourné :`);
      if (g.phase === 'discard') {
        if (g.taker !== 0) return tr(`${NAMES[g.taker]} is choosing the discards…`, `${NAMES[g.taker]} choisit son écart…`);
        const err = selected.size === 6 ? T.validateDiscard(g.hands[0], g.hands[0].filter(c => selected.has(c.id))) : null;
        return err || tr(`Select 6 cards to discard (${selected.size}/6).`, `Choisissez 6 cartes à écarter (${selected.size}/6).`);
      }
      if (g.phase === 'play') {
        if (g.trickComplete) {
          const w = g.trick[T.trickWinnerIndex(g.trick)].player;
          return tr(`${NAMES[w]} wins the trick.`, `${NAMES[w]} ${w === 0 ? 'remportez' : 'remporte'} le pli.`);
        }
        if (g.turn === 0) return g.trick.length ? tr('Your turn. Follow the rules of the trick.', 'À vous. Respectez les règles du pli.') : tr('You lead the trick.', 'Vous entamez le pli.');
        return tr(`${NAMES[g.turn]} to play…`, `${NAMES[g.turn]} joue…`);
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
        box.append(el('button', { class: 'btn', onclick: () => humanBid(null) }, tr('Pass', 'Passer')));
        T.CONTRACT_ORDER.forEach(k => {
          box.append(el('button', { class: 'btn primary', disabled: !g.canBid(k), onclick: () => humanBid(k) }, `${T.CONTRACTS[k].name} (×${T.CONTRACTS[k].mult})`));
        });
        if (g.highest) box.append(el('div', { class: 'muted', style: 'color:#cfe' }, tr(`Current bid: ${contractName(g.highest.contract)} by ${NAMES[g.highest.player]}`, `Enchère actuelle : ${contractName(g.highest.contract)} par ${NAMES[g.highest.player]}`)));
      } else if (g.phase === 'dog' && g.taker === 0) {
        box.append(el('button', { class: 'btn primary', onclick: () => { g.takeDog(); log(tr('You take the dog.', 'Vous prenez le chien.')); advance(); } }, tr('Take the dog into your hand', 'Prendre le chien dans votre main')));
      } else if (g.phase === 'discard' && g.taker === 0) {
        const err = selected.size === 6 ? T.validateDiscard(g.hands[0], g.hands[0].filter(c => selected.has(c.id))) : 'x';
        box.append(el('button', { class: 'btn primary', disabled: !!err, onclick: confirmDiscard }, tr('Discard these 6 cards', 'Écarter ces 6 cartes')));
        if (settings.hints) box.append(el('button', { class: 'btn', onclick: suggestDiscard }, tr('💡 Suggest discards', '💡 Suggérer un écart')));
      } else if (g.phase === 'passed' || g.phase === 'done') {
        box.append(el('button', { class: 'btn primary', onclick: newDeal }, g.phase === 'done' ? tr('Next deal', 'Donne suivante') : tr('Deal again', 'Redonner')));
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
          onclick = ok ? humanPlay : () => { log(tr(`✘ ${c.text} is not legal here: ${T.RULE_TEXT[g.legalFor(0).rule]}`, `✘ ${c.text} n'est pas jouable ici : ${T.RULE_TEXT[g.legalFor(0).rule]}`)); render(); };
        }
        hand.append(cardEl(c, { cls, onclick }));
      });
      return hand;
    }

    function coachPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, tr('Hints are off. Enable them below.', 'Les conseils sont désactivés. Activez-les ci-dessous.'))); return box; }
      if (g.phase === 'bidding' && g.bidder === 0) {
        const ev = T.Bots.evaluateHand(g.hands[0]);
        const higher = !g.highest || (ev.level && T.CONTRACTS[ev.level].level > T.CONTRACTS[g.highest.contract].level);
        box.append(el('div', { class: 'coach-box' },
          el('div', {}, tr('Hand strength: ', 'Force de la main : '), el('strong', {}, fmt(ev.score))),
          el('div', {}, tr('Suggestion: ', 'Suggestion : '), el('strong', {}, ev.level && higher ? contractName(ev.level) : tr('Pass', 'Passer'))),
          T.Drills.evalTable(ev)),
          el('p', { class: 'muted' }, tr('15+ → Petite, 22+ → Garde, 30+ → Garde Sans. A rough guide only.', '15+ → Petite, 22+ → Garde, 30+ → Garde sans. Simple repère, rien de plus.')));
      } else if (g.phase === 'discard' && g.taker === 0) {
        box.append(el('p', {}, tr('Discard 6 cards: no kings, no oudlers, and trumps only if you have no other choice. Aim to empty your short suits.', 'Écartez 6 cartes : ni rois, ni bouts, et des atouts seulement si vous n\'avez pas d\'autre choix. Cherchez à vider vos couleurs courtes.')),
          hint && hint.reason ? el('div', { class: 'coach-box' }, hint.reason) : null);
      } else if (g.phase === 'play' && g.turn === 0) {
        const info = g.legalFor(0);
        box.append(el('p', {}, el('strong', {}, tr('Rule: ', 'Règle : ')), T.RULE_TEXT[info.rule]),
          el('button', { class: 'btn small', onclick: showHint }, tr('💡 Suggest a card', '💡 Suggérer une carte')),
          hint && hint.card ? el('div', { class: 'coach-box' }, el('strong', {}, hint.card.text), ' – ', hint.reason) : null);
      } else {
        box.append(el('p', { class: 'muted' }, tr('Hints appear when it is your turn.', 'Les conseils apparaissent quand c\'est votre tour.')));
      }
      return box;
    }

    function infoPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, tr(`Deal ${dealNo}`, `Donne ${dealNo}`)));
      const rows = [];
      if (g.contract) {
        rows.push([tr('Contract', 'Contrat'), tr(`${contractName(g.contract)} by ${NAMES[g.taker]}`, `${contractName(g.contract)} par ${NAMES[g.taker]}`)]);
        rows.push([tr('Trick', 'Pli'), `${Math.min(g.trickNo + (g.trickComplete ? 0 : 1), 18)} / 18`]);
        if (settings.count) {
          const o = g.takerOudlersSoFar();
          rows.push([tr('Taker pts so far', 'Points du preneur'), `${fmt(g.takerPointsSoFar())}`]);
          rows.push([tr('Taker oudlers', 'Bouts du preneur'), tr(`${o} → needs ${T.requiredPoints(o)}`, `${o} → il faut ${T.requiredPoints(o)}`)]);
        } else {
          rows.push([tr('Needs', 'Il faut'), tr('depends on oudlers: 56 / 51 / 41 / 36', 'selon les bouts : 56 / 51 / 41 / 36')]);
        }
      } else rows.push([tr('Phase', 'Phase'), tr('Bidding', 'Enchères')]);
      box.append(el('table', { class: 'score-pill' }, rows.map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))));
      return box;
    }

    function settingsPanel() {
      const defs = [
        ['highlight', tr('Highlight playable cards', 'Surligner les cartes jouables')],
        ['hints', tr('Coach: hints & bid advice', 'Coach : conseils et aide aux enchères')],
        ['explain', tr("Explain bots' choices in the log", 'Expliquer les choix des bots dans le journal')],
        ['count', tr('Show live point count', 'Afficher le décompte des points en direct')],
      ];
      return el('div', { class: 'panel' }, el('h3', {}, tr('Learning aids', 'Aides à l\'apprentissage')), defs.map(([k, label]) =>
        el('label', { class: 'switch' },
          el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => {
            settings[k] = e.target.checked; T.Settings.set(settings); hint = null; render();
          } }), ' ' + label)));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l =>
        el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, tr('Log', 'Journal')), box);
    }

    function scorePanel() {
      return el('div', { class: 'panel' }, el('h3', {}, tr('Total score', 'Score total')),
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
      const takerYou = r.taker === 0;
      modalOpen = true;
      modalHost.append(el('div', { class: 'modal-back' }, el('div', { class: 'modal' },
        el('h2', {}, r.win
          ? tr(`${takerName === 'You' ? 'You make' : takerName + ' makes'} the contract!`, `${takerYou ? 'Vous remplissez' : takerName + ' remplit'} le contrat !`)
          : tr(`${takerName === 'You' ? 'You fail' : takerName + ' fails'} the contract.`, `${takerYou ? 'Vous chutez' : takerName + ' chute'}.`)),
        el('table', { class: 't' },
          el('tr', {}, el('th', {}, tr('Contract', 'Contrat')), el('td', {}, `${contractName(r.contract)} (×${r.mult})`)),
          el('tr', {}, el('th', {}, tr('Taker\'s oudlers', 'Bouts du preneur')), el('td', {}, tr(`${r.oudlers} → needs ${r.required} points`, `${r.oudlers} → ${r.required} points requis`))),
          el('tr', {}, el('th', {}, tr('Taker\'s points', 'Points du preneur')), el('td', {}, tr(`${fmt(r.takerPoints)} (defenders ${fmt(r.defPoints)})`, `${fmt(r.takerPoints)} (défenseurs ${fmt(r.defPoints)})`))),
          el('tr', {}, el('th', {}, tr('Difference', 'Différence')), el('td', {}, tr(`${r.diff >= 0 ? '+' : ''}${fmt(r.diff)} → rounded ${r.gap}`, `${r.diff >= 0 ? '+' : ''}${fmt(r.diff)} → arrondi à ${r.gap}`))),
          el('tr', {}, el('th', {}, tr('Score', 'Score')), el('td', {}, `${r.win ? '' : '−'}${formula} × ${r.mult} = ${r.perDefender >= 0 ? '+' : ''}${r.perDefender}`))),
        el('p', {}, tr(`The taker gets ${fmt(r.perDefender * 3)}, each defender gets ${fmt(-r.perDefender)}. `, `Le preneur marque ${fmt(r.perDefender * 3)}, chaque défenseur marque ${fmt(-r.perDefender)}. `),
          el('strong', {}, tr(`Your result: ${me > 0 ? '+' : ''}${me}`, `Votre résultat : ${me > 0 ? '+' : ''}${me}`))),
        el('div', { class: 'btn-row' },
          el('button', { class: 'btn primary', onclick: newDeal }, tr('Next deal', 'Donne suivante')),
          el('button', { class: 'btn', onclick: close }, tr('Review the table', 'Revoir la table')),
          el('a', { class: 'btn', href: '#/tarot' }, tr('Game menu', 'Menu du jeu'))))));
    }

    logDealStart();
    advance();

    return () => { alive = false; clearTimeout(timer); };
  }

  T.Screens = Object.assign(T.Screens || {}, { play: playScreen });
})(window.Tarot = window.Tarot || {});
