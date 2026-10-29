/* Le Rami Hand Advisor: mark your cards (13-14), see whether you can open and what to throw. */
(function (R, P) {
  'use strict';
  const { el, cardEl, lab, meldName } = R;

  function advisorScreen(root) {
    const counts = {};           // face id ("14S" or "JK") -> copies in hand
    const top = [];              // visible défausse card
    let target = 'hand';
    let opened = false;
    const results = el('div', {});
    const picker = el('div', { class: 'picker' });
    const status = el('p', {});
    const modeRow = el('div', { class: 'btn-row' });
    const total = () => Object.values(counts).reduce((a, b) => a + b, 0);

    function faceCard(face) { return face === 'JK' ? R.card('JK0') : R.card(`0${face}`); }

    function refreshPicker() {
      picker.innerHTML = '';
      const wrap = el('div', { class: 'deck-guide' });
      const groups = [...R.SUITS.map(s => ({ s, faces: Array.from({ length: 13 }, (_, k) => `${k + 2}${s}`) })), { s: 'JK', faces: ['JK'] }];
      groups.forEach(g => {
        const row = el('div', { class: 'cards-row' });
        g.faces.forEach(face => {
          const n = el('div', { style: 'position:relative;cursor:pointer' }, cardEl(faceCard(face)));
          const k = target === 'hand' ? (counts[face] || 0) : (top[0] === face ? 1 : 0);
          if (k) { n.firstChild.classList.add(target === 'hand' ? 'picked' : 'in-dog'); if (k > 1 || face === 'JK') n.append(el('span', { class: 'copies' }, '×' + k)); }
          if (target === 'hand' && counts[face]) n.firstChild.classList.add('picked');
          n.addEventListener('click', () => {
            if (target === 'hand') {
              const max = face === 'JK' ? 4 : 2;
              const cur = counts[face] || 0;
              if (cur >= max) delete counts[face]; else if (total() < 14) counts[face] = cur + 1;
              else delete counts[face];
            } else { top.length = 0; if (top[0] !== face) top.push(face); }
            update();
          });
          row.append(n);
        });
        wrap.append(el('div', { class: 'deck-group' }, row));
      });
      picker.append(el('p', { class: 'muted' }, target === 'hand' ? 'Cliquez sur une carte pour l\'ajouter (il y en a deux de chaque, et quatre jokers). Un 2ᵉ clic ajoute la deuxième copie, un 3ᵉ la retire.' : 'Cliquez sur la carte visible de la défausse.'), wrap);
    }

    function renderResults() {
      results.innerHTML = '';
      const n = total();
      if (n < 13) { results.append(el('p', { class: 'muted' }, 'Indiquez vos 13 cartes (14 après avoir pioché).')); return; }
      const hand = R.cardsFromCounts(counts);
      const panel = el('div', { class: 'panel', style: 'margin-top:14px' }, el('h3', {}, 'Conseils'));
      const open = R.bestArrangement(hand, 'open');
      const all = R.bestArrangement(hand, 'cards');
      const show = a => a.melds.map(m => el('div', { style: 'margin:4px 0' }, el('strong', {}, meldName(m) + ' (' + m.points + ' pts) : '), lab(m.cards)));
      if (!opened) {
        if (open && open.points >= R.OPEN_MIN) panel.append(el('div', { class: 'coach-box' }, el('strong', {}, `Vous pouvez ouvrir avec ${open.points} points`), show(open)));
        else panel.append(el('div', { class: 'coach-box' }, el('strong', {}, 'Vous ne pouvez pas encore ouvrir'),
          el('div', {}, open ? `Meilleur total avec une suite sans joker : ${open.points} points (il en faut ${R.OPEN_MIN}).` : all.melds.length ? 'Aucune suite sans joker dans votre main.' : 'Aucune combinaison pour le moment.')));
      }
      panel.append(el('h4', {}, 'Meilleur arrangement (le plus de cartes posées)'), all.melds.length ? el('div', {}, show(all)) : el('p', {}, 'Aucune combinaison.'),
        el('p', {}, `Cartes restantes (${all.rest.length}) : ${lab(all.rest) || '—'} → ${all.rest.reduce((s, c) => s + R.penalty(c), 0)} points de pénalité.`));
      if (n === 14) {
        const pool = all.rest.filter(c => !c.joker);
        const g = { hands: [hand], opened: [opened], table: [], taken: null, names: ['Vous'] };
        const d = R.RamiBots.chooseDiscard(g, 0);
        panel.append(el('div', { class: 'coach-box' }, el('strong', {}, `Défaussez ${d.card.text}`), el('div', {}, pool.length ? d.reason : 'Tout est combiné : vous pouvez vous coucher !')));
      } else if (top.length) {
        const g = { hands: [hand], opened: [opened], table: [], top: () => faceCard(top[0]) };
        const w = R.RamiBots.wantsDiscard(g, 0);
        panel.append(el('div', { class: 'coach-box' }, el('strong', {}, w.take ? `Prenez ${faceCard(top[0]).text}` : 'Piochez'), el('div', {}, w.reason)));
      }
      results.append(panel);
    }

    function update() {
      status.textContent = `Main : ${total()}/14 cartes · Défausse : ${top.length}/1`;
      modeRow.querySelectorAll('button[data-mode]').forEach(b => b.classList.toggle('primary', b.dataset.mode === target));
      refreshPicker(); renderResults();
    }

    modeRow.append(
      el('button', { class: 'btn', 'data-mode': 'hand', onclick: () => { target = 'hand'; update(); } }, 'Je marque : ma main'),
      el('button', { class: 'btn', 'data-mode': 'top', onclick: () => { target = 'top'; update(); } }, 'Je marque : la défausse'),
      el('button', { class: 'btn', onclick: () => { Object.keys(counts).forEach(k => delete counts[k]); P.shuffle(R.DECK.slice()).slice(0, 13).forEach(c => { const f = c.joker ? 'JK' : `${c.rank}${c.suit}`; counts[f] = Math.min((counts[f] || 0) + 1, f === 'JK' ? 4 : 2); }); top.length = 0; target = 'hand'; update(); } }, '🎲 Main au hasard'),
      el('button', { class: 'btn', onclick: () => { Object.keys(counts).forEach(k => delete counts[k]); top.length = 0; target = 'hand'; update(); } }, 'Effacer'),
      el('label', {}, el('input', { type: 'checkbox', onchange: e => { opened = e.target.checked; renderResults(); } }), ' J\'ai déjà ouvert'));

    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Conseiller · Le Rami'),
      el('p', { class: 'muted' }, 'Vous jouez avec de vrais jeux de cartes ? Indiquez vos 13 cartes (14 après avoir pioché) et la carte visible de la défausse : vous obtenez vos meilleures combinaisons, si vous pouvez ouvrir (51 points) et quoi défausser.'),
      modeRow, status, picker), results);
    update();
  }

  R.RamiScreens = Object.assign(R.RamiScreens || {}, { advisor: advisorScreen });
})(window.Rami = window.Rami || {}, window.Poker);
