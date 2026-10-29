/* Le Rami drills. */
(function (R, P) {
  'use strict';
  const { el, cardEl } = R;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[rint(0, a.length - 1)];
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Exercice suivant →');
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, (ok ? '✔ ' : '✘ ') + text);
  const handRow = (cards, onclick) => el('div', { class: 'hand flat' }, cards.map(c => cardEl(c, { onclick })));
  const physical = (rank, suit, copy) => R.card(`${copy || 0}${rank}${suit}`);
  const joker = k => R.card('JK' + (k || 0));

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }

  function whyNot(cards) {
    if (cards.length < 3) return 'Une combinaison comporte au moins 3 cartes.';
    const jokers = cards.filter(c => c.joker).length;
    if (jokers > 1) return 'Un seul joker par combinaison.';
    const nat = cards.filter(c => !c.joker);
    if (nat.every(c => c.rank === nat[0].rank)) {
      if (cards.length > 4) return 'Un brelan ou un carré a 3 ou 4 cartes.';
      return 'Dans un brelan ou un carré, toutes les cartes doivent être de couleurs différentes.';
    }
    if (!nat.every(c => c.suit === nat[0].suit)) return 'Pour faire une suite, des valeurs différentes doivent être de la même couleur.';
    return 'Les valeurs d\'une suite doivent se suivre (l\'as est bas dans A-2-3 ou haut dans D-R-A, mais on ne fait pas le tour : R-A-2 est interdit).';
  }

  function randomValid() {
    const suit = pick(R.SUITS);
    if (Math.random() < 0.4) { // set
      const r = rint(2, 14);
      const suits = P.shuffle(R.SUITS.slice()).slice(0, rint(3, 4));
      const cards = suits.map(s => physical(r, s, rint(0, 1)));
      if (Math.random() < 0.3) cards[0] = joker(rint(0, 3));
      return cards;
    }
    const len = rint(3, 6); const lo = rint(1, 14 - len + 1);
    const cards = [];
    for (let r = lo; r < lo + len; r++) cards.push(physical(r === 1 ? 14 : r, suit, rint(0, 1)));
    if (Math.random() < 0.3) cards[rint(0, len - 1)] = joker(rint(0, 3));
    return cards;
  }
  function randomInvalid() {
    const k = rint(0, 5);
    const suit = pick(R.SUITS); const [s2, s3] = P.shuffle(R.SUITS.filter(s => s !== suit));
    const lo = rint(3, 9);
    if (k === 0) return [physical(lo, suit), physical(lo + 1, suit), physical(lo + 3, suit)];                 // gap
    if (k === 1) return [physical(lo, suit), physical(lo + 1, s2), physical(lo + 2, suit)];                  // mixed suits
    if (k === 2) return [physical(lo, suit), physical(lo, suit, 1), physical(lo, s2)];                        // same suit twice
    if (k === 3) return [physical(13, suit), physical(14, suit), physical(2, suit)];                          // wrap around
    if (k === 4) return [physical(lo, suit), physical(lo, s2), joker(0), joker(1)];                           // two jokers
    return [physical(lo, suit), physical(lo + 1, suit)];                                                       // too short
  }

  /* ----- 1. valid? ----- */
  function validDrill(box) {
    shell(box, 'Combinaison valide ?', 'Brelan ou carré : 3 à 4 cartes de même valeur, de couleurs toutes différentes. Suite : 3 cartes ou plus qui se suivent dans une même couleur. Un joker maximum.', (body, run) => {
      let cards = Math.random() < 0.5 ? randomValid() : randomInvalid();
      cards = P.shuffle(cards.slice());
      const an = R.analyze(cards);
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, [['Oui, elle est valide', true], ['Non', false]].map(([l, v]) => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(b => { b.disabled = true; });
        fb.append(verdict(v === !!an, v === !!an ? 'Bravo !' : 'Pas tout à fait.'),
          el('p', {}, an ? `Oui : c\'est ${an.type === 'run' ? 'une suite' : an.cards.length === 3 ? 'un brelan' : 'un carré'}${an.joker ? ' (le joker remplace ' + (an.type === 'run' ? 'le ' + R.RANK_FR[an.joker.rank === 1 ? 14 : an.joker.rank].toLowerCase() : 'un ' + R.RANK_FR[an.joker.rank].toLowerCase() + ' manquant') + ')' : ''}. Ordre : ${R.lab(an.cards)}.` : whyNot(cards)), nextBtn(run));
      } }, l)));
      body.append(handRow(cards), row, fb);
    });
  }

  /* ----- 2. points of a combination ----- */
  function pointsDrill(box) {
    shell(box, 'Combien de points ?', 'Chaque carte vaut sa valeur (figures 10, as 11, ou 1 dans A-2-3). Un joker vaut la carte qu\'il remplace. Combien cette combinaison rapporte-t-elle pour l\'ouverture ?', (body, run) => {
      let an;
      do { an = R.analyze(randomValid()); } while (!an);
      const input = el('input', { type: 'number', min: 0, placeholder: 'points' });
      const fb = el('div', { class: 'feedback' });
      const go = () => {
        if (input.value === '') return;
        input.disabled = true; btn.disabled = true;
        const ok = parseInt(input.value, 10) === an.points;
        fb.append(verdict(ok, ok ? 'Bravo !' : `Elle vaut ${an.points} points.`),
          el('p', {}, `${R.meldName(an)} : ${R.lab(an.cards)} = ${an.points} points.`), el('p', { class: 'muted' }, an.type === 'run' && an.cards.some(c => c.rank === 14) ? 'L\'as vaut 11 dans …D-R-A, mais seulement 1 dans A-2-3.' : 'Les figures valent 10 ; l\'as vaut 11 (1 dans A-2-3).'), nextBtn(run));
      };
      const btn = el('button', { class: 'btn primary', onclick: go }, 'Vérifier');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      body.append(handRow(an.cards), el('div', { class: 'btn-row' }, input, btn), fb);
    });
  }

  /* ----- 3. can you open? ----- */
  function openDrill(box) {
    shell(box, "L'ouverture à 51", 'Pour ouvrir (poser pour la première fois), il faut étaler des combinaisons valant au moins 51 points, dont une suite sans joker. Cette main peut-elle ouvrir ?', (body, run) => {
      let hand, arr;
      for (let t = 0; t < 60; t++) {
        const cards = P.shuffle(R.DECK.slice());
        const h = cards.slice(0, 13);
        const inject = rint(0, 2);
        if (inject >= 1) { const s = pick(R.SUITS); const lo = rint(6, 11); [lo, lo + 1, lo + 2].forEach((r, k) => { h[k] = physical(r, s, 0); }); }
        if (inject >= 2) { const r = rint(9, 14); P.shuffle(R.SUITS.slice()).slice(0, 3).forEach((s, k) => { h[3 + k] = physical(r, s, 1); }); }
        if (new Set(h.map(c => c.id)).size !== 13) continue;
        hand = R.sortHand(h); arr = R.bestArrangement(hand, 'open');
        if ((!!arr && arr.points >= R.OPEN_MIN) === (Math.random() < 0.5)) break;
      }
      const can = !!arr && arr.points >= R.OPEN_MIN;
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, [['Oui, je peux ouvrir', true], ['Pas encore', false]].map(([l, v]) => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(b => { b.disabled = true; });
        const best = R.bestArrangement(hand, 'cards');
        fb.append(verdict(v === can, v === can ? 'Bravo !' : 'Pas tout à fait.'),
          can ? el('p', {}, `Ouverture avec ${arr.melds.map(a => R.lab(a.cards)).join(' | ')} = ${arr.points} points (dont au moins une suite sans joker).`)
            : el('p', {}, arr ? `Le mieux que vous puissiez poser avec une suite sans joker est ${arr.points} points : insuffisant (il en faut 51).`
              : (best.melds.length ? `Vos combinaisons (${best.melds.map(a => R.lab(a.cards)).join(' | ')}) ne contiennent aucune suite sans joker : vous ne pouvez pas encore ouvrir.` : 'Vous n\'avez encore aucune combinaison.')),
          nextBtn(run));
      } }, l)));
      body.append(handRow(hand), row, fb);
    });
  }

  /* ----- 4. which card replaces the joker ----- */
  function jokerDrill(box) {
    shell(box, 'Récupérer le joker', 'Une combinaison de la table contient un joker. Après votre ouverture, vous pouvez le prendre en posant la carte exacte qu\'il remplace. Laquelle de vos cartes convient ? (Ou aucune.)', (body, run) => {
      let an, hand, ok;
      for (;;) {
        const suit = pick(R.SUITS);
        if (Math.random() < 0.5) {
          const lo = rint(2, 9); const cards = [physical(lo, suit), joker(0), physical(lo + 2, suit)];
          an = R.analyze(cards);
        } else {
          const r = rint(2, 14); const [a, b] = P.shuffle(R.SUITS.slice());
          an = R.analyze([physical(r, a), physical(r, b), joker(0)]);
        }
        if (!an) continue;
        const d = P.shuffle(R.DECK.filter(c => !c.joker)).slice(0, 7);
        hand = R.sortHand(d);
        ok = hand.filter(c => R.canReplaceJoker(an, c));
        if (Math.random() < 0.7 ? ok.length : !ok.length) break;
        if (!ok.length && Math.random() < 0.2) break;
      }
      const fb = el('div', { class: 'feedback' });
      let done = false;
      const nodes = new Map();
      const finish = chosen => {
        if (done) return; done = true;
        const right = chosen == null ? !ok.length : ok.includes(chosen);
        ok.forEach(c => nodes.get(c.id).classList.add('right'));
        if (chosen && !right) nodes.get(chosen.id).classList.add('wrong');
        const j = an.joker;
        fb.append(verdict(right, right ? 'Bravo !' : 'Pas tout à fait.'),
          el('p', {}, an.type === 'run' ? `Le joker remplace le ${R.RANK_FR[j.rank === 1 ? 14 : j.rank].toLowerCase()} de ${R.SUIT_FR[j.suit].toLowerCase()}.`
            : `Le joker remplace un ${R.RANK_FR[j.rank].toLowerCase()} d\'une couleur manquante (${j.missing.map(s => R.SUIT_FR[s].toLowerCase()).join(' ou ')}).`),
          el('p', {}, ok.length ? `Cartes qui conviennent : ${R.lab(ok)}.` : 'Vous n\'avez aucune des bonnes cartes.'), nextBtn(run));
      };
      body.append(el('div', {}, el('strong', {}, 'Sur la table :')), handRow(an.cards), el('div', {}, el('strong', {}, 'Votre main (cliquez sur la carte) :')),
        el('div', { class: 'hand flat' }, hand.map(c => { const n = cardEl(c, { onclick: card => finish(card) }); nodes.set(c.id, n); return n; })),
        el('div', { class: 'btn-row' }, el('button', { class: 'btn', onclick: () => finish(null) }, 'Aucune')), fb);
    });
  }

  R.whyNot = whyNot;
  R.RamiDrills = {
    valid: { title: 'Combinaison valide ?', fn: validDrill },
    points: { title: 'Points', fn: pointsDrill },
    open: { title: "L'ouverture", fn: openDrill },
    joker: { title: 'Récupérer un joker', fn: jokerDrill },
  };
})(window.Rami = window.Rami || {}, window.Poker);
