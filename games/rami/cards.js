/* Le Rami: 108-card deck (2 x 52 + 4 jokers), combination analysis, best arrangement search. No DOM. */
(function (R, P) {
  'use strict';

  const SUITS = ['S', 'H', 'D', 'C'];
  const SUIT_FR = { S: 'Pique', H: 'Cœur', D: 'Carreau', C: 'Trèfle' };
  const RANK_FR = { 1: 'As', 2: 'Deux', 3: 'Trois', 4: 'Quatre', 5: 'Cinq', 6: 'Six', 7: 'Sept', 8: 'Huit', 9: 'Neuf', 10: 'Dix', 11: 'Valet', 12: 'Dame', 13: 'Roi', 14: 'As' };
  const LABEL_FR = { 11: 'V', 12: 'D', 13: 'R', 14: 'A' };
  const DECK = [];
  [0, 1].forEach(copy => SUITS.forEach(s => {
    for (let r = 2; r <= 14; r++) {
      DECK.push({ id: `${copy}${r}${s}`, copy, suit: s, rank: r, joker: false, label: LABEL_FR[r] || String(r),
        text: (LABEL_FR[r] || r) + P.SUIT_INFO[s].sym, name: `${RANK_FR[r]} de ${SUIT_FR[s]}` });
    }
  }));
  for (let k = 0; k < 4; k++) DECK.push({ id: 'JK' + k, copy: 0, suit: null, rank: 0, joker: true, label: '★', text: 'Joker', name: 'Joker' });
  DECK.forEach((c, i) => { c.order = i; });
  const BY_ID = {};
  DECK.forEach(c => { BY_ID[c.id] = c; });

  /** Hand ordering: by suit, then rank; jokers last. */
  const sortHand = cards => cards.slice().sort((a, b) => {
    if (a.joker !== b.joker) return a.joker ? 1 : -1;
    return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit) || a.rank - b.rank || a.copy - b.copy;
  });

  /** Points of a rank placed in a combination (ace 11, or 1 when low in a run). */
  const rankValue = r => (r === 1 ? 1 : r === 14 ? 11 : r >= 11 ? 10 : r);
  /** Penalty value of a card left in hand. */
  const penalty = c => (c.joker ? 25 : c.rank === 14 ? 11 : c.rank >= 11 ? 10 : c.rank);

  /**
   * Is `cards` a valid combination? Returns null or
   * {type:'set'|'run', cards (ordered), points, pure, joker:{rank,suit?,suits?}|null}.
   * At most one joker per combination.
   */
  function analyze(cards) {
    if (cards.length < 3 || cards.length > 14) return null;
    const jokers = cards.filter(c => c.joker);
    const nat = cards.filter(c => !c.joker);
    if (jokers.length > 1 || nat.length < 2) return null;

    if (nat.every(c => c.rank === nat[0].rank)) {
      if (cards.length > 4) return null;
      const suits = nat.map(c => c.suit);
      if (new Set(suits).size !== nat.length) return null;
      const v = rankValue(nat[0].rank);
      return {
        type: 'set', cards: nat.concat(jokers), points: v * cards.length, pure: false,
        joker: jokers.length ? { rank: nat[0].rank, missing: SUITS.filter(s => !suits.includes(s)) } : null,
      };
    }
    if (!nat.every(c => c.suit === nat[0].suit)) return null;
    const hasAce = nat.some(c => c.rank === 14);
    for (const aceHigh of hasAce ? [false, true] : [false]) {
      const map = c => (c.rank === 14 && !aceHigh ? 1 : c.rank);
      const ranks = nat.map(map).sort((a, b) => a - b);
      if (ranks.some((r, i) => i && r === ranks[i - 1])) continue;
      const lo = ranks[0]; const hi = ranks[ranks.length - 1];
      const gaps = hi - lo + 1 - nat.length;
      const jn = jokers.length;
      if (gaps > jn) continue;
      let start = lo; let end = hi;
      if (jn - gaps === 1) { // joker extends one end
        if (lo > 1) start = lo - 1; else if (hi < 14) end = hi + 1; else continue;
      }
      const seq = []; const byRank = new Map(nat.map(c => [map(c), c]));
      let jokerRank = null;
      for (let r = start; r <= end; r++) {
        if (byRank.has(r)) seq.push(byRank.get(r));
        else { seq.push(jokers[0]); jokerRank = r; }
      }
      if (seq.length !== cards.length) continue;
      const pts = [];
      for (let r = start; r <= end; r++) pts.push(rankValue(r === 14 ? 14 : r));
      return {
        type: 'run', cards: seq, points: pts.reduce((a, b) => a + b, 0), pure: jn === 0, suit: nat[0].suit,
        joker: jn ? { rank: jokerRank, suit: nat[0].suit } : null,
      };
    }
    return null;
  }

  /** Can natural card `card` replace the joker in analysed combination `an`? */
  function canReplaceJoker(an, card) {
    if (!an || !an.joker || card.joker) return false;
    if (an.type === 'set') return card.rank === an.joker.rank && an.joker.missing.includes(card.suit);
    if (card.suit !== an.joker.suit) return false;
    return card.rank === an.joker.rank || (card.rank === 14 && an.joker.rank === 1);
  }

  /**
   * Best way to lay combinations from `cards`.
   * mode 'open': maximise points, needs one pure run (returns null if impossible).
   * mode 'cards': maximise the number of cards laid (then points).
   */
  function bestArrangement(cards, mode) {
    const n = cards.length;
    if (n > 16) cards = cards.slice(0, 16);
    const N = cards.length;
    const melds = [];
    for (let mask = 7; mask < (1 << N); mask++) {
      let bits = 0; let jk = 0;
      for (let i = 0; i < N; i++) if (mask & (1 << i)) { bits++; if (cards[i].joker) jk++; }
      if (bits < 3 || jk > 1) continue;
      const sub = [];
      for (let i = 0; i < N; i++) if (mask & (1 << i)) sub.push(cards[i]);
      const an = analyze(sub);
      if (an) melds.push({ mask, an, size: bits });
    }
    const byLow = Array.from({ length: N }, () => []);
    melds.forEach(m => { byLow[31 - Math.clz32(m.mask & -m.mask)].push(m); });
    const full = (1 << N) - 1;
    const memo = new Map();
    const open = mode === 'open';
    const val = m => (open ? m.an.points : m.size * 1000 + m.an.points);
    const f = (mask, pure) => {
      if (mask === full) return open && !pure ? { v: -Infinity, pick: null } : { v: 0, pick: null };
      const key = mask * 2 + (pure ? 1 : 0);
      if (memo.has(key)) return memo.get(key);
      const i = 31 - Math.clz32(~mask & (mask + 1)); // lowest unset bit
      let best = { v: -Infinity, pick: null, next: null };
      const skip = f(mask | (1 << i), pure);
      if (skip.v > best.v) best = { v: skip.v, pick: null, next: [mask | (1 << i), pure] };
      byLow[i].forEach(m => {
        if (m.mask & mask) return;
        const nxt = f(mask | m.mask, pure || m.an.pure);
        const v = nxt.v + val(m);
        if (v > best.v) best = { v, pick: m, next: [mask | m.mask, pure || m.an.pure] };
      });
      memo.set(key, best);
      return best;
    };
    const root = f(0, false);
    if (root.v === -Infinity) return null;
    const chosen = [];
    let state = [0, false];
    for (;;) {
      const node = f(state[0], state[1]);
      if (state[0] === full) break;
      if (node.pick) chosen.push(node.pick);
      state = node.next;
    }
    const used = new Set();
    const groups = chosen.map(m => { m.an.cards.forEach(c => used.add(c)); return m.an; });
    return {
      melds: groups, points: groups.reduce((s, a) => s + a.points, 0),
      laid: groups.reduce((s, a) => s + a.cards.length, 0), rest: cards.filter(c => !used.has(c)),
    };
  }

  const OPEN_MIN = 51;

  Object.assign(R, { SUIT_FR, RANK_FR, SUITS, DECK, BY_ID, sortHand, rankValue, penalty, analyze, canReplaceJoker, bestArrangement, OPEN_MIN, card: id => BY_ID[id] });
})(window.Rami = window.Rami || {}, window.Poker);
