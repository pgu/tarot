/* Le Rami Play screen: you vs 1-3 bots. */
(function (R, P) {
  'use strict';
  const { el, cardEl, lab, meldName } = R;
  const B = R.RamiBots;
  const Settings = R.Settings;

  function playScreen(root) {
    const settings = Settings.get();
    let game;
    let selected = new Set();
    let staged = [];
    let note = '';
    let timer = null;
    let alive = true;
    let coachCache = null;
    const logLines = [];

    const tableEl = el('div', { class: 'table rami' });
    const sideEl = el('div', { class: 'side' });
    root.append(el('div', { class: 'play' }, tableEl, sideEl));

    const log = (text, why) => { if (text) { logLines.push({ text, why }); if (logLines.length > 150) logLines.shift(); } };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const nm = i => game.names[i];

    function newGame() {
      game = new R.Rami({ players: settings.players, rounds: settings.rounds });
      logLines.length = 0;
      startLog();
      advance();
    }
    function startLog() {
      selected = new Set(); staged = []; note = ''; coachCache = null;
      log(`— Manche ${game.round}/${game.rounds} — donneur : ${nm(game.dealer)} ; ${nm(game.turn)} commence (défausse : ${game.top().text}).`);
    }

    /* ---------- flow ---------- */
    function advance() {
      clearTimeout(timer);
      render();
      if (!alive || game.phase === 'roundover' || game.phase === 'gameover') { if (game.result && !loggedEnd) logEnd(); return; }
      if (game.turn === 0) return;
      const p = game.turn;
      if (game.phase === 'draw') {
        later(900, () => {
          const w = B.wantsDiscard(game, p);
          if (w.take) { const c = game.top(); game.drawDiscard(p); log(`${nm(p)} prend ${c.text} dans la défausse.`, settings.explain ? w.reason : null); }
          else { game.drawStock(p); log(`${nm(p)} pioche.`, settings.explain ? w.reason : null); }
          advance();
        });
      } else {
        later(1200, () => { B.playTurn(game, p).forEach(t => log(t)); advance(); });
      }
    }

    let loggedEnd = false;
    function logEnd() {
      loggedEnd = true;
      const r = game.result;
      log(r.stalemate ? 'Manche nulle : personne ne peut finir ; chacun compte sa main.' : `${nm(r.winner)} fait Rami ! Pénalités : ` + r.penalties.map((v, i) => `${nm(i)} ${v}`).join(', ') + '.');
      render();
    }

    /* ---------- human actions ---------- */
    const handCards = () => game.hands[0];
    const selCards = () => handCards().filter(c => selected.has(c.id));
    const stagedSet = () => new Set(staged.flat().map(c => c.id));

    function guard(fn) { try { fn(); } catch (e) { note = '⚠ ' + e.message; render(); } }
    function drawStock() { guard(() => { game.drawStock(0); log('Vous piochez.'); note = ''; advance(); }); }
    function drawDiscard() { guard(() => { const c = game.top(); game.drawDiscard(0); log(`Vous prenez ${c.text} dans la défausse.`); note = ''; advance(); }); }
    function toggle(c) {
      if (game.phase !== 'play' || game.turn !== 0 || stagedSet().has(c.id)) return;
      if (selected.has(c.id)) selected.delete(c.id); else selected.add(c.id);
      note = ''; render();
    }
    function stage() {
      const cards = selCards();
      const an = R.analyze(cards);
      if (!an) { note = '⚠ ' + R.whyNot(cards); render(); return; }
      staged.push(an.cards); selected = new Set(); note = ''; render();
    }
    function unstage(i) { staged.splice(i, 1); note = ''; render(); }
    function lay() {
      guard(() => {
        const r = game.layDown(0, staged);
        log(`Vous posez ${staged.map(lab).join(' | ')} (${r.points} points).`);
        staged = []; selected = new Set(); note = ''; coachCache = null; advance();
      });
    }
    function addTo(id) {
      guard(() => { const cards = selCards(); game.extend(0, id, cards); log(`Vous ajoutez ${lab(cards)} à une combinaison.`); selected = new Set(); note = ''; coachCache = null; advance(); });
    }
    function takeJoker(id) {
      guard(() => { const c = selCards()[0]; game.swapJoker(0, id, c); log(`Vous récupérez un joker avec ${c.text}.`); selected = new Set(); note = ''; coachCache = null; advance(); });
    }
    function discard() {
      guard(() => {
        const cards = selCards();
        if (cards.length !== 1) throw new Error('Sélectionnez exactement une carte à défausser.');
        if (staged.length) throw new Error('Posez d\'abord (ou annulez) les combinaisons préparées.');
        game.discard(0, cards[0]);
        log(`Vous défaussez ${cards[0].text}.`);
        selected = new Set(); note = ''; coachCache = null; advance();
      });
    }
    function useCoach() {
      const c = coach();
      if (c.arr && c.arr.melds.length) { staged = c.arr.melds.map(a => a.cards); selected = new Set(); note = ''; render(); }
    }

    /* ---------- coach ---------- */
    function coach() {
      const key = game.hands[0].map(c => c.id).join() + game.opened[0] + game.table.length + game.phase;
      if (coachCache && coachCache.key === key) return coachCache.data;
      let data;
      if (game.phase === 'draw') data = { draw: B.wantsDiscard(game, 0) };
      else {
        const hand = game.hands[0];
        const open = !game.opened[0] ? R.bestArrangement(hand, 'open') : null;
        const arr = game.opened[0] ? R.bestArrangement(hand, 'cards') : (open && open.points >= R.OPEN_MIN ? open : null);
        const all = R.bestArrangement(hand, 'cards');
        data = { open, arr, all, disc: B.chooseDiscard(game, 0) };
      }
      coachCache = { key, data };
      return data;
    }

    function coachPanel() {
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Le coach est désactivé. Activez-le ci-dessous.')); return box; }
      if (game.turn !== 0 || !['draw', 'play'].includes(game.phase)) { box.append(el('p', { class: 'muted' }, 'Les conseils apparaissent à votre tour.')); return box; }
      const c = coach();
      if (c.draw) { box.append(el('div', { class: 'coach-box' }, el('strong', {}, c.draw.take ? `Prenez ${game.top().text}` : 'Piochez'), el('div', {}, c.draw.reason))); return box; }
      const lines = [];
      if (!game.opened[0]) {
        if (c.arr) lines.push(`Vous pouvez ouvrir : ${c.arr.points} points (${c.arr.melds.map(a => meldName(a) + ' ' + lab(a.cards)).join(' | ')}).`);
        else if (c.open) lines.push(`Pas encore : le meilleur total avec une suite sans joker est ${c.open.points} points (il en faut ${R.OPEN_MIN}).`);
        else lines.push(c.all.melds.length ? `Vous avez ${c.all.melds.length} combinaison(s) mais aucune suite sans joker: impossible d'ouvrir.` : 'Pas encore de combinaison. Gardez les paires et les cartes voisines.');
      } else if (c.arr && c.arr.melds.length) lines.push(`Vous pouvez poser : ${c.arr.melds.map(a => meldName(a) + ' ' + lab(a.cards)).join(' | ')}.`);
      else lines.push('Rien à poser pour le moment : cherchez à ajouter des cartes sur la table.');
      box.append(el('div', { class: 'coach-box' }, lines.map(l => el('div', {}, l)),
        c.arr && c.arr.melds.length ? el('button', { class: 'btn small', onclick: useCoach }, 'Préparer ces combinaisons') : null,
        el('div', { style: 'margin-top:6px' }, el('strong', {}, `Défausse conseillée : ${c.disc.card.text}`), el('div', { class: 'muted' }, c.disc.reason))));
      return box;
    }

    /* ---------- rendering ---------- */
    const POS = { 2: [0, 0], 3: [0, 1, 2], 4: [0, 1, 2, 3] };
    function oppRow() {
      const others = [];
      for (let k = 1; k < game.n; k++) {
        const i = (game.turn != null && false) ? k : k;
        others.push(el('div', { class: 'opp' + (game.turn === i ? ' active' : '') },
          el('div', { class: 'name' }, nm(i), ' ', game.opened[i] ? el('span', { class: 'chip taker' }, 'ouvert') : el('span', { class: 'chip' }, 'pas ouvert'), game.turn === i ? el('span', { class: 'chip turn' }, 'joue') : null),
          el('div', { class: 'backs rami-backs' }, game.hands[i].map(() => cardEl(null, { back: true }))),
          el('div', { class: 'muted', style: 'color:#cfe' }, `${game.hands[i].length} cartes · ${game.scores[i]} pts`)));
      }
      return el('div', { class: 'opp-row' }, others);
    }

    function centerArea() {
      const myDraw = game.phase === 'draw' && game.turn === 0;
      const stock = cardEl(null, { back: true, cls: myDraw ? 'clickable' : '' });
      if (myDraw) stock.addEventListener('click', drawStock);
      const top = game.top();
      const topEl = top ? cardEl(top, { onclick: myDraw ? drawDiscard : null }) : el('div', { class: 'empty-slot' });
      let msg = '';
      if (game.phase === 'draw') msg = game.turn === 0 ? 'À vous : piochez dans la pioche ou prenez la défausse.' : `${nm(game.turn)} joue…`;
      else if (game.phase === 'play') msg = game.turn === 0 ? 'Posez vos combinaisons, ajoutez des cartes, puis défaussez une carte.' : `${nm(game.turn)} joue…`;
      return el('div', { class: 'center-area', style: 'min-height:0' },
        el('div', { class: 'row-piles' },
          el('div', { class: 'pile' }, stock, el('div', { class: 'muted', style: 'color:#cfe' }, `Pioche (${game.stock.length})`)),
          el('div', { class: 'pile' }, topEl, el('div', { class: 'muted', style: 'color:#cfe' }, `Défausse (${game.discardPile.length})`))),
        el('div', { class: 'msg' }, note || msg));
    }

    function tablePanel() {
      const box = el('div', { class: 'meld-table' });
      if (!game.table.length) { box.append(el('div', { class: 'muted', style: 'color:#cfe;text-align:center' }, 'Aucune combinaison sur la table.')); return box; }
      const mine = game.phase === 'play' && game.turn === 0;
      const sc = selCards();
      for (let o = 0; o < game.n; o++) {
        const ms = game.table.filter(m => m.owner === o);
        if (!ms.length) continue;
        box.append(el('div', { class: 'meld-owner' }, `Combinaisons de ${nm(o)}`));
        const row = el('div', { class: 'melds' });
        ms.forEach(m => {
          const canAdd = mine && sc.length && game.checkExtend(0, m.id, sc);
          const canJoker = mine && sc.length === 1 && game.opened[0] && R.canReplaceJoker(m.an, sc[0]);
          row.append(el('div', { class: 'meld' },
            el('div', { class: 'cap' }, `${meldName(m.an)} · ${m.an.points} pts`),
            el('div', { class: 'cards-row mini5' }, m.cards.map(c => cardEl(c))),
            mine ? el('div', {}, el('button', { class: 'btn small', disabled: !canAdd, onclick: () => addTo(m.id) }, '+ Ajouter'),
              m.an.joker ? el('button', { class: 'btn small', disabled: !canJoker, onclick: () => takeJoker(m.id) }, '🃏 Prendre') : null) : null));
        });
        box.append(row);
      }
      return box;
    }

    function stagingPanel() {
      const mine = game.phase === 'play' && game.turn === 0;
      if (!mine) return null;
      const total = staged.reduce((s, g) => s + (R.analyze(g) ? R.analyze(g).points : 0), 0);
      const pure = staged.some(g => { const a = R.analyze(g); return a && a.type === 'run' && a.pure; });
      const req = !game.opened[0] ? ` — pour ouvrir : ${R.OPEN_MIN} points + une suite sans joker (${total >= R.OPEN_MIN ? '✓' : '✗'} points, ${pure ? '✓' : '✗'} suite sans joker)` : '';
      return el('div', { class: 'staging' },
        el('div', { class: 'muted', style: 'color:#cfe' }, staged.length ? `À poser : ${total} points${req}` : 'Sélectionnez des cartes puis « Former une combinaison ».'),
        el('div', { class: 'melds' }, staged.map((g, i) => el('div', { class: 'meld' }, el('div', { class: 'cards-row mini5' }, g.map(c => cardEl(c))), el('button', { class: 'btn small', onclick: () => unstage(i) }, '✕')))));
    }

    function actions() {
      const box = el('div', { class: 'south-actions' });
      if (game.phase === 'roundover' || game.phase === 'gameover') { box.append(resultPanel()); return box; }
      if (game.turn !== 0) return box;
      if (game.phase === 'draw') {
        box.append(el('button', { class: 'btn primary', onclick: drawStock }, 'Piocher'), el('button', { class: 'btn', onclick: drawDiscard }, `Prendre ${game.top().text}`));
        return box;
      }
      const sc = selCards();
      box.append(el('button', { class: 'btn', disabled: sc.length < 3, onclick: stage }, `Former une combinaison (${sc.length})`),
        el('button', { class: 'btn primary', disabled: !staged.length, onclick: lay }, 'Poser'),
        el('button', { class: 'btn', disabled: sc.length !== 1 || !!staged.length, onclick: discard }, sc.length === 1 ? `Défausser ${sc[0].text}` : 'Défausser (1 carte)'));
      return box;
    }

    function resultPanel() {
      const r = game.result;
      const panel = el('div', { class: 'panel', style: 'text-align:left;color:var(--ink);max-width:560px;margin:0 auto 10px' });
      const over = game.phase === 'gameover';
      const best = Math.min(...game.scores);
      panel.append(el('h3', {}, over ? (game.scores[0] === best ? '🏆 Vous gagnez la partie !' : `${nm(game.scores.indexOf(best))} gagne la partie.`) : r.stalemate ? 'Manche nulle' : r.winner === 0 ? 'Rami ! Vous gagnez la manche 🎉' : `${nm(r.winner)} fait Rami`),
        el('table', { class: 't' }, el('tr', {}, el('th', {}, 'Joueur'), el('th', {}, 'Cartes restantes'), el('th', {}, 'Manche'), el('th', {}, 'Total')),
          game.names.map((n, i) => el('tr', {}, el('td', {}, n), el('td', {}, game.opened[i] || i === r.winner ? game.hands[i].map(c => c.text).join(' ') || '—' : `${game.hands[i].length} cartes (pas ouvert: 100)`), el('td', {}, '+' + r.penalties[i]), el('td', {}, String(game.scores[i]))))),
        over ? el('button', { class: 'btn primary', onclick: () => { loggedEnd = false; newGame(); } }, 'Nouvelle partie')
          : el('button', { class: 'btn primary', onclick: () => { loggedEnd = false; game.nextRound(); startLog(); advance(); } }, 'Manche suivante'));
      return panel;
    }

    function handEl() {
      const mine = game.phase === 'play' && game.turn === 0;
      const hidden = stagedSet();
      return el('div', { class: 'hand flat' }, game.hands[0].filter(c => !hidden.has(c.id)).map(c =>
        cardEl(c, { cls: selected.has(c.id) ? 'selected' : '', onclick: mine ? toggle : null })));
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      tableEl.append(oppRow(), centerArea(), tablePanel(), el('div', { class: 'actions' }, stagingPanel(), actions(),
        el('div', { class: 'seat south' }, el('div', { class: 'name' }, 'Vous ', game.opened[0] ? el('span', { class: 'chip taker' }, 'ouvert') : el('span', { class: 'chip' }, 'pas ouvert'), game.turn === 0 ? el('span', { class: 'chip turn' }, 'à vous') : null)),
        handEl()));
      sideEl.innerHTML = '';
      sideEl.append(scorePanel(), coachPanel(), settingsPanel(), logPanel());
    }

    function scorePanel() {
      return el('div', { class: 'panel' }, el('h3', {}, `Points (manche ${game.round}/${game.rounds}) — le plus bas gagne`),
        el('table', {}, game.names.map((n, i) => el('tr', {}, el('td', {}, n + ' '), el('td', {}, String(game.scores[i]))))));
    }

    function settingsPanel() {
      const defs = [['hints', 'Coach : conseils'], ['explain', 'Expliquer les choix des bots dans le journal']];
      return el('div', { class: 'panel' }, el('h3', {}, 'Aides à l\'apprentissage'),
        defs.map(([k, label]) => el('label', { class: 'switch' }, el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => { settings[k] = e.target.checked; Settings.set(settings); coachCache = null; render(); } }), ' ' + label)),
        el('label', { class: 'switch' }, 'Joueurs : ', el('select', { onchange: e => { settings.players = +e.target.value; Settings.set(settings); loggedEnd = false; newGame(); } }, [2, 3, 4].map(n => el('option', { value: n, selected: n === settings.players ? true : null }, n)))),
        el('label', { class: 'switch' }, 'Manches : ', el('select', { onchange: e => { settings.rounds = +e.target.value; Settings.set(settings); loggedEnd = false; newGame(); } }, [3, 5, 7].map(n => el('option', { value: n, selected: n === settings.rounds ? true : null }, n)))));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l => el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, 'Journal'), box);
    }

    newGame();
    return () => { alive = false; clearTimeout(timer); };
  }

  R.RamiScreens = Object.assign(R.RamiScreens || {}, { play: playScreen });
  void P;
})(window.Rami = window.Rami || {}, window.Poker);
