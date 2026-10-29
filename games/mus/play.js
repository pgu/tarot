/* El Mus Play screen: you + Marta (partner, opposite) vs Ana + Luis. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const B = S.MusBots;
  const Settings = S.makeSettings('mus.settings', { hints: true, explain: true, analysis: true });
  const POS = ['south', 'east', 'north', 'west'];
  const LANCE_LABEL = { grande: 'Grande', chica: 'Chica', pares: 'Pares', juego: 'Juego', punto: 'Punto' };
  const ACTION_LABEL = a => ({ paso: 'Paso', envido: `Envido ${a.amount}`, ordago: '¡Órdago!', quiero: 'Quiero', no: 'No quiero', subo: `Subo +${a.amount}` })[a.type];

  function playScreen(root) {
    const settings = Settings.get();
    let game = new S.Mus({});
    let discardSel = new Set();
    let timer = null;
    let alive = true;
    let hint = null;
    let seenResults = 0;
    const logLines = [];

    const tableEl = el('div', { class: 'table mus' });
    const sideEl = el('div', { class: 'side' });
    root.append(el('div', { class: 'play' }, tableEl, sideEl));

    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 160) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const nm = p => game.names[p];
    const coupleName = t => (t === 0 ? 'Your couple' : 'The rivals');
    const actText = (p, a) => {
      if (a.type === 'paso') return 'paso';
      if (a.type === 'envido') return `envido ${a.amount}`;
      if (a.type === 'ordago') return '¡ÓRDAGO!';
      if (a.type === 'quiero') return 'quiero';
      if (a.type === 'no') return 'no quiero';
      return `subo +${a.amount}`;
    };

    function logResults() {
      while (seenResults < game.results.length) {
        const r = game.results[seenResults++];
        if (r.how === 'skipped') { log(`${LANCE_LABEL[r.name]}: nobody takes part.`); continue; }
        const who = r.winnerTeam == null ? '—' : coupleName(r.winnerTeam);
        const how = { passed: 'all passed', accepted: 'bet accepted', refused: 'bet refused (no quiero)', solo: 'only one couple takes part', ordago: '¡órdago accepted!' }[r.how];
        log(`${LANCE_LABEL[r.kind]}: ${who} — ${how}${r.how === 'ordago' ? '' : `, ${r.points} piedra${r.points === 1 ? '' : 's'}`}.`);
      }
    }

    function newHand(first) {
      if (!first) game.nextHand();
      discardSel = new Set(); hint = null; seenResults = 0;
      log(`— Mano ${game.handNo}: ${nm(game.mano)} is mano (dealer: ${nm(game.dealer)}). —`);
      advance();
    }

    function advance() {
      clearTimeout(timer);
      logResults();
      render();
      if (!alive || game.phase === 'handover' || game.phase === 'gameover' || game.phase === 'recuento') return;
      const p = game.actor;
      if (p === 0 || p == null) return;
      later(950, () => botMove(p));
    }

    function botMove(p) {
      if (game.phase === 'mus') {
        const d = B.musDecision(game, p);
        game.musSay(p, d.mus);
        log(`${nm(p)}: ${d.mus ? 'mus.' : '¡no hay mus!'}`, settings.explain ? d.reason : null);
      } else if (game.phase === 'discard') {
        const d = B.chooseDiscard(game, p);
        game.discard(p, d.discard);
        log(`${nm(p)} discards ${d.discard.length} card${d.discard.length === 1 ? '' : 's'}.`, settings.explain ? d.reason : null);
        if (game.phase === 'mus') log('New cards dealt. Mus again?');
      } else if (game.phase === 'lance') {
        const a = B.lanceAction(game, p);
        const L = game.lance;
        game.act(p, a);
        log(`${nm(p)} (${LANCE_LABEL[L.kind]}): ${actText(p, a)}.`, settings.explain ? a.reason : null);
      }
      advance();
    }

    /* ---- human ---- */
    function guard(fn) { try { fn(); } catch (e) { log('⚠ ' + e.message); render(); } }
    function say(yes) {
      guard(() => { game.musSay(0, yes); log(`You: ${yes ? 'mus.' : '¡no hay mus!'}`); hint = null; advance(); });
    }
    function doDiscard() {
      guard(() => {
        const cards = game.hands[0].filter(c => discardSel.has(c.id));
        game.discard(0, cards);
        log(`You discard ${cards.length} card${cards.length === 1 ? '' : 's'}.`);
        discardSel = new Set(); hint = null;
        if (game.phase === 'mus') log('New cards dealt. Mus again?');
        advance();
      });
    }
    function lanceAct(a) {
      guard(() => { const L = game.lance; game.act(0, a); log(`You (${LANCE_LABEL[L.kind]}): ${actText(0, a)}.`); hint = null; advance(); });
    }

    /* ---- rendering ---- */
    function seat(p) {
      const g = game;
      const chips = [];
      if (g.mano === p) chips.push(el('span', { class: 'chip taker' }, 'mano'));
      if (g.actor === p) chips.push(el('span', { class: 'chip turn' }, 'speaks'));
      const L = g.lance;
      if (g.phase === 'lance' && L && (L.name === 'pares' || L.name === 'juego') && L.declared[p] != null && L.kind !== 'punto') {
        chips.push(el('span', { class: 'chip' }, L.declared[p] ? (L.name === 'pares' ? 'tengo pares' : 'tengo juego') : (L.name === 'pares' ? 'no tengo' : 'no hay juego')));
      }
      const mate = p === 2 ? ' (your partner)' : p % 2 === 1 ? ' (rival)' : '';
      return el('div', { class: 'seat ' + POS[p] },
        el('div', { class: 'name' }, nm(p) + mate, ' ', chips),
        p === 0 ? null : el('div', { class: 'backs' }, g.hands[p].map(() => cardEl(null, { back: true }))));
    }

    function lanceBar() {
      const g = game;
      const kinds = ['grande', 'chica', 'pares', 'juego'];
      const cur = g.phase === 'lance' && g.lance ? g.lance.name : null;
      const st = el('div', { class: 'lance-bar' }, kinds.map(k => {
        const r = g.results.find(x => x.name === k);
        let cls = 'lance-pill';
        if (cur === k) cls += ' current';
        if (r) cls += ' done';
        const label = k === 'juego' && ((cur === 'juego' && g.lance.kind === 'punto') || (r && r.kind === 'punto')) ? 'Punto' : LANCE_LABEL[k];
        return el('div', { class: cls }, label, r ? el('small', {}, r.winnerTeam == null ? ' —' : r.winnerTeam === 0 ? ' ✔ us' : ' ✘ them') : null);
      }));
      return st;
    }

    function betText() {
      const L = game.lance;
      if (game.phase !== 'lance' || !L || L.done) return '';
      if (L.stage === 'respond' && L.bet) {
        const b = L.bet;
        return b.ordago ? `¡ÓRDAGO de ${nm(b.by)}!` : `${nm(b.by)} bets ${b.amount} piedras${b.prev ? ` (raising ${b.prev})` : ''}. Answer, ${nm(L.responders[0])}.`;
      }
      return `${LANCE_LABEL[L.kind]}: ${nm(L.participants[L.openIdx])} to speak.`;
    }

    function centerArea() {
      const g = game;
      let msg = betText();
      if (g.phase === 'mus') msg = `${nm(g.actor)}: mus or no hay mus?${g.musRounds ? ` (round ${g.musRounds + 1} of mus)` : ''}`;
      if (g.phase === 'discard') msg = g.actor === 0 ? 'Select the cards to discard (0 to 4), then confirm.' : `${nm(g.actor)} is choosing the cards to discard…`;
      return el('div', { class: 'center-area', style: 'min-height:120px' }, lanceBar(), el('div', { class: 'msg' }, msg));
    }

    function actions() {
      const g = game;
      const box = el('div', { class: 'south-actions' });
      if (g.phase === 'handover' || g.phase === 'gameover') { box.append(resultPanel()); return box; }
      if (g.actor !== 0) return box;
      if (g.phase === 'mus') {
        box.append(el('button', { class: 'btn primary', onclick: () => say(true) }, 'Mus'), el('button', { class: 'btn', onclick: () => say(false) }, '¡No hay mus!'));
      } else if (g.phase === 'discard') {
        const n = discardSel.size;
        box.append(el('button', { class: 'btn primary', onclick: doDiscard }, n ? `Discard ${n} card${n > 1 ? 's' : ''}` : 'Keep all (no discard)'));
        if (settings.hints) box.append(el('button', { class: 'btn', onclick: () => { discardSel = new Set(B.chooseDiscard(g, 0).discard.map(c => c.id)); render(); } }, '💡 Select the coach\'s discard'));
      } else if (g.phase === 'lance') {
        g.options(0).forEach(a => box.append(el('button', { class: a.type === 'ordago' ? 'btn' : 'btn primary', style: a.type === 'no' || a.type === 'paso' ? '' : null, onclick: () => lanceAct(a) }, ACTION_LABEL(a))));
      }
      return box;
    }

    function resultPanel() {
      const g = game; const r = g.handResult;
      const panel = el('div', { class: 'panel', style: 'text-align:left;color:var(--ink);max-width:680px;margin:0 auto 10px' });
      panel.append(el('h3', {}, g.phase === 'gameover' ? (g.winner === 0 ? '🏆 You and Marta win the game!' : 'Ana and Luis win the game.') : 'Recuento'));
      panel.append(el('table', { class: 't' }, el('tr', {}, el('th', {}, 'Lance'), el('th', {}, 'Winner'), el('th', {}, 'How'), el('th', {}, 'Piedras')),
        g.results.map(x => el('tr', {}, el('td', {}, LANCE_LABEL[x.kind]), el('td', {}, x.winnerTeam == null ? '—' : x.winnerTeam === 0 ? 'Us' : 'Them'),
          el('td', {}, { passed: 'all passed', accepted: 'accepted bet', refused: 'refused (no quiero)', solo: 'only one couple', ordago: 'órdago', skipped: 'nobody' }[x.how]),
          el('td', {}, x.winnerTeam == null ? '0' : `${x.points}${x.extras ? ` (${x.stake} + ${x.extras})` : ''}`)))));
      panel.append(el('p', {}, 'Hands: ', [0, 1, 2, 3].map(p => el('span', { style: 'margin-right:14px' }, `${nm(p)}: ${g.hands[p].map(c => c.text).join(' ')}`))));
      panel.append(el('p', {}, `Gained this hand: us ${r.gained[0]}, them ${r.gained[1]}. Score: us ${g.scores[0]} – them ${g.scores[1]} (to ${g.target}).`));
      panel.append(el('button', { class: 'btn primary', onclick: () => { logLines.length = 0; if (g.phase === 'gameover') { game = new S.Mus({}); newHand(true); } else newHand(false); } }, g.phase === 'gameover' ? 'New game' : 'Next hand'));
      return panel;
    }

    function handEl() {
      const g = game;
      const canSel = g.phase === 'discard' && g.actor === 0;
      return el('div', { class: 'hand flat' }, g.hands[0].map(c => cardEl(c, {
        cls: discardSel.has(c.id) ? 'selected' : '',
        onclick: canSel ? (() => { if (discardSel.has(c.id)) discardSel.delete(c.id); else discardSel.add(c.id); render(); }) : null,
      })));
    }

    function coachPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      const d = S.musDescribe(g.hands[0]);
      if (settings.analysis) box.append(S.musDescTable(g.hands[0]));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Advice is off. Enable it below.')); return box; }
      if (g.actor !== 0) { box.append(el('p', { class: 'muted' }, 'Advice appears on your turn.')); return box; }
      if (g.phase === 'mus') {
        const m = B.musDecision(g, 0, { deterministic: true });
        box.append(el('div', { class: 'coach-box' }, el('strong', {}, m.mus ? 'Mus' : '¡No hay mus!'), el('div', {}, m.reason)));
      } else if (g.phase === 'discard') {
        const x = B.chooseDiscard(g, 0);
        box.append(el('div', { class: 'coach-box' }, el('strong', {}, x.discard.length ? `Discard ${x.discard.map(c => c.text).join(' ')}` : 'Keep everything'), el('div', {}, x.reason)));
      } else if (g.phase === 'lance') {
        if (!hint) hint = B.lanceAction(g, 0, { deterministic: true, iters: 500 });
        const L = g.lance;
        const mine = L.kind === 'grande' ? d.grande : L.kind === 'chica' ? d.chica : L.kind === 'pares' ? d.pares : d.juego;
        box.append(el('p', {}, el('strong', {}, `${LANCE_LABEL[L.kind]}: `), mine),
          el('div', { class: 'coach-box' }, el('strong', {}, ACTION_LABEL(hint)), el('div', {}, hint.reason),
            el('div', { class: 'muted' }, 'This estimate does not know your partner\'s cards: it assumes random ones.')));
      }
      return box;
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      tableEl.append(seat(2), seat(3), centerArea(), seat(1), el('div', { class: 'actions' }, actions(),
        el('div', { class: 'seat south' }, el('div', { class: 'name' }, 'You ', game.mano === 0 ? el('span', { class: 'chip taker' }, 'mano') : null, game.actor === 0 ? el('span', { class: 'chip turn' }, 'your turn') : null)),
        handEl()));
      sideEl.innerHTML = '';
      sideEl.append(scorePanel(), coachPanel(), settingsPanel(), logPanel());
    }

    function scorePanel() {
      const bar = (v, c) => el('div', { class: 'scorebar' }, el('div', { class: 'fill ' + c, style: `width:${Math.min(100, v / game.target * 100)}%` }));
      return el('div', { class: 'panel' }, el('h3', {}, `Piedras (to ${game.target})`),
        el('div', {}, el('strong', {}, `Us (You + Marta): ${game.scores[0]}`), bar(game.scores[0], 'us')),
        el('div', { style: 'margin-top:6px' }, el('strong', {}, `Them (Ana + Luis): ${game.scores[1]}`), bar(game.scores[1], 'them')));
    }

    function settingsPanel() {
      const defs = [['hints', 'Coach: advice & win chances'], ['analysis', 'Show what my hand is worth'], ['explain', "Explain the bots' choices in the log"]];
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

  S.MusScreens = Object.assign(S.MusScreens || {}, { play: playScreen });
})(window.Spanish = window.Spanish || {});
