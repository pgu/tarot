// Rami rules unit tests: node test/rami.eval.js
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
const load = (d, f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'games', d, f + '.js'), 'utf8'), ctx);
load('poker', 'cards'); load('rami', 'cards');
const R = ctx.Rami;
const assert = (c, m) => { if (!c) throw new Error('FAIL ' + m); };
const L = { J: 11, Q: 12, K: 13, A: 14 };
// card spec "7H", "0" copy default; "AS2" copy 1; "JK" joker index
let jk = 0;
const C = s => { if (s === 'JK') return R.card('JK' + (jk++ % 4)); const copy = s.endsWith('b') ? 1 : 0; s = s.replace('b', ''); const suit = s.slice(-1); const r = s.slice(0, -1); return R.card(`${copy}${L[r] || +r}${suit}`); };
const H = s => s.split(' ').map(C);
assert(R.DECK.length === 108, '108 cards');
assert(R.analyze(H('7H 7S 7D')).type === 'set', 'set');
assert(R.analyze(H('7H 7S 7D 7C')).points === 28, 'carré points');
assert(!R.analyze(H('7H 7Hb 7D')), 'same suit twice not a set');
assert(R.analyze(H('7H 7S JK')).points === 21, 'set with joker');
assert(!R.analyze(H('7H 7S JK JK')), 'two jokers');
assert(R.analyze(H('4H 5H 6H')).pure, 'pure run');
assert(R.analyze(H('4H 6H JK')).points === 15 && !R.analyze(H('4H 6H JK')).pure, 'run with joker in gap');
assert(R.analyze(H('AH 2H 3H')).points === 6, 'ace low = 1');
assert(R.analyze(H('QH KH AH')).points === 31, 'ace high = 11');
assert(!R.analyze(H('KH AH 2H')), 'no wrap');
assert(R.analyze(H('KH QH JK')).type === 'run', 'joker extends the end');
assert(R.analyze(H('AH KH JK')).points === 31 && R.analyze(H('AH KH JK')).joker.rank === 12, 'ace+king+joker = Q');
assert(!R.analyze(H('4H 5S 6H')), 'mixed suits');
assert(!R.analyze(H('4H 5H')), 'too short');
assert(R.canReplaceJoker(R.analyze(H('4H 6H JK')), C('5H')), 'replace joker run');
assert(!R.canReplaceJoker(R.analyze(H('4H 6H JK')), C('5S')), 'wrong suit');
assert(R.canReplaceJoker(R.analyze(H('7H 7S JK')), C('7D')) && !R.canReplaceJoker(R.analyze(H('7H 7S JK')), C('7H')), 'replace in set');
// arrangement
const hand = H('KH KS KD 4H 5H 6H 9C 2D 3S');
const a = R.bestArrangement(hand, 'cards');
assert(a.laid === 6 && a.rest.length === 3, 'two melds laid: ' + a.laid);
const o = R.bestArrangement(hand, 'open');
assert(o.points === 30 + 15, 'open points ' + o.points);
assert(R.bestArrangement(H('KH KS KD 9H 9S 9D'), 'open') === null, 'no pure run -> cannot open');
console.log('rami eval tests OK');
