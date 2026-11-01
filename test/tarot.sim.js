// Headless simulation: node test/sim.js [games]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
ctx.Core = { t: (en, fr) => (process.env.LANG_FR ? fr : en), get lang() { return process.env.LANG_FR ? 'fr' : 'en'; } }; // i18n stub
for (const f of ['cards', 'rules', 'bots', 'game'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../games/tarot', f + '.js'), 'utf8'), ctx, { filename: f });
const T = ctx.Tarot;
const N = +process.argv[2] || 500;
const assert = (c, m) => { if (!c) throw new Error(m); };
assert(T.DECK.length === 78, 'deck size');
assert(Math.abs(T.sumPoints(T.DECK) - 91) < 1e-9, 'deck points');
// poignée thresholds: 10/13/15 trumps (4 players), 13/15/18 (3 players); Excuse only as the one missing trump
const trumpsOf = n => T.DECK.filter(c => c.suit === 'T').slice(0, n), ex = T.DECK.find(c => c.suit === 'X');
assert(T.poigneeCards(trumpsOf(9), 1, 4) === null, 'poignee 9 trumps');
assert(T.poigneeCards(trumpsOf(10), 1, 4).length === 10, 'poignee 10');
assert(T.poigneeCards(trumpsOf(14), 2, 4).length === 13, 'poignee 14 -> shows 13');
assert(T.poigneeCards(trumpsOf(9).concat(ex), 1, 4).length === 10, 'excuse completes');
assert(T.poigneeCards(trumpsOf(8).concat(ex), 1, 4) === null, 'excuse cannot fill two');
assert(T.poigneeCards(trumpsOf(12), 1, 3) === null && T.poigneeCards(trumpsOf(13), 1, 3).length === 13, '3p thresholds');
assert(T.poigneeCards(trumpsOf(17), 3, 3) === null && T.poigneeCards(trumpsOf(18), 3, 3).length === 18, '3p triple');
const stats = { passed: 0, win: 0, loss: 0, byContract: {}, poignees: 0 };
for (let g = 0; g < N * 2; g++) {
  const np = g % 2 ? 3 : 4; // alternate 4- and 3-player deals
  const game = new T.Game({ players: np, dealer: g % np });
  assert(game.hands.every(h => h.length === (np === 3 ? 24 : 18)), 'hand size');
  let guard = 0;
  while (game.phase !== 'done' && game.phase !== 'passed') {
    assert(guard++ < 600, 'infinite loop');
    if (game.trickComplete) { game.collectTrick(); continue; }
    game.botStep();
  }
  if (game.phase === 'passed') { stats.passed++; continue; }
  const r = game.result;
  const all = game.piles.taker.concat(game.piles.def);
  assert(all.length === 78, 'cards accounted: ' + all.length);
  assert(new Set(all.map(c => c.id)).size === 78, 'duplicates');
  assert(Math.abs(r.takerPoints + r.defPoints - 91) < 1e-9, 'points sum');
  assert(r.totals.length === np, 'totals length');
  assert(r.totals.reduce((a, b) => a + b, 0) === 0, 'zero sum');
  stats.poignees += r.poignees.length;
  const pTotal = r.poignees.reduce((a, p) => a + p.points, 0);
  assert(r.perDefender === (r.base + r.petit) * r.mult + (r.win ? 1 : -1) * pTotal, 'poignee scoring');
  assert(r.poignees.every(p => p.cards.length === T.POIGNEE_MIN[np][p.level - 1]), 'poignee size');
  r.win ? stats.win++ : stats.loss++;
  stats.byContract[r.contract] = (stats.byContract[r.contract] || 0) + 1;
}
console.log(N * 2, 'games OK (4p+3p)', JSON.stringify(stats));
