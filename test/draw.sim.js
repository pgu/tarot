// Bot-only five-card draw simulation: node test/draw.sim.js [hands]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx);
['cards', 'game', 'bots'].forEach(f => load('poker', f)); ['game', 'bots'].forEach(f => load('draw', f));
const P = ctx.Poker;
const N = +process.argv[2] || 1500;
const assert = (c, m) => { if (!c) throw new Error(m); };
let hands = 0, showdowns = 0, folds = 0, draws = [0, 0, 0, 0];
while (hands < N) {
  const t = new P.DrawTable({ chips: 400 });
  t.players.forEach((p, i) => { p.style = P.STYLES[i]; });
  const total = 1600;
  for (let h = 0; h < 300 && t.startHand(); h++, hands++) {
    let guard = 0;
    while (t.phase !== 'done') {
      assert(guard++ < 200, 'loop in phase ' + t.phase);
      assert(t.toAct != null, 'no actor in ' + t.phase);
      if (t.phase === 'draw') {
        const d = P.DrawBots.chooseDiscards(t.players[t.toAct].hole);
        assert(d.discard.length <= 3, 'too many discards');
        draws[d.discard.length]++;
        t.drawCards(t.toAct, d.discard);
        continue;
      }
      t.act(t.toAct, P.DrawBots.decide(t, t.toAct, { iters: 30 }));
    }
    assert(t.players.every(p => p.hole.length === 5 || !p.inHand), 'hand size');
    assert(t.players.reduce((s, p) => s + p.chips, 0) === total, 'chips conserved');
    assert(t.result.pots.reduce((s, p) => s + p.amount, 0) === t.pot, 'pots sum');
    t.result.uncontested ? folds++ : showdowns++;
  }
}
console.log(`${hands} draw hands OK`, JSON.stringify({ showdowns, folds, draws }));
