/* Le Rami : leçons, entraînement, référence (en français). */
(function (R, P) {
  'use strict';
  const { el, cardEl } = R;
  const drillBox = key => { const b = el('div', {}); R.RamiDrills[key].fn(b); return b; };
  const ex = (title, ids) => el('div', { class: 'slot' }, el('div', { class: 'cards-row mini', style: 'justify-content:center' }, ids.split(' ').map(x => {
    if (x === 'JK') return cardEl(R.card('JK0'));
    const L = { V: 11, D: 12, R: 13, A: 14 }; const s = x.slice(-1); const r = x.slice(0, -1);
    return cardEl(R.card(`0${L[r] || +r}${s}`));
  })), title);

  const LESSONS = [
    {
      title: 'Le principe du jeu',
      body: () => el('div', { html: `
        <p>Le <strong>Rami</strong> est le jeu de « rummy » à la française. On joue avec <strong>2 jeux de 52 cartes + 4 jokers</strong> (108 cartes). Chaque joueur reçoit <strong>13 cartes</strong>.</p>
        <p>Le but : être le premier à <strong>se débarrasser de toutes ses cartes</strong> en les rangeant en <strong>combinaisons</strong> (brelans, carrés et suites) qu'on <strong>pose</strong> sur la table. À son tour, on <strong>pioche</strong> une carte, on <strong>pose</strong> éventuellement des combinaisons, puis on <strong>défausse</strong> une carte.</p>
        <p>Quand un joueur <strong>se couche</strong> (« <em>il fait Rami</em> »), les autres comptent les points des cartes qui leur restent en main : <strong>moins on en a, mieux c'est</strong>. La partie se joue en plusieurs <strong>manches</strong> et celui qui a le <strong>total le plus bas</strong> gagne.</p>
        <div class="note">Le grand obstacle : la première fois qu'on pose (l'<strong>ouverture</strong>), il faut <strong>51 points</strong> de combinaisons, dont au moins <strong>une suite sans joker</strong>.</div>` }),
    },
    {
      title: 'Les combinaisons',
      body: () => {
        const d = el('div', { html: `
          <p>Une combinaison comporte au moins <strong>3 cartes</strong> :</p>
          <ul>
            <li>Le <strong>brelan</strong> (3 cartes) ou le <strong>carré</strong> (4) : des cartes de <strong>même valeur</strong> et de <strong>couleurs toutes différentes</strong> (pique, cœur, carreau, trèfle).</li>
            <li>La <strong>suite</strong> : des cartes qui se <strong>suivent</strong> dans la <strong>même couleur</strong>, par exemple 4♥ 5♥ 6♥. L'<strong>as</strong> peut être bas (A-2-3) ou haut (D-R-A), mais on ne peut pas « faire le tour » (R-A-2 est interdit).</li>
            <li>Le <strong>joker</strong> remplace n'importe quelle carte. Un <strong>seul joker</strong> par combinaison, et on ne peut pas le défausser.</li>
          </ul>
          <p>Les figures s'écrivent <strong>V</strong> (valet), <strong>D</strong> (dame), <strong>R</strong> (roi) et <strong>A</strong> (as).</p>` });
        d.append(el('div', { class: 'trick-line' }, ex('Brelan', '7H 7S 7D'), ex('Carré', 'RH RS RD RC'), ex('Suite', '4H 5H 6H 7H'), ex('Suite (as haut)', 'DS RS AS'), ex('Avec joker', '9C JK VC')),
          el('p', {}, 'Laquelle de ces combinaisons est valide ?'), drillBox('valid'));
        return d;
      },
    },
    {
      title: 'Le tour de jeu',
      body: () => el('div', { html: `
        <p>On joue chacun son tour. À votre tour :</p>
        <ol>
          <li><strong>Piocher :</strong> prenez la carte du dessus de la <strong>pioche</strong> (le talon, face cachée) <em>ou</em> la carte du dessus de la <strong>défausse</strong> (face visible).</li>
          <li><strong>Poser</strong> (facultatif) : étalez des combinaisons sur la table (on dit aussi « <em>descendre</em> »). Une fois que vous avez ouvert, vous pouvez aussi <strong>ajouter des cartes</strong> à n'importe quelle combinaison de la table, la vôtre ou celle des autres.</li>
          <li><strong>Défausser :</strong> posez une carte face visible sur la défausse. Il est interdit de défausser un joker, ou de rejeter la carte que vous venez de prendre dans la défausse.</li>
        </ol>
        <p>On <strong>se couche</strong> en défaussant sa dernière carte, ou en posant toutes ses cartes d'un coup.</p>` }),
    },
    {
      title: 'L\'ouverture à 51',
      body: () => {
        const d = el('div', { html: `
          <p>Votre <strong>première</strong> pose (l'<strong>ouverture</strong>) doit respecter deux conditions :</p>
          <ul>
            <li>Les combinaisons posées valent ensemble <strong>au moins 51 points</strong> ;</li>
            <li>L'une d'elles au moins est une <strong>suite sans joker</strong> (une suite « pure »).</li>
          </ul>
          <p>Vous pouvez poser plusieurs combinaisons dans le même tour pour atteindre 51. Chaque carte vaut sa valeur : les <strong>cartes de 2 à 10</strong> leur numéro, <strong>valet, dame et roi 10</strong>, l'<strong>as 11</strong> (mais 1 dans A-2-3). Un joker vaut la carte qu'il remplace.</p>
          <p>Exemple : R♥ R♠ R♦ (30) + 7♣ 8♣ 9♣ (24) = 54 points ✓.</p>
          <p>Comptez les points d'une combinaison :</p>` });
        d.append(drillBox('points'), el('p', {}, 'Puis décidez si vous pouvez ouvrir :'), drillBox('open'));
        return d;
      },
    },
    {
      title: 'Poser sur la table, les jokers',
      body: () => {
        const d = el('div', { html: `
          <p>Une fois ouvert, la table vous aide à vous débarrasser de vos cartes :</p>
          <ul>
            <li><strong>Ajouter</strong> une carte à une combinaison de la table : une 4ᵉ couleur à un brelan, ou une carte au bout d'une suite (…5♥ 6♥ 7♥ + 8♥).</li>
            <li><strong>Récupérer un joker :</strong> si une combinaison contient un joker et que vous avez <strong>exactement la carte</strong> qu'il remplace, mettez-la à sa place et prenez le joker. Il est à vous : utilisez-le dans une nouvelle combinaison !</li>
          </ul>
          <p>Le joker est très puissant : beaucoup de joueurs ouvrent dès qu'ils le peuvent pour avoir le droit d'en récupérer.</p>
          <p>Entraînez-vous :</p>` });
        d.append(drillBox('joker'));
        return d;
      },
    },
    {
      title: 'Fin de manche et décompte',
      body: () => el('div', { html: `
        <p>Quand un joueur se couche, la manche s'arrête. Tous les autres marquent des <strong>points de pénalité</strong> :</p>
        <ul>
          <li>Chaque carte restant en main vaut sa valeur : numéro, <strong>figures 10</strong>, <strong>as 11</strong>, <strong>joker 25</strong>.</li>
          <li>Si vous n'avez <strong>jamais ouvert</strong> : <strong>100</strong> points forfaitaires (dans cette version).</li>
        </ul>
        <p>Celui qui se couche marque 0. Après la dernière manche, le <strong>total le plus bas</strong> gagne la partie.</p>
        <p class="muted">Si plus personne ne peut finir après un très grand nombre de tours, la manche est nulle et chacun compte sa main.</p>` }),
    },
    {
      title: 'Quelques conseils',
      body: () => el('div', { html: `
        <ul>
          <li><strong>Collectez des paires et des voisines</strong> dès le début : deux cartes de même valeur, ou deux cartes proches dans la même couleur.</li>
          <li><strong>Visez une belle suite et des brelans de figures</strong> pour atteindre 51 : rois, dames, valets et as rapportent le plus.</li>
          <li><strong>Ne prenez la défausse</strong> que si elle complète quelque chose : cela renseigne aussi vos adversaires sur votre jeu.</li>
          <li><strong>Ne gardez pas trop longtemps les grosses cartes</strong> inutiles : un roi qui reste en main coûte 10 points.</li>
          <li><strong>Une fois ouvert, accélérez</strong> : posez vos cartes sur les combinaisons de la table et volez les jokers.</li>
          <li><strong>Surveillez vos adversaires</strong> : si l'un d'eux a ouvert et n'a plus que quelques cartes, débarrassez-vous vite de vos grosses cartes.</li>
        </ul>
        <p>À vous de jouer : <a href="#/rami/play">lancez une partie</a> avec le coach.</p>` }),
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/rami/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/rami/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1 ? el('a', { class: 'btn primary', href: `#/rami/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/rami/play' }, 'Jouer une partie →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(R.RamiDrills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Exercices'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/rami/practice/${k}` }, R.RamiDrills[k].title))), box));
    R.RamiDrills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Pioche (ou talon)', 'Le tas de cartes face cachée où l\'on pioche.'],
      ['Défausse', 'Le tas où l\'on dépose ses cartes face visible ; on peut en prendre la carte du dessus.'],
      ['Brelan / carré', '3 / 4 cartes de même valeur et de couleurs différentes.'],
      ['Suite', '3 cartes ou plus qui se suivent dans la même couleur.'],
      ['Joker', 'Remplace n\'importe quelle carte (un seul par combinaison) ; on ne peut pas le défausser.'],
      ['Ouverture', 'La première pose : 51 points au minimum, avec une suite sans joker.'],
      ['Poser / descendre', 'Étaler ses combinaisons sur la table.'],
      ['Se coucher / faire Rami', 'Se débarrasser de toutes ses cartes : la manche est gagnée.'],
      ['Main', 'Les cartes que l\'on tient.'],
      ['Manche', 'Un tour complet de jeu, de la donne jusqu\'à ce que quelqu\'un se couche.'],
      ['Donneur', 'Celui qui distribue les cartes.'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Référence'),
      el('h3', {}, 'Valeur des cartes'),
      el('p', {}, '2 à 10 : le numéro · valet, dame, roi : 10 · as : 11 (1 dans A-2-3) · joker dans une combinaison : la carte qu\'il remplace · joker resté en main : 25 points de pénalité.'),
      el('h3', {}, 'Une manche en 5 étapes'),
      el('ol', {}, ['On distribue 13 cartes à chacun et on retourne une carte pour commencer la défausse.', 'On pioche dans la pioche ou on prend la défausse.', 'On pose ses combinaisons (ouverture : 51 points + une suite sans joker).', 'On ajoute des cartes sur la table et on récupère des jokers.', 'On défausse une carte ; le premier qui n\'a plus de cartes se couche et gagne la manche.'].map(t => el('li', {}, t))),
      el('h3', {}, 'Lexique'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Variantes courantes (non implémentées ici)'),
      el('ul', {}, ['Le « rami sec » : se coucher en posant tout d\'un coup sans avoir ouvert avant, avec des pénalités doublées pour les autres.', 'Un total d\'ouverture et des règles sur les jokers qui varient d\'une table à l\'autre.'].map(t => el('li', {}, t))),
      el('h3', {}, 'Simplifications de cette version'),
      el('ul', {}, ['Nombre de manches fixé à l\'avance ; le total le plus bas gagne.', 'Un joueur qui n\'a jamais ouvert compte 100 points forfaitaires.', 'Un seul joker au maximum par combinaison.', 'On peut prendre la carte de la défausse à tout moment (sans condition supplémentaire).'].map(t => el('li', {}, t)))));
  }

  R.RamiScreens = Object.assign(R.RamiScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
  void P;
})(window.Rami = window.Rami || {}, window.Poker);
