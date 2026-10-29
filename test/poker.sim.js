// Bot-only poker simulation: node test/poker.sim.js [hands]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
for (const f of ['cards', 'game', 'bots']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../games/poker', f + '.js'), 'utf8'), ctx);
const P = ctx.Poker;
const N = +process.argv[2] || 2000;
const assert = (c, m) => { if (!c) throw new Error(m); };
let hands = 0, games = 0, showdowns = 0, folds = 0, allins = 0, splits = 0;
while (hands < N) {
  const t = new P.Table({ chips: 400 }); games++;
  t.players.forEach((p, i) => { p.style = P.STYLES[i]; });
  const total = t.players.reduce((s, p) => s + p.chips, 0);
  for (let h = 0; h < 300 && t.startHand(); h++, hands++) {
    let guard = 0;
    while (t.phase !== 'done') {
      assert(guard++ < 200, 'loop');
      if (t.pendingRunout) { t.runoutStep(); continue; }
      const d = P.Bots.decide(t, t.toAct, { iters: 40 });
      t.act(t.toAct, d);
    }
    assert(t.players.reduce((s, p) => s + p.chips, 0) === total, 'chips conserved');
    assert(t.players.every(p => p.chips >= 0), 'negative chips');
    if (t.result.uncontested) folds++; else showdowns++;
    if (t.players.some(p => p.allIn)) allins++;
    if (t.result.pots.some(p => p.winners.length > 1)) splits++;
    assert(t.result.pots.reduce((s, p) => s + p.amount, 0) === t.pot, 'pots sum to total bets');
  }
}
console.log(`${hands} hands in ${games} games OK`, JSON.stringify({ showdowns, folds, allins, splits }));
