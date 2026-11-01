/* Le Bridge: natural bidding system for the bots and the coach (5-card majors, 15-17 SA, simple competitive bidding). No DOM. */
(function (Br) {
  'use strict';
  const { SUITS, STRAINS, SYM, SUIT_FR, side, partner, evalHand, stopper, pass, bid, dbl, bidValue, isLegalCall, callText } = Br;
  const MAJORS = ['S', 'H'];
  const sn = s => SUIT_FR[s];
  const R = (call, reason) => ({ call, reason });

  function analyze(auction, seat) {
    const pt = partner(seat);
    const bids = auction.filter(a => a.call.t === 'b');
    return {
      seat, pt, bids, auction,
      mine: bids.filter(a => a.seat === seat).map(a => a.call),
      parts: bids.filter(a => a.seat === pt).map(a => a.call),
      opps: bids.filter(a => side(a.seat) !== side(seat)).map(a => a.call),
      first: bids[0] || null,
      highest: bids.length ? bids[bids.length - 1].call : null,
      lastNP: Br.lastNonPass(auction),
    };
  }

  /** Lowest level at which `strain` can be bid over the current auction. */
  function cheapestLevel(highest, strain) {
    if (!highest) return 1;
    return STRAINS.indexOf(strain) > STRAINS.indexOf(highest.strain) ? highest.level : highest.level + 1;
  }
  const mk = (hi, strain, extra) => bid(Math.min(7, cheapestLevel(hi, strain) + (extra || 0)), strain);

  /** Rough minimum points shown by partner's bidding. */
  function partnerMin(a) {
    if (!a.parts.length) return 0;
    const f = a.parts[0]; const opener = a.bids[0].seat === a.pt;
    let base;
    if (opener) base = f.strain === 'N' ? ({ 1: 15, 2: 20, 3: 22 })[f.level] || 15 : (f.level >= 2 ? 6 : 12);
    else if (f.strain === 'N') base = ({ 1: 6, 2: 10, 3: 13 })[f.level] || 13;
    else base = f.level === 1 ? 6 : f.level === 2 ? 10 : 13;
    return base + Math.min(4, 2 * (a.parts.length - 1));
  }

  /* ---------- opening ---------- */
  function opening(ev) {
    const c = ev.counts; const hcp = ev.hcp;
    if (ev.balanced) {
      if (hcp >= 22) return R(bid(3, 'N'), `Main équilibrée très forte (${hcp} points d'honneurs) : 3SA.`);
      if (hcp >= 20) return R(bid(2, 'N'), `Main équilibrée de ${hcp} points : ouverture de 2SA (20–21).`);
      if (hcp >= 15 && hcp <= 17) return R(bid(1, 'N'), `Main équilibrée de ${hcp} points : ouverture de 1SA (15–17).`);
    }
    if (hcp >= 12 || ev.points >= 13) {
      const maj = MAJORS.filter(s => c[s] >= 5).sort((x, y) => c[y] - c[x] || (x === 'S' ? -1 : 1));
      let suit;
      if (maj.length) suit = maj[0];
      else if (c.D > c.C) suit = 'D';
      else if (c.C > c.D) suit = 'C';
      else suit = c.D >= 4 ? 'D' : 'C';
      return R(bid(1, suit), `${ev.points} points (honneurs + longueur) : on ouvre à 1 dans sa couleur ${maj.length ? 'majeure de 5 cartes' : 'mineure la plus longue'} (${sn(suit)}).`);
    }
    if (hcp >= 5 && hcp <= 10) {
      const six = ['S', 'H', 'D'].find(s => c[s] === 6);
      if (six) return R(bid(2, six), `Couleur de 6 cartes (${sn(six)}) et seulement ${hcp} points : ouverture faible à 2.`);
      const long = SUITS.find(s => c[s] >= 7);
      if (long) return R(bid(c[long] >= 8 ? 4 : 3, long), `Longue couleur de ${c[long]} cartes (${sn(long)}) et peu de points : barrage.`);
    }
    return R(pass(), `Seulement ${ev.hcp} points d'honneurs (${ev.points} avec la longueur) : pas assez pour ouvrir.`);
  }

  /* ---------- responding to partner's opening ---------- */
  function respond(ev, hand, a, auction) {
    const p = a.parts[0]; const c = ev.counts; const hcp = ev.hcp;
    const hi = a.highest;
    if (p.strain === 'N') {
      if (p.level === 1) {
        const major6 = MAJORS.find(s => c[s] >= 6);
        if (hcp >= 17) return R(bid(6, 'N'), `Vous avez ${hcp} points face à 15–17 : le chelem à SA est probable.`);
        if (major6 && hcp >= 10) return R(bid(4, major6), `Couleur de 6 cartes à ${sn(major6)} et ${hcp} points : manche à ${sn(major6)}.`);
        if (hcp >= 10) return R(bid(3, 'N'), `${hcp} points face à 15–17 : 25 points ou plus, on joue la manche à 3SA.`);
        if (hcp >= 8) return R(bid(2, 'N'), `${hcp} points : invitation (2SA), le partenaire ira à 3SA s'il a le haut de sa fourchette.`);
        return R(pass(), `Seulement ${hcp} points face à 15–17 : on passe.`);
      }
      if (p.level === 2) {
        if (hcp >= 13) return R(bid(6, 'N'), `${hcp} points face à 20–21 : petit chelem à SA.`);
        if (hcp >= 5) return R(bid(3, 'N'), `${hcp} points face à 20–21 : manche à 3SA.`);
        return R(pass(), 'Presque aucun point : on passe.');
      }
      if (hcp >= 10) return R(bid(6, 'N'), `${hcp} points face à une main très forte : petit chelem.`);
      return R(pass(), 'Le partenaire est déjà à la manche : on passe.');
    }
    if (p.level >= 2) { // weak two / pre-empt: only raise to game with a real fit and values
      if (c[p.strain] >= 3 && hcp >= 14) return R(bid(p.level >= 4 ? p.level : 4, p.strain), `Fit à ${sn(p.strain)} et ${hcp} points : manche.`);
      return R(pass(), 'Ouverture de barrage : sans grosse main, on passe.');
    }
    const S = p.strain; const major = MAJORS.includes(S);
    const short = n => (n === 0 ? 3 : n === 1 ? 2 : n === 2 ? 1 : 0);
    const fit = major ? c[S] >= 3 : c[S] >= 5;
    const sp = hcp + (fit ? SUITS.filter(s => s !== S).reduce((t, s) => t + short(c[s]), 0) : 0);
    if (hcp < 6 && sp < 6) return R(pass(), `Seulement ${hcp} points : trop faible pour répondre.`);
    if (fit && major) {
      if (sp >= 13) return R(bid(4, S), `Fit à ${sn(S)} (${c[S]} cartes) et ${sp} points avec les courtes : manche à ${sn(S)}.`);
      if (sp >= 10) return R(bid(3, S), `Fit à ${sn(S)} et ${sp} points : soutien sauté à 3 (10–12).`);
      return R(bid(2, S), `Fit à ${sn(S)} et ${sp} points : soutien simple à 2 (6–9).`);
    }
    // a new suit at the 1 level
    const newSuits = SUITS.filter(s => s !== S && c[s] >= 4).sort((x, y) => c[y] - c[x] || (MAJORS.includes(y) ? 1 : -1));
    const oneLevel = newSuits.filter(s => cheapestLevel(hi, s) === 1);
    const maj1 = oneLevel.filter(s => MAJORS.includes(s));
    if (maj1.length) {
      const s = maj1.sort((x, y) => c[y] - c[x] || (x === 'H' ? -1 : 1))[0];
      if (c[s] >= 5 || hcp >= 6) return R(bid(1, s), `${hcp} points et 4 cartes ou plus à ${sn(s)} : on montre sa majeure à 1.`);
    }
    if (hcp >= 10 && fit && !major) return R(bid(3, S), `Fit mineur et ${hcp} points : soutien sauté.`);
    if (oneLevel.length) return R(bid(1, oneLevel[0]), `${hcp} points : on montre sa couleur de ${c[oneLevel[0]]} cartes (${sn(oneLevel[0])}) à 1.`);
    if (hcp >= 10) {
      const two = SUITS.filter(s => s !== S && c[s] >= 5)[0];
      if (two) return R(bid(cheapestLevel(hi, two), two), `${hcp} points et 5 cartes à ${sn(two)} : on change de couleur au niveau de 2 (il faut 10 points).`);
    }
    if (fit && !major && hcp >= 6) return R(bid(2, S), `Fit mineur à ${sn(S)} : soutien à 2.`);
    if (ev.balanced || hcp < 10) {
      if (hcp >= 13) return R(bid(3, 'N'), `${hcp} points, main sans fit : on joue la manche à 3SA.`);
      if (hcp >= 10) return R(bid(2, 'N'), `${hcp} points : réponse de 2SA (10–12), invitation.`);
      return R(bid(1, 'N'), `${hcp} points sans fit ni couleur à montrer : 1SA (6–9).`);
    }
    return R(bid(2, 'N'), `${hcp} points sans fit : 2SA.`);
  }

  /* ---------- opener's rebid ---------- */
  function rebid(ev, hand, a) {
    const m = a.mine[0]; const p = a.parts[a.parts.length - 1]; const c = ev.counts; const pts = ev.points; const hi = a.highest;
    if (m.strain === 'N') {
      if (p.strain === 'N' && p.level === 2 && m.level === 1) return ev.hcp >= 16 ? R(bid(3, 'N'), `Le partenaire invite (2SA) : avec ${ev.hcp} points, j'accepte et j'annonce 3SA.`) : R(pass(), `Le partenaire invite mais je n'ai que ${ev.hcp} points : je passe.`);
      return R(pass(), 'Le partenaire a décidé du contrat : je passe.');
    }
    const S = m.strain; const major = MAJORS.includes(S);
    if (p.strain === S) { // raised my suit
      if (p.level >= 4) return R(pass(), 'Le partenaire est à la manche : je passe.');
      if (p.level === 3) return pts >= 14 ? R(major ? bid(4, S) : bid(3, 'N'), `Le partenaire montre 10–12 points et un fit : avec ${pts}, la manche est bonne.`) : R(pass(), 'Mon minimum ne permet pas la manche : je passe.');
      if (pts >= 19) return R(major ? bid(4, S) : bid(3, 'N'), `${pts} points et un fit : j'annonce la manche.`);
      if (pts >= 16) return R(bid(3, S), `${pts} points : j'invite à la manche en relevant à 3.`);
      return R(pass(), `Mon minimum (${pts} points) : je passe sur le soutien.`);
    }
    if (p.strain === 'N') {
      if (p.level >= 3) return R(pass(), 'Le partenaire est à la manche : je passe.');
      if (p.level === 2) return pts >= 15 ? R(bid(3, 'N'), `${pts} points face à 10–12 : 3SA.`) : R(pass(), 'Je passe sur son invitation.');
      if (pts >= 19) return R(bid(3, 'N'), `${pts} points face à 6–9 : 3SA.`);
      if (pts >= 17) return R(bid(2, 'N'), `${pts} points : j'invite (2SA).`);
      if (c[S] >= 6 && cheapestLevel(hi, S) <= 2) return R(bid(2, S), `Couleur de ${c[S]} cartes : je la répète.`);
      return R(pass(), `Mon minimum : je passe sur 1SA.`);
    }
    // partner bid a new suit
    const T = p.strain;
    if (MAJORS.includes(T) && c[T] >= 4) {
      if (pts >= 19) return R(bid(4, T), `Fit majeur à ${sn(T)} (${c[T]} cartes) et ${pts} points : manche.`);
      if (pts >= 16) return R(bid(Math.max(3, cheapestLevel(hi, T)), T), `Fit majeur à ${sn(T)} : j'invite avec ${pts} points.`);
      return R(mk(hi, T), `Fit majeur à ${sn(T)} : je soutiens au minimum.`);
    }
    if (pts >= 19 && ev.balanced) return R(bid(3, 'N'), `${pts} points, main équilibrée : 3SA.`);
    if (c[S] >= 6) return R(pts >= 17 ? mk(hi, S, 1) : mk(hi, S), `Couleur de ${c[S]} cartes : je la répète${pts >= 17 ? ' en sautant (mains fortes)' : ''}.`);
    const second = SUITS.filter(s => s !== S && s !== T && c[s] >= 4)[0];
    if (second && cheapestLevel(hi, second) <= 2) return R(mk(hi, second), `Deuxième couleur de ${c[second]} cartes (${sn(second)}) : je la montre.`);
    if (ev.balanced) return R(pts >= 18 ? bid(2, 'N') : mk(hi, 'N'), `Main équilibrée de ${pts} points sans fit : SA au plus bas niveau.`);
    return R(mk(hi, S), `Je répète ma couleur de ${c[S]} cartes.`);
  }

  /* ---------- later calls: head for game when the partnership has the points ---------- */
  function carryOn(ev, hand, a) {
    const hi = a.highest; const c = ev.counts;
    const total = ev.points + partnerMin(a);
    const ours = hi && side(lastBidderSeat(a)) === side(a.seat);
    if (!ours) return R(pass(), 'Je ne relève pas les enchères adverses.');
    const gameLevel = hi.strain === 'N' ? 3 : MAJORS.includes(hi.strain) ? 4 : 5;
    if (hi.level >= gameLevel) return R(pass(), 'Nous sommes à la manche.');
    if (total >= 26) {
      const fitSuit = MAJORS.find(s => c[s] >= 4 && a.parts.some(x => x.strain === s)) || null;
      if (fitSuit) return R(bid(4, fitSuit), `Environ ${total} points à nous : manche à ${sn(fitSuit)}.`);
      return R(bid(3, 'N'), `Environ ${total} points à nous : manche à 3SA.`);
    }
    return R(pass(), `Environ ${total} points à nous : pas de manche, je passe.`);
  }
  const lastBidderSeat = a => { const k = a.bids.length - 1; return a.bids[k].seat; };

  /* ---------- opponents have bid ---------- */
  function overcall(ev, hand, a) {
    const o = a.highest; const c = ev.counts; const hcp = ev.hcp;
    if (o.level >= 3) return R(pass(), 'Les adversaires sont déjà haut : je ne me risque pas.');
    if (o.strain === 'N') {
      const long = SUITS.find(s => c[s] >= 6 && hcp >= 9);
      return long && cheapestLevel(o, long) <= 3 ? R(mk(o, long), `Longue couleur de ${c[long]} cartes : j'intervient.`) : R(pass(), 'Je passe sur leur SA.');
    }
    if (o.level === 1 && hcp >= 12 && c[o.strain] <= 2) {
      const unbid = SUITS.filter(s => s !== o.strain);
      if (unbid.every(s => c[s] >= 3) && isLegalCall(a.auction, a.seat, dbl())) return R(dbl(), `Contre d'appel : ${hcp} points, courte à ${sn(o.strain)} et du soutien dans les autres couleurs.`);
    }
    if (o.level <= 2 && ev.balanced && hcp >= 15 && hcp <= 18 && stopper(hand, o.strain)) {
      const call = bid(cheapestLevel(o, 'N'), 'N');
      if (call.level <= 2) return R(call, `Main équilibrée de ${hcp} points avec un arrêt à ${sn(o.strain)} : intervention à SA.`);
    }
    const suit = SUITS.filter(s => s !== o.strain && c[s] >= 5).sort((x, y) => c[y] - c[x])[0];
    if (suit) {
      const lvl = cheapestLevel(o, suit);
      if ((lvl === 1 && hcp >= 8) || (lvl === 2 && hcp >= 11)) return R(bid(lvl, suit), `Couleur de ${c[suit]} cartes et ${hcp} points : intervention à ${lvl}${SYM[suit]}.`);
    }
    return R(pass(), `Rien à dire avec ${hcp} points sur l'ouverture adverse.`);
  }

  /* ---------- both sides in the auction ---------- */
  function compete(ev, hand, a) {
    const hi = a.highest; const c = ev.counts; const hcp = ev.hcp;
    const lnp = a.lastNP;
    // partner made a take-out double: choose a suit
    if (lnp && lnp.call.t === 'x' && lnp.seat === a.pt && !a.mine.length) {
      const opp = a.opps[a.opps.length - 1];
      const suits = SUITS.filter(s => s !== opp.strain).sort((x, y) => c[y] - c[x] || (MAJORS.includes(x) ? -1 : 1));
      const best = suits[0];
      if (hcp >= 10 && opp.strain !== 'N' && stopper(hand, opp.strain) && ev.balanced) return R(mk(hi, 'N'), `Réponse au contre : SA avec ${hcp} points et un arrêt.`);
      const lvl = cheapestLevel(hi, best) + (hcp >= 9 ? 1 : 0);
      return R(bid(Math.min(7, lvl), best), `Le partenaire demande une couleur (contre d'appel) : je dis ma plus longue (${sn(best)}, ${c[best]} cartes)${hcp >= 9 ? ' en sautant avec ' + hcp + ' points' : ''}.`);
    }
    // support partner's overcall / suit
    const ps = a.parts.length ? a.parts[a.parts.length - 1] : null;
    if (ps && ps.strain !== 'N' && c[ps.strain] >= 3 && hi && side(lastBidderSeat(a)) !== side(a.seat)) {
      const fitLen = c[ps.strain] + 5;
      const room = Math.min(4, Math.max(2, fitLen - 6));
      const lvl = cheapestLevel(hi, ps.strain);
      if (lvl <= room && hcp >= 6) return R(bid(lvl, ps.strain), `Fit à ${sn(ps.strain)} : on se bat à ${lvl}${SYM[ps.strain]}.`);
    }
    return R(pass(), 'Les enchères sont disputées : je passe.');
  }

  /* ---------- main entry ---------- */
  function choose(hand, auction, seat) {
    const ev = evalHand(hand);
    const a = analyze(auction, seat);
    let r;
    if (!a.bids.length) r = opening(ev);
    else if (!a.opps.length) {
      if (!a.mine.length && a.parts.length === 1 && a.first && a.parts[0] === a.first) r = respond(ev, hand, a, auction);
      else if (a.mine.length === 1 && a.first && a.mine[0] === a.first) r = a.parts.length ? rebid(ev, hand, a) : R(pass(), 'Rien à ajouter.');
      else r = carryOn(ev, hand, a);
    } else if (!a.mine.length && !a.parts.length) r = overcall(ev, hand, a);
    else r = compete(ev, hand, a);
    // safety net
    if (!isLegalCall(auction, seat, r.call)) return R(pass(), r.reason + ' (enchère impossible, je passe)');
    if (r.call.t === 'b') {
      const { level, strain } = r.call;
      const ok = level <= 3 || (level === 4 && strain !== 'C' && strain !== 'D') || (level === 5 && (strain === 'C' || strain === 'D')) || (level === 6 && strain === 'N');
      if (!ok) return R(pass(), 'Je préfère ne pas monter si haut.');
    }
    return r;
  }

  Br.Bid = { choose, analyze, cheapestLevel, opening, respond, partnerMin, callText, bidValue };
})(window.Bridge = window.Bridge || {});
