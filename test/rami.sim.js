// Bot-only Rami simulation: node test/rami.sim.js [games]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx);
load('poker', 'cards'); ['cards', 'game', 'bots'].forEach(f => load('rami', f));
const R = ctx.Rami;
const assert = (c, m) => { if (!c) throw new Error(m); };
const N = +process.argv[2] || 20;
let rounds = 0, outs = 0, stale = 0, opens = 0, turns = 0;
const t0 = Date.now();
for (let g = 0; g < N; g++) {
  const game = new R.Rami({ players: 2 + (g % 3), rounds: 3 });
  while (game.phase !== 'gameover') {
    let guard = 0;
    while (game.phase === 'draw' || game.phase === 'play') {
      assert(guard++ < 400, 'round loop');
      const p = game.turn;
      const total = game.stock.length + game.discardPile.length + game.hands.reduce((s, h) => s + h.length, 0) + game.table.reduce((s, m) => s + m.cards.length, 0);
      assert(total === 108, 'cards conserved ' + total);
      const w = R.RamiBots.wantsDiscard(game, p);
      w.take ? game.drawDiscard(p) : game.drawStock(p);
      R.RamiBots.playTurn(game, p);
      turns++;
    }
    rounds++;
    const r = game.result;
    if (r.stalemate) stale++; else outs++;
    opens += game.opened.filter(Boolean).length;
    assert(r.penalties.every(v => v >= 0), 'penalties');
    if (game.phase === 'roundover') game.nextRound();
  }
}
console.log(`${N} games, ${rounds} rounds OK`, JSON.stringify({ outs, stale, avgOpened: (opens / rounds).toFixed(2), avgTurns: (turns / rounds).toFixed(1), ms: Date.now() - t0 }));
