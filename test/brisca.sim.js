// Bot-only La Brisca simulation: node test/brisca.sim.js [hands]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx);
load('spanish', 'cards'); load('tute', 'game'); load('tute', 'bots'); load('brisca', 'game');
const S = ctx.Spanish;
const assert = (c, m) => { if (!c) throw new Error('FAIL ' + m); };
const N = +process.argv[2] || 500;
let wins = [0, 0], ties = 0, avg = 0;
for (let g = 0; g < N; g++) {
  const game = new S.Brisca({ dealer: g % 2 });
  let guard = 0;
  while (game.phase !== 'done') {
    assert(guard++ < 100, 'loop');
    if (game.trickComplete) { game.collectTrick(); continue; }
    const p = game.turn;
    game.play(p, S.TuteBots.chooseCard(game.ctxFor(p)).card);
    const all = game.stock.length + game.hands[0].length + game.hands[1].length + game.piles[0].length + game.piles[1].length + game.trick.length;
    assert(all === 40, 'cards conserved ' + all);
  }
  const r = game.result;
  assert(r.points[0] + r.points[1] === 120, 'points = 120');
  assert(game.piles[0].length + game.piles[1].length === 40, 'all captured');
  if (r.winner == null) ties++; else wins[r.winner]++;
  avg += Math.max(...r.points);
}
console.log(`${N} hands OK`, JSON.stringify({ wins, ties, avgWinnerPoints: (avg / N).toFixed(1) }));
