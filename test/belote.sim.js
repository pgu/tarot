// Bot-only Belote simulation: node test/belote.sim.js [deals]
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx, { filename: f });
load('poker', 'cards'); ['cards', 'game', 'bots'].forEach(f => load('belote', f));
const B = ctx.Belote;
const assert = (c, m) => { if (!c) throw new Error(m); };
const N = +process.argv[2] || 1000;

// deck and values
assert(B.DECK.length === 32, 'deck size');
for (const t of B.SUITS) assert(B.sumPoints(B.DECK, t) === 152, 'deck points for trump ' + t);
const card = id => B.card(id);
assert(B.points(card('11H'), 'H') === 20 && B.points(card('11S'), 'H') === 2, 'jack values');
assert(B.strength(card('11H'), 'H') > B.strength(card('9H'), 'H') && B.strength(card('9H'), 'H') > B.strength(card('14H'), 'H'), 'trump order');
assert(B.strength(card('10S'), 'H') > B.strength(card('13S'), 'H') && B.strength(card('14S'), 'H') > B.strength(card('10S'), 'H'), 'plain order');

// legal cards
const T = 'H';
const tr = (...p) => p.map(([pl, id]) => ({ player: pl, card: card(id) }));
const ids = a => a.map(c => c.id).sort().join(' ');
// follow suit
assert(ids(B.legalCards(['9S', '12S', '10C'].map(card), tr([1, '14S']), T, 0)) === '12S 9S', 'follow');
assert(B.legalInfo(['9D', '12C', '7H'].map(card), tr([3, '14S']), T, 1).rule === 'partner', 'partner master');
assert(ids(B.legalCards(['9D', '12C', '7H'].map(card), tr([2, '14S']), T, 1)) === '7H', 'must cut');
// overcut / undercut
assert(ids(B.legalCards(['9H', '8H', '12C'].map(card), tr([1, '14S'], [2, '10H']), T, 3)) === '9H', 'overcut');
assert(B.legalInfo(['7H', '8H', '12C'].map(card), tr([1, '14S'], [2, '10H']), T, 3).rule === 'undercut', 'undercut');
// trump led
assert(ids(B.legalCards(['9H', '7H', '12C'].map(card), tr([1, '10H']), T, 2)) === '9H', 'trump led, climb');
assert(ids(B.legalCards(['7H', '8H', '12C'].map(card), tr([1, '10H']), T, 2)) === '7H 8H', 'trump led, cannot climb');
// winner
assert(B.trickWinnerIndex(tr([0, '14S'], [1, '7H'], [2, '10S'], [3, '9H']), T) === 3, 'winner trump');
assert(B.trickWinnerIndex(tr([0, '10S'], [1, '14D'], [2, '14S'], [3, '9S']), T) === 2, 'winner plain');

const stats = { allpass: 0, made: 0, failed: 0, capot: 0, belote: 0, round1: 0, round2: 0, takerTeam: [0, 0] };
for (let g = 0; g < N; g++) {
  const game = new B.Belote({ dealer: g % 4 });
  let guard = 0;
  while (game.phase !== 'done' && game.phase !== 'allpass') {
    assert(guard++ < 200, 'infinite loop');
    if (game.trickComplete) { game.collectTrick(); continue; }
    game.botStep();
  }
  if (game.phase === 'allpass') { stats.allpass++; continue; }
  const r = game.result;
  const all = game.won[0].concat(game.won[1]);
  assert(all.length === 32 && new Set(all.map(c => c.id)).size === 32, 'cards accounted');
  assert(game.pointsSoFar(0) + game.pointsSoFar(1) === 152, 'card points sum');
  assert(r.raw[0] + r.raw[1] === (r.capot == null ? 162 : 252), 'raw total ' + r.raw);
  if (r.made) assert(r.scores[0] + r.scores[1] === r.raw[0] + r.raw[1] + r.belote[0] + r.belote[1], 'made scores');
  else assert(r.scores[1 - r.takerTeam] >= 162, 'dedans scores');
  r.made ? stats.made++ : stats.failed++;
  if (r.capot != null) stats.capot++;
  if (game.beloteTeam != null) stats.belote++;
  stats.takerTeam[r.takerTeam]++;
  game.bids.find(b => b.suit).round === 'bid1' ? stats.round1++ : stats.round2++;
}
console.log(N, 'deals OK', JSON.stringify(stats));
