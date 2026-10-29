/* Hand Advisor: enter your real cards, get bidding / discard / lead advice. */
(function (T) {
  'use strict';
  const { el, cardEl, fmt, contractName } = T;
  const tr = window.Core.t;

  function commentary(ev) {
    const out = [];
    const need = T.requiredPoints(ev.oudlers);
    out.push(tr(`${ev.oudlers} oudler(s) in hand: you would need ${need} points to win.`, `${ev.oudlers} bout(s) en main : il vous faudrait ${need} points pour gagner.`));
    if (ev.trumps >= 8) out.push(tr(`${ev.trumps} trumps is a lot: you can control the deal and protect your kings.`, `${ev.trumps} atouts, c'est beaucoup : vous pouvez contrôler la donne et protéger vos rois.`));
    else if (ev.trumps >= 6) out.push(tr(`${ev.trumps} trumps is decent.`, `${ev.trumps} atouts, c'est correct.`));
    else out.push(tr(`Only ${ev.trumps} trump(s): defenders will be able to cut your kings and queens.`, `Seulement ${ev.trumps} atout(s) : les défenseurs pourront couper vos rois et vos dames.`));
    if (ev.kings === 0) out.push(tr('No kings: you will struggle to collect points.', 'Aucun roi : vous aurez du mal à ramasser des points.'));
    else out.push(tr(`${ev.kings} king(s): each one is a likely 4.5 points.`, `${ev.kings} roi(s) : chacun vaut probablement 4,5 points.`));
    const names = list => list.map(s => (window.Core.lang === 'fr' ? String(T.SUIT_INFO[s].name).toLowerCase() : T.SUIT_INFO[s].name)).join(', ');
    if (ev.voids.length && ev.trumps >= 4) out.push(tr(`Void in ${names(ev.voids)}: you can trump when it is led.`, `Chicane à ${names(ev.voids)} : vous pourrez couper quand cette couleur est entamée.`));
    const long = T.SUITS.filter(s => ev.counts[s] >= 6);
    if (long.length) out.push(tr(`Long suit${long.length > 1 ? 's' : ''} (${names(long)}): others may run out and be forced to trump.`, `Longue${long.length > 1 ? 's' : ''} couleur${long.length > 1 ? 's' : ''} (${names(long)}) : les autres risquent de manquer et devront couper.`));
    return out;
  }

  function advisorScreen(root) {
    const hand = new Set();
    const dog = new Set();
    let target = 'hand';
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const modeRow = el('div', { class: 'btn-row' });

    const byId = ids => T.sortHand([...ids].map(id => T.card(id)));

    function refreshPicker() {
      picker.innerHTML = '';
      const guide = T.deckGuide();
      guide.querySelectorAll('.card').forEach(node => {
        const id = node.getAttribute('data-id');
        if (hand.has(id)) node.classList.add('picked');
        if (dog.has(id)) node.classList.add('in-dog');
        node.style.cursor = 'pointer';
        node.addEventListener('click', () => {
          const mine = target === 'hand' ? hand : dog;
          const other = target === 'hand' ? dog : hand;
          const max = target === 'hand' ? 18 : 6;
          if (other.has(id)) return;
          if (mine.has(id)) mine.delete(id);
          else if (mine.size < max) mine.add(id);
          update();
        });
      });
      picker.append(guide);
    }

    function adviceBlock(title, cards, extra) {
      const ev = T.Bots.evaluateHand(cards);
      const box = el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, title));
      box.append(el('div', { class: 'hand flat' }, cards.map(c => cardEl(c))));
      box.append(el('p', {}, tr('Hand strength ', 'Force de la main '), el('strong', {}, fmt(ev.score)), tr('. Suggested bid: ', '. Enchère conseillée : '),
        el('strong', {}, ev.level ? contractName(ev.level) : tr('Pass', 'Passer'))),
      T.Drills.evalTable(ev),
      el('ul', {}, commentary(ev).map(t => el('li', {}, t))));
      if (extra) box.append(extra);
      return box;
    }

    function leadAdvice(cards) {
      const r = T.Bots.choosePlay({ hand: cards, trick: [], player: 0, taker: 0, trickNo: 0 });
      return el('div', { class: 'coach-box' }, el('strong', {}, tr('Opening lead (as taker): ', 'Entame (en tant que preneur) : ')), cardEl(r.card), ' ', r.reason);
    }

    function renderResults() {
      results.innerHTML = '';
      if (hand.size !== 18) return;
      const cards = byId(hand);
      const ev = T.Bots.evaluateHand(cards);
      results.append(adviceBlock(tr('1 · Bidding advice', '1 · Conseil pour les enchères'), cards,
        el('p', { class: 'muted' }, ev.level
          ? tr(`If nobody has bid higher, ${contractName(ev.level)} looks reasonable. Always bid one level above the previous bid, and remember the multiplier: ×${T.CONTRACTS[ev.level].mult}.`,
            `Si personne n'annonce plus haut, ${contractName(ev.level)} semble raisonnable. Annoncez toujours un niveau au-dessus de l'enchère précédente, et n'oubliez pas le multiplicateur : ×${T.CONTRACTS[ev.level].mult}.`)
          : tr('This hand is better defended than played: pass.', 'Cette main se défend mieux qu\'elle ne se joue : passez.'))));
      if (dog.size === 6) {
        const full = T.sortHand(cards.concat(byId(dog)));
        const d = T.Bots.chooseDiscard(full);
        const kept = full.filter(c => !d.cards.includes(c));
        results.append(el('div', { class: 'panel', style: 'margin-top:14px' },
          el('h3', {}, tr('2 · After taking the dog', '2 · Après avoir pris le chien')),
          el('p', {}, tr('Your 24 cards: ', 'Vos 24 cartes : ')), el('div', { class: 'hand flat' }, full.map(c => cardEl(c, { cls: d.cards.includes(c) ? 'dim' : '' }))),
          el('p', {}, el('strong', {}, tr('Suggested discard (greyed): ', 'Écart suggéré (grisé) : ')), d.reason),
          el('div', { class: 'cards-row' }, d.cards.map(c => cardEl(c))),
          adviceBlock(tr('3 · Your hand after the discard', '3 · Votre main après l\'écart'), kept, leadAdvice(kept))));
      } else {
        results.append(el('div', { class: 'panel', style: 'margin-top:14px' },
          el('h3', {}, tr('2 · Taking the dog?', '2 · Prendre le chien ?')),
          el('p', { class: 'muted' }, tr('If you win the bid with a Petite or a Garde, switch to “The dog” above, mark the 6 dog cards, and I will suggest the discard and your opening lead.', 'Si vous remportez les enchères avec une Petite ou une Garde, passez sur « Le chien » ci-dessus, marquez les 6 cartes du chien, et je vous suggérerai l\'écart et votre entame.')),
          leadAdvice(cards)));
      }
    }

    function update() {
      status.textContent = tr(`Your hand: ${hand.size}/18 cards · Dog: ${dog.size}/6 cards`, `Votre main : ${hand.size}/18 cartes · Chien : ${dog.size}/6 cartes`);
      modeRow.querySelectorAll('button').forEach(b => b.classList.toggle('primary', b.dataset.mode === target));
      refreshPicker();
      renderResults();
    }

    function randomHand() {
      const deck = T.shuffle(T.DECK.slice());
      hand.clear(); dog.clear();
      deck.slice(0, 18).forEach(c => hand.add(c.id));
      target = 'hand';
      update();
    }

    modeRow.append(
      el('button', { class: 'btn', 'data-mode': 'hand', onclick: () => { target = 'hand'; update(); } }, tr('Marking: my hand (18)', 'Je marque : ma main (18)')),
      el('button', { class: 'btn', 'data-mode': 'dog', onclick: () => { target = 'dog'; update(); } }, tr('Marking: the dog (6)', 'Je marque : le chien (6)')),
      el('button', { class: 'btn', onclick: randomHand }, tr('🎲 Random hand', '🎲 Main au hasard')),
      el('button', { class: 'btn', onclick: () => { hand.clear(); dog.clear(); target = 'hand'; update(); } }, tr('Clear', 'Effacer')));

    root.append(el('div', { class: 'panel' },
      el('h2', {}, tr('Hand Advisor', 'Conseiller')),
      el('p', { class: 'muted' }, tr('Playing a real game with real cards? Tap the cards you were dealt (18 for 4 players). You get a hand evaluation, a bid suggestion and, if you take the dog, the cards to discard and what to lead first.', 'Vous jouez une vraie partie avec de vraies cartes ? Touchez les cartes que vous avez reçues (18 à 4 joueurs). Vous obtenez une évaluation de votre main, une suggestion d\'enchère et, si vous prenez le chien, les cartes à écarter et votre première entame.')),
      modeRow, status, picker), results);
    update();
  }

  T.Screens = Object.assign(T.Screens || {}, { advisor: advisorScreen });
})(window.Tarot = window.Tarot || {});
