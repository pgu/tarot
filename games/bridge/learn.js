/* Le Bridge : leçons, entraînement, référence (en français). */
(function (Br) {
  'use strict';
  const { el } = Br;
  const drillBox = key => { const b = el('div', {}); Br.Drills[key].fn(b); return b; };

  const LESSONS = [
    {
      title: 'Le principe du jeu',
      body: () => el('div', { html: `
        <p>Le <strong>Bridge</strong> est un jeu de <strong>plis</strong> à <strong>4 joueurs</strong> en <strong>2 équipes de 2</strong>. Les partenaires sont assis <strong>face à face</strong> : vous (Sud) jouez avec Nord, contre Est et Ouest.</p>
        <ul>
          <li>On utilise <strong>52 cartes</strong>, distribuées entièrement : <strong>13 cartes par joueur</strong>.</li>
          <li>Chaque donne a deux temps : les <strong>enchères</strong> (on décide du contrat) puis le <strong>jeu de la carte</strong> (13 plis).</li>
          <li>Pendant les enchères, chaque camp annonce <strong>combien de plis</strong> il pense faire et <strong>dans quelle couleur d'atout</strong> (ou sans atout). Le camp qui a fait la dernière enchère devra tenir son <strong>contrat</strong>.</li>
          <li>Un des joueurs du camp du contrat devient le <strong>déclarant</strong> ; son partenaire est le <strong>mort</strong> : il étale ses cartes sur la table et c'est le déclarant qui les joue.</li>
          <li>Les points se marquent en <strong>rubber</strong> : le premier camp qui gagne <strong>2 manches</strong> remporte le rubber.</li>
        </ul>
        <p>Le jeu tourne <strong>dans le sens des aiguilles d'une montre</strong> (contrairement au Tarot et à la Belote).</p>
        <div class="note">Le bridge s'apprend par étapes : d'abord <strong>compter ses points</strong>, puis <strong>enchérir</strong>, puis <strong>jouer la carte</strong>. Les leçons suivantes suivent cet ordre.</div>` }),
    },
    {
      title: 'Les plis et l\'atout',
      body: () => {
        const d = el('div', { html: `
          <p>Dans chaque couleur, les cartes se classent <strong>de l'as (la plus forte) au 2 (la plus faible)</strong> : A, R, D, V, 10, 9, 8, 7, 6, 5, 4, 3, 2.</p>
          <p>Un pli, c'est une carte de chaque joueur. Le premier joueur (l'<strong>entame</strong>) choisit une carte ; les autres doivent <strong>fournir</strong> : jouer dans la <strong>même couleur</strong> s'ils le peuvent. S'ils ne le peuvent pas, ils jouent n'importe quelle carte.</p>
          <ul>
            <li>Le pli est gagné par <strong>la plus forte carte de la couleur demandée</strong>…</li>
            <li>…<strong>sauf</strong> si le contrat a une couleur d'<strong>atout</strong> : un atout bat toutes les autres couleurs. Un joueur qui n'a pas la couleur demandée peut alors <strong>couper</strong> avec un atout.</li>
            <li>Dans un contrat <strong>sans atout</strong> (SA), seule la couleur demandée compte.</li>
            <li>Le gagnant du pli <strong>entame</strong> le suivant.</li>
          </ul>
          <p>À vous :</p>` });
        d.append(drillBox('winner'));
        return d;
      },
    },
    {
      title: 'Compter ses points',
      body: () => {
        const d = el('div', { html: `
          <p>Pour savoir si l'on peut annoncer, on compte les <strong>points d'honneurs</strong> :</p>
          <table class="t"><tr><th>Carte</th><th>As</th><th>Roi</th><th>Dame</th><th>Valet</th></tr><tr><td>Points</td><td>4</td><td>3</td><td>2</td><td>1</td></tr></table>
          <p>Il y a <strong>40 points</strong> dans le jeu : en moyenne <strong>10 par joueur</strong>. Un camp qui en a <strong>25 ou 26</strong> à deux peut en général réussir une <strong>manche</strong>.</p>
          <ul>
            <li><strong>Points de longueur</strong> : on ajoute 1 point pour chaque carte au-delà de la quatrième dans une couleur (une couleur de 5 cartes : +1, de 6 : +2…).</li>
            <li><strong>Main équilibrée</strong> : répartition 4-3-3-3, 4-4-3-2 ou 5-3-3-2 (aucune couleur courte). Les autres mains sont <strong>irrégulières</strong> et ont de la <strong>distribution</strong>.</li>
            <li>Avec un <strong>fit</strong> (au moins 8 cartes dans une couleur à deux), on peut aussi compter les <strong>courtes</strong> : chicane 3 points, singleton 2, doubleton 1.</li>
          </ul>
          <p>Entraînez-vous :</p>` });
        d.append(drillBox('count'));
        return d;
      },
    },
    {
      title: 'Les enchères',
      body: () => el('div', { html: `
        <p>Chacun à son tour (en commençant par le donneur), on dit une <strong>enchère</strong> :</p>
        <ul>
          <li>Une <strong>annonce</strong> : un <strong>niveau de 1 à 7</strong> et une <strong>dénomination</strong>, par exemple <strong>3♥</strong> ou <strong>2SA</strong>. Elle doit être <strong>plus forte</strong> que la précédente.</li>
          <li><strong>Passe</strong>.</li>
          <li><strong>Contre</strong> : double la mise d'une annonce adverse (si on pense qu'elle va chuter) ; <strong>surcontre</strong> : redouble.</li>
        </ul>
        <p>Ordre des dénominations, de la plus faible à la plus forte : <strong>♣ trèfle &lt; ♦ carreau &lt; ♥ cœur &lt; ♠ pique &lt; SA</strong>. Donc 1♠ bat 1♥, mais 2♣ bat 1SA.</p>
        <p><strong>Le niveau = le nombre de plis à faire au-dessus de 6.</strong> Annoncer <strong>4♠</strong>, c'est s'engager à faire <strong>10 plis</strong> (4 + 6) avec pique comme atout.</p>
        <p>Les enchères se terminent après <strong>3 passes de suite</strong> suivant une annonce. La dernière annonce devient le <strong>contrat</strong>. Le <strong>déclarant</strong> est le premier joueur de ce camp qui a nommé la couleur du contrat. Le joueur à gauche du déclarant fait l'<strong>entame</strong>, puis le <strong>mort</strong> étale son jeu.</p>
        <table class="t"><tr><th>Contrat</th><th>Plis à faire</th></tr>
          <tr><td>Une <strong>manche</strong> : 3SA, 4♥, 4♠, 5♣, 5♦</td><td>9 à 11</td></tr>
          <tr><td>Un <strong>petit chelem</strong> : niveau 6</td><td>12</td></tr>
          <tr><td>Un <strong>grand chelem</strong> : niveau 7</td><td>13</td></tr></table>` }),
    },
    {
      title: 'Ouvrir les enchères',
      body: () => {
        const d = el('div', { html: `
          <p>Le coach de ce site utilise un système simple, proche des conventions courantes :</p>
          <table class="t"><tr><th>Votre main</th><th>Ouverture</th></tr>
            <tr><td>Moins de 12 points</td><td><strong>Passe</strong> (ou barrage avec une longue couleur)</td></tr>
            <tr><td>12 points ou plus, couleur majeure (♥ ♠) de <strong>5 cartes</strong></td><td><strong>1 dans la majeure</strong></td></tr>
            <tr><td>12 points ou plus, pas de majeure cinquième</td><td><strong>1 dans la mineure</strong> la plus longue (♣ ou ♦)</td></tr>
            <tr><td>Main <strong>équilibrée</strong> de 15 à 17 points</td><td><strong>1SA</strong></td></tr>
            <tr><td>Main équilibrée de 20 à 21 points</td><td><strong>2SA</strong></td></tr>
            <tr><td>6 cartes ♦ ♥ ♠ et 5 à 10 points</td><td><strong>2</strong> dans la couleur (ouverture faible)</td></tr>
            <tr><td>7 cartes ou plus et peu de points</td><td><strong>3</strong> dans la couleur (barrage)</td></tr></table>
          <p>Essayez :</p>` });
        d.append(drillBox('open'));
        return d;
      },
    },
    {
      title: 'Répondre à l\'ouverture',
      body: () => {
        const d = el('div', { html: `
          <p>Avec <strong>6 points ou plus</strong>, vous devez répondre à votre partenaire (sinon, passez). Ce qu'il faut regarder :</p>
          <ul>
            <li><strong>Fit majeur</strong> (3 cartes ou plus dans sa majeure) : <strong>soutenez</strong> — 6–9 points : au niveau de 2 ; 10–12 points : au niveau de 3 ; 13 points ou plus : directement la <strong>manche</strong> (4 dans la majeure).</li>
            <li>Une <strong>majeure de 4 cartes</strong> que vous pouvez annoncer au niveau de 1 : annoncez-la.</li>
            <li>Sans fit ni couleur à montrer : <strong>1SA</strong> (6–9 points), <strong>2SA</strong> (10–12), <strong>3SA</strong> (13+).</li>
            <li>Après une ouverture de <strong>1SA</strong> (15–17) : <strong>0–7 points</strong> passe, <strong>8–9</strong> invite avec 2SA, <strong>10 ou plus</strong> annonce la manche 3SA.</li>
          </ul>
          <p>Le but : dire à son partenaire <strong>combien de points</strong> vous avez et <strong>dans quelles couleurs</strong>, pour trouver le bon contrat.</p>` });
        d.append(drillBox('respond'));
        return d;
      },
    },
    {
      title: 'Le jeu de la carte',
      body: () => el('div', { html: `
        <h3>Comme déclarant</h3>
        <ul>
          <li>Quand le mort s'étale, <strong>comptez vos plis</strong> : combien en avez-vous de sûrs (as, rois maîtres) ? Combien vous en manque-t-il ?</li>
          <li>À l'<strong>atout</strong>, commencez en général par <strong>tirer les atouts adverses</strong> pour éviter d'être coupé.</li>
          <li>Les <strong>longues couleurs</strong> du camp fournissent des plis supplémentaires une fois que les cartes adverses sont tombées.</li>
          <li>Vous jouez <strong>les deux mains</strong> : pensez à <strong>passer d'une main à l'autre</strong> (la main qui gagne le pli entame le suivant).</li>
        </ul>
        <h3>En défense</h3>
        <ul>
          <li><strong>L'entame</strong> : le haut d'une <strong>séquence</strong> (R-D-10 → le roi), sinon la <strong>4e meilleure</strong> carte de votre couleur la plus longue.</li>
          <li><strong>2e en main : petit</strong> · <strong>3e en main : fort</strong> (essayez de gagner) · <strong>4e</strong> : gagnez avec la plus petite carte suffisante.</li>
          <li>Ne <strong>coupez pas</strong> si votre partenaire gagne déjà le pli.</li>
        </ul>
        <p>Dans l'écran Jouer, activez <strong>« Voir toutes les mains »</strong> pour comprendre ce que font les bots, ou demandez une <strong>suggestion</strong> au coach.</p>` }),
    },
    {
      title: 'La marque (rubber)',
      body: () => {
        const d = el('div', { html: `
          <p>Le score est séparé par une <strong>ligne</strong> :</p>
          <ul>
            <li><strong>Sous la ligne</strong> : les points des <strong>levées du contrat</strong> réussi. Dès qu'un camp atteint <strong>100 points</strong> sous la ligne, il gagne une <strong>manche</strong> (la ligne est alors « refermée » : les points en cours repartent à zéro). Le premier camp avec <strong>2 manches</strong> gagne le <strong>rubber</strong> (bonus <strong>700</strong> s'il a gagné 2–0, <strong>500</strong> 2–1).</li>
            <li><strong>Au-dessus de la ligne</strong> : tout le reste (levées de mieux, chelems, chutes de l'adversaire…).</li>
          </ul>
          <table class="t"><tr><th>Valeur d'une levée du contrat</th><th>Points</th></tr>
            <tr><td>♣ ♦ (mineures)</td><td>20</td></tr><tr><td>♥ ♠ (majeures)</td><td>30</td></tr><tr><td>SA</td><td>40 la première, 30 les suivantes</td></tr></table>
          <p>Un camp est <strong>vulnérable</strong> après avoir gagné une manche : les primes et les pénalités sont alors plus fortes.</p>
          <table class="t"><tr><th></th><th>Non vulnérable</th><th>Vulnérable</th></tr>
            <tr><td>Chute (par levée)</td><td>50</td><td>100</td></tr>
            <tr><td>Petit chelem (12 levées)</td><td>500</td><td>750</td></tr>
            <tr><td>Grand chelem (13 levées)</td><td>1000</td><td>1500</td></tr></table>
          <p>Un contrat <strong>contré</strong> double les points de levées et les chutes valent beaucoup plus. Une réussite contrée rapporte une prime de <strong>50</strong>.</p>
          <p>Calculez :</p>` });
        d.append(drillBox('score'));
        return d;
      },
    },
    {
      title: 'Premiers conseils',
      body: () => el('div', { html: `
        <ul>
          <li>Comptez toujours vos <strong>points d'honneurs</strong> avant de parler : 12 points pour ouvrir, 6 pour répondre.</li>
          <li>Cherchez d'abord un <strong>fit majeur</strong> (8 cartes à deux) : les majeures rapportent 30 par levée et la manche est à 4.</li>
          <li>Ne montez pas trop haut avec un jeu moyen : une <strong>chute</strong> coûte cher, surtout vulnérable.</li>
          <li>En jeu de la carte, <strong>prenez le temps</strong> : regardez le mort, comptez, faites un plan avant de jouer la première carte.</li>
          <li>Écoutez les enchères adverses : elles vous disent où sont les points et les longues couleurs.</li>
        </ul>
        <p>À vous de jouer : <a href="#/bridge/play">lancez un rubber</a> avec le coach.</p>` }),
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/bridge/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/bridge/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1 ? el('a', { class: 'btn primary', href: `#/bridge/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/bridge/play' }, 'Jouer un rubber →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(Br.Drills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Exercices'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/bridge/practice/${k}` }, Br.Drills[k].title))), box));
    Br.Drills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Atout', 'La couleur du contrat : ses cartes battent les autres couleurs. En « sans-atout » (SA), il n\'y en a pas.'],
      ['Contrat', 'La dernière annonce : niveau + dénomination. Elle engage le camp à faire 6 + niveau plis.'],
      ['Déclarant', 'Le joueur du camp du contrat qui a nommé le premier la couleur du contrat. Il joue ses cartes et celles du mort.'],
      ['Mort', 'Le partenaire du déclarant : il étale son jeu après l\'entame et ne joue pas.'],
      ['Entame', 'La première carte d\'un pli. L\'entame initiale est faite par le joueur à gauche du déclarant.'],
      ['Fournir', 'Jouer dans la couleur demandée.'],
      ['Couper', 'Jouer un atout sur une couleur qu\'on n\'a pas.'],
      ['Fit', 'Au moins 8 cartes de la même couleur à deux.'],
      ['Manche', '100 points sous la ligne : par exemple 3SA, 4♥, 4♠, 5♣ ou 5♦ réussis.'],
      ['Chelem', 'Petit chelem : 12 levées (niveau 6). Grand chelem : 13 levées (niveau 7).'],
      ['Vulnérable', 'Un camp qui a déjà gagné une manche : primes et pénalités plus fortes.'],
      ['Contre / Surcontre', 'Double ou quadruple les points du contrat (et des chutes).'],
      ['Barrage', 'Ouverture haute avec une longue couleur et peu de points, pour gêner les adversaires.'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Référence'),
      el('h3', {}, 'Points d\'honneurs'), el('p', {}, 'As 4 · roi 3 · dame 2 · valet 1 (40 points au total). Longueur : +1 par carte au-delà de la 4e.'),
      el('h3', {}, 'Ordre des dénominations'), el('p', {}, '♣ < ♦ < ♥ < ♠ < SA. Niveau = plis à faire au-dessus de 6.'),
      el('h3', {}, 'Ouvertures du coach'),
      el('table', { class: 't' }, [['12+ points, majeure de 5 cartes', '1♥ / 1♠'], ['12+ points, sans majeure cinquième', '1♣ / 1♦ (la plus longue)'], ['Équilibrée 15–17', '1SA'], ['Équilibrée 20–21', '2SA'], ['6 cartes, 5–10 points', '2♦ / 2♥ / 2♠ (faible)'], ['7 cartes, peu de points', '3 dans la couleur (barrage)']].map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Marque (rubber, sans honneurs)'),
      el('p', {}, 'Levées : ♣♦ 20 · ♥♠ 30 · SA 40 puis 30. Manche à 100 points sous la ligne. Rubber : +700 (2–0) ou +500 (2–1). Chute : 50 par levée (100 vulnérable). Petit chelem 500/750, grand chelem 1000/1500. Contrat contré réussi : +50.'),
      el('h3', {}, 'Lexique'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Simplifications de cette version'),
      el('ul', {}, ['Bridge de rubber seulement (pas de duplicate), sans la prime des honneurs.', 'Les bots enchérissent « naturellement » : pas de Stayman, de Blackwood, de transferts ni de conventions ; le chelem n\'est enchéri que dans quelques cas simples.', 'Les bots ne contrent que pour demander une couleur (contre d\'appel), jamais pour punir.', 'Le jeu de la carte des bots est classique mais simple : pas de squeeze, d\'impasse calculée ni de signaux.'].map(t => el('li', {}, t)))));
  }

  Br.BridgeScreens = Object.assign(Br.BridgeScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
})(window.Bridge = window.Bridge || {});
