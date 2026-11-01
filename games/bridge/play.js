/* Le Bridge, écran Jouer : vous (Sud) et votre partenaire (Nord) contre Est et Ouest, en rubber. */
(function (Br) {
  'use strict';
  const { el, cardEl } = Br;
  const SEAT_CLASS = ['south', 'west', 'north', 'east'];
  const COLS = [1, 2, 3, 0]; // auction columns: Ouest, Nord, Est, Sud
  const TEAM = ['Nous', 'Eux'];

  function playScreen(root) {
    let settings = Br.Settings.get();
    let rubber = new Br.Rubber();
    const game = new Br.Bridge({ dealer: Math.floor(Math.random() * 4), vul: rubber.vul });
    const logLines = [];
    let timer = null; let alive = true; let hint = null; let scored = false; let modalOpen = false; let dealNo = 1;
    let lastOutcome = null;

    const tableEl = el('div', { class: 'table bridge' });
    const sideEl = el('div', { class: 'side' });
    const modalHost = el('div', {});
    root.append(el('div', { class: 'play' }, tableEl, sideEl), modalHost);

    const NAME = Br.seatName;
    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 120) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const humanControls = seat => seat != null && game.controller(seat) === 0;
    const humanToAct = () => (game.phase === 'bidding' && game.bidder === 0) || (game.phase === 'play' && game.turn != null && humanControls(game.turn));

    function logCall(seat, call, reason) {
      const you = seat === 0;
      log(`${NAME(seat)} ${you ? 'annoncez' : 'annonce'} : ${Br.callText(call)}.`, settings.explain && !you ? reason : null);
    }
    function logPlay(seat, by, card, reason) {
      const who = seat === game.dummy ? `${NAME(seat)} (le mort${by === 0 ? ', joué par vous' : ''})` : NAME(seat);
      log(`${who} joue ${card.text}.`, settings.explain && by !== 0 ? reason : null);
    }

    /* ---------- flow ---------- */
    function advance() {
      clearTimeout(timer);
      render();
      if (!alive || game.phase === 'passedout') { if (game.phase === 'passedout' && !scored) { scored = true; log('Personne n\'a enchéri : donne passée.'); render(); } return; }
      if (game.phase === 'done') {
        if (!scored) {
          scored = true;
          const r = game.result;
          lastOutcome = rubber.apply(r.side, r.res);
          log(`Donne terminée : ${Br.contractText(r.contract)} par ${NAME(r.declarer)}, ${r.tricks} levées — ${r.res.made ? 'réussi' : 'chute de ' + r.res.down}.`);
          render();
        }
        later(900, showResult);
        return;
      }
      if (game.phase === 'play' && game.trickComplete) {
        later(1300, () => {
          const rec = game.collectTrick();
          log(`→ ${NAME(rec.winner)} remporte le pli ${rec.no + 1}.`);
          advance();
        });
        return;
      }
      if (humanToAct()) return;
      later(game.phase === 'bidding' ? 800 : 700, () => {
        const wasHidden = !game.dummyVisible;
        const ev = game.botStep();
        if (ev.kind === 'call') logCall(ev.seat, ev.call, ev.reason);
        else { logPlay(ev.seat, ev.by, ev.card, ev.reason); if (wasHidden && game.dummyVisible) log(`Le mort (${NAME(game.dummy)}) étale son jeu.`); }
        advance();
      });
    }

    function newDeal() {
      if (rubber.over) { rubber = new Br.Rubber(); dealNo = 0; }
      game.dealer = (game.dealer + 1) % 4;
      game.vul = rubber.vul;
      game.newDeal();
      hint = null; scored = false; dealNo++; lastOutcome = null;
      logLines.length = 0;
      logDealStart();
      modalHost.innerHTML = ''; modalOpen = false;
      advance();
    }
    function newRubber() { rubber = new Br.Rubber(); dealNo = 0; newDeal(); }

    function logDealStart() {
      log(`Donne ${dealNo}. ${NAME(game.dealer)} ${game.dealer === 0 ? 'donnez' : 'donne'} et ouvre les enchères. Vulnérabilité : ${vulText()}.`);
    }
    const vulText = () => (rubber.vul[0] && rubber.vul[1] ? 'tous vulnérables' : rubber.vul[0] ? 'nous seuls' : rubber.vul[1] ? 'eux seuls' : 'personne');

    /* ---------- human actions ---------- */
    function humanCall(call) {
      logCall(0, call);
      game.call(0, call);
      hint = null;
      advance();
    }
    function humanPlay(card) {
      const seat = game.turn; hint = null;
      const wasHidden = !game.dummyVisible;
      game.play(seat, card);
      logPlay(seat, 0, card);
      if (wasHidden && game.dummyVisible) log(`Le mort (${NAME(game.dummy)}) étale son jeu.`);
      advance();
    }
    function showHint() { hint = game.suggest(game.turn); render(); }

    /* ---------- rendering ---------- */
    const faceUp = seat => settings.showAll || seat === 0 || (game.dummyVisible && seat === game.dummy);

    function seatEl(p) {
      const chips = [];
      if (p === 2) chips.push(el('span', { class: 'chip' }, 'partenaire'));
      if (game.declarer === p) chips.push(el('span', { class: 'chip taker' }, 'Déclarant'));
      if (game.dummy === p && game.phase !== 'bidding') chips.push(el('span', { class: 'chip' }, 'Mort'));
      if (game.dealer === p && game.phase === 'bidding') chips.push(el('span', { class: 'chip' }, 'donneur'));
      const turnSeat = game.phase === 'bidding' ? game.bidder : game.phase === 'play' ? game.turn : null;
      if (turnSeat === p) chips.push(el('span', { class: 'chip turn' }, 'à jouer'));
      const n = game.hands[p].length;
      const box = el('div', { class: 'seat ' + SEAT_CLASS[p] }, el('div', { class: 'name' }, NAME(p), ' ', chips));
      if (p === 0) return box;
      if (faceUp(p)) {
        const mine = game.phase === 'play' && game.turn === p && humanControls(p);
        const legal = mine && settings.highlight ? new Set(game.legalFor(p).map(c => c.id)) : null;
        box.append(el('div', { class: 'dummy' }, Br.suitRows(game.hands[p], { onclick: mine ? humanPlay : null, legal: mine ? new Set(game.legalFor(p).map(c => c.id)) : null, hint: mine && hint && hint.card })));
        void legal;
      } else box.append(el('div', { class: 'backs' }, [...Array(Math.min(n, 13))].map(() => cardEl(null, { back: true }))), el('div', { class: 'muted', style: 'color:#cfe' }, `${n} cartes`));
      return box;
    }

    function auctionTable() {
      const offset = COLS.indexOf(game.dealer);
      const cells = [...Array(offset)].map(() => el('td', {}, ''));
      game.auction.forEach(a => cells.push(el('td', { class: a.seat === 0 ? 'me' : '' }, Br.callEl(a.call))));
      if (game.phase === 'bidding') cells.push(el('td', { class: 'next' }, '…'));
      const rows = [];
      for (let i = 0; i < cells.length; i += 4) rows.push(el('tr', {}, cells.slice(i, i + 4)));
      return el('table', { class: 'auction' }, el('thead', {}, el('tr', {}, COLS.map(s => el('th', {}, NAME(s) + (rubber.vul[Br.side(s)] ? ' (vul.)' : ''))))), el('tbody', {}, rows));
    }

    function bidPad() {
      const pad = el('div', { class: 'bidpad' });
      for (let l = 1; l <= 7; l++) {
        const row = el('div', { class: 'row' });
        Br.STRAINS.forEach(s => {
          const call = Br.bid(l, s);
          row.append(el('button', { class: 'btn small', disabled: !game.legal(call), onclick: () => humanCall(call) }, Br.callEl(call)));
        });
        pad.append(row);
      }
      pad.append(el('div', { class: 'row' },
        el('button', { class: 'btn small', onclick: () => humanCall(Br.pass()) }, 'Passe'),
        el('button', { class: 'btn small', disabled: !game.legal(Br.dbl()), onclick: () => humanCall(Br.dbl()) }, 'Contre'),
        el('button', { class: 'btn small', disabled: !game.legal(Br.rdbl()), onclick: () => humanCall(Br.rdbl()) }, 'Surcontre')));
      return pad;
    }

    function message() {
      const g = game;
      if (g.phase === 'bidding') return g.bidder === 0 ? 'À vous d\'annoncer.' : `${NAME(g.bidder)} réfléchit…`;
      if (g.phase === 'passedout') return 'Quatre passes : on redonne.';
      if (g.phase === 'play') {
        if (g.trickComplete) return `${NAME(g.trick[g.trickWinnerIdx()].player)} remporte le pli.`;
        if (g.turn != null && humanControls(g.turn)) return g.turn === 0 ? (g.trick.length ? 'À vous. Fournissez à la couleur demandée.' : 'Vous entamez.') : `Vous jouez pour le mort (${NAME(g.turn)}).`;
        return g.turn === g.dummy && g.declarer !== 0 ? `${NAME(g.declarer)} joue pour le mort (${NAME(g.dummy)})…` : `${NAME(g.turn)} joue…`;
      }
      return '';
    }

    function centerArea() {
      const g = game;
      const area = el('div', { class: 'center-area' });
      if (g.phase === 'bidding' || g.phase === 'passedout') {
        area.append(auctionTable());
        if (g.phase === 'bidding' && g.bidder === 0) area.append(bidPad());
      } else {
        const wi = g.trickComplete ? g.trickWinnerIdx() : -1;
        const grid = el('div', { class: 'trick-grid bridge' });
        for (let p = 0; p < 4; p++) {
          const idx = g.trick.findIndex(x => x.player === p);
          grid.append(idx >= 0 ? cardEl(g.trick[idx].card, { cls: 'p' + p + (idx === wi ? ' winner' : '') }) : el('div', { class: 'empty p' + p }));
        }
        area.append(grid);
      }
      area.append(el('div', { class: 'msg' }, message()), el('div', { class: 'muted', style: 'color:#cfe;font-size:.8rem' }, '↻ Au bridge, le jeu tourne dans le sens des aiguilles d\'une montre'));
      return area;
    }

    function southArea() {
      const g = game;
      const box = el('div', { class: 'south-actions' });
      if (g.phase === 'passedout') box.append(el('button', { class: 'btn primary', onclick: newDeal }, 'Redonner'));
      else if (g.phase === 'done') box.append(el('button', { class: 'btn primary', onclick: newDeal }, rubber.over ? 'Nouveau rubber' : 'Donne suivante'));
      const hand = el('div', { class: 'hand' });
      const mine = g.phase === 'play' && g.turn === 0 && humanControls(0);
      const legal = mine ? new Set(g.legalFor(0).map(c => c.id)) : null;
      g.hands[0].forEach(c => {
        let cls = ''; let onclick = null;
        if (mine) {
          const ok = legal.has(c.id);
          if (settings.highlight) cls = ok ? 'legal' : 'dim';
          if (hint && hint.card === c) cls += ' hint';
          onclick = ok ? humanPlay : () => { log(`✘ ${c.text} n'est pas jouable : il faut fournir à la couleur demandée.`); render(); };
        }
        hand.append(cardEl(c, { cls, onclick }));
      });
      return [box, seatEl(0), hand];
    }

    function coachPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Les conseils sont désactivés. Activez-les ci-dessous.')); return box; }
      const ev = Br.evalHand(g.hands[0]);
      if (g.phase === 'bidding') {
        box.append(el('div', { class: 'coach-box' }, el('div', {}, 'Votre main : ', el('strong', {}, `${ev.hcp} points d'honneurs`), ` (${ev.points} avec la longueur)`),
          el('div', {}, `Répartition ${Br.shapeText(ev)} · ${ev.balanced ? 'main équilibrée' : 'main irrégulière'}`)));
        if (g.bidder === 0) {
          const r = Br.Bid.choose(g.hands[0], g.auction, 0);
          box.append(el('div', { class: 'coach-box' }, el('div', {}, 'Suggestion : ', el('strong', {}, Br.callText(r.call))), el('div', { class: 'muted' }, r.reason)));
        }
        box.append(el('p', { class: 'muted' }, 'A = 4, R = 3, D = 2, V = 1. Ouvrir à 12 points ou plus ; 1SA = 15–17 en main équilibrée ; 25–26 points pour une manche.'));
      } else if (g.phase === 'play' && g.turn != null && humanControls(g.turn)) {
        const seat = g.turn;
        const need = g.contract.level + 6;
        box.append(el('p', {}, el('strong', {}, 'Contrat : '), `${Br.contractText(g.contract)} par ${NAME(g.declarer)} (${need} levées).`),
          el('p', {}, g.trick.length ? 'Fournissez à la couleur demandée ; sinon coupez ou défaussez.' : 'Vous entamez : jouez votre meilleure couleur.'),
          el('button', { class: 'btn small', onclick: showHint }, '💡 Suggérer une carte'),
          hint && hint.card ? el('div', { class: 'coach-box' }, el('strong', {}, hint.card.text), ' – ', hint.reason) : null);
        void seat;
      } else box.append(el('p', { class: 'muted' }, 'Les conseils apparaissent quand c\'est votre tour.'));
      return box;
    }

    function infoPanel() {
      const g = game; const rows = [];
      if (g.contract) {
        rows.push(['Contrat', Br.contractText(g.contract)]);
        rows.push(['Déclarant', `${NAME(g.declarer)} (${Br.side(g.declarer) === 0 ? 'nous' : 'eux'})`]);
        rows.push(['Levées', `Nous ${g.tricksWon[0]} · Eux ${g.tricksWon[1]}`]);
        rows.push(['Objectif', `${g.contract.level + 6} levées pour le déclarant`]);
      } else rows.push(['Phase', 'Enchères']);
      rows.push(['Vulnérables', vulText()]);
      return el('div', { class: 'panel' }, el('h3', {}, `Donne ${dealNo}`), el('table', { class: 'score-pill' }, rows.map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))));
    }

    function rubberPanel() {
      const t = rubber.totals;
      return el('div', { class: 'panel' }, el('h3', {}, 'Rubber'),
        el('table', { class: 't' }, el('tr', {}, el('th', {}, ''), el('th', {}, 'Nous'), el('th', {}, 'Eux')),
          el('tr', {}, el('th', {}, 'Manches'), el('td', {}, String(rubber.games[0])), el('td', {}, String(rubber.games[1]))),
          el('tr', {}, el('th', {}, 'Points de manche en cours'), el('td', {}, String(rubber.below[0])), el('td', {}, String(rubber.below[1]))),
          el('tr', {}, el('th', {}, 'Au-dessus de la ligne'), el('td', {}, String(rubber.above[0])), el('td', {}, String(rubber.above[1]))),
          el('tr', {}, el('th', {}, 'Total'), el('th', {}, String(t[0])), el('th', {}, String(t[1])))));
    }

    function settingsPanel() {
      const defs = [['highlight', 'Surligner les cartes jouables'], ['hints', 'Coach : conseils et aide aux enchères'], ['explain', 'Expliquer les choix des bots dans le journal'], ['showAll', 'Voir toutes les mains (pour apprendre)']];
      return el('div', { class: 'panel' }, el('h3', {}, 'Aides à l\'apprentissage'), defs.map(([k, label]) =>
        el('label', { class: 'switch' }, el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => { settings[k] = e.target.checked; Br.Settings.set(settings); hint = null; render(); } }), ' ' + label)),
      el('div', { class: 'btn-row' }, el('button', { class: 'btn small', onclick: () => { if (window.confirm('Recommencer un nouveau rubber ?')) newRubber(); } }, 'Nouveau rubber')));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l => el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, 'Journal'), box);
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      tableEl.append(seatEl(2), seatEl(1), centerArea(), seatEl(3), el('div', { class: 'actions' }, southArea()));
      sideEl.innerHTML = '';
      sideEl.append(infoPanel(), coachPanel(), settingsPanel(), rubberPanel(), logPanel());
    }

    function showResult() {
      if (!alive || modalOpen) return;
      const r = game.result; const res = r.res; const close = () => { modalHost.innerHTML = ''; modalOpen = false; };
      const usDecl = r.side === 0;
      const lines = [];
      if (res.made) {
        lines.push(['Points de levées (sous la ligne)', res.trickPoints]);
        res.above.forEach(x => lines.push([x.label + ' (au-dessus)', x.value]));
      } else res.above.forEach(x => lines.push([x.label + ' pour la défense (au-dessus)', x.value]));
      modalOpen = true;
      modalHost.append(el('div', { class: 'modal-back' }, el('div', { class: 'modal' },
        el('h2', {}, res.made ? `${usDecl ? 'Nous réussissons' : 'Ils réussissent'} ${Br.contractText(r.contract)} !` : `${usDecl ? 'Nous chutons' : 'Ils chutent'} de ${res.down}.`),
        el('table', { class: 't' },
          el('tr', {}, el('th', {}, 'Contrat'), el('td', {}, `${Br.contractText(r.contract)} par ${NAME(r.declarer)}${r.vul ? ' (vulnérable)' : ''}`)),
          el('tr', {}, el('th', {}, 'Levées du déclarant'), el('td', {}, `${r.tricks} (il en fallait ${res.need})`)),
          lines.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, `+${b}`)))),
        lastOutcome && lastOutcome.game != null ? el('p', {}, el('strong', {}, `🏁 Manche pour ${lastOutcome.game === 0 ? 'nous' : 'eux'} ! (les points de manche repartent à zéro)`)) : null,
        rubber.over ? el('p', {}, el('strong', {}, `🏆 Rubber ${rubber.winner === 0 ? 'gagné par nous' : 'gagné par eux'} (bonus ${lastOutcome.bonus}). Total : Nous ${rubber.totals[0]} · Eux ${rubber.totals[1]}`)) : null,
        el('div', { class: 'btn-row' },
          el('button', { class: 'btn primary', onclick: newDeal }, rubber.over ? 'Nouveau rubber' : 'Donne suivante'),
          el('button', { class: 'btn', onclick: close }, 'Revoir la table'),
          el('a', { class: 'btn', href: '#/bridge' }, 'Menu du jeu')))));
    }

    logDealStart();
    advance();
    return () => { alive = false; clearTimeout(timer); };
  }

  Br.BridgeScreens = Object.assign(Br.BridgeScreens || {}, { play: playScreen });
})(window.Bridge = window.Bridge || {});
