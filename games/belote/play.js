/* La Belote, écran Jouer : vous (Sud) et votre partenaire (Nord) contre Est et Ouest. */
(function (B) {
  'use strict';
  const { el, cardEl } = B;
  const SEAT_CLASS = ['south', 'east', 'north', 'west'];
  const TEAM_NAME = ['Nous', 'Eux'];

  function playScreen(root) {
    const NAMES = B.SEATS;
    let settings = B.Settings.get();
    const game = new B.Belote({ dealer: Math.floor(Math.random() * 4) });
    let scores = [0, 0];
    const logLines = [];
    let timer = null;
    let alive = true;
    let hint = null;
    let scored = false;
    let modalOpen = false;
    let dealNo = 1;

    const tableEl = el('div', { class: 'table' });
    const sideEl = el('div', { class: 'side' });
    const modalHost = el('div', {});
    root.append(el('div', { class: 'play' }, tableEl, sideEl), modalHost);

    const humanToAct = () => ((game.phase === 'bid1' || game.phase === 'bid2') && game.bidder === 0) || (game.phase === 'play' && game.turn === 0);
    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 80) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const sym = s => B.SUIT_SYM[s];

    function logEvent(ev) {
      const n = NAMES[ev.player]; const you = ev.player === 0;
      const why = settings.explain && !you ? ev.reason : null;
      if (ev.kind === 'bid') {
        log(ev.suit ? `${n} ${you ? 'prenez' : 'prend'} à ${B.suitTag(ev.suit)}.` : `${n} ${you ? 'passez' : 'passe'}.`, why);
      } else if (ev.kind === 'play') {
        log(`${n} ${you ? 'jouez' : 'joue'} ${ev.card.text}.`, why);
        if (ev.announce) log(ev.announce === 'belote' ? `${n} : « Belote ! »` : `${n} : « Rebelote ! » +20 points.`);
      }
    }

    /* ---------- flow ---------- */
    function advance() {
      clearTimeout(timer);
      render();
      if (!alive || game.phase === 'allpass') return;
      if (game.phase === 'done') {
        if (!scored) {
          scored = true;
          const r = game.result;
          scores[0] += r.scores[0]; scores[1] += r.scores[1];
          log(`Donne terminée. ${r.made ? 'Contrat rempli' : 'Dedans'} (preneur : ${NAMES[r.taker]}).`);
          render();
        }
        later(900, showResult);
        return;
      }
      if (game.phase === 'play' && game.trickComplete) {
        later(1300, () => {
          const rec = game.collectTrick();
          log(`→ ${NAMES[rec.winner]} ${rec.winner === 0 ? 'remportez' : 'remporte'} le pli ${rec.no + 1} (${rec.points} pts).`);
          advance();
        });
        return;
      }
      if (humanToAct()) return;
      later(750, () => { logEvent(game.botStep()); advance(); });
    }

    function newDeal() {
      game.dealer = (game.dealer + 1) % 4;
      game.newDeal();
      hint = null; scored = false; dealNo++;
      logLines.length = 0;
      logDealStart();
      modalHost.innerHTML = '';
      modalOpen = false;
      advance();
    }

    function newGame() {
      scores = [0, 0]; dealNo = 0;
      newDeal();
    }

    function logDealStart() {
      const d = game.dealer; const f = (d + 1) % 4;
      log(`Donne ${dealNo}. ${NAMES[d]} ${d === 0 ? 'donnez' : 'donne'} ; ${NAMES[f]} ${f === 0 ? 'parlez' : 'parle'} en premier. Retourne : ${game.turned.text}.`);
    }

    /* ---------- human actions ---------- */
    function humanBid(suit) {
      logEvent({ kind: 'bid', player: 0, suit });
      game.bid(0, suit);
      advance();
    }

    function humanPlay(card) {
      hint = null;
      const { announce } = game.play(0, card);
      logEvent({ kind: 'play', player: 0, card, announce });
      advance();
    }

    function showHint() { hint = game.suggest(0); render(); }

    /* ---------- rendering ---------- */
    function seat(p) {
      const chips = [];
      if (p === 2) chips.push(el('span', { class: 'chip' }, 'partenaire'));
      if (game.taker === p) chips.push(el('span', { class: 'chip taker' }, 'Preneur · ' + sym(game.trump)));
      else if (game.phase === 'bid1' || game.phase === 'bid2') {
        const b = game.bids.find(x => x.player === p && x.round === game.phase);
        if (b) chips.push(el('span', { class: 'chip' }, b.suit ? sym(b.suit) : 'passe'));
      }
      if (((game.phase === 'bid1' || game.phase === 'bid2') && game.bidder === p) || (game.phase === 'play' && game.turn === p)) chips.push(el('span', { class: 'chip turn' }, 'à jouer'));
      if (game.dealer === p) chips.push(el('span', { class: 'chip' }, 'donneur'));
      const n = game.hands[p].length;
      return el('div', { class: 'seat ' + SEAT_CLASS[p] },
        el('div', { class: 'name' }, NAMES[p], ' ', chips),
        p === 0 ? null : el('div', { class: 'backs' }, [...Array(Math.min(n, 8))].map(() => cardEl(null, { back: true }))),
        p === 0 ? null : el('div', { class: 'muted', style: 'color:#cfe' }, `${n} cartes`));
    }

    function message() {
      const g = game;
      if (g.phase === 'bid1' || g.phase === 'bid2') {
        if (g.bidder === 0) return g.phase === 'bid1' ? `À vous : prenez-vous à ${B.suitTag(g.turned.suit)} ?` : 'Second tour : prenez à une autre couleur, ou passez.';
        return `${NAMES[g.bidder]} réfléchit…`;
      }
      if (g.phase === 'allpass') return 'Tout le monde a passé aux deux tours. On redonne.';
      if (g.phase === 'play') {
        if (g.trickComplete) { const w = g.trick[g.trickWinnerIdx()].player; return `${NAMES[w]} ${w === 0 ? 'remportez' : 'remporte'} le pli.`; }
        if (g.turn === 0) return g.trick.length ? 'À vous. Respectez les règles du pli.' : 'Vous entamez le pli.';
        return `${NAMES[g.turn]} joue…`;
      }
      return '';
    }

    function centerArea() {
      const g = game;
      const area = el('div', { class: 'center-area' });
      if (g.phase === 'bid1' || g.phase === 'bid2' || g.phase === 'allpass') {
        area.append(el('div', { class: 'dog-row' }, cardEl(g.turned)), el('div', { style: 'color:#cfe' }, 'La retourne'));
      } else if (g.phase === 'play' || g.phase === 'done') {
        const wi = g.trickComplete ? g.trickWinnerIdx() : -1;
        const grid = el('div', { class: 'trick-grid' });
        for (let p = 0; p < 4; p++) {
          const idx = g.trick.findIndex(x => x.player === p);
          grid.append(idx >= 0 ? cardEl(g.trick[idx].card, { cls: 'p' + p + (idx === wi ? ' winner' : '') }) : el('div', { class: 'empty p' + p }));
        }
        area.append(grid);
      }
      area.append(el('div', { class: 'msg' }, message()),
        el('div', { class: 'muted', style: 'color:#cfe;font-size:.8rem' }, '↺ Le jeu tourne dans le sens inverse des aiguilles d\'une montre'));
      return area;
    }

    function southActions() {
      const g = game;
      const box = el('div', { class: 'south-actions' });
      if ((g.phase === 'bid1' || g.phase === 'bid2') && g.bidder === 0) {
        box.append(el('button', { class: 'btn', onclick: () => humanBid(null) }, 'Passer'));
        const suits = g.phase === 'bid1' ? [g.turned.suit] : B.SUITS.filter(s => s !== g.turned.suit);
        suits.forEach(s => box.append(el('button', { class: 'btn primary', onclick: () => humanBid(s) }, `Prendre à ${B.suitTag(s)}`)));
      } else if (g.phase === 'allpass') {
        box.append(el('button', { class: 'btn primary', onclick: newDeal }, 'Redonner'));
      } else if (g.phase === 'done') {
        box.append(el('button', { class: 'btn primary', onclick: newDeal }, 'Donne suivante'));
      }
      return box;
    }

    function handEl() {
      const g = game;
      const hand = el('div', { class: 'hand' });
      const info = g.phase === 'play' && g.turn === 0 ? g.legalFor(0) : null;
      g.hands[0].forEach(c => {
        let cls = ''; let onclick = null;
        if (info) {
          const ok = info.cards.includes(c);
          if (settings.highlight) cls = ok ? 'legal' : 'dim';
          if (hint && hint.card === c) cls += ' hint';
          onclick = ok ? humanPlay : () => { log(`✘ ${c.text} n'est pas jouable ici : ${B.RULE_TEXT[info.rule]}`); render(); };
        }
        hand.append(cardEl(c, { cls, onclick }));
      });
      return hand;
    }

    function coachPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Les conseils sont désactivés. Activez-les ci-dessous.')); return box; }
      if ((g.phase === 'bid1' || g.phase === 'bid2') && g.bidder === 0) {
        const r = B.Bots.chooseBid(g.hands[0], g.turned, g.phase === 'bid1' ? 1 : 2, 0, g.dealer === 0);
        const best = r.options[0];
        box.append(el('div', { class: 'coach-box' },
          el('div', {}, `Meilleure couleur (avec la retourne) : `, el('strong', {}, `${B.suitTag(best.suit)} · ${best.ev.score.toFixed(1)}`), ` (seuil ${r.limit.toFixed(1)})`),
          el('div', {}, 'Suggestion : ', el('strong', {}, r.suit ? `prendre à ${B.suitTag(r.suit)}` : 'passer')),
          B.evalTable(best.ev)),
        el('p', { class: 'muted' }, 'Simple repère : valet et 9 d\'atout, des as et 3 atouts ou plus font une bonne prise.'));
      } else if (g.phase === 'play' && g.turn === 0) {
        const info = g.legalFor(0);
        box.append(el('p', {}, el('strong', {}, 'Règle : '), B.RULE_TEXT[info.rule]),
          el('button', { class: 'btn small', onclick: showHint }, '💡 Suggérer une carte'),
          hint && hint.card ? el('div', { class: 'coach-box' }, el('strong', {}, hint.card.text), ' – ', hint.reason) : null);
      } else box.append(el('p', { class: 'muted' }, 'Les conseils apparaissent quand c\'est votre tour.'));
      return box;
    }

    function infoPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, `Donne ${dealNo}`));
      const rows = [];
      if (g.trump) {
        rows.push(['Atout', B.suitTag(g.trump)]);
        rows.push(['Preneur', `${NAMES[g.taker]} (${g.taker % 2 === 0 ? 'nous' : 'eux'})`]);
        rows.push(['Pli', `${Math.min(g.trickNo + (g.trickComplete ? 0 : 1), 8)} / 8`]);
        if (settings.count) {
          rows.push(['Nos points', `${g.pointsSoFar(0)}`]);
          rows.push(['Leurs points', `${g.pointsSoFar(1)}`]);
          rows.push(['Preneur', `il lui faut ${B.NEED} (belote + dix de der compris)`]);
        }
      } else rows.push(['Phase', g.phase === 'bid1' ? 'Enchères (1er tour)' : g.phase === 'bid2' ? 'Enchères (2e tour)' : 'Enchères']);
      box.append(el('table', { class: 'score-pill' }, rows.map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))));
      return box;
    }

    function settingsPanel() {
      const defs = [
        ['highlight', 'Surligner les cartes jouables'],
        ['hints', 'Coach : conseils et aide aux enchères'],
        ['explain', 'Expliquer les choix des bots dans le journal'],
        ['count', 'Afficher le décompte des points en direct'],
      ];
      return el('div', { class: 'panel' }, el('h3', {}, 'Aides à l\'apprentissage'), defs.map(([k, label]) =>
        el('label', { class: 'switch' }, el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => {
          settings[k] = e.target.checked; B.Settings.set(settings); hint = null; render();
        } }), ' ' + label)),
      el('label', { class: 'switch' }, 'Partie en : ', el('select', { onchange: e => { settings.target = +e.target.value; B.Settings.set(settings); render(); } },
        [500, 1000, 2000].map(n => el('option', { value: n, selected: n === settings.target ? true : null }, n + ' points')))),
      el('div', { class: 'btn-row' }, el('button', { class: 'btn small', onclick: () => { if (window.confirm('Recommencer une nouvelle partie ?')) newGame(); } }, 'Nouvelle partie')));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l => el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, 'Journal'), box);
    }

    function scorePanel() {
      return el('div', { class: 'panel' }, el('h3', {}, `Score (partie en ${settings.target})`),
        el('table', { class: 'score-pill' }, [0, 1].map(t => el('tr', {}, el('td', {}, `${TEAM_NAME[t]} (${t === 0 ? 'Vous + Nord' : 'Est + Ouest'}) `), el('td', {}, String(scores[t]))))));
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      tableEl.append(seat(2), seat(3), centerArea(), seat(1), el('div', { class: 'actions' }, southActions(), seat(0), handEl()));
      sideEl.innerHTML = '';
      sideEl.append(infoPanel(), coachPanel(), settingsPanel(), scorePanel(), logPanel());
    }

    function showResult() {
      if (!alive || modalOpen) return;
      const r = game.result;
      const close = () => { modalHost.innerHTML = ''; modalOpen = false; };
      const over = scores[0] >= settings.target || scores[1] >= settings.target;
      const winner = scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1;
      const takerNous = r.takerTeam === 0;
      const rowFor = t => [
        TEAM_NAME[t] + (r.takerTeam === t ? ' (preneur)' : ''),
        `${game.pointsSoFar(t)} + ${r.lastTeam === t ? 10 : 0} (der)${r.capot === t ? ' + 90 (capot)' : ''}${r.belote[t] ? ' + 20 (belote)' : ''}`,
        String(r.scores[t]),
      ];
      modalOpen = true;
      modalHost.append(el('div', { class: 'modal-back' }, el('div', { class: 'modal' },
        el('h2', {}, r.made ? `${takerNous ? 'Nous remplissons' : 'Ils remplissent'} le contrat !` : `${takerNous ? 'Nous sommes' : 'Ils sont'} dedans.`),
        el('table', { class: 't' },
          el('tr', {}, el('th', {}, 'Atout'), el('td', { colspan: 2 }, B.suitTag(r.trump))),
          el('tr', {}, el('th', {}, 'Équipe'), el('th', {}, 'Points de la donne'), el('th', {}, 'Marque')),
          [0, 1].map(t => el('tr', {}, rowFor(t).map((x, i) => (i === 0 ? el('th', {}, x) : el('td', {}, x)))))),
        el('p', {}, r.made ? `Le preneur a fait ${r.takerTotal} points (il en fallait ${r.need}).`
          : `Le preneur n'a fait que ${r.takerTotal} points (il en fallait ${r.need}) : ses adversaires marquent ${r.capot != null ? 252 : 162} points.`),
        el('p', {}, el('strong', {}, `Total : Nous ${scores[0]} · Eux ${scores[1]}`)),
        over ? el('p', {}, el('strong', {}, winner === 0 ? '🏆 Vous gagnez la partie !' : winner === 1 ? 'Les adversaires gagnent la partie.' : 'Égalité !')) : null,
        el('div', { class: 'btn-row' },
          over ? el('button', { class: 'btn primary', onclick: newGame }, 'Nouvelle partie') : el('button', { class: 'btn primary', onclick: newDeal }, 'Donne suivante'),
          el('button', { class: 'btn', onclick: close }, 'Revoir la table'),
          el('a', { class: 'btn', href: '#/belote' }, 'Menu du jeu')))));
    }

    logDealStart();
    advance();
    return () => { alive = false; clearTimeout(timer); };
  }

  B.BeloteScreens = Object.assign(B.BeloteScreens || {}, { play: playScreen });
})(window.Belote = window.Belote || {});
