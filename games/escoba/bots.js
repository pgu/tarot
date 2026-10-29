/* Escoba AI (also the coach): value of captures, danger of leaving the table. */
(function (S) {
  'use strict';
  const value = S.escobaValue;
  const fmt = n => (Math.round(n * 10) / 10).toString();

  /** Rough worth (in points) of taking a card. */
  function cardWorth(c) {
    let w = 0.35;
    if (c.suit === 'O') w += 0.55;
    if (c.rank === 7) w += 0.9;
    if (c.rank === 6) w += 0.2;
    if (c.id === 'O7') w += 2.5;
    return w;
  }

  /** Chance the opponent can immediately sweep or capture after we leave `table`. */
  function danger(table, unseen, handSize) {
    if (!unseen.length) return 0;
    const sum = table.reduce((s, c) => s + value(c), 0);
    const p = v => {
      const k = unseen.filter(c => value(c) === v).length;
      return 1 - Math.pow(1 - k / unseen.length, handSize);
    };
    let d = 0;
    const need = 15 - sum;
    if (table.length && need >= 1 && need <= 10) d += 3 * p(need); // sweep
    // any capture (rough): for each card value, does a subset of the table complete 15?
    const n = table.length;
    const sums = new Set();
    for (let mask = 1; mask < (1 << n); mask++) {
      let s = 0;
      for (let i = 0; i < n; i++) if (mask & (1 << i)) s += value(table[i]);
      sums.add(s);
    }
    for (let v = 1; v <= 10; v++) if (sums.has(15 - v)) d += 0.5 * p(v);
    return d;
  }

  /** Evaluate every legal move. Returns sorted list of {card, capture, score, reason}. */
  function options(game, player) {
    const hand = game.hands[player];
    const unseen = game.unseen(player);
    const opp = Math.min(3, game.hands[1 - player].length || 3);
    const lastPlay = game.hands[0].length + game.hands[1].length === 1 && game.deck.length === 0;
    const out = [];
    hand.forEach(card => {
      const caps = game.capturesFor(player, card);
      if (caps.length) {
        caps.forEach(cap => {
          const all = cap.concat(card);
          let score = all.reduce((s, c) => s + cardWorth(c), 0);
          const rest = game.table.filter(c => !cap.includes(c));
          let why = `Takes ${all.length} cards`;
          if (!rest.length && !lastPlay) { score += 3.2; why += ' and sweeps the table (escoba, +1 point)'; }
          else score -= danger(rest, unseen, opp);
          if (all.some(c => c.id === 'O7')) why += ', including the 7 de Oros';
          else if (all.filter(c => c.rank === 7).length) why += `, including ${all.filter(c => c.rank === 7).length} seven(s)`;
          out.push({ card, capture: cap, score, reason: why + '.' });
        });
      } else {
        const rest = game.table.concat(card);
        const score = -cardWorth(card) * 0.7 - danger(rest, unseen, opp);
        out.push({ card, capture: null, score, reason: `Nothing adds up to 15 with ${card.text}: drop it where it gives the opponent the least.` });
      }
    });
    // the rules force a capture with a card that can capture, but the player may still choose a non-capturing card
    return out.sort((a, b) => b.score - a.score);
  }

  function choose(game, player) {
    const opts = options(game, player);
    return opts[0];
  }

  S.EscobaBots = { options, choose, cardWorth, danger, fmt };
})(window.Spanish = window.Spanish || {});
