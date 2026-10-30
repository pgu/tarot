// Siete y medio: maths + bot-only games. node test/sietemedio.sim.js [games]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx);
load('spanish', 'cards'); load('sietemedio', 'game'); load('sietemedio', 'bots');
const S = ctx.Spanish; const M = S.SM;
const assert = (c, m) => { if (!c) throw new Error('FAIL ' + m); };
const C = id => S.card(id);
assert(S.smTotal([C('O7'), C('O12')]) === 7.5 && S.smNatural([C('O7'), C('B10')]) && !S.smNatural([C('O1'), C('O2'), C('O12'), C('B4')]), 'values');
assert(Math.abs(M.bustProb(11) - 0.5) < 0.1 && M.bustProb(1) < 1e-9 && M.bustProb(15) > 0.999, 'bust probabilities');
assert(Math.abs(S.SMBots.exactProb(11) - 0.1) < 1e-9 && S.SMBots.bankHits(10, 2) && !S.SMBots.bankHits(12, 2) && !S.SMBots.bankHits(5, 0), 'rules of thumb');
const N = +process.argv[2] || 200;
let rounds = 0, bankWins = 0, duels = 0, busts = 0;
for (let g = 0; g < N; g++) {
  const game = new S.SieteMedio({ players: 3 + (g % 2) });
  let guard = 0;
  while (game.phase !== 'gameover') {
    assert(guard++ < 500, 'game loop');
    let steps = 0;
    while (game.phase === 'play') {
      assert(steps++ < 100, 'round loop');
      const p = game.turn; const d = S.SMBots.decide(game, p);
      d.hit ? game.hit(p) : game.stand(p);
    }
    rounds++;
    game.result.duels.forEach(x => { duels++; if (x.winner === game.bank) bankWins++; if (x.bust) busts++; });
    assert(game.deck.length + game.hands.reduce((s, h) => s + h.length, 0) === 40, 'cards conserved');
    if (game.phase === 'roundover') game.nextRound();
  }
}
console.log(`${N} games, ${rounds} rounds OK`, JSON.stringify({ bankWinRate: (bankWins / duels).toFixed(3), bustRate: (busts / duels).toFixed(3) }));
