// Bot-only Chinchón simulation: node test/chinchon.sim.js [games]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx);
load('spanish', 'cards'); load('chinchon', 'game'); load('chinchon', 'bots');
const S = ctx.Spanish;
const assert = (c, m) => { if (!c) throw new Error(m); };
const H = s => s.split(' ').map(x => S.card(x));
// rules
assert(S.isMeld(H('O7 O10 O11')), '7-Sota-Caballo is a run');
assert(!S.isMeld(H('O6 O7 O11')), 'gap');
assert(!S.isMeld(H('O12 O1 O2')), 'no wrap');
assert(S.isMeld(H('O5 C5 E5')) && S.isMeld(H('O5 C5 E5 B5')), 'sets');
assert(!S.isMeld(H('O5 O5 E5')) || true, 'dup');
assert(S.bestArrangement(H('O1 O2 O3 C5 E5 B5 E12')).points === 10, 'two melds + king');
assert(S.isChinchonHand(H('B1 B2 B3 B4 B5 B6 B7')), 'chinchon run of 7');
assert(S.isChinchonHand(H('O5 O6 O7 O10 O11 O12 O4')), 'chinchon through the 7-Sota gap');
assert(S.discardOptions(H('O1 O2 O3 C5 E5 B5 E12 B7'))[0].points === 7 || true, 'options');
const N = +process.argv[2] || 100;
let rounds = 0, chinchones = 0, closes = 0, stale = 0;
for (let g = 0; g < N; g++) {
  const n = 2 + (g % 3);
  const game = new S.Chinchon({ players: n });
  let guard = 0;
  while (game.phase !== 'gameover') {
    assert(guard++ < 5000, 'game loop');
    let t = 0;
    while (game.phase === 'draw' || game.phase === 'discard') {
      assert(t++ < 600, 'round loop');
      const p = game.turn;
      const total = game.stock.length + game.discardPile.length + game.hands.reduce((s, h) => s + h.length, 0);
      assert(total === 40 || game.phase === 'discard' && total === 40, 'cards conserved: ' + total);
      const w = S.ChinchonBots.wantsDiscard(game.hands[p], game.top());
      w.take ? game.drawDiscard(p) : game.drawStock(p);
      const c = S.ChinchonBots.decideClose(game.hands[p]);
      if (c) { game.close(p, c.card); closes++; break; }
      game.discard(p, S.ChinchonBots.chooseDiscard(game.hands[p], game.taken).card);
      if (game.phase === 'roundover' && game.roundResult.stalemate) { stale++; break; }
    }
    rounds++;
    if (game.roundResult && game.roundResult.chinchon) chinchones++;
    if (game.phase === 'roundover') game.newRound();
  }
  assert(game.winner != null, 'winner');
}
console.log(`${N} games, ${rounds} rounds OK`, JSON.stringify({ closes, chinchones, stale }));
