/* Le Bridge: 52-card deck, hand evaluation, calls and auction rules, scoring. No DOM. */
(function (Br, P) {
  'use strict';

  const SUITS = ['S', 'H', 'D', 'C'];            // display order
  const STRAINS = ['C', 'D', 'H', 'S', 'N'];      // bidding order, lowest first
  const SUIT_FR = { S: 'pique', H: 'cœur', D: 'carreau', C: 'trèfle', N: 'sans-atout' };
  const SYM = { S: '♠', H: '♥', D: '♦', C: '♣', N: 'SA' };
  const RANK_FR = { 2: 'deux', 3: 'trois', 4: 'quatre', 5: 'cinq', 6: 'six', 7: 'sept', 8: 'huit', 9: 'neuf', 10: 'dix', 11: 'valet', 12: 'dame', 13: 'roi', 14: 'as' };
  const LABEL = { 11: 'V', 12: 'D', 13: 'R', 14: 'A' };
  const SEATS = ['Sud', 'Ouest', 'Nord', 'Est']; // clockwise: seat + 1 is the next player
  const side = s => s % 2;                       // 0 = Nord-Sud (you), 1 = Est-Ouest
  const partner = s => (s + 2) % 4;

  const DECK = [];
  const BY_ID = {};
  SUITS.forEach(s => {
    for (let r = 14; r >= 2; r--) {
      const c = { id: r + s, suit: s, rank: r, label: LABEL[r] || String(r), text: (LABEL[r] || r) + SYM[s], name: `${RANK_FR[r][0].toUpperCase()}${RANK_FR[r].slice(1)} de ${SUIT_FR[s]}` };
      DECK.push(c); BY_ID[c.id] = c;
    }
  });
  const SUIT_ORDER = { S: 0, H: 1, D: 2, C: 3 };
  const sortHand = cards => cards.slice().sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || b.rank - a.rank);
  const shuffle = (a, rng) => P.shuffle(a, rng);

  /* ---------- hand evaluation ---------- */
  const HCP = { 14: 4, 13: 3, 12: 2, 11: 1 };
  const hcpOf = cards => cards.reduce((s, c) => s + (HCP[c.rank] || 0), 0);

  function evalHand(hand) {
    const counts = { S: 0, H: 0, D: 0, C: 0 };
    hand.forEach(c => { counts[c.suit]++; });
    const hcp = hcpOf(hand);
    const lengthPts = SUITS.reduce((s, x) => s + Math.max(0, counts[x] - 4), 0);
    const shape = SUITS.map(s => counts[s]).sort((a, b) => b - a);
    const balanced = shape[3] >= 2 && shape[0] <= 5 && shape.filter(n => n === 2).length <= 1 && (shape[0] <= 5) && shape[3] !== 1 && shape[3] !== 0 && !(shape[0] === 5 && shape[1] === 4);
    return { hcp, counts, lengthPts, points: hcp + lengthPts, shape, balanced };
  }

  /** Does the hand hold a stopper in `suit`? (A, Kx, Qxx, Jxxx) */
  function stopper(hand, suit) {
    const cs = hand.filter(c => c.suit === suit); const n = cs.length; const has = r => cs.some(c => c.rank === r);
    return has(14) || (has(13) && n >= 2) || (has(12) && n >= 3) || (has(11) && n >= 4);
  }

  /* ---------- calls and auction ---------- */
  const pass = () => ({ t: 'p' });
  const bid = (level, strain) => ({ t: 'b', level, strain });
  const dbl = () => ({ t: 'x' });
  const rdbl = () => ({ t: 'xx' });
  const bidValue = c => c.level * 5 + STRAINS.indexOf(c.strain);
  const callText = c => (c.t === 'p' ? 'Passe' : c.t === 'x' ? 'Contre' : c.t === 'xx' ? 'Surcontre' : `${c.level}${SYM[c.strain]}`);
  const sameCall = (a, b) => a.t === b.t && a.level === b.level && a.strain === b.strain;

  const lastBidEntry = auction => { for (let i = auction.length - 1; i >= 0; i--) if (auction[i].call.t === 'b') return auction[i]; return null; };
  const lastNonPass = auction => { for (let i = auction.length - 1; i >= 0; i--) if (auction[i].call.t !== 'p') return auction[i]; return null; };

  function isLegalCall(auction, seat, call) {
    if (call.t === 'p') return true;
    const lb = lastBidEntry(auction);
    if (call.t === 'b') return call.level >= 1 && call.level <= 7 && (!lb || bidValue(call) > bidValue(lb.call));
    const lnp = lastNonPass(auction);
    if (!lnp) return false;
    if (call.t === 'x') return lnp.call.t === 'b' && side(lnp.seat) !== side(seat);
    return lnp.call.t === 'x' && side(lnp.seat) !== side(seat);
  }

  function auctionOver(auction) {
    if (auction.length < 4) return false;
    const bids = auction.some(a => a.call.t !== 'p');
    if (!bids) return true; // passed out
    return auction.slice(-3).every(a => a.call.t === 'p');
  }

  /** {level, strain, declarer, doubled: 0|1|2} or null if passed out. */
  function finalContract(auction) {
    const lb = lastBidEntry(auction);
    if (!lb) return null;
    const idx = auction.indexOf(lb);
    const declarer = auction.find(a => a.call.t === 'b' && a.call.strain === lb.call.strain && side(a.seat) === side(lb.seat)).seat;
    let doubled = 0;
    auction.slice(idx + 1).forEach(a => { if (a.call.t === 'x') doubled = 1; else if (a.call.t === 'xx') doubled = 2; });
    return { level: lb.call.level, strain: lb.call.strain, declarer, doubled };
  }

  const contractText = c => `${c.level}${SYM[c.strain]}${c.doubled === 1 ? ' contré' : c.doubled === 2 ? ' surcontré' : ''}`;

  /* ---------- trick play ---------- */
  function trickWinnerIndex(trick, trump) {
    const lead = trick[0].card.suit;
    let best = 0;
    trick.forEach((p, i) => {
      if (i === 0) return;
      const c = p.card; const b = trick[best].card;
      if (c.suit === b.suit) { if (c.rank > b.rank) best = i; }
      else if (trump && c.suit === trump && b.suit !== trump) best = i;
    });
    void lead;
    return best;
  }
  const legalCards = (hand, trick) => {
    if (!trick.length) return hand.slice();
    const f = hand.filter(c => c.suit === trick[0].card.suit);
    return f.length ? f : hand.slice();
  };

  /* ---------- scoring (rubber bridge, without honours) ---------- */
  const perTrick = (strain, n) => (strain === 'N' ? (n === 0 ? 0 : 40 + 30 * (n - 1)) : n * (strain === 'C' || strain === 'D' ? 20 : 30));

  /**
   * contract: {level, strain, doubled}; tricks: tricks won by declarer's side (0-13); vul: declarer side vulnerable.
   * Returns {made, trickPoints (below the line), above:[{label, value}], aboveTotal, declarerPoints, defenderPoints}.
   */
  function scoreDeal(contract, tricks, vul) {
    const need = contract.level + 6;
    const mult = [1, 2, 4][contract.doubled];
    const above = [];
    if (tricks >= need) {
      const trickPoints = perTrick(contract.strain, contract.level) * mult;
      const over = tricks - need;
      if (over) {
        const unit = contract.doubled === 0 ? (contract.strain === 'N' ? 30 : perTrick(contract.strain, 1)) : (vul ? 200 : 100) * (contract.doubled === 2 ? 2 : 1);
        above.push({ label: `${over} levée(s) de mieux`, value: over * unit });
      }
      if (contract.doubled) above.push({ label: contract.doubled === 1 ? 'Prime de contrat contré réussi' : 'Prime de contrat surcontré réussi', value: contract.doubled === 1 ? 50 : 100 });
      if (contract.level === 6) above.push({ label: 'Petit chelem', value: vul ? 750 : 500 });
      if (contract.level === 7) above.push({ label: 'Grand chelem', value: vul ? 1500 : 1000 });
      const aboveTotal = above.reduce((s, x) => s + x.value, 0);
      return { made: true, need, trickPoints, above, aboveTotal, declarerPoints: trickPoints + aboveTotal, defenderPoints: 0 };
    }
    const down = need - tricks;
    let pts = 0;
    for (let i = 1; i <= down; i++) {
      if (contract.doubled === 0) pts += vul ? 100 : 50;
      else {
        const base = vul ? (i === 1 ? 200 : 300) : (i === 1 ? 100 : i <= 3 ? 200 : 300);
        pts += base * (contract.doubled === 2 ? 2 : 1);
      }
    }
    return { made: false, need, down, trickPoints: 0, above: [{ label: `${down} levée(s) de chute`, value: pts }], aboveTotal: pts, declarerPoints: 0, defenderPoints: pts };
  }

  /** Rubber: tracks the scores above and below the line, games and vulnerability. */
  class Rubber {
    constructor() { this.reset(); }
    reset() { this.below = [0, 0]; this.banked = [0, 0]; this.above = [0, 0]; this.games = [0, 0]; this.vul = [false, false]; this.over = false; this.winner = null; }
    get totals() { return [0, 1].map(s => this.above[s] + this.banked[s] + this.below[s]); }
    /** sideIdx: declarer's side (0/1). res: scoreDeal result. Returns {game: side|null, bonus}. */
    apply(sideIdx, res) {
      const other = 1 - sideIdx;
      this.below[sideIdx] += res.trickPoints;
      this.above[res.made ? sideIdx : other] += res.aboveTotal;
      let game = null; let bonus = 0;
      if (this.below[sideIdx] >= 100) {
        game = sideIdx;
        this.games[game]++;
        this.vul[game] = true;
        this.banked[game] += this.below[game];
        this.below = [0, 0]; // part-scores are wiped out once a game is won
        if (this.games[game] === 2) {
          bonus = this.games[other] === 0 ? 700 : 500;
          this.above[game] += bonus;
          this.over = true;
          this.winner = game;
        }
      }
      return { game, bonus };
    }
  }

  Object.assign(Br, {
    SUITS, STRAINS, SUIT_FR, SYM, RANK_FR, SEATS, side, partner, DECK, card: id => BY_ID[id], sortHand, shuffle,
    hcpOf, evalHand, stopper, pass, bid, dbl, rdbl, bidValue, callText, sameCall, lastBidEntry, lastNonPass,
    isLegalCall, auctionOver, finalContract, contractText, trickWinnerIndex, legalCards, perTrick, scoreDeal, Rubber,
  });
})(window.Bridge = window.Bridge || {}, window.Poker);
