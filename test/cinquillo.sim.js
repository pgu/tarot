// Bot-only Cinquillo simulation: node test/cinquillo.sim.js [games]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx);
load('spanish', 'cards'); load('cinquillo', 'game'); load('cinquillo', 'bots');
const S = ctx.Spanish;
const assert = (c, m) => { if (!c) throw new Error('FAIL ' + m); };
const N = +process.argv[2] || 200;
let rounds = 0, passes = 0, plays = 0;
const wins = [0, 0, 0, 0];
for (let g = 0; g < N; g++) {
  const game = new S.Cinquillo({ players: 3 + (g % 2) });
  let guard = 0;
  while (game.phase !== 'gameover') {
    assert(guard++ < 400, 'game loop');
    let steps = 0;
    assert(game.hands.reduce((s, h) => s + h.length, 0) === 40, 'deal 40');
    while (game.phase === 'play') {
      assert(steps++ < 300, 'round loop');
      const p = game.turn;
      const c = S.CinquilloBots.choose({ hand: game.hands[p], table: game.table, first: game.first });
      if (c.card) { game.play(p, c.card); plays++; } else { game.pass(p); passes++; }
    }
    rounds++;
    const onTable = S.DECK.filter(c => game.onTable(c)).length;
    assert(onTable + game.hands.reduce((s, h) => s + h.length, 0) === 40, 'cards conserved');
    wins[game.result.winner]++;
    if (game.phase === 'roundover') game.nextRound();
  }
  assert(game.winner != null, 'winner');
}
console.log(`${N} games, ${rounds} rounds OK`, JSON.stringify({ plays, passes, wins }));
