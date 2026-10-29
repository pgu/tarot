// El Mus: rules tests + bot-only games. node test/mus.sim.js [games]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx);
load('spanish', 'cards'); ['rules', 'game'].forEach(f => load('mus', f));
try { load('mus', 'bots'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const S = ctx.Spanish;
const assert = (c, m) => { if (!c) throw new Error('FAIL ' + m); };
const H = s => s.split(' ').map(x => S.card(x));
// card values (8 reyes)
assert(S.musValue(S.card('O3')) === 10 && S.musValue(S.card('O2')) === 1 && S.musValue(S.card('E11')) === 10 && S.musValue(S.card('B7')) === 7, 'values');
assert(S.juegoSum(H('O12 O3 B7 C4')) === 31, 'juego 31');
// grande / chica
assert(S.lanceValue('grande', H('O12 C12 E11 B7')) > S.lanceValue('grande', H('O3 C11 E11 B7')) , 'grande: two reyes beat rey+caballos? (rey,rey vs rey,caballo)');
assert(S.lanceValue('grande', H('O12 O3 E1 B4')) > S.lanceValue('grande', H('O12 C11 E11 B7')), 'grande second card decides');
assert(S.lanceValue('chica', H('O1 C2 E12 B7')) > S.lanceValue('chica', H('O1 C4 E12 B7')), 'chica: two ases beat as+4');
// pares
assert(S.pares(H('O12 C3 E4 B7')).type === 1 && S.pares(H('O12 C3 E12 B7')).type === 2 && S.pares(H('O12 C3 E4 B4')).type === 3 && S.pares(H('O1 C2 E1 B2')).type === 3 && S.pares(H('O12 C11 E10 B7')).type === 0, 'pares types');
assert(S.lanceValue('pares', H('O12 C3 E4 B4')) > S.lanceValue('pares', H('O11 C11 E11 B7')), 'duples beat medias');
// juego order
assert(S.lanceValue('juego', H('O12 O3 B7 C4')) > S.lanceValue('juego', H('O12 O3 B7 C5')), '31 beats 32');
assert(S.lanceValue('juego', H('O12 O3 B7 C5')) > S.lanceValue('juego', H('O12 O3 B12 C11')), '32 beats 40');
assert(S.lanceValue('juego', H('O12 O3 B12 C11')) > S.lanceValue('juego', H('O12 C11 B12 C7')), '40 beats 37');
assert(S.lanceValue('juego', H('O12 C11 B6 C5')) > S.lanceValue('juego', H('O12 C11 B7 C4')) === false, 'ordering check 31..'); 
assert(S.juegoPoints(H('O12 O3 B7 C4')) === 3 && S.juegoPoints(H('O12 O3 B7 C5')) === 2, 'juego points');
if (!S.MusBots) { console.log('mus rules tests OK (no bots yet)'); process.exit(0); }
const N = +process.argv[2] || 100;
let hands = 0, games = 0, ordagos = 0, refused = 0, accepted = 0, cuts = 0;
for (let g = 0; g < N; g++) {
  const game = new S.Mus({}); games++;
  let guard = 0;
  while (game.phase !== 'gameover') {
    assert(guard++ < 400, 'game loop');
    let steps = 0;
    while (game.phase !== 'handover' && game.phase !== 'gameover') {
      assert(steps++ < 300, 'hand loop in phase ' + game.phase);
      const p = game.actor;
      assert(p != null, 'no actor in ' + game.phase);
      if (game.phase === 'mus') { const d = S.MusBots.musDecision(game, p); game.musSay(p, d.mus); if (!d.mus) cuts++; }
      else if (game.phase === 'discard') game.discard(p, S.MusBots.chooseDiscard(game, p).discard);
      else { const a = S.MusBots.lanceAction(game, p); game.act(p, a); }
      const total = game.deck.length + game.discardPile.length + game.hands.reduce((s, h) => s + h.length, 0);
      assert(total === 40, 'cards conserved ' + total);
    }
    hands++;
    game.results.forEach(r => { if (r.how === 'ordago') ordagos++; if (r.how === 'refused') refused++; if (r.how === 'accepted') accepted++; });
    assert(game.scores.every(s => s >= 0), 'scores');
    if (game.phase === 'handover') game.nextHand();
  }
  assert(game.winner === 0 || game.winner === 1, 'winner');
  assert(Math.max(...game.scores) >= game.target, 'target reached');
}
console.log(`${games} games, ${hands} hands OK`, JSON.stringify({ cuts, accepted, refused, ordagos }));
