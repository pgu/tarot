/* Interactive exercises. Each drill renders into a box and can regenerate itself. */
(function (T) {
  'use strict';
  const { el, cardEl, fmt } = T;
  const tr = window.Core.t;
  const ord = i => tr(['1st', '2nd', '3rd', '4th'], ['1er', '2e', '3e', '4e'])[i];
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }

  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, tr('Next exercise →', 'Exercice suivant →'));

  /* Which cards may I play? */
  function legalDrill(box) {
    shell(box, tr('Which cards can you play?', 'Quelles cartes pouvez-vous jouer ?'),
      tr('Click every card from your hand that is legal to play on the trick below, then check.', 'Cliquez sur chaque carte de votre main que vous avez le droit de jouer sur le pli ci-dessous, puis vérifiez.'), (body, run) => {
        let hand, trick;
        for (;;) {
          const deck = T.shuffle(T.DECK.slice());
          hand = T.sortHand(deck.slice(0, 9));
          trick = deck.slice(9, 9 + rint(1, 3)).map((card, i) => ({ player: i, card }));
          if (!trick.some(p => p.card.suit === 'X')) break;
        }
        const info = T.legalInfo(hand, trick);
        const sel = new Set();
        const feedback = el('div', { class: 'feedback' });
        const cards = {};
        const handEl = el('div', { class: 'hand flat' });
        hand.forEach(c => {
          cards[c.id] = cardEl(c, {
            onclick: (card, e) => {
              if (checked) return;
              sel.has(c.id) ? sel.delete(c.id) : sel.add(c.id);
              e.classList.toggle('selected');
            },
          });
          handEl.append(cards[c.id]);
        });
        let checked = false;
        const check = el('button', { class: 'btn primary', onclick: () => {
          checked = true;
          check.disabled = true;
          const legalIds = new Set(info.cards.map(c => c.id));
          hand.forEach(c => {
            cards[c.id].classList.remove('selected');
            if (legalIds.has(c.id)) cards[c.id].classList.add('right');
            else if (sel.has(c.id)) cards[c.id].classList.add('wrong');
            else cards[c.id].classList.add('dim');
          });
          const ok = hand.every(c => legalIds.has(c.id) === sel.has(c.id));
          feedback.append(
            el('div', { class: ok ? 'ok' : 'bad' }, ok ? tr('✔ Correct!', '✔ Bravo !') : tr('✘ Not quite. Green outlines are the legal cards.', '✘ Pas tout à fait. Les cartes encadrées en vert sont les cartes permises.')),
            el('p', {}, T.RULE_TEXT[info.rule]),
            nextBtn(run));
        } }, tr('Check', 'Vérifier'));
        body.append(
          el('div', {}, el('strong', {}, tr('Cards already played: ', 'Cartes déjà jouées : '))),
          el('div', { class: 'trick-line' }, trick.map((p, i) =>
            el('div', { class: 'slot' }, cardEl(p.card), ord(i)))),
          el('div', {}, el('strong', {}, tr('Your hand:', 'Votre main :'))), handEl, el('div', { class: 'btn-row' }, check), feedback);
      });
  }

  /* Who wins the trick? */
  function winnerDrill(box) {
    shell(box, tr('Who wins the trick?', 'Qui gagne le pli ?'),
      tr('Four cards were played in order. Click the card that wins the trick.', 'Quatre cartes ont été jouées dans l\'ordre. Cliquez sur la carte qui remporte le pli.'), (body, run) => {
        const deck = T.shuffle(T.DECK.slice());
        let cards = deck.slice(0, 4);
        if (Math.random() < 0.35) { // make trumps / the Excuse show up more often
          cards[rint(1, 3)] = T.shuffle(T.DECK.filter(c => c.suit === 'T' || c.suit === 'X'))[0];
        }
        cards = [...new Map(cards.map(c => [c.id, c])).values()];
        while (cards.length < 4) {
          const c = deck[rint(4, 70)];
          if (!cards.includes(c)) cards.push(c);
        }
        const trick = cards.map((card, i) => ({ player: i, card }));
        const win = T.trickWinnerIndex(trick);
        const lead = T.leadSuit(trick);
        const feedback = el('div', { class: 'feedback' });
        let answered = false;
        const nodes = trick.map((p, i) => cardEl(p.card, {
          onclick: () => {
            if (answered) return;
            answered = true;
            const ok = i === win;
            nodes[win].classList.add('winner');
            if (!ok) nodes[i].classList.add('wrong');
            const w = trick[win].card;
            const hasTrump = trick.some(q => q.card.suit === 'T');
            let why = hasTrump
              ? tr(`A trump was played, and trumps beat every suit. The highest trump (${w.text}) wins.`, `Un atout a été joué, et les atouts battent toutes les couleurs. Le plus fort atout (${w.text}) gagne.`)
              : tr(`No trump was played, so the highest card of the suit led (${T.SUIT_INFO[lead].name}) wins: ${w.text}. Cards of another suit cannot win, whatever their rank.`, `Aucun atout n'a été joué : la plus forte carte de la couleur demandée (${T.SUIT_INFO[lead].name}) gagne : ${w.text}. Les cartes d'une autre couleur ne peuvent pas gagner, quelle que soit leur valeur.`);
            if (trick.some(q => q.card.suit === 'X')) why += tr(' The Excuse never wins a trick.', ' L\'Excuse ne gagne jamais un pli.');
            feedback.append(el('div', { class: ok ? 'ok' : 'bad' }, ok ? tr('✔ Correct!', '✔ Bravo !') : tr('✘ Not that one.', '✘ Ce n\'est pas celle-là.')), el('p', {}, why), nextBtn(run));
          },
        }));
        body.append(el('div', { class: 'trick-line' }, nodes.map((n, i) =>
          el('div', { class: 'slot' }, n, ord(i) + (i === 0 ? tr(' (lead)', ' (entame)') : '')))), feedback);
      });
  }

  /* Count the points */
  function countDrill(box) {
    shell(box, tr('Count the points', 'Comptez les points'),
      tr('Kings 4.5 · Queens 3.5 · Knights 2.5 · Jacks 1.5 · oudlers (Excuse, Petit, 21) 4.5 · every other card 0.5. Add up this pile.', 'Rois 4,5 · Dames 3,5 · Cavaliers 2,5 · Valets 1,5 · bouts (Excuse, Petit, 21) 4,5 · toutes les autres cartes 0,5. Additionnez ce tas.'), (body, run) => {
        const n = rint(5, 8);
        const pile = T.shuffle(T.DECK.slice()).slice(0, n);
        const total = T.sumPoints(pile);
        const input = el('input', { type: 'number', step: '0.5', placeholder: 'points' });
        const feedback = el('div', { class: 'feedback' });
        const go = () => {
          if (input.value === '') return;
          const ok = Math.abs(parseFloat(input.value) - total) < 1e-9;
          feedback.innerHTML = '';
          feedback.append(
            el('div', { class: ok ? 'ok' : 'bad' }, ok ? tr('✔ Correct!', '✔ Bravo !') : tr(`✘ The answer is ${fmt(total)}.`, `✘ La réponse est ${fmt(total)}.`)),
            el('p', {}, pile.map(c => `${c.text} = ${fmt(c.points)}`).join('  +  ') + `  =  ${fmt(total)}`),
            nextBtn(run));
          input.disabled = true; btn.disabled = true;
        };
        const btn = el('button', { class: 'btn primary', onclick: go }, tr('Check', 'Vérifier'));
        input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        body.append(T.cardsRow(pile), el('div', { class: 'btn-row' }, input, btn), feedback);
      });
  }

  /* Bid or pass? */
  function bidDrill(box) {
    shell(box, tr('Bid or pass?', 'Annoncer ou passer ?'),
      tr('You are first to speak. Looking at your 18 cards, what would you bid?', 'Vous parlez en premier. Avec vos 18 cartes, qu\'annonceriez-vous ?'), (body, run) => {
        const hand = T.sortHand(T.shuffle(T.DECK.slice()).slice(0, 18));
        const ev = T.Bots.evaluateHand(hand);
        const feedback = el('div', { class: 'feedback' });
        const keys = [null, 'petite', 'garde', 'sans'];
        const lvl = k => (k ? T.CONTRACTS[k].level : 0);
        const row = el('div', { class: 'btn-row' }, keys.map(k => el('button', { class: 'btn', onclick: () => {
          row.querySelectorAll('button').forEach(b => { b.disabled = true; });
          const diff = Math.abs(lvl(k) - lvl(ev.level));
          const verdict = diff === 0 ? ['ok', tr('✔ Matches the coach.', '✔ Identique au coach.')] : diff === 1 ? ['ok', tr('≈ Close – a defensible choice.', '≈ Proche : un choix défendable.')] : ['bad', tr('✘ Quite far from the coach.', '✘ Assez loin du coach.')];
          feedback.append(
            el('div', { class: verdict[0] }, verdict[1]),
            el('p', {}, tr('Coach suggests: ', 'Le coach suggère : '), el('strong', {}, T.contractName(ev.level)), tr(` (hand strength ${fmt(ev.score)}).`, ` (force de la main ${fmt(ev.score)}).`)),
            evalTable(ev),
            el('p', { class: 'muted' }, tr('The coach uses a simple points-based rule of thumb. Strong players also consider the long suits, the distribution and the position at the table.', 'Le coach utilise une règle simple fondée sur les points. Les bons joueurs tiennent aussi compte des longues couleurs, de la répartition et de leur position à la table.')),
            nextBtn(run));
        } }, T.contractName(k))));
        body.append(el('div', { class: 'hand flat' }, hand.map(c => cardEl(c))), row, feedback);
      });
  }

  function evalTable(ev) {
    return el('table', { class: 't eval-table' },
      el('tbody', {}, ev.details.map(d => el('tr', { title: d.note }, el('td', {}, d.label), el('td', {}, (d.value >= 0 ? '+' : '') + fmt(d.value)))),
        el('tr', {}, el('th', {}, 'Total'), el('th', {}, fmt(ev.score)))));
  }

  const DRILLS = {
    legal: { get title() { return tr('Which cards are legal?', 'Quelles cartes sont permises ?'); }, fn: legalDrill },
    winner: { get title() { return tr('Who wins the trick?', 'Qui gagne le pli ?'); }, fn: winnerDrill },
    count: { get title() { return tr('Count the points', 'Compter les points'); }, fn: countDrill },
    bid: { get title() { return tr('Bid or pass?', 'Annoncer ou passer ?'); }, fn: bidDrill },
  };
  DRILLS.evalTable = evalTable;

  T.Drills = DRILLS;
})(window.Tarot = window.Tarot || {});
