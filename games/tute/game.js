/* El Tute arrastrado, 2 players, Spanish 40-card deck. Rules + game state, no DOM. */
(function (S) {
  'use strict';

  // Strength (high wins) and points of each card
  const POWER = { 1: 10, 3: 9, 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 2: 1 };
  const PTS = { 1: 11, 3: 10, 12: 4, 11: 3, 10: 2 };
  const power = c => POWER[c.rank];
  const points = c => PTS[c.rank] || 0;
  const sum = cards => cards.reduce((s, c) => s + points(c), 0);
  const TRICKS = 20;

  /** Index (0 or 1) of the winner of a two-card trick [lead, reply]. */
  function trickWinner(lead, reply, triumph) {
    if (reply.suit === lead.suit) return power(reply) > power(lead) ? 1 : 0;
    if (reply.suit === triumph) return 1;
    return 0;
  }

  /** Cards the follower may play in the arrastre (stock empty): follow suit, beat if able, else trump, else anything. */
  function arrastreLegal(hand, lead, triumph) {
    const same = hand.filter(c => c.suit === lead.suit);
    if (same.length) {
      const higher = same.filter(c => power(c) > power(lead));
      return { cards: higher.length ? higher : same, rule: higher.length ? 'montar' : 'asistir' };
    }
    const tr = hand.filter(c => c.suit === triumph);
    if (tr.length) return { cards: tr, rule: 'fallar' };
    return { cards: hand.slice(), rule: 'libre' };
  }

  const RULE_TEXT = {
    libre: 'Free play: while there are cards in the monte (stock) nobody has to follow suit or win the trick.',
    lead: 'You lead: play any card.',
    asistir: 'Arrastre: you must follow suit (asistir). You cannot beat the card, so any card of that suit.',
    montar: 'Arrastre: you must follow suit AND play a higher card of that suit (montar) if you can.',
    fallar: 'Arrastre: you have no card of that suit, so you must play a triumph (fallar).',
    libre2: 'Arrastre: you have neither the suit nor a triumph, so you may play anything.',
  };

  class Tute {
    constructor(opts) {
      opts = opts || {};
      this.names = opts.names || ['You', 'Bot'];
      this.matches = [0, 0];
      this.dealer = opts.dealer == null ? 1 : opts.dealer;
      this.newHand();
    }

    newHand() {
      const deck = S.shuffle(S.DECK.slice());
      this.hands = [S.sortCards(deck.splice(0, 6)), S.sortCards(deck.splice(0, 6))];
      this.stock = deck;               // draw with pop(); stock[0] is the face-up triumph card, drawn last
      this.pinta = this.stock[0];
      this.triumph = this.pinta.suit;
      this.piles = [[], []];
      this.cantes = [[], []];          // suits sung
      this.bonus = [0, 0];             // points from cantes
      this.wonAny = [false, false];
      this.trick = [];
      this.trickNo = 0;
      this.leader = (this.dealer + 1) % 2;
      this.turn = this.leader;
      this.phase = 'play';
      this.result = null;
      this.history = [];
      this.swapped = false;
    }

    get arrastre() { return this.stock.length === 0; }
    get trickComplete() { return this.trick.length === 2; }

    /** Legal cards for player p right now, plus the rule that applies. */
    legal(p) {
      const hand = this.hands[p];
      if (!this.trick.length) return { cards: hand.slice(), rule: 'lead' };
      if (!this.arrastre) return { cards: hand.slice(), rule: 'libre' };
      const r = arrastreLegal(hand, this.trick[0].card, this.triumph);
      return { cards: r.cards, rule: r.rule === 'libre' ? 'libre2' : r.rule };
    }

    /* ---- special actions (only for the player who leads) ---- */
    singable(p) {
      if (this.phase !== 'play' || this.turn !== p || this.trick.length || !this.wonAny[p]) return [];
      return S.SUITS.filter(s => !this.cantes[p].includes(s)
        && this.hands[p].some(c => c.suit === s && c.rank === 12) && this.hands[p].some(c => c.suit === s && c.rank === 11));
    }
    sing(p, suit) {
      if (!this.singable(p).includes(suit)) throw new Error('You cannot sing that');
      const pts = suit === this.triumph ? 40 : 20;
      this.cantes[p].push(suit);
      this.bonus[p] += pts;
      return pts;
    }
    canSwap(p) {
      return this.phase === 'play' && this.turn === p && !this.trick.length && this.wonAny[p] && this.stock.length >= 2
        && this.pinta.rank !== 7 && this.hands[p].some(c => c.suit === this.triumph && c.rank === 7);
    }
    swap(p) {
      if (!this.canSwap(p)) throw new Error('You cannot swap the 7');
      const seven = this.hands[p].find(c => c.suit === this.triumph && c.rank === 7);
      this.hands[p] = S.sortCards(this.hands[p].filter(c => c !== seven).concat(this.pinta));
      this.stock[0] = seven;
      this.pinta = seven;
      this.swapped = true;
    }
    canTute(p) {
      if (this.phase !== 'play' || this.turn !== p || this.trick.length === 2) return null;
      for (const r of [12, 11]) if (this.hands[p].filter(c => c.rank === r).length === 4) return r;
      return null;
    }
    tute(p) {
      const r = this.canTute(p);
      if (!r) throw new Error('You do not have four reyes or four caballos');
      this.result = { tute: true, rank: r, winner: p, points: [0, 0] };
      this.finish(p);
    }

    /* ---- trick play ---- */
    play(p, card) {
      if (this.phase !== 'play' || this.turn !== p || this.trickComplete) throw new Error('Not your turn');
      if (!this.hands[p].includes(card)) throw new Error('Card not in hand');
      if (!this.legal(p).cards.includes(card)) throw new Error('Illegal card');
      this.hands[p] = this.hands[p].filter(c => c !== card);
      this.trick.push({ player: p, card });
      this.turn = this.trick.length === 2 ? null : 1 - p;
    }

    collectTrick() {
      if (!this.trickComplete) throw new Error('Trick not complete');
      const [a, b] = this.trick;
      const w = trickWinner(a.card, b.card, this.triumph) === 0 ? a.player : b.player;
      this.piles[w].push(a.card, b.card);
      this.wonAny[w] = true;
      const rec = { no: this.trickNo, cards: this.trick.slice(), winner: w, points: points(a.card) + points(b.card) };
      this.history.push(rec);
      this.trick = [];
      this.trickNo++;
      if (this.stock.length) { // winner draws first
        this.hands[w] = S.sortCards(this.hands[w].concat(this.stock.pop()));
        this.hands[1 - w] = S.sortCards(this.hands[1 - w].concat(this.stock.pop()));
      }
      if (this.trickNo === TRICKS) {
        this.bonusLast = w;
        this.finish(null, w);
      } else { this.leader = w; this.turn = w; }
      return rec;
    }

    finish(tuteWinner, lastWinner) {
      this.phase = 'done';
      this.turn = null;
      if (tuteWinner != null) { this.matches[tuteWinner]++; return; }
      const cardPts = [sum(this.piles[0]), sum(this.piles[1])];
      const last = [0, 0]; last[lastWinner] = 10;
      const total = [0, 1].map(i => cardPts[i] + this.bonus[i] + last[i]);
      const winner = total[0] > total[1] ? 0 : total[1] > total[0] ? 1 : null;
      this.result = { tute: false, cardPts, cantes: this.bonus.slice(), last, points: total, winner };
      if (winner != null) this.matches[winner]++;
    }

    nextHand() { this.dealer = 1 - this.dealer; this.newHand(); }

    /** Information available to a decision maker sitting in seat p. */
    ctxFor(p) {
      const seen = new Set();
      this.piles[0].concat(this.piles[1], this.hands[p], this.trick.map(t => t.card)).forEach(c => seen.add(c.id));
      seen.add(this.pinta.id);
      return {
        hand: this.hands[p], led: this.trick.length ? this.trick[0].card : null, triumph: this.triumph, pinta: this.pinta,
        arrastre: this.arrastre, stockLen: this.stock.length, seen, sung: this.cantes[p], oppSung: this.cantes[1 - p],
        singable: this.singable(p), canSwap: this.canSwap(p), canTute: this.canTute(p), trickNo: this.trickNo,
        legal: this.legal(p).cards, oppHandSize: this.hands[1 - p].length,
      };
    }
  }

  Object.assign(S, { Tute, tutePower: power, tutePoints: points, tuteSum: sum, tuteWinner: trickWinner, tuteArrastreLegal: arrastreLegal, TUTE_RULES: RULE_TEXT });
})(window.Spanish = window.Spanish || {});
