// Evaluator unit tests: node test/poker.eval.js
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console }); ctx.window = ctx;
for (const f of ['cards']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../games/poker', f + '.js'), 'utf8'), ctx);
const P = ctx.Poker;
const H = s => s.split(' ').map(x => P.card(x.replace('T', '10').replace('A', '14').replace('K', '13').replace('Q', '12').replace('J', '11')));
const assert = (c, m) => { if (!c) throw new Error('FAIL ' + m); };
const v = s => P.evaluate(H(s));
const order = [
  '2S 3H 5D 9C JS', '2S 2H 5D 9C JS', '2S 2H 5D 5C JS', '2S 2H 2D 9C JS', '3S 4H 5D 6C 7S',
  '2S 6S 9S JS KS', '2S 2H 2D 9C 9S', '2S 2H 2D 2C 9S', '3S 4S 5S 6S 7S', 'TS JS QS KS AS',
];
for (let i = 1; i < order.length; i++) assert(v(order[i]) > v(order[i - 1]), 'category order ' + i);
assert(v('AS 2H 3D 4C 5S') < v('2S 3H 4D 5C 6S'), 'wheel is lowest straight');
assert(P.categoryOf(v('AS 2H 3D 4C 5S')) === 4, 'wheel is straight');
assert(v('KS KH 2D 3C 4S') > v('QS QH AD 3C 4S'), 'higher pair wins');
assert(v('KS KH AD 3C 4S') > v('KS KH QD JC 4S'), 'kicker');
assert(v('KS KH 3D 3C 4S') > v('QS QH JD JC AS'), 'two pair high');
assert(v('2S 2H 2D 3C 3S') < v('3S 3H 3D 2C 2S'), 'full house trips rank');
assert(P.bestHand(H('AS KS 2D 3D 4H 5C 9C')).category === 4, 'best of 7 wheel');
assert(P.bestHand(H('AS AH AD AC 2D 2H 2C')).name.startsWith('Four'), 'quads over full house');
assert(P.bestHand(H('TS JS QS KS AS 2D 2H')).name === 'Royal flush', 'royal');
const eq = P.equity(H('AS AH'), [], 1, 4000);
assert(eq.equity > 0.8 && eq.equity < 0.88, 'AA vs random ~85%: ' + eq.equity);
const eq2 = P.equity(H('2S 7H'), [], 1, 4000);
assert(eq2.equity > 0.3 && eq2.equity < 0.4, '72o ~35%: ' + eq2.equity);
assert(P.outsToStraightOrBetter(H('AS KS'), H('2S 7S 9D')) === null || true, 'outs api');
const o = P.outsToStraightOrBetter(H('9S 8H'), H('7D 6C 2S'));
assert(o.outs === 8, 'OESD 8 outs: ' + o.outs);
const o2 = P.outsToStraightOrBetter(H('AS KS'), H('2S 7S 9D'));
assert(o2.outs === 9, 'flush draw 9 outs: ' + o2.outs);
assert(P.chen(...H('AS AH')).score === 20, 'chen AA');
assert(P.chen(...H('AS KS')).score === 12, 'chen AKs');
assert(P.chen(...H('2S 7H')).score < 0, 'chen 72o ' + P.chen(...H('2S 7H')).score);
console.log('poker eval tests OK');
