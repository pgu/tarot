/* Tute AI and coach. Works from a context object (see Tute.ctxFor), so the Hand Advisor can reuse it. */
(function (S) {
  'use strict';
  const power = S.tutePower;
  const pts = S.tutePoints;
  const fmt = n => String(Math.round(n * 10) / 10);

  /** Cards of the same suit still hidden from this player. */
  const unseenOf = (ctx, suit) => S.DECK.filter(c => c.suit === suit && !ctx.seen.has(c.id));
  const isBoss = (ctx, c) => !unseenOf(ctx, c.suit).some(o => power(o) > power(c));

  /** Cost of throwing a card away: points it carries, plus potential cante/triumph value. */
  function keepValue(ctx, c) {
    let v = pts(c);
    if (c.suit === ctx.triumph) v += 3 + power(c) * 0.3;
    const pair = (c.rank === 12 || c.rank === 11) && !ctx.sung.includes(c.suit)
      && ctx.hand.some(o => o.suit === c.suit && o.rank === (c.rank === 12 ? 11 : 12));
    if (pair) v += c.suit === ctx.triumph ? 9 : 6;
    return v;
  }

  const cheapest = (ctx, cards) => cards.slice().sort((a, b) => keepValue(ctx, a) - keepValue(ctx, b) || power(a) - power(b))[0];

  /** Pick the card to play. */
  function chooseCard(ctx) {
    const legal = ctx.legal;
    if (legal.length === 1) return { card: legal[0], reason: 'Only one legal card.' };
    const tr = ctx.triumph;
    if (!ctx.led) { // we lead
      if (ctx.arrastre) {
        const trumps = legal.filter(c => c.suit === tr).sort((a, b) => power(b) - power(a));
        const unseenTr = unseenOf(ctx, tr).length;
        if (trumps.length >= 2 && unseenTr > 0) return { card: trumps[0], reason: 'Arrastre: lead your highest triumph to drag out the rival\'s triumphs.' };
        const bosses = legal.filter(c => c.suit !== tr && isBoss(ctx, c) && (unseenTr === 0 || unseenOf(ctx, c.suit).length >= 2));
        if (bosses.length) {
          const b = bosses.sort((a, b2) => pts(b2) - pts(a))[0];
          return { card: b, reason: `${b.text} is the highest card of its suit still in play: it should win the trick.` };
        }
        if (trumps.length && unseenTr === 0) return { card: trumps[0], reason: 'No triumphs left outside your hand: yours win.' };
      }
      const c = cheapest(ctx, legal);
      return { card: c, reason: ctx.arrastre ? 'Nothing sure to win: lead the card you can least afford to lose last.' : `Lead a low-value card (${c.text}): the rival gets few points if they win it, and you keep your strong cards.` };
    }
    // we reply
    const ledPts = pts(ctx.led);
    const wins = legal.filter(c => S.tuteWinner(ctx.led, c, tr) === 1).sort((a, b) => (a.suit === tr) - (b.suit === tr) || power(a) - power(b));
    if (wins.length) {
      const w = wins[0];
      const wastesTriumph = w.suit === tr && ctx.led.suit !== tr && !ctx.arrastre && ledPts + pts(w) < 6;
      if (!wastesTriumph) return { card: w, reason: `${w.text} wins the trick (${fmt(ledPts + pts(w))} points) with the cheapest card that can.` };
      const low = cheapest(ctx, legal.filter(c => c.suit !== tr).length ? legal.filter(c => c.suit !== tr) : legal);
      return { card: low, reason: 'You could trump it, but the trick is worth too little: keep your triumph.' };
    }
    const low = cheapest(ctx, legal);
    return { card: low, reason: 'You cannot win this trick: give away your least valuable card.' };
  }

  /** Decide what to do on our turn: optional tute / swap / sing, then a card. */
  function plan(ctx) {
    const acts = [];
    if (ctx.canTute) return { tute: ctx.canTute, acts: [`Cuatro ${ctx.canTute === 12 ? 'reyes' : 'caballos'}: ¡tute! You win the hand.`] };
    let swap = false;
    if (ctx.canSwap && pts(ctx.pinta) >= 4) {
      swap = true;
      acts.push(`Cambiar el 7: swap your 7 of triumph for the ${ctx.pinta.text} (worth ${pts(ctx.pinta)} points).`);
    }
    let sing = null;
    if (ctx.singable.length) {
      sing = ctx.singable.includes(ctx.triumph) ? ctx.triumph : ctx.singable[0];
      acts.push(sing === ctx.triumph ? '¡Las cuarenta! Sing the king and knight of the triumph suit: 40 points.' : `Las veinte en ${S.SUIT_INFO[sing].name.toLowerCase()}: 20 points.`);
    }
    return { tute: null, swap, sing, acts };
  }

  S.TuteBots = { chooseCard, plan, isBoss, keepValue, unseenOf, fmt };
})(window.Spanish = window.Spanish || {});
