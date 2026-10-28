// Headless simulation: node test/sim.js [games]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
for (const f of ['cards', 'rules', 'bots', 'game'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', f + '.js'), 'utf8'), ctx, { filename: f });
const T = ctx.Tarot;
const N = +process.argv[2] || 500;
const assert = (c, m) => { if (!c) throw new Error(m); };
assert(T.DECK.length === 78, 'deck size');
assert(Math.abs(T.sumPoints(T.DECK) - 91) < 1e-9, 'deck points');
const stats = { passed: 0, win: 0, loss: 0, byContract: {} };
for (let g = 0; g < N; g++) {
  const game = new T.Game({ dealer: g % 4 });
  let guard = 0;
  while (game.phase !== 'done' && game.phase !== 'passed') {
    assert(guard++ < 500, 'infinite loop');
    if (game.trickComplete) { game.collectTrick(); continue; }
    game.botStep();
  }
  if (game.phase === 'passed') { stats.passed++; continue; }
  const r = game.result;
  const all = game.piles.taker.concat(game.piles.def);
  assert(all.length === 78, 'cards accounted: ' + all.length);
  assert(new Set(all.map(c => c.id)).size === 78, 'duplicates');
  assert(Math.abs(r.takerPoints + r.defPoints - 91) < 1e-9, 'points sum');
  assert(r.totals.reduce((a, b) => a + b, 0) === 0, 'zero sum');
  r.win ? stats.win++ : stats.loss++;
  stats.byContract[r.contract] = (stats.byContract[r.contract] || 0) + 1;
}
console.log(N, 'games OK', JSON.stringify(stats));
