/* Rami AI and coaching. */
(function (R) {
  'use strict';

  function potential(card, others) {
    let p = 0;
    others.forEach(o => {
      if (o === card || o.joker) return;
      if (o.rank === card.rank && o.suit !== card.suit) p += 1;
      else if (o.suit === card.suit) {
        const d = Math.abs(o.rank - card.rank);
        if (d === 1) p += 1; else if (d === 2) p += 0.5;
      }
    });
    return p;
  }

  /** Should we take the visible défausse card? */
  function wantsDiscard(game, p) {
    const hand = game.hands[p];
    const top = game.top();
    if (!top) return { take: false, reason: 'La défausse est vide.' };
    const base = R.bestArrangement(hand, 'cards').laid;
    const withTop = R.bestArrangement(hand.concat(top), 'cards').laid;
    let usable = false;
    if (game.opened[p]) usable = game.table.some(m => R.analyze(m.cards.concat(top)));
    if (withTop > base) return { take: true, reason: `${top.text} complète une combinaison.` };
    if (usable) return { take: true, reason: `${top.text} peut s\'ajouter à une combinaison déjà posée sur la table.` };
    return { take: false, reason: `${top.text} ne sert à rien : piochez.` };
  }

  /** What to discard (the card you can least use). */
  function chooseDiscard(game, p) {
    const hand = game.hands[p];
    const arr = R.bestArrangement(hand, 'cards');
    let pool = arr.rest.filter(c => !c.joker);
    if (!pool.length) pool = hand.filter(c => !c.joker);
    if (game.taken && pool.length > 1) pool = pool.filter(c => c !== game.taken);
    if (!pool.length) pool = hand.filter(c => !c.joker);
    if (!pool.length) pool = hand.slice(); // only jokers left: nothing else to throw
    let best = null;
    pool.forEach(c => {
      const score = R.penalty(c) - 4 * potential(c, hand) - (game.opened[p] && game.table.some(m => R.analyze(m.cards.concat(c))) ? 12 : 0);
      if (!best || score > best.score) best = { card: c, score };
    });
    return { card: best.card, reason: `${best.card.text} vaut ${R.penalty(best.card)} points et ne s\'intègre à aucune de vos combinaisons.`, arrangement: arr };
  }

  /** Play a whole turn after the draw (laying down, extending, swapping jokers, discarding). Returns log events. */
  function playTurn(game, p) {
    const ev = [];
    const live = () => game.phase === 'play' && game.turn === p;
    const label = groups => groups.map(g => g.map(c => c.text).join(' ')).join(' | ');

    if (game.opened[p]) {
      let again = true;
      while (again && live()) {
        again = false;
        for (const m of game.table) {
          if (!m.an.joker) continue;
          const c = game.hands[p].find(x => R.canReplaceJoker(m.an, x));
          if (c) { game.swapJoker(p, m.id, c); ev.push(`${game.names[p]} récupère un joker avec ${c.text}.`); again = true; break; }
        }
      }
    }
    if (live() && !game.opened[p]) {
      const arr = R.bestArrangement(game.hands[p], 'open');
      if (arr && arr.points >= R.OPEN_MIN) {
        const groups = arr.melds.map(a => a.cards);
        game.layDown(p, groups);
        ev.push(`${game.names[p]} ouvre avec ${arr.points} points : ${label(groups)}.`);
      }
    }
    if (live() && game.opened[p]) {
      const arr = R.bestArrangement(game.hands[p], 'cards');
      if (arr && arr.melds.length) {
        const groups = arr.melds.map(a => a.cards);
        game.layDown(p, groups);
        ev.push(`${game.names[p]} pose ${label(groups)}.`);
      }
      let again = true;
      while (again && live()) {
        again = false;
        for (const c of game.hands[p].filter(x => !x.joker)) {
          const m = game.table.find(t => game.checkExtend(p, t.id, [c]));
          if (m) { game.extend(p, m.id, [c]); ev.push(`${game.names[p]} ajoute ${c.text} à une combinaison.`); again = true; break; }
        }
      }
    }
    if (live()) {
      const d = chooseDiscard(game, p);
      game.discard(p, d.card);
      ev.push(game.phase === 'draw' || game.phase === 'roundover' || game.phase === 'gameover' ? `${game.names[p]} défausse ${d.card.text}.` : '');
      if (game.result && game.result.winner === p) ev.push(`${game.names[p]} se couche : RAMI ! 🎉`);
    } else if (game.result && game.result.winner === p) ev.push(`${game.names[p]} se couche en posant tout : RAMI ! 🎉`);
    return ev.filter(Boolean);
  }

  R.RamiBots = { wantsDiscard, chooseDiscard, playTurn, potential };
})(window.Rami = window.Rami || {});
