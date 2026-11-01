/* Le Bridge, Conseiller : indiquez vos 13 cartes, obtenez l'évaluation, l'ouverture, la réponse et l'entame. */
(function (Br) {
  'use strict';
  const { el, cardEl } = Br;

  function advisorScreen(root) {
    const hand = new Set();
    let partnerOpen = 'aucune'; // 'aucune' or a call text
    let contractSel = '4♠';
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const byId = ids => Br.sortHand([...ids].map(id => Br.card(id)));
    const OPENINGS = ['1♣', '1♦', '1♥', '1♠', '1SA', '2SA'];
    const CONTRACTS = [];
    for (let l = 1; l <= 5; l++) Br.STRAINS.forEach(s => CONTRACTS.push(`${l}${Br.SYM[s]}`));
    const parseCall = t => { const m = /^(\d)(.+)$/.exec(t); const strain = Object.keys(Br.SYM).find(k => Br.SYM[k] === m[2]); return Br.bid(+m[1], strain); };

    function refreshPicker() {
      picker.innerHTML = '';
      const guide = Br.deckGuide();
      guide.querySelectorAll('.card').forEach(node => {
        const id = node.getAttribute('data-id');
        if (hand.has(id)) node.classList.add('picked');
        node.style.cursor = 'pointer';
        node.addEventListener('click', () => { if (hand.has(id)) hand.delete(id); else if (hand.size < 13) hand.add(id); update(); });
      });
      picker.append(guide);
    }

    function select(options, value, onchange) {
      return el('select', { onchange: e => onchange(e.target.value) }, options.map(o => el('option', { value: o, selected: o === value ? true : null }, o)));
    }

    function renderResults() {
      results.innerHTML = '';
      if (hand.size !== 13) return;
      const cards = byId(hand); const ev = Br.evalHand(cards);
      const open = Br.Bid.choose(cards, [], 0);
      results.append(el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, '1 · Votre main'),
        el('div', { class: 'hand flat' }, cards.map(c => cardEl(c))),
        el('p', {}, el('strong', {}, `${ev.hcp} points d'honneurs`), ` · ${ev.points} avec la longueur · répartition ${Br.shapeText(ev)} · ${ev.balanced ? 'main équilibrée' : 'main irrégulière'}`),
        el('p', { class: 'muted' }, ev.points >= 12 ? 'Assez pour ouvrir.' : 'Moins de 12 points : pas d\'ouverture normale.')),
      el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, '2 · Si vous ouvrez les enchères'),
        el('p', {}, 'Conseil : ', el('strong', {}, Br.callText(open.call))), el('p', { class: 'muted' }, open.reason)));
      const respBox = el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, '3 · Si votre partenaire ouvre'),
        el('p', {}, 'Il a ouvert : ', select(['aucune', ...OPENINGS], partnerOpen, v => { partnerOpen = v; renderResults(); })));
      if (partnerOpen !== 'aucune') {
        const r = Br.Bid.choose(cards, [{ seat: 2, call: parseCall(partnerOpen) }, { seat: 3, call: Br.pass() }], 0);
        respBox.append(el('p', {}, 'Conseil : ', el('strong', {}, Br.callText(r.call))), el('p', { class: 'muted' }, r.reason));
      }
      results.append(respBox);
      const lead = Br.AI.openingLead(cards, parseCall(contractSel).strain === 'N' ? null : parseCall(contractSel).strain);
      results.append(el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, '4 · Votre entame en défense'),
        el('p', {}, 'Les adversaires jouent le contrat ', select(CONTRACTS, contractSel, v => { contractSel = v; renderResults(); }), ' :'),
        el('div', { class: 'coach-box' }, el('strong', {}, 'Entame : '), cardEl(lead.card), ' ', lead.reason)));
    }

    function update() {
      status.textContent = `Votre main : ${hand.size}/13 cartes`;
      refreshPicker();
      renderResults();
    }

    const bar = el('div', { class: 'btn-row' },
      el('button', { class: 'btn', onclick: () => { hand.clear(); Br.shuffle(Br.DECK.slice()).slice(0, 13).forEach(c => hand.add(c.id)); update(); } }, '🎲 Main au hasard'),
      el('button', { class: 'btn', onclick: () => { hand.clear(); update(); } }, 'Effacer'));
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Conseiller · Le Bridge'),
      el('p', { class: 'muted' }, 'Vous jouez avec de vraies cartes ? Touchez les 13 cartes que vous avez reçues : vous obtenez le compte des points, l\'ouverture conseillée, la réponse à l\'ouverture du partenaire et votre entame.'),
      bar, status, picker), results);
    update();
  }

  Br.BridgeScreens = Object.assign(Br.BridgeScreens || {}, { advisor: advisorScreen });
})(window.Bridge = window.Bridge || {});
