/* Heuristic AI. Also powers the coach (hints, bid advice, discard advice). */
(function (T) {
  'use strict';

  const tr = window.Core.t;
  const sameTeam = (taker, a, b) => (a === taker) === (b === taker);
  const isSuitCard = c => c.suit !== 'T' && c.suit !== 'X';
  const fmt = n => { const x = Number.isInteger(n) ? String(n) : n.toFixed(1); return window.Core.lang === 'fr' ? x.replace('.', ',') : x; };
  const sn = s => tr(T.SUIT_INFO[s].name, T.SUIT_INFO[s].name.toLowerCase());

  /* ---------- Hand evaluation / bidding ---------- */

  function evaluateHand(hand) {
    const trumps = hand.filter(c => c.suit === 'T');
    const oudlers = hand.filter(c => c.oudler);
    const kings = hand.filter(c => isSuitCard(c) && c.rank === 14);
    const queens = hand.filter(c => isSuitCard(c) && c.rank === 13);
    const big = trumps.filter(c => c.rank >= 15);
    const hasPetit = trumps.some(c => c.rank === 1);
    const counts = {};
    T.SUITS.forEach(s => { counts[s] = hand.filter(c => c.suit === s).length; });
    const voids = T.SUITS.filter(s => counts[s] === 0);

    const details = [];
    let score = 0;
    const add = (label, value, note) => { if (value) { score += value; details.push({ label, value, note }); } };

    add(tr(`${trumps.length} trump(s)`, `${trumps.length} atout(s)`), trumps.length, tr('Trumps win tricks and protect your kings. 1 point each.', 'Les atouts font gagner des plis et protègent vos rois. 1 point chacun.'));
    let oudlerValue = oudlers.length * 4;
    let oudlerNote = tr('Oudlers (21, Petit, Excuse) lower the points you need and are worth 4.5 each.', 'Les bouts (21, Petit, Excuse) abaissent les points à réaliser et valent 4,5 chacun.');
    if (hasPetit && trumps.length < 6) {
      oudlerValue -= 2;
      oudlerNote += tr(' The Petit is fragile with fewer than 6 trumps, so it counts for less.', ' Le Petit est fragile avec moins de 6 atouts : il compte donc moins.');
    }
    add(tr(`${oudlers.length} oudler(s)`, `${oudlers.length} bout(s)`), oudlerValue, oudlerNote);
    add(tr(`${kings.length} king(s)`, `${kings.length} roi(s)`), kings.length * 2, tr('Kings usually win their suit early.', 'Les rois gagnent généralement leur couleur tôt.'));
    add(tr(`${queens.length} queen(s)`, `${queens.length} dame(s)`), queens.length, tr('Queens are decent but can be captured by a king.', 'Les dames sont bonnes mais peuvent être prises par un roi.'));
    add(tr(`${big.length} big trump(s) (15+)`, `${big.length} gros atout(s) (15+)`), big.length * 1.5, tr('High trumps win tricks late in the deal.', 'Les gros atouts font gagner des plis en fin de donne.'));
    if (trumps.length >= 4) {
      add(tr(`${voids.length} void suit(s)`, `${voids.length} chicane(s)`), voids.length * 1.5, tr('With no cards in a suit you can ruff (trump) it.', 'Sans carte dans une couleur (chicane), vous pouvez la couper à l\'atout.'));
    }

    let level = null;
    if (score >= 30) level = 'sans';
    else if (score >= 22) level = 'garde';
    else if (score >= 15) level = 'petite';

    return { score, details, level, trumps: trumps.length, oudlers: oudlers.length, kings: kings.length, voids, counts };
  }

  const levelOf = key => (key ? T.CONTRACTS[key].level : 0);

  function chooseBid(hand, highest, aggr) {
    const ev = evaluateHand(hand);
    // `aggr` nudges the thresholds so bots do not all behave identically.
    const adj = ev.score + (aggr || 0);
    let want = null;
    if (adj >= 30) want = 'sans';
    else if (adj >= 22) want = 'garde';
    else if (adj >= 15) want = 'petite';
    const raise = want && levelOf(want) > (highest ? levelOf(highest.contract) : 0);
    return {
      contract: raise ? want : null,
      reason: tr(`Hand strength ${fmt(ev.score)}: ${ev.trumps} trumps, ${ev.oudlers} oudler(s), ${ev.kings} king(s).`,
        `Force de la main ${fmt(ev.score)} : ${ev.trumps} atouts, ${ev.oudlers} bout(s), ${ev.kings} roi(s).`) +
        (raise ? tr(` Enough for ${T.CONTRACTS[want].name}.`, ` Suffisant pour une ${T.CONTRACTS[want].name}.`) : tr(' Not enough to outbid.', ' Pas assez pour surenchérir.')),
      eval: ev,
    };
  }

  /* ---------- Dog discard ---------- */

  function chooseDiscard(hand24) {
    const suitLen = {};
    T.SUITS.forEach(s => { suitLen[s] = hand24.filter(c => c.suit === s).length; });
    const hasKing = {};
    T.SUITS.forEach(s => { hasKing[s] = hand24.some(c => c.suit === s && c.rank === 14); });

    const plain = hand24
      .filter(c => isSuitCard(c) && c.rank !== 14)
      .sort((a, b) =>
        (hasKing[a.suit] - hasKing[b.suit]) || (suitLen[a.suit] - suitLen[b.suit]) || (a.rank - b.rank));
    const picked = plain.slice(0, 6);
    if (picked.length < 6) {
      const lowTrumps = hand24.filter(c => c.suit === 'T' && !c.oudler).sort((a, b) => a.rank - b.rank);
      picked.push(...lowTrumps.slice(0, 6 - picked.length));
    }
    const remaining = hand24.filter(c => !picked.includes(c));
    const newVoids = T.SUITS.filter(s => suitLen[s] > 0 && !remaining.some(c => c.suit === s));
    let reason = tr('Discard low cards from your shortest suits (never kings or oudlers)', 'Écartez de petites cartes de vos couleurs les plus courtes (jamais de rois ni de bouts)');
    if (newVoids.length) {
      reason += tr(` to create a void in ${newVoids.map(s => T.SUIT_INFO[s].name).join(' and ')}, so you can trump it later`, ` pour faire chicane à ${newVoids.map(sn).join(' et ')}, afin de pouvoir couper plus tard`);
    }
    if (picked.some(c => c.suit === 'T')) reason += tr('. Low trumps were needed to fill the 6 cards', '. Il a fallu écarter de petits atouts pour compléter les 6 cartes');
    return { cards: T.sortHand(picked), reason: reason + '.' };
  }

  /* ---------- Card play ---------- */

  // Order cards from "cheapest to lose" to "most valuable".
  const lowFirst = (a, b) =>
    ((a.suit === 'T') - (b.suit === 'T')) || (a.points - b.points) || (a.rank - b.rank);

  function leadCard(ctx, playable, excuse) {
    const { hand, player, taker } = ctx;
    const isTaker = player === taker;
    const nonTrump = playable.filter(isSuitCard);
    const trumps = playable.filter(c => c.suit === 'T').sort((a, b) => a.rank - b.rank);
    const trumpCount = hand.filter(c => c.suit === 'T').length;
    const suitCards = s => hand.filter(c => c.suit === s).length;

    if (isTaker && trumpCount >= 6) {
      const draw = trumps.filter(c => c.rank !== 1).pop();
      if (draw) return { card: draw, reason: tr(`You hold ${trumpCount} trumps: lead your highest to draw out the defenders' trumps.`, `Vous avez ${trumpCount} atouts : jouez le plus fort pour faire tomber les atouts des défenseurs.`) };
    }
    const kings = nonTrump.filter(c => c.rank === 14).sort((a, b) => suitCards(b.suit) - suitCards(a.suit));
    if (kings.length && ctx.trickNo < 12) {
      return { card: kings[0], reason: tr(`Leading the ${kings[0].name} is a strong start: a king usually wins 4.5 points.`, `Entamer avec ${kings[0].name} est un bon début : un roi remporte généralement 4,5 points.`) };
    }
    if (nonTrump.length) {
      const bySuit = {};
      nonTrump.forEach(c => { (bySuit[c.suit] = bySuit[c.suit] || []).push(c); });
      const suits = Object.keys(bySuit).sort((a, b) => suitCards(a) - suitCards(b));
      const pick = isTaker ? suits[suits.length - 1] : suits[0];
      const card = bySuit[pick].slice().sort((a, b) => a.rank - b.rank)[0];
      return {
        card,
        reason: isTaker
          ? tr(`Probe your longest suit (${T.SUIT_INFO[pick].name}) with a low card.`, `Sondez votre couleur la plus longue (${sn(pick)}) avec une petite carte.`)
          : tr(`Lead low in your shortest suit (${T.SUIT_INFO[pick].name}) to run out of it and be able to trump later.`, `Entamez petit dans votre couleur la plus courte (${sn(pick)}) pour vous en défaire et pouvoir couper plus tard.`),
      };
    }
    const lowTrump = trumps.filter(c => c.rank !== 1)[0] || trumps[0];
    if (lowTrump) return { card: lowTrump, reason: tr('Only trumps left: lead the lowest, keeping the Petit for the last trick.', 'Il ne reste que des atouts : jouez le plus petit en gardant le Petit pour le dernier pli.') };
    return { card: excuse, reason: tr('Nothing else to play.', 'Rien d\'autre à jouer.') };
  }

  /** ctx: {hand, trick, player, taker, trickNo}. Returns {card, reason}. */
  function choosePlay(ctx) {
    const { hand, trick, player, taker } = ctx;
    const info = T.legalInfo(hand, trick);
    const legal = info.cards;
    if (legal.length === 1) {
      return { card: legal[0], reason: legal[0].suit === 'X' ? tr('The Excuse is your last card.', 'L\'Excuse est votre dernière carte.') : tr('Only one legal card.', 'Une seule carte est permise.') };
    }
    const excuse = legal.find(c => c.suit === 'X');
    const playable = legal.filter(c => c.suit !== 'X');
    const win = T.trickWinnerIndex(trick);

    if (!trick.length || win < 0) return leadCard(ctx, playable, excuse);

    const wp = trick[win].player;
    const wc = trick[win].card;
    const trickPts = T.sumPoints(trick.map(p => p.card));
    const last = trick.length === 3;

    if (sameTeam(taker, wp, player)) {
      if (last || wc.id === 'T21') {
        const pool = playable.filter(c => !c.oudler);
        const feed = (pool.length ? pool : playable).slice().sort((a, b) => b.points - a.points || lowFirst(a, b))[0];
        return {
          card: feed,
          reason: tr(`Your partner is winning${last ? ' and nobody can overtake' : ' with the unbeatable 21'}: feed the trick with your most valuable safe card.`, `Votre partenaire gagne${last ? ' et personne ne peut le surpasser' : ' avec le 21 imbattable'} : chargez le pli avec votre carte la plus précieuse sans risque.`),
        };
      }
      const low = playable.slice().sort(lowFirst)[0];
      return { card: low, reason: tr('Your partner is winning for now: play low and keep your good cards.', 'Votre partenaire gagne pour le moment : jouez petit et gardez vos bonnes cartes.') };
    }

    const winners = playable
      .filter(c => T.trickWinnerIndex(trick.concat({ player, card: c })) === trick.length)
      .sort((a, b) => ((a.suit === 'T') - (b.suit === 'T')) || (a.rank - b.rank));
    if (winners.length) {
      const cheapest = winners[0];
      const voluntaryTrump = cheapest.suit === 'T' && playable.some(c => c.suit !== 'T');
      if (!(voluntaryTrump && trickPts < 3)) {
        return {
          card: cheapest,
          reason: tr(`An opponent is winning (${fmt(trickPts)} pts on the table). ${cheapest.name} is the cheapest card that takes the trick.`, `Un adversaire gagne (${fmt(trickPts)} pts sur la table). ${cheapest.name} est la carte la moins chère qui prend le pli.`),
        };
      }
    }
    const sacrifice = playable.slice().sort(lowFirst)[0];
    if (excuse && sacrifice.points >= 2.5) {
      return { card: excuse, reason: tr(`You cannot win this trick and would lose ${sacrifice.name}. The Excuse saves it.`, `Vous ne pouvez pas gagner ce pli et perdriez ${sacrifice.name}. L'Excuse la sauve.`) };
    }
    return { card: sacrifice, reason: tr('You cannot win this trick: give away your least valuable card.', 'Vous ne pouvez pas gagner ce pli : donnez votre carte la moins précieuse.') };
  }

  T.Bots = { evaluateHand, chooseBid, chooseDiscard, choosePlay, sameTeam, fmt };
})(window.Tarot = window.Tarot || {});
