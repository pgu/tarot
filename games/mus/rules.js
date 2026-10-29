/* El Mus (8 reyes): card values, lance comparisons. No DOM. */
(function (S) {
  'use strict';

  // 8 reyes: the 3 counts as a rey and the 2 as an as.
  const mr = c => (c.rank === 3 ? 12 : c.rank === 2 ? 1 : c.rank);
  const value = c => { const r = mr(c); return r >= 10 ? 10 : r; };
  const POWER = { 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 1: 1 };
  const power = c => POWER[mr(c)];
  const RANK_NAME = { 12: 'rey', 11: 'caballo', 10: 'sota', 7: 'siete', 6: 'seis', 5: 'cinco', 4: 'cuatro', 1: 'as' };
  const rankName = r => RANK_NAME[r];

  const enc = digits => digits.reduce((a, d) => a * 10 + d, 0);

  /** Higher is better. */
  const grandeValue = h => enc(h.map(power).sort((a, b) => b - a));
  /** Lower cards win the chica; encoded so that higher is better. */
  const chicaValue = h => enc(h.map(c => 9 - power(c)).sort((a, b) => b - a));

  /** {type: 0 none | 1 par | 2 medias | 3 duples, key, points} */
  function pares(h) {
    const cnt = {};
    h.forEach(c => { cnt[mr(c)] = (cnt[mr(c)] || 0) + 1; });
    const groups = Object.entries(cnt).map(([r, n]) => ({ r: +r, n })).sort((a, b) => b.n - a.n || POWER[b.r] - POWER[a.r]);
    const shape = groups.map(g => g.n).join('');
    if (shape === '4') return { type: 3, key: [POWER[groups[0].r], POWER[groups[0].r]], points: 3, label: 'duples', ranks: [groups[0].r, groups[0].r] };
    if (shape === '22') return { type: 3, key: groups.map(g => POWER[g.r]).sort((a, b) => b - a), points: 3, label: 'duples', ranks: groups.map(g => g.r) };
    if (shape === '31') return { type: 2, key: [POWER[groups[0].r]], points: 2, label: 'medias', ranks: [groups[0].r] };
    if (shape === '211') return { type: 1, key: [POWER[groups[0].r]], points: 1, label: 'par', ranks: [groups[0].r] };
    return { type: 0, key: [], points: 0, label: 'sin pares', ranks: [] };
  }
  const paresValue = h => { const p = pares(h); return p.type ? p.type * 1000 + enc(p.key.concat([0, 0]).slice(0, 2)) : -1; };

  const sum = h => h.reduce((s, c) => s + value(c), 0);
  const JUEGO_ORDER = [31, 32, 40, 37, 36, 35, 34, 33];
  const hasJuego = h => sum(h) >= 31;
  /** Juego: 31 is the best, then 32, 40, 37, 36, 35, 34, 33. */
  const juegoValue = h => (hasJuego(h) ? 100 - JUEGO_ORDER.indexOf(sum(h)) : -1);
  /** Punto (nobody has juego): the closest to 30. */
  const puntoValue = h => sum(h);
  const juegoPoints = h => (sum(h) === 31 ? 3 : 2);

  /** Value used to rank hands in a lance (higher wins; -1 = does not take part). */
  function lanceValue(kind, h) {
    if (kind === 'grande') return grandeValue(h);
    if (kind === 'chica') return chicaValue(h);
    if (kind === 'pares') return paresValue(h);
    if (kind === 'juego') return juegoValue(h);
    return puntoValue(h);
  }

  /** Winner among `order` (players in speaking order from the mano; ties go to the earliest). */
  function lanceWinner(kind, hands, order) {
    let best = -2; let who = null;
    order.forEach(p => { const v = lanceValue(kind, hands[p]); if (v > best) { best = v; who = p; } });
    return who;
  }

  Object.assign(S, {
    musRank: mr, musValue: value, musPower: power, musRankName: rankName, pares, juegoSum: sum, hasJuego, juegoPoints,
    lanceValue, lanceWinner, JUEGO_ORDER,
  });
})(window.Spanish = window.Spanish || {});
