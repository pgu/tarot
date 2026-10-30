/* Cinquillo AI and coach. ctx: {hand, table, first}. */
(function (S) {
  'use strict';
  const SEQ = S.CINQ_SEQ;
  const idx = S.cinqIdx;
  const OPEN = 4; // the 5 opens a suit

  /** Card of suit s at sequence index i (or null outside the suit). */
  const cardAt = (s, i) => (i >= 0 && i < SEQ.length ? S.card(s + SEQ[i]) : null);

  /** Choose the card to play. Returns {card, reason} (card null = pass). */
  function choose(ctx) {
    const legal = S.cinquilloLegal(ctx.hand, ctx.table, ctx.first);
    if (!legal.length) return { card: null, reason: 'No card can be played: you must pass (it costs nothing).' };
    if (legal.length === 1) return { card: legal[0], reason: ctx.first ? 'The player with the 5 de oros starts.' : 'Your only playable card.' };
    const holds = c => !!c && ctx.hand.includes(c);
    let best = null;
    legal.forEach(c => {
      const i = idx(c);
      const t = ctx.table[c.suit];
      let score = 0;
      let why;
      if (!t) { // opening a suit with its 5
        const up = cardAt(c.suit, i + 1); const down = cardAt(c.suit, i - 1);
        const mine = [up, down].filter(holds).length;
        score = mine * 2 - (2 - mine) * 1.5;
        why = mine === 2 ? `Opening ${c.suit === 'O' ? 'oros' : S.SUIT_INFO[c.suit].name.toLowerCase()} is good: you hold the cards on both sides.` : `Opening a suit with the 5 lets the others play on both sides${mine ? ', though you keep one side' : ''}.`;
      } else {
        const dir = i > t.hi ? 1 : -1;
        const nextCard = cardAt(c.suit, i + dir);
        if (!nextCard) { score = 3; why = `${c.text} closes that end of the suit: it opens nothing for the others.`; }
        else if (holds(nextCard)) { score = 2.5; why = `You also hold ${nextCard.text}, so you keep control of that end.`; }
        else { score = -1; why = `Playing ${c.text} lets the next player continue with ${nextCard.text}.`; }
        // chain support: cards behind it that I can follow with
        let k = i + dir; let chain = 0;
        while (k >= 0 && k < SEQ.length && holds(cardAt(c.suit, k))) { chain++; k += dir; }
        score += chain * 0.8;
      }
      if (!best || score > best.score) best = { card: c, score, reason: why };
    });
    return best;
  }

  S.CinquilloBots = { choose, cardAt };
})(window.Spanish = window.Spanish || {});
