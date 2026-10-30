/* El Siete y medio Play screen: you vs 2-3 bots, the bank rotates. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const B = S.SMBots;
  const fmt = S.smFmt;
  const Settings = S.makeSettings('sietemedio.settings', { hints: true, explain: true, players: 4 });
  const POS = { 3: ['south', 'east', 'west'], 4: ['south', 'east', 'north', 'west'] };

  function playScreen(root) {
    const settings = Settings.get();
    let game;
    let timer = null;
    let alive = true;
    let endLogged = false;
    const logLines = [];

    const tableEl = el('div', { class: 'table sietemedio' });
    const sideEl = el('div', { class: 'side' });
    root.append(el('div', { class: 'play' }, tableEl, sideEl));

    const log = (text, why) => { logLines.push({ text, why }); if (logLines.length > 150) logLines.shift(); };
    const later = (ms, fn) => { clearTimeout(timer); timer = setTimeout(() => { if (alive) fn(); }, ms); };
    const nm = i => game.names[i];

    function newGame() { game = new S.SieteMedio({ players: settings.players }); logLines.length = 0; startRound(); }
    function startRound() {
      endLogged = false;
      log(`— Round ${game.round} — the bank is ${nm(game.bank)}${game.bank === 0 ? ' (you)' : ''}. —`);
      advance();
    }

    function advance() {
      clearTimeout(timer);
      render();
      if (!alive) return;
      if (game.phase !== 'play') {
        if (!endLogged) {
          endLogged = true;
          const r = game.result;
          log(`Bank ${nm(r.bank)}: ${r.bankBust ? 'went over' : fmt(r.bankTotal)}${r.bankNatural ? ' (siete y medio real!)' : ''}.`);
          r.duels.forEach(d => log(`${nm(d.player)}: ${d.bust ? 'went over' : fmt(d.total)} → ${nm(d.winner)} wins +${d.points}.`));
          render();
        }
        return;
      }
      const p = game.turn;
      if (p === 0) return;
      later(900, () => {
        const d = B.decide(game, p);
        if (d.hit) { game.hit(p); const t = game.total(p); log(`${nm(p)}: carta.${game.state[p] === 'bust' ? ' ¡Me paso!' : ''}`, settings.explain ? d.reason : null); void t; }
        else { game.stand(p); log(`${nm(p)}: me planto.`, settings.explain ? d.reason : null); }
        advance();
      });
    }

    function humanHit() { game.hit(0); log(`You: carta (${game.state[0] === 'bust' ? '¡me paso!' : 'total ' + fmt(game.total(0))}).`); advance(); }
    function humanStand() { game.stand(0); log(`You: me planto con ${fmt(game.total(0))}.`); advance(); }

    function seat(i) {
      const g = game;
      const chips = [];
      if (g.bank === i) chips.push(el('span', { class: 'chip taker' }, 'banca'));
      if (g.turn === i) chips.push(el('span', { class: 'chip turn' }, 'plays'));
      if (g.state[i] === 'stand' && g.phase === 'play') chips.push(el('span', { class: 'chip' }, 'plantado'));
      if (g.state[i] === 'bust') chips.push(el('span', { class: 'chip' }, 'se pasa'));
      const reveal = g.phase !== 'play';
      return el('div', { class: 'seat ' + POS[g.n][i] },
        el('div', { class: 'name' }, nm(i), ' ', chips, el('span', { class: 'chip' }, `${g.scores[i]} pts`)),
        el('div', { class: 'pcards sm' }, reveal ? g.hands[i].map(c => cardEl(c)) : g.hands[i].map(() => cardEl(null, { back: true }))),
        reveal ? el('div', { class: 'muted', style: 'color:#cfe' }, g.state[i] === 'bust' ? `${fmt(g.total(i))} (over)` : fmt(g.total(i))) : null);
    }

    function actions() {
      const g = game;
      const box = el('div', { class: 'south-actions' });
      if (g.phase !== 'play') {
        const r = g.result;
        box.append(el('div', { class: 'panel', style: 'text-align:left;color:var(--ink);max-width:560px;margin:0 auto 10px' },
          el('h3', {}, g.phase === 'gameover' ? (g.winner === 0 ? '🏆 You win the game!' : `${nm(g.winner)} wins the game.`) : 'Round over'),
          el('table', { class: 't' }, el('tr', {}, el('th', {}, 'Duel'), el('th', {}, 'Player'), el('th', {}, 'Bank'), el('th', {}, 'Winner')),
            r.duels.map(d => el('tr', {}, el('td', {}, nm(d.player) + ' vs ' + nm(r.bank)), el('td', {}, d.bust ? 'over' : fmt(d.total) + (d.natural ? ' real' : '')), el('td', {}, r.bankBust ? 'over' : fmt(r.bankTotal) + (r.bankNatural ? ' real' : '')),
              el('td', {}, `${nm(d.winner)} +${d.points}`)))),
          g.phase === 'gameover' ? el('button', { class: 'btn primary', onclick: newGame }, 'New game') : el('button', { class: 'btn primary', onclick: () => { g.nextRound(); startRound(); } }, 'Next round')));
        return box;
      }
      if (g.turn === 0) box.append(el('button', { class: 'btn primary', onclick: humanHit }, 'Carta'), el('button', { class: 'btn', onclick: humanStand }, 'Me planto'));
      return box;
    }

    function centerArea() {
      const g = game;
      const msg = g.phase !== 'play' ? '' : g.turn === 0 ? (g.bank === 0 ? 'You are the bank: you play last. Carta or me planto?' : 'Your turn: carta or me planto?') : `${nm(g.turn)} is playing…`;
      return el('div', { class: 'center-area', style: 'min-height:90px' }, el('div', { class: 'msg' }, msg));
    }

    function coachPanel() {
      const g = game;
      const box = el('div', { class: 'panel' }, el('h3', {}, '🎓 Coach'));
      if (!settings.hints) { box.append(el('p', { class: 'muted' }, 'Coach is off. Enable it below.')); return box; }
      if (g.phase !== 'play' || g.turn !== 0) { box.append(el('p', { class: 'muted' }, 'Advice appears on your turn.')); return box; }
      const d = B.advise(g, 0);
      box.append(el('table', {}, [['Your total', fmt(g.total(0))], ['Risk of going over', B.pct(d.bust)], ['Chance of exactly 7½', B.pct(d.exact)], g.bank === 0 ? ['Players still in', String(g.survivors())] : null].filter(Boolean)
        .map(r => el('tr', {}, el('td', { class: 'muted' }, r[0] + ' '), el('td', {}, r[1])))),
        el('div', { class: 'coach-box' }, el('strong', {}, d.hit ? 'Carta' : 'Me planto'), el('div', {}, d.reason)));
      return box;
    }

    function render() {
      if (!alive) return;
      tableEl.innerHTML = '';
      const others = [...Array(game.n - 1).keys()].map(k => seat(k + 1));
      const mine = game.hands[0];
      tableEl.append(el('div', { class: 'opp-row' }, others), centerArea(), el('div', { class: 'actions' }, actions(),
        el('div', { class: 'seat south' }, el('div', { class: 'name' }, 'You ', game.bank === 0 ? el('span', { class: 'chip taker' }, 'banca') : null, game.turn === 0 ? el('span', { class: 'chip turn' }, 'your turn') : null,
          el('span', { class: 'chip' }, `${game.scores[0]} pts`), ` total ${fmt(game.total(0))}`, game.state[0] === 'bust' ? ' — ¡te pasas!' : '')),
        el('div', { class: 'hand flat' }, mine.map(c => cardEl(c)))));
      sideEl.innerHTML = '';
      sideEl.append(scorePanel(), coachPanel(), settingsPanel(), logPanel());
    }

    function scorePanel() {
      return el('div', { class: 'panel' }, el('h3', {}, `Points (to ${game.target})`),
        el('table', {}, game.names.map((n, i) => el('tr', {}, el('td', {}, n + (game.bank === i ? ' (banca) ' : ' ')), el('td', {}, String(game.scores[i]))))));
    }

    function settingsPanel() {
      const defs = [['hints', 'Coach: risk and advice'], ['explain', "Explain the bots' choices in the log"]];
      return el('div', { class: 'panel' }, el('h3', {}, 'Learning aids'),
        defs.map(([k, label]) => el('label', { class: 'switch' }, el('input', { type: 'checkbox', checked: settings[k] ? true : null, onchange: e => { settings[k] = e.target.checked; Settings.set(settings); render(); } }), ' ' + label)),
        el('label', { class: 'switch' }, 'Players: ', el('select', { onchange: e => { settings.players = +e.target.value; Settings.set(settings); newGame(); } }, [3, 4].map(n => el('option', { value: n, selected: n === settings.players ? true : null }, n)))));
    }

    function logPanel() {
      const box = el('div', { class: 'log' }, logLines.map(l => el('div', {}, l.text, l.why ? el('div', { class: 'why' }, '↳ ' + l.why) : null)));
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 0);
      return el('div', { class: 'panel' }, el('h3', {}, 'Log'), box);
    }

    newGame();
    return () => { alive = false; clearTimeout(timer); };
  }

  S.SMScreens = Object.assign(S.SMScreens || {}, { play: playScreen });
})(window.Spanish = window.Spanish || {});
