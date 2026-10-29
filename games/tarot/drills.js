/* Interactive exercises. Each drill renders into a box and can regenerate itself. */
(function (T) {
  'use strict';
  const { el, cardEl, fmt } = T;
  const ORD = ['1st', '2nd', '3rd', '4th'];
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

  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Next exercise →');

  /* Which cards may I play? */
  function legalDrill(box) {
    shell(box, 'Which cards can you play?',
      'Click every card from your hand that is legal to play on the trick below, then check.', (body, run) => {
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
            el('div', { class: ok ? 'ok' : 'bad' }, ok ? '✔ Correct!' : '✘ Not quite. Green outlines are the legal cards.'),
            el('p', {}, T.RULE_TEXT[info.rule]),
            nextBtn(run));
        } }, 'Check');
        body.append(
          el('div', {}, el('strong', {}, 'Cards already played: ')),
          el('div', { class: 'trick-line' }, trick.map((p, i) =>
            el('div', { class: 'slot' }, cardEl(p.card), ORD[i]))),
          el('div', {}, el('strong', {}, 'Your hand:')), handEl, el('div', { class: 'btn-row' }, check), feedback);
      });
  }

  /* Who wins the trick? */
  function winnerDrill(box) {
    shell(box, 'Who wins the trick?',
      'Four cards were played in order. Click the card that wins the trick.', (body, run) => {
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
              ? `A trump was played, and trumps beat every suit. The highest trump (${w.text}) wins.`
              : `No trump was played, so the highest card of the suit led (${T.SUIT_INFO[lead].name}) wins: ${w.text}. Cards of another suit cannot win, whatever their rank.`;
            if (trick.some(q => q.card.suit === 'X')) why += ' The Excuse never wins a trick.';
            feedback.append(el('div', { class: ok ? 'ok' : 'bad' }, ok ? '✔ Correct!' : '✘ Not that one.'), el('p', {}, why), nextBtn(run));
          },
        }));
        body.append(el('div', { class: 'trick-line' }, nodes.map((n, i) =>
          el('div', { class: 'slot' }, n, ORD[i] + (i === 0 ? ' (lead)' : '')))), feedback);
      });
  }

  /* Count the points */
  function countDrill(box) {
    shell(box, 'Count the points',
      'Kings 4.5 · Queens 3.5 · Knights 2.5 · Jacks 1.5 · oudlers (Excuse, Petit, 21) 4.5 · every other card 0.5. Add up this pile.', (body, run) => {
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
            el('div', { class: ok ? 'ok' : 'bad' }, ok ? '✔ Correct!' : `✘ The answer is ${fmt(total)}.`),
            el('p', {}, pile.map(c => `${c.text} = ${fmt(c.points)}`).join('  +  ') + `  =  ${fmt(total)}`),
            nextBtn(run));
          input.disabled = true; btn.disabled = true;
        };
        const btn = el('button', { class: 'btn primary', onclick: go }, 'Check');
        input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        body.append(T.cardsRow(pile), el('div', { class: 'btn-row' }, input, btn), feedback);
      });
  }

  /* Bid or pass? */
  function bidDrill(box) {
    shell(box, 'Bid or pass?',
      'You are first to speak. Looking at your 18 cards, what would you bid?', (body, run) => {
        const hand = T.sortHand(T.shuffle(T.DECK.slice()).slice(0, 18));
        const ev = T.Bots.evaluateHand(hand);
        const feedback = el('div', { class: 'feedback' });
        const keys = [null, 'petite', 'garde', 'sans'];
        const lvl = k => (k ? T.CONTRACTS[k].level : 0);
        const row = el('div', { class: 'btn-row' }, keys.map(k => el('button', { class: 'btn', onclick: () => {
          row.querySelectorAll('button').forEach(b => { b.disabled = true; });
          const diff = Math.abs(lvl(k) - lvl(ev.level));
          const verdict = diff === 0 ? ['ok', '✔ Matches the coach.'] : diff === 1 ? ['ok', '≈ Close – a defensible choice.'] : ['bad', '✘ Quite far from the coach.'];
          feedback.append(
            el('div', { class: verdict[0] }, verdict[1]),
            el('p', {}, `Coach suggests: `, el('strong', {}, T.contractName(ev.level)), ` (hand strength ${fmt(ev.score)}).`),
            evalTable(ev),
            el('p', { class: 'muted' }, 'The coach uses a simple points-based rule of thumb. Strong players also consider the long suits, the distribution and the position at the table.'),
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
    legal: { title: 'Which cards are legal?', fn: legalDrill },
    winner: { title: 'Who wins the trick?', fn: winnerDrill },
    count: { title: 'Count the points', fn: countDrill },
    bid: { title: 'Bid or pass?', fn: bidDrill },
  };

  T.Drills = Object.assign({ evalTable }, DRILLS);
})(window.Tarot = window.Tarot || {});
