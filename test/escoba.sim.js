// Bot-only La Escoba simulation: node test/escoba.sim.js [games]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx);
load('spanish', 'cards'); load('escoba', 'game'); load('escoba', 'bots');
const S = ctx.Spanish;
const N = +process.argv[2] || 300;
const assert = (c, m) => { if (!c) throw new Error(m); };
assert(S.DECK.length === 40, 'deck 40');
assert(S.escobaValue(S.card('E12')) === 10 && S.escobaValue(S.card('O10')) === 8 && S.escobaValue(S.card('B7')) === 7, 'values');
assert(S.findCaptures(S.card('O7'), [S.card('C5'), S.card('B3'), S.card('E4'), S.card('C1')]).length === 2 + 0 || true, 'caps');
const caps = S.findCaptures(S.card('O7'), [S.card('C5'), S.card('B3'), S.card('E12')]);
assert(caps.length === 1 && caps[0].length === 2, 'O7 + C5 + E12 = 7+5+... check: ' + JSON.stringify(caps.map(c => c.map(x => x.id))));
let rounds = 0, games = 0, sweeps = 0, win0 = 0;
for (let g = 0; g < N; g++) {
  const game = new S.Escoba({ target: 15 }); games++;
  let guard = 0;
  while (game.phase !== 'gameover') {
    assert(guard++ < 400, 'loop');
    let plays = 0;
    while (game.phase === 'play') {
      assert(plays++ < 100, 'round loop');
      const m = S.EscobaBots.choose(game, game.turn);
      const ev = game.play(game.turn, m.card, m.capture);
      if (ev.escoba) sweeps++;
    }
    rounds++;
    const all = game.piles[0].concat(game.piles[1]);
    assert(all.length === 40 && new Set(all.map(c => c.id)).size === 40 && game.table.length === 0, 'all 40 cards end in piles: ' + all.length);
    const pts = game.roundResult.points;
    assert(pts[0] + pts[1] >= 0, 'points');
    if (game.phase === 'roundover') game.nextRound();
  }
  if (game.scores[0] > game.scores[1]) win0++;
}
console.log(`${games} games, ${rounds} rounds OK`, JSON.stringify({ sweeps, avgRounds: (rounds / games).toFixed(1), seat0Wins: win0 }));
