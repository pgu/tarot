// Bot-only Bridge simulation: node test/bridge.sim.js [deals]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx, { filename: f });
load('poker', 'cards'); ['cards', 'bid', 'ai', 'game'].forEach(f => load('bridge', f));
const Br = ctx.Bridge;
const assert = (c, m) => { if (!c) throw new Error(m); };
const N = +process.argv[2] || 500;

// scoring table checks (rubber bridge)
const sc = (level, strain, doubled, tricks, vul) => Br.scoreDeal({ level, strain, doubled }, tricks, vul);
assert(sc(4, 'S', 0, 10, false).trickPoints === 120 && sc(4, 'S', 0, 10, false).declarerPoints === 120, '4S made');
assert(sc(3, 'N', 0, 9, false).trickPoints === 100, '3NT');
assert(sc(1, 'N', 0, 7, false).trickPoints === 40, '1NT');
assert(sc(2, 'D', 0, 9, false).aboveTotal === 20, 'overtrick minor');
assert(sc(2, 'S', 1, 8, false).trickPoints === 120 && sc(2, 'S', 1, 8, false).aboveTotal === 50, 'doubled 2S made: 120 below, 50 insult');
assert(sc(4, 'H', 0, 8, false).defenderPoints === 100 && sc(4, 'H', 0, 8, true).defenderPoints === 200, 'down 2 undoubled');
assert(sc(4, 'H', 1, 7, false).defenderPoints === 100 + 200 + 200, 'down 3 doubled NV');
assert(sc(4, 'H', 1, 7, true).defenderPoints === 200 + 300 + 300, 'down 3 doubled V');
assert(sc(6, 'N', 0, 12, false).aboveTotal === 500 && sc(6, 'N', 0, 12, true).aboveTotal === 750, 'small slam');
assert(sc(7, 'S', 0, 13, false).aboveTotal === 1000, 'grand slam');
assert(sc(3, 'N', 1, 10, true).aboveTotal === 200 + 50, 'doubled overtrick V + insult');
const rub = new Br.Rubber();
let r = rub.apply(0, sc(4, 'S', 0, 10, false)); assert(r.game === 0 && rub.vul[0] && rub.below[0] === 0 && rub.banked[0] === 120, 'game won');
rub.apply(0, sc(3, 'N', 0, 9, true)); assert(rub.over && rub.winner === 0 && rub.above[0] === 700, 'rubber 2-0');

// bidding legality
const A = (...c) => c.map((call, i) => ({ seat: i % 4, call }));
assert(Br.isLegalCall([], 0, Br.dbl()) === false, 'no double on empty');
assert(Br.isLegalCall(A(Br.bid(1, 'S')), 1, Br.dbl()) === true && Br.isLegalCall(A(Br.bid(1, 'S')), 2, Br.dbl()) === false, 'double rules');
assert(Br.isLegalCall(A(Br.bid(1, 'S'), Br.dbl()), 2, Br.rdbl()) === true, 'redouble');
assert(Br.isLegalCall(A(Br.bid(1, 'S')), 1, Br.bid(1, 'N')) === true && Br.isLegalCall(A(Br.bid(1, 'S')), 1, Br.bid(1, 'H')) === false && Br.isLegalCall(A(Br.bid(1, 'S')), 1, Br.bid(2, 'C')) === true, 'bid order');
const fc = Br.finalContract(A(Br.bid(1, 'H'), Br.pass(), Br.bid(2, 'C'), Br.pass(), Br.bid(2, 'H'), Br.pass(), Br.pass(), Br.pass()));
assert(fc.declarer === 0 && fc.strain === 'H' && fc.level === 2, 'declarer is first to bid the suit');

const stats = { passedOut: 0, byLevel: {}, byStrain: {}, made: 0, down: 0, doubled: 0, games: 0, slams: 0, rubbers: 0 };
let rubber = new Br.Rubber();
for (let g = 0; g < N; g++) {
  const game = new Br.Bridge({ dealer: g % 4, vul: rubber.vul });
  let guard = 0;
  while (game.phase !== 'done' && game.phase !== 'passedout') {
    assert(guard++ < 300, 'infinite loop');
    if (game.trickComplete) { game.collectTrick(); continue; }
    game.botStep();
  }
  if (game.phase === 'passedout') { stats.passedOut++; continue; }
  const res = game.result;
  assert(game.tricksWon[0] + game.tricksWon[1] === 13, 'tricks');
  assert(game.hands.every(h => h.length === 0), 'cards played');
  assert(game.history.length === 13, 'history');
  const c = res.contract;
  stats.byLevel[c.level] = (stats.byLevel[c.level] || 0) + 1;
  stats.byStrain[c.strain] = (stats.byStrain[c.strain] || 0) + 1;
  res.res.made ? stats.made++ : stats.down++;
  if (c.doubled) stats.doubled++;
  if (c.level >= 6) stats.slams++;
  const out = rubber.apply(res.side, res.res);
  if (out.game != null) stats.games++;
  if (rubber.over) { stats.rubbers++; rubber = new Br.Rubber(); }
}
console.log(N, 'deals OK', JSON.stringify(stats));
