/* El Mus: hand descriptions shared by the screens. */
(function (S) {
  'use strict';
  const { el } = S;
  const mr = S.musRank;

  const sortedBy = (h, desc) => h.slice().sort((a, b) => (desc ? S.musPower(b) - S.musPower(a) : S.musPower(a) - S.musPower(b)));
  const names = cards => cards.map(c => S.musRankName(mr(c))).join(' · ');

  /** Plain-words description of what a hand is worth in each lance. */
  function describe(h) {
    const pa = S.pares(h);
    const sum = S.juegoSum(h);
    const juego = S.hasJuego(h);
    return {
      grande: names(sortedBy(h, true)),
      chica: names(sortedBy(h, false)),
      pares: pa.type ? `${pa.label}${pa.type === 3 && pa.ranks[0] !== pa.ranks[1] ? ' de ' + S.musRankName(pa.ranks[0]) + 's y ' + S.musRankName(pa.ranks[1]) + 's' : pa.type === 3 ? ' de ' + S.musRankName(pa.ranks[0]) + 's' : ' de ' + S.musRankName(pa.ranks[0]) + 's'} (${pa.points} pt)` : 'sin pares',
      juego: juego ? `${sum} (juego${sum === 31 ? ': ¡la mejor, 31!' : ''})` : `${sum} (no hay juego: punto)`,
      sum, hasJuego: juego, paresInfo: pa,
    };
  }

  function descTable(h) {
    const d = describe(h);
    return el('table', { class: 't' },
      el('tr', {}, el('th', {}, 'Grande'), el('td', {}, d.grande)),
      el('tr', {}, el('th', {}, 'Chica'), el('td', {}, d.chica)),
      el('tr', {}, el('th', {}, 'Pares'), el('td', {}, d.pares)),
      el('tr', {}, el('th', {}, 'Juego'), el('td', {}, d.juego)));
  }

  /** Percentile of a hand among random hands (fraction of hands it beats) for a lance. */
  function percentile(kind, h, iters) {
    iters = iters || 1500;
    const mine = S.lanceValue(kind, h);
    const known = new Set(h.map(c => c.id));
    const pool = S.DECK.filter(c => !known.has(c.id));
    let beat = 0;
    for (let i = 0; i < iters; i++) {
      for (let k = 0; k < 4; k++) { const j = k + Math.floor(Math.random() * (pool.length - k)); const t = pool[k]; pool[k] = pool[j]; pool[j] = t; }
      if (mine > S.lanceValue(kind, pool.slice(0, 4))) beat++;
    }
    return beat / iters;
  }

  const RANK_BADGE = c => (c.rank === 3 ? '=R' : c.rank === 2 ? '=A' : null); // 8 reyes: the 3 is a rey, the 2 an as

  Object.assign(S, { musDescribe: describe, musDescTable: descTable, musPercentile: percentile, musBadge: RANK_BADGE });
})(window.Spanish = window.Spanish || {});
