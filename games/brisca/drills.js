/* La Brisca drills (the first two are shared with the Tute: same cards, same points). */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Next exercise →');
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  function playDrill(box) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, '¿Qué juegas?'),
        el('p', { class: 'muted' }, 'There are no obligations in the brisca: any card is legal. Which one is the best play?'));
      box.append(body);
      const d = S.shuffle(S.DECK.slice());
      const hand = S.sortCards(d.slice(0, 3));
      const pinta = d[3];
      const led = Math.random() < 0.6 ? d[4] : null;
      const seen = new Set(hand.concat(pinta, led || []).map(c => c.id));
      const ctx = { hand, legal: hand, led, triumph: pinta.suit, pinta, arrastre: false, stockLen: 12, seen, sung: S.SUITS.slice(), oppSung: [], singable: [], canSwap: false, canTute: null, trickNo: 4 };
      const best = S.TuteBots.chooseCard(ctx);
      const fb = el('div', { class: 'feedback' });
      let done = false;
      const nodes = new Map();
      const row = el('div', { class: 'hand flat' }, hand.map(c => {
        const n = cardEl(c, { onclick: () => {
          if (done) return; done = true;
          const ok = c === best.card;
          nodes.get(best.card.id).classList.add('right');
          if (!ok) nodes.get(c.id).classList.add('wrong');
          fb.append(el('div', { class: ok ? 'ok' : 'bad' }, ok ? '✔ Same as the coach!' : '✘ The coach would play another card.'),
            el('p', {}, el('strong', {}, best.card.text), ' – ', best.reason),
            el('p', { class: 'muted' }, 'Other plays can be reasonable too: this is a rule of thumb.'), nextBtn(run));
        } });
        nodes.set(c.id, n); return n;
      }));
      body.append(el('p', {}, 'Triunfo (pinta): ', S.icon(pinta.suit), ' ', el('strong', {}, S.SUIT_INFO[pinta.suit].name)),
        led ? el('div', {}, el('strong', {}, 'Your rival leads: '), cardEl(led)) : el('p', {}, el('strong', {}, 'You lead the trick.')),
        el('div', {}, el('strong', {}, 'Your hand:')), row, fb);
    };
    run();
  }

  S.BriscaDrills = {
    winner: { title: '¿Quién gana?', fn: S.TuteDrills.winner.fn },
    count: { title: 'Cuenta los puntos', fn: S.TuteDrills.count.fn },
    play: { title: '¿Qué juegas?', fn: playDrill },
  };
  void rint;
})(window.Spanish = window.Spanish || {});
