// La Podrida: rules + bot-only games. node test/podrida.sim.js [games]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx);
load('spanish', 'cards'); load('podrida', 'game'); load('podrida', 'bots');
const S = ctx.Spanish;
const assert = (c, m) => { if (!c) throw new Error('FAIL ' + m); };
const C = id => S.card(id);
assert(S.podridaPoints(2, 2) === 14 && S.podridaPoints(0, 0) === 10 && S.podridaPoints(2, 4) === -4 && S.podridaPoints(3, 1) === -4, 'points');
assert(S.podridaSchedule(4, 5).join() === '1,2,3,4,5,4,3,2,1' && S.podridaSchedule(4, 20).length === 17 && Math.max(...S.podridaSchedule(4, 20)) === 9, 'schedule');
assert(S.podridaPower(C('O1')) > S.podridaPower(C('O12')) && S.podridaPower(C('O12')) > S.podridaPower(C('O11')) && S.podridaPower(C('O7')) > S.podridaPower(C('O6')), 'order');
const L = S.podridaLegal([C('O5'), C('E3'), C('C12')], [{ player: 0, card: C('O1') }], 'C');
assert(L.rule === 'follow' && L.cards.length === 1, 'follow suit');
assert(S.podridaLegal([C('E3'), C('C12')], [{ player: 0, card: C('O1') }], 'C').rule === 'trump', 'must trump');
assert(S.podridaLegal([C('E3'), C('B2')], [{ player: 0, card: C('O1') }], 'C').rule === 'free', 'free');
assert(S.podridaWinner([{ card: C('O1') }, { card: C('O12') }, { card: C('C2') }, { card: C('E1') }], 'C') === 2, 'trump wins');
const N = +process.argv[2] || 100;
let rounds = 0, exact = 0, total = 0;
for (let g = 0; g < N; g++) {
  const game = new S.Podrida({ players: 3 + (g % 3), maxCards: 5 + (g % 4) });
  let guard = 0;
  while (game.phase !== 'gameover') {
    assert(guard++ < 400, 'game loop');
    while (game.phase === 'bidding') {
      const p = game.bidder; const b = S.PodridaBots.chooseBid(game, p);
      game.bid(p, b.bid);
    }
    assert(game.bids.reduce((a, b) => a + b, 0) !== game.cards, 'bids never add up to the number of tricks');
    let steps = 0;
    while (game.phase === 'play') {
      assert(steps++ < 400, 'round loop');
      if (game.trickComplete) { game.collectTrick(); continue; }
      const p = game.turn;
      game.play(p, S.PodridaBots.choosePlay(game.ctxFor(p)).card);
    }
    assert(game.won.reduce((a, b) => a + b, 0) === game.cards, 'all tricks won');
    rounds++;
    game.history[game.history.length - 1].bids.forEach((b, p) => { total++; if (b === game.history[game.history.length - 1].won[p]) exact++; });
    if (game.phase === 'roundover') game.nextRoundStart();
  }
}
console.log(`${N} games, ${rounds} rounds OK`, JSON.stringify({ exactBidRate: (exact / total).toFixed(3) }));
