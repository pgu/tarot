/* Le Bridge : exercices. */
(function (Br) {
  'use strict';
  const { el, cardEl } = Br;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[rint(0, a.length - 1)];
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Exercice suivant →');
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, (ok ? '✔ ' : '✘ ') + text);

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }

  const randomHand = () => Br.sortHand(Br.shuffle(Br.DECK.slice()).slice(0, 13));
  const handBox = hand => Br.suitRows(hand, {});
  const handRow = hand => el('div', { class: 'drill-hand', style: '--cw:40px' }, handBox(hand));

  /* ----- 1. compter les points ----- */
  function countDrill(box) {
    shell(box, 'Compter les points', 'As = 4 · roi = 3 · dame = 2 · valet = 1. Additionnez les points d\'honneurs de cette main.', (body, run) => {
      const hand = randomHand();
      const ev = Br.evalHand(hand);
      const input = el('input', { type: 'number', placeholder: 'points' });
      const fb = el('div', { class: 'feedback' });
      const go = el('button', { class: 'btn primary', onclick: () => {
        const v = parseInt(input.value, 10); if (Number.isNaN(v)) return; go.disabled = true;
        fb.append(verdict(v === ev.hcp, v === ev.hcp ? `Exact : ${ev.hcp} points d'honneurs.` : `Non : il y en a ${ev.hcp}.`),
          el('p', {}, `Répartition ${Br.shapeText(ev)} (${ev.balanced ? 'main équilibrée' : 'main irrégulière'}). Avec la longueur (1 point par carte au-delà de la 4e dans une couleur) : ${ev.points} points.`), nextBtn(run));
      } }, 'Vérifier');
      body.append(handRow(hand), el('div', { class: 'btn-row' }, input, go), fb);
    });
  }

  /* ----- 2 et 3. ouvrir / répondre ----- */
  function callSelect(auction, seat) {
    const sel = el('select', {});
    const opts = [Br.pass()];
    for (let l = 1; l <= 4; l++) Br.STRAINS.forEach(s => opts.push(Br.bid(l, s)));
    opts.push(Br.dbl());
    opts.filter(c => Br.isLegalCall(auction, seat, c)).forEach(c => sel.append(el('option', { value: Br.callText(c) }, Br.callText(c))));
    return sel;
  }

  function callDrill(box, kind) {
    const respond = kind === 'respond';
    shell(box, respond ? 'Quelle réponse ?' : 'Quelle ouverture ?', respond
      ? 'Votre partenaire (Nord) a ouvert ; l\'adversaire à sa gauche a passé. Que dites-vous ?'
      : 'Vous êtes donneur : les enchères commencent par vous. Que dites-vous ?', (body, run) => {
      let hand; let auction; let r;
      for (let i = 0; i < 200; i++) {
        hand = randomHand();
        if (respond) {
          const opener = pick([Br.bid(1, 'C'), Br.bid(1, 'D'), Br.bid(1, 'H'), Br.bid(1, 'S'), Br.bid(1, 'S'), Br.bid(1, 'N')]);
          auction = [{ seat: 2, call: opener }, { seat: 3, call: Br.pass() }];
        } else auction = [];
        r = Br.Bid.choose(hand, auction, 0);
        if (respond ? Br.evalHand(hand).hcp >= 4 : (r.call.t !== 'p' || Math.random() < 0.3)) break;
      }
      const sel = callSelect(auction, 0);
      const fb = el('div', { class: 'feedback' });
      const go = el('button', { class: 'btn primary', onclick: () => {
        go.disabled = true; sel.disabled = true;
        const ok = sel.value === Br.callText(r.call);
        fb.append(verdict(ok, ok ? 'Bien vu !' : `La réponse du coach : ${Br.callText(r.call)}.`), el('p', {}, r.reason),
          el('p', { class: 'muted' }, 'Plusieurs enchères peuvent être défendables : le coach suit un système simple (majeures cinquièmes, 1SA 15–17).'), nextBtn(run));
      } }, 'Valider');
      body.append(respond ? el('p', {}, el('strong', {}, 'Nord a ouvert : '), Br.callEl(auction[0].call)) : null, handRow(hand), el('p', {}, el('strong', {}, `${Br.evalHand(hand).hcp} points d'honneurs · répartition ${Br.shapeText(Br.evalHand(hand))}`)),
        el('div', { class: 'btn-row' }, sel, go), fb);
    });
  }

  /* ----- 4. la marque ----- */
  function scoreDrill(box) {
    shell(box, 'Calculer la marque', 'Entrez le total des points marqués par le camp qui marque : le déclarant si le contrat est réussi (points de levées + primes), la défense si le contrat chute.', (body, run) => {
      const strain = pick(['C', 'D', 'H', 'S', 'N', 'N', 'H', 'S']);
      const level = rint(1, strain === 'N' ? 4 : 5);
      const doubled = Math.random() < 0.2 ? 1 : 0;
      const vul = Math.random() < 0.4;
      const tricks = Math.max(5, Math.min(13, level + 6 + rint(-2, 2)));
      const contract = { level, strain, doubled };
      const res = Br.scoreDeal(contract, tricks, vul);
      const total = res.made ? res.declarerPoints : res.defenderPoints;
      const input = el('input', { type: 'number', placeholder: 'points' });
      const fb = el('div', { class: 'feedback' });
      const go = el('button', { class: 'btn primary', onclick: () => {
        const v = parseInt(input.value, 10); if (Number.isNaN(v)) return; go.disabled = true;
        fb.append(verdict(v === total, v === total ? `Exact : ${total}.` : `Non : ${total}.`),
          el('ul', {}, res.made
            ? [el('li', {}, `Levées du contrat (sous la ligne) : ${res.trickPoints}`), ...res.above.map(x => el('li', {}, `${x.label} : ${x.value}`))]
            : res.above.map(x => el('li', {}, `${x.label} : ${x.value}`))), nextBtn(run));
      } }, 'Vérifier');
      body.append(el('p', {}, el('strong', {}, 'Contrat : '), Br.contractText(contract), ` · ${vul ? 'déclarant vulnérable' : 'déclarant non vulnérable'} · le déclarant fait ${tricks} levées (${res.made ? 'il en fallait ' + res.need : 'il en fallait ' + res.need}).`), el('div', { class: 'btn-row' }, input, go), fb);
    });
  }

  /* ----- 5. qui gagne le pli ----- */
  function winnerDrill(box) {
    shell(box, 'Qui gagne le pli ?', 'Quatre cartes ont été jouées dans l\'ordre. Cliquez sur celle qui remporte le pli.', (body, run) => {
      const trump = pick(['S', 'H', 'D', 'C', null]);
      const lead = pick(Br.SUITS);
      const cs = Br.shuffle(Br.DECK.slice()).slice(0, 4);
      cs[0] = pick(Br.DECK.filter(c => c.suit === lead));
      if (Math.random() < 0.7) cs[1] = pick(Br.DECK.filter(c => c.suit === lead && c !== cs[0]));
      const trick = cs.map((card, i) => ({ player: i, card }));
      if (new Set(cs.map(c => c.id)).size < 4) return run();
      const wi = Br.trickWinnerIndex(trick, trump);
      const fb = el('div', { class: 'feedback' }); let done = false; const nodes = [];
      body.append(el('p', {}, el('strong', {}, 'Atout : '), trump ? Br.suitTag(trump) : 'sans-atout'),
        el('div', { class: 'trick-line' }, trick.map((p, i) => {
          const n = cardEl(p.card, { onclick: () => {
            if (done) return; done = true; nodes[wi].classList.add('right'); if (i !== wi) nodes[i].classList.add('wrong');
            const w = trick[wi].card;
            fb.append(verdict(i === wi, i === wi ? 'Bravo !' : 'Pas tout à fait.'),
              el('p', {}, w.suit === trump ? 'Un atout bat toutes les autres couleurs (le plus fort atout gagne).' : `Personne n'a coupé : la plus forte carte de la couleur demandée (${Br.SUIT_FR[lead]}) gagne. L'as est la plus forte, le 2 la plus faible.`), nextBtn(run));
          } });
          nodes.push(n);
          return el('div', { class: 'slot' }, n, `${['1er', '2e', '3e', '4e'][i]}`);
        })), fb);
    });
  }

  Br.Drills = {
    count: { title: 'Compter les points', fn: countDrill },
    open: { title: 'Ouvrir', fn: box => callDrill(box, 'open') },
    respond: { title: 'Répondre', fn: box => callDrill(box, 'respond') },
    score: { title: 'La marque', fn: scoreDrill },
    winner: { title: 'Qui gagne le pli ?', fn: winnerDrill },
  };
})(window.Bridge = window.Bridge || {});
