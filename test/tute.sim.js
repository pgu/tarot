// Bot-only El Tute simulation: node test/tute.sim.js [hands]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx);
load('spanish', 'cards'); load('tute', 'game'); load('tute', 'bots');
const S = ctx.Spanish;
const assert = (c, m) => { if (!c) throw new Error(m); };
assert(S.tuteSum(S.DECK) === 120, 'deck is 120 points');
const C = id => S.card(id);
assert(S.tuteWinner(C('O1'), C('O3'), 'E') === 0, 'as beats tres');
assert(S.tuteWinner(C('O1'), C('E2'), 'E') === 1, 'any triumph beats');
assert(S.tuteWinner(C('O1'), C('C12'), 'E') === 0, 'other suit loses');
assert(S.tuteArrastreLegal([C('O2'), C('O12'), C('E4')], C('O5'), 'E').cards.map(c => c.id).join() === 'O12', 'must montar');
assert(S.tuteArrastreLegal([C('B2'), C('E4')], C('O5'), 'E').cards[0].id === 'E4', 'must fallar');
const N = +process.argv[2] || 500;
let hands = 0, tutes = 0, sings = 0, swaps = 0, ties = 0, w0 = 0;
for (let g = 0; g < N; g++) {
  const game = new S.Tute({ dealer: g % 2 });
  let guard = 0;
  while (game.phase !== 'done') {
    assert(guard++ < 100, 'loop');
    if (game.trickComplete) { game.collectTrick(); continue; }
    const p = game.turn;
    const c = S.TuteBots.plan(game.ctxFor(p));
    if (c.tute) { game.tute(p); tutes++; break; }
    if (c.swap) { game.swap(p); swaps++; }
    if (c.sing) { game.sing(p, c.sing); sings++; }
    const pick = S.TuteBots.chooseCard(game.ctxFor(p));
    game.play(p, pick.card);
    const all = game.stock.length + game.hands[0].length + game.hands[1].length + game.piles[0].length + game.piles[1].length + game.trick.length;
    assert(all === 40, 'cards conserved ' + all);
  }
  hands++;
  const r = game.result;
  if (!r.tute) {
    assert(game.piles[0].length + game.piles[1].length === 40, 'all cards captured');
    assert(r.cardPts[0] + r.cardPts[1] === 120, 'card points = 120');
    assert(r.points[0] + r.points[1] === 130 + r.cantes[0] + r.cantes[1], 'total points');
    if (r.winner == null) ties++; else if (r.winner === 0) w0++;
  }
}
console.log(`${hands} hands OK`, JSON.stringify({ tutes, sings, swaps, ties, seat0Wins: w0 }));
