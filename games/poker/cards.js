/* Poker: 52-card deck, hand evaluation, equity, outs, starting-hand score. No DOM. */
(function (P) {
  'use strict';

  const SUITS = ['S', 'H', 'D', 'C'];
  const SUIT_INFO = {
    S: { name: 'Spades', sym: '♠', color: 'black' },
    H: { name: 'Hearts', sym: '♥', color: 'red' },
    D: { name: 'Diamonds', sym: '♦', color: 'red' },
    C: { name: 'Clubs', sym: '♣', color: 'black' },
  };
  const RANK_LABEL = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  const RANK_NAME = {
    2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine',
    10: 'Ten', 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace',
  };
  const RANK_PLURAL = {
    2: 'Twos', 3: 'Threes', 4: 'Fours', 5: 'Fives', 6: 'Sixes', 7: 'Sevens', 8: 'Eights', 9: 'Nines',
    10: 'Tens', 11: 'Jacks', 12: 'Queens', 13: 'Kings', 14: 'Aces',
  };

  const DECK = [];
  const BY_ID = {};
  SUITS.forEach(s => {
    for (let r = 2; r <= 14; r++) {
      const c = {
        id: r + s, suit: s, rank: r, label: RANK_LABEL[r] || String(r),
        text: (RANK_LABEL[r] || r) + SUIT_INFO[s].sym,
        name: RANK_NAME[r] + ' of ' + SUIT_INFO[s].name,
      };
      DECK.push(c);
      BY_ID[c.id] = c;
    }
  });

  function shuffle(arr, rng) {
    rng = rng || Math.random;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ---------- hand evaluation ---------- */

  const CATEGORIES = [
    'High card', 'One pair', 'Two pair', 'Three of a kind', 'Straight',
    'Flush', 'Full house', 'Four of a kind', 'Straight flush',
  ];
  const BASE = 15;
  const BASE5 = Math.pow(BASE, 5);

  const encode = (cat, ranks) => {
    let v = cat;
    for (let i = 0; i < 5; i++) v = v * BASE + (ranks[i] || 0);
    return v;
  };

  /** Value (bigger = better) of exactly 5 cards. */
  function evaluate5(cards) {
    const counts = {};
    let flush = true;
    for (const c of cards) {
      counts[c.rank] = (counts[c.rank] || 0) + 1;
      if (c.suit !== cards[0].suit) flush = false;
    }
    const groups = Object.keys(counts).map(Number)
      .sort((a, b) => counts[b] - counts[a] || b - a);
    const uniq = groups.slice().sort((a, b) => b - a);
    let straightHigh = 0;
    if (uniq.length === 5) {
      if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
      else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) straightHigh = 5; // wheel A-2-3-4-5
    }
    const shape = groups.map(r => counts[r]).join('');
    if (straightHigh && flush) return encode(8, [straightHigh]);
    if (shape === '41') return encode(7, groups);
    if (shape === '32') return encode(6, groups);
    if (flush) return encode(5, uniq);
    if (straightHigh) return encode(4, [straightHigh]);
    if (shape === '311') return encode(3, groups);
    if (shape === '221') return encode(2, groups);
    if (shape === '2111') return encode(1, groups);
    return encode(0, groups);
  }

  function combos5(cards) {
    const n = cards.length;
    const out = [];
    for (let a = 0; a < n - 4; a++)
      for (let b = a + 1; b < n - 3; b++)
        for (let c = b + 1; c < n - 2; c++)
          for (let d = c + 1; d < n - 1; d++)
            for (let e = d + 1; e < n; e++) out.push([cards[a], cards[b], cards[c], cards[d], cards[e]]);
    return out;
  }

  /** Best 5-card hand out of 5..7 cards. Returns {value, cards, category, name}. */
  function bestHand(cards) {
    let best = -1;
    let bestCards = null;
    for (const combo of combos5(cards)) {
      const v = evaluate5(combo);
      if (v > best) { best = v; bestCards = combo; }
    }
    return { value: best, cards: bestCards, category: categoryOf(best), name: handName(best) };
  }

  const evaluate = cards => (cards.length === 5 ? evaluate5(cards) : bestHand(cards).value);
  const categoryOf = v => Math.floor(v / BASE5);

  function decode(v) {
    const ranks = [];
    for (let i = 0; i < 5; i++) { ranks.unshift(v % BASE); v = Math.floor(v / BASE); }
    return { cat: v, ranks };
  }

  function handName(v) {
    const { cat, ranks } = decode(v);
    const [a, b] = ranks;
    switch (cat) {
      case 8: return a === 14 ? 'Royal flush' : `Straight flush, ${RANK_NAME[a]} high`;
      case 7: return `Four of a kind, ${RANK_PLURAL[a]}`;
      case 6: return `Full house, ${RANK_PLURAL[a]} full of ${RANK_PLURAL[b]}`;
      case 5: return `Flush, ${RANK_NAME[a]} high`;
      case 4: return `Straight, ${RANK_NAME[a]} high`;
      case 3: return `Three of a kind, ${RANK_PLURAL[a]}`;
      case 2: return `Two pair, ${RANK_PLURAL[a]} and ${RANK_PLURAL[b]}`;
      case 1: return `Pair of ${RANK_PLURAL[a]}`;
      default: return `High card ${RANK_NAME[a]}`;
    }
  }

  /* ---------- equity (Monte Carlo) ---------- */

  /**
   * Win/tie probability of `hole` against `opponents` random hands.
   * `board` has 0-5 known cards. Returns {win, tie, equity} in 0..1.
   */
  function equity(hole, board, opponents, iters, rng) {
    rng = rng || Math.random;
    iters = iters || 1000;
    const known = new Set(hole.concat(board).map(c => c.id));
    const rest = DECK.filter(c => !known.has(c.id));
    const need = 5 - board.length;
    const draw = need + opponents * 2;
    let win = 0;
    let tie = 0;
    for (let it = 0; it < iters; it++) {
      // partial Fisher-Yates: only the first `draw` cards are needed
      for (let i = 0; i < draw; i++) {
        const j = i + Math.floor(rng() * (rest.length - i));
        const t = rest[i]; rest[i] = rest[j]; rest[j] = t;
      }
      const full = board.concat(rest.slice(0, need));
      const mine = evaluate(hole.concat(full));
      let best = -1;
      let ties = 0;
      for (let o = 0; o < opponents; o++) {
        const off = need + o * 2;
        const v = evaluate([rest[off], rest[off + 1]].concat(full));
        if (v > best) { best = v; ties = 1; } else if (v === best) ties++;
      }
      if (mine > best) win++;
      else if (mine === best) tie += 1 / (ties + 1);
    }
    return { win: win / iters, tie: tie / iters, equity: (win + tie) / iters };
  }

  /**
   * Outs: unseen cards that lift you to a straight or better when you are below it.
   * Only meaningful on the flop (3 board cards) or turn (4).
   */
  function outsToStraightOrBetter(hole, board) {
    if (board.length < 3 || board.length > 4) return null;
    const seen = new Set(hole.concat(board).map(c => c.id));
    if (categoryOf(evaluate(hole.concat(board))) >= 4) return { outs: 0, cards: [], made: true };
    const cards = DECK.filter(c => !seen.has(c.id)
      && categoryOf(evaluate(hole.concat(board, [c]))) >= 4);
    return { outs: cards.length, cards, made: false };
  }

  /* ---------- starting hands: Chen formula ---------- */

  function chen(c1, c2) {
    const hi = Math.max(c1.rank, c2.rank);
    const lo = Math.min(c1.rank, c2.rank);
    const pts = r => (r === 14 ? 10 : r === 13 ? 8 : r === 12 ? 7 : r === 11 ? 6 : r / 2);
    const steps = [];
    let score = pts(hi);
    steps.push([`Highest card (${RANK_LABEL[hi] || hi})`, pts(hi)]);
    if (hi === lo) {
      score = Math.max(5, pts(hi) * 2);
      steps.push(['Pair: double the points (minimum 5)', score - pts(hi)]);
    } else {
      if (c1.suit === c2.suit) { score += 2; steps.push(['Suited', 2]); }
      const gap = hi - lo - 1;
      const pen = gap === 0 ? 0 : gap === 1 ? -1 : gap === 2 ? -2 : gap === 3 ? -4 : -5;
      if (pen) { score += pen; steps.push([`Gap of ${gap} between the cards`, pen]); }
      if (gap <= 1 && hi < 12) { score += 1; steps.push(['Connected and low: straight potential', 1]); }
    }
    return { score: Math.ceil(score), steps };
  }

  /** Short label for a hole-card pair, e.g. "AKs", "77", "T9o". */
  function holeLabel(c1, c2) {
    const [a, b] = c1.rank >= c2.rank ? [c1, c2] : [c2, c1];
    const lab = r => (r === 10 ? 'T' : RANK_LABEL[r] || String(r));
    return lab(a.rank) + lab(b.rank) + (a.rank === b.rank ? '' : a.suit === b.suit ? 's' : 'o');
  }

  Object.assign(P, {
    SUITS, SUIT_INFO, RANK_LABEL, RANK_NAME, RANK_PLURAL, DECK, BY_ID, CATEGORIES,
    card: id => BY_ID[id], shuffle, evaluate5, evaluate, bestHand, categoryOf, decode, handName,
    equity, outsToStraightOrBetter, chen, holeLabel,
    sortHand: cards => cards.slice().sort((a, b) => b.rank - a.rank),
  });
})(window.Poker = window.Poker || {});
