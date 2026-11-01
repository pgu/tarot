/* La Belote : exercices. Chaque exercice se redessine dans sa boîte. */
(function (B) {
  'use strict';
  const { el, cardEl } = B;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[rint(0, a.length - 1)];
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Exercice suivant →');
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, (ok ? '✔ ' : '✘ ') + text);
  const trumpBanner = t => el('p', {}, 'Atout : ', el('strong', { class: t === 'H' || t === 'D' ? 'bad-suit' : '' }, B.suitTag(t)));
  const ORD = ['1er', '2e', '3e', '4e'];

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }

  /* ----- 1. quelles cartes puis-je jouer ? ----- */
  function legalDrill(box) {
    shell(box, 'Quelles cartes pouvez-vous jouer ?', 'Vous êtes le joueur du bas (le partenaire est en face). Cliquez sur chaque carte de votre main que vous avez le droit de jouer, puis vérifiez.', (body, run) => {
      const trump = pick(B.SUITS);
      const n = rint(1, 3);
      const deck = B.shuffle(B.DECK.slice());
      const hand = B.sortHand(deck.slice(0, 7), trump);
      const trick = deck.slice(7, 7 + n).map((card, i) => ({ player: (4 - n + i) % 4, card }));
      const info = B.legalInfo(hand, trick, trump, 0);
      const sel = new Set();
      const nodes = {};
      let checked = false;
      const fb = el('div', { class: 'feedback' });
      const handEl = el('div', { class: 'hand flat' });
      hand.forEach(c => {
        nodes[c.id] = cardEl(c, { onclick: (card, e) => { if (checked) return; sel.has(c.id) ? sel.delete(c.id) : sel.add(c.id); e.classList.toggle('selected'); } });
        handEl.append(nodes[c.id]);
      });
      const check = el('button', { class: 'btn primary', onclick: () => {
        checked = true; check.disabled = true;
        const legal = new Set(info.cards.map(c => c.id));
        hand.forEach(c => {
          nodes[c.id].classList.remove('selected');
          nodes[c.id].classList.add(legal.has(c.id) ? 'right' : sel.has(c.id) ? 'wrong' : 'dim');
        });
        const ok = hand.every(c => legal.has(c.id) === sel.has(c.id));
        fb.append(verdict(ok, ok ? 'Bravo !' : 'Pas tout à fait. Les cartes encadrées en vert sont permises.'), el('p', {}, B.RULE_TEXT[info.rule]), nextBtn(run));
      } }, 'Vérifier');
      body.append(trumpBanner(trump),
        el('div', {}, el('strong', {}, 'Cartes déjà jouées :')),
        el('div', { class: 'trick-line' }, trick.map((p, i) => el('div', { class: 'slot' }, cardEl(p.card), `${B.seatLabel(p.player)} (${ORD[i]})`))),
        el('div', {}, el('strong', {}, 'Votre main :')), handEl, el('div', { class: 'btn-row' }, check), fb);
    });
  }

  /* ----- 2. qui gagne le pli ? ----- */
  function winnerDrill(box) {
    shell(box, 'Qui gagne le pli ?', 'Quatre cartes ont été jouées dans l\'ordre. Cliquez sur la carte qui remporte le pli.', (body, run) => {
      const trump = pick(B.SUITS);
      let trick;
      for (;;) {
        const cs = B.shuffle(B.DECK.slice()).slice(0, 4);
        if (Math.random() < 0.6) { const lead = cs[0].suit; cs[1] = pick(B.DECK.filter(c => c.suit === lead && !cs.includes(c))) || cs[1]; }
        if (new Set(cs.map(c => c.id)).size === 4) { trick = cs.map((card, i) => ({ player: i, card })); break; }
      }
      const wi = B.trickWinnerIndex(trick, trump);
      const fb = el('div', { class: 'feedback' });
      let done = false;
      const nodes = [];
      const row = el('div', { class: 'trick-line' }, trick.map((p, i) => {
        const n = cardEl(p.card, { onclick: () => {
          if (done) return; done = true;
          nodes[wi].classList.add('right'); if (i !== wi) nodes[i].classList.add('wrong');
          const w = trick[wi].card; const lead = trick[0].card.suit;
          const why = w.suit === trump ? (trick.filter(x => x.card.suit === trump).length > 1 ? 'Le plus fort atout l\'emporte (valet > 9 > as > 10 > roi > dame > 8 > 7).' : 'Un atout bat toutes les autres couleurs.')
            : `Personne n\'a coupé : la plus forte carte de la couleur demandée (${B.suitName(lead)}) gagne (as > 10 > roi > dame > valet > 9 > 8 > 7).`;
          fb.append(verdict(i === wi, i === wi ? 'Bravo !' : 'Pas tout à fait.'), el('p', {}, `${B.seatLabel(trick[wi].player)} gagne avec ${w.name.toLowerCase()}. ${why}`), nextBtn(run));
        } });
        nodes.push(n);
        return el('div', { class: 'slot' }, n, `${B.seatLabel(p.player)} (${ORD[i]})`);
      }));
      body.append(trumpBanner(trump), row, fb);
    });
  }

  /* ----- 3. compter les points ----- */
  function countDrill(box) {
    shell(box, 'Compter les points', 'Atout : valet 20 · 9 14 · as 11 · 10 10 · roi 4 · dame 3. Hors atout : as 11 · 10 10 · roi 4 · dame 3 · valet 2. Les 7, 8 (et le 9 hors atout) ne valent rien. Additionnez ce tas.', (body, run) => {
      const trump = pick(B.SUITS);
      const cards = B.sortHand(B.shuffle(B.DECK.slice()).slice(0, rint(5, 9)), trump);
      const total = B.sumPoints(cards, trump);
      const input = el('input', { type: 'number', placeholder: 'points' });
      const fb = el('div', { class: 'feedback' });
      const go = el('button', { class: 'btn primary', onclick: () => {
        const v = parseInt(input.value, 10); if (Number.isNaN(v)) return;
        go.disabled = true;
        fb.append(verdict(v === total, v === total ? `Exact : ${total} points.` : `Non : c'était ${total} points.`),
          el('p', {}, cards.map(c => `${c.text} = ${B.points(c, trump)}`).join(' · ')), nextBtn(run));
      } }, 'Vérifier');
      body.append(trumpBanner(trump), el('div', { class: 'hand flat' }, cards.map(c => cardEl(c))), el('div', { class: 'btn-row' }, input, go), fb);
    });
  }

  /* ----- 4. prendre ou passer ? ----- */
  function evalTable(ev) {
    return el('table', { class: 't eval-table' }, el('tbody', {}, ev.details.map(d => el('tr', { title: d.note }, el('td', {}, d.label), el('td', {}, '+' + d.value.toFixed(1)))),
      el('tr', {}, el('th', {}, 'Total'), el('th', {}, ev.score.toFixed(1)))));
  }

  function takeDrill(box) {
    shell(box, 'Prendre ou passer ?', 'Vous parlez en premier. Voici votre main de 5 cartes et la retourne. Prenez-vous à la couleur de la retourne (elle vous reviendra) ?', (body, run) => {
      const deck = B.shuffle(B.DECK.slice());
      const hand = B.sortHand(deck.slice(0, 5), null);
      const turned = deck[20];
      const r = B.Bots.chooseBid(hand, turned, 1, 0, false);
      const take = !!r.suit;
      const best = r.options[0];
      const fb = el('div', { class: 'feedback' });
      let done = false;
      const answer = ok => {
        if (done) return; done = true;
        fb.append(verdict(ok === take, ok === take ? 'Bien vu !' : 'Pas tout à fait.'),
          el('p', {}, `Avec la retourne, ${B.suitName(turned.suit)} vaut ${best.ev.score.toFixed(1)} (on prend à partir de ${r.limit.toFixed(1)}) : ${take ? 'prenez.' : 'passez.'}`),
          evalTable(best.ev),
          el('p', { class: 'muted' }, 'Un simple repère, pas une vérité : les bons joueurs regardent aussi qui parle après eux et leur position.'), nextBtn(run));
      };
      body.append(el('div', {}, el('strong', {}, 'Votre main :')), el('div', { class: 'hand flat' }, hand.map(c => cardEl(c))),
        el('div', {}, el('strong', {}, 'La retourne : '), B.suitTag(turned.suit)), el('div', { class: 'hand flat' }, cardEl(turned)),
        el('div', { class: 'btn-row' }, el('button', { class: 'btn primary', onclick: () => answer(true) }, `Prendre (${B.SUIT_SYM[turned.suit]})`), el('button', { class: 'btn', onclick: () => answer(false) }, 'Passer')), fb);
    });
  }

  B.evalTable = evalTable;
  B.Drills = {
    legal: { title: 'Cartes jouables', fn: legalDrill },
    winner: { title: 'Qui gagne le pli ?', fn: winnerDrill },
    count: { title: 'Compter les points', fn: countDrill },
    take: { title: 'Prendre ou passer ?', fn: takeDrill },
  };
})(window.Belote = window.Belote || {});
