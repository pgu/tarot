/* La Belote : leçons, entraînement, référence (en français). */
(function (B) {
  'use strict';
  const { el, cardEl } = B;
  const drillBox = key => { const b = el('div', {}); B.Drills[key].fn(b); return b; };
  const ex = (title, cards) => el('div', { class: 'slot' }, el('div', { class: 'cards-row mini', style: 'justify-content:center' }, B.ids(cards).map(c => cardEl(c))), title);

  const LESSONS = [
    {
      title: 'Le principe du jeu',
      body: () => el('div', { html: `
        <p>La <strong>Belote</strong> est le jeu de cartes le plus populaire de France. On y joue à <strong>4 joueurs</strong>, en <strong>2 équipes de 2</strong> : vous et votre partenaire (assis en face de vous) contre les deux adversaires.</p>
        <ul>
          <li>On utilise un jeu de <strong>32 cartes</strong> (du 7 à l'as). Chacun reçoit <strong>8 cartes</strong>.</li>
          <li>Une couleur devient l'<strong>atout</strong> : ses cartes battent toutes les autres. Un joueur la « prend » : c'est le <strong>preneur</strong>.</li>
          <li>On joue <strong>8 plis</strong>. À chaque pli, chacun pose une carte ; la meilleure l'emporte.</li>
          <li>Les cartes gagnées valent des points : il y en a <strong>152</strong>, plus <strong>10 de der</strong> (le dernier pli) : <strong>162 points</strong> par donne.</li>
          <li>Le preneur doit faire <strong>au moins 82 points</strong> avec son partenaire, sinon il est « <strong>dedans</strong> » et ses adversaires marquent tout.</li>
        </ul>
        <p>Le jeu tourne <strong>dans le sens inverse des aiguilles d'une montre</strong>. Le joueur après le donneur commence.</p>
        <div class="note">La clé du jeu : <strong>choisir le bon atout</strong> et <strong>bien jouer avec son partenaire</strong>, sans pouvoir lui parler.</div>` }),
    },
    {
      title: 'Les cartes et leur valeur',
      body: () => {
        const d = el('div', { html: `
          <p>La valeur d'une carte dépend de l'<strong>atout</strong>. Dans la couleur d'atout, l'ordre change complètement :</p>
          <table class="t"><tr><th>Carte</th><th>Valet</th><th>9</th><th>As</th><th>10</th><th>Roi</th><th>Dame</th><th>8</th><th>7</th></tr>
            <tr><td><strong>Atout</strong> (du plus fort au plus faible)</td><td>20</td><td>14</td><td>11</td><td>10</td><td>4</td><td>3</td><td>0</td><td>0</td></tr></table>
          <table class="t"><tr><th>Carte</th><th>As</th><th>10</th><th>Roi</th><th>Dame</th><th>Valet</th><th>9</th><th>8</th><th>7</th></tr>
            <tr><td><strong>Hors atout</strong> (du plus fort au plus faible)</td><td>11</td><td>10</td><td>4</td><td>3</td><td>2</td><td>0</td><td>0</td><td>0</td></tr></table>
          <p>Le <strong>valet d'atout</strong> est la plus forte carte du jeu (20 points), suivi du <strong>9 d'atout</strong> (14 points). Total d'une donne : 62 (atout) + 3 × 30 (autres couleurs) = <strong>152 points</strong>, plus 10 de der.</p>
          <p>Entraînez-vous à compter (ici l'atout est tiré au hasard) :</p>` });
        d.append(drillBox('count'));
        return d;
      },
    },
    {
      title: 'Les enchères : prendre l\'atout',
      body: () => {
        const d = el('div', { html: `
          <p>Chaque joueur reçoit d'abord <strong>5 cartes</strong>, puis le donneur <strong>retourne une carte</strong> : la <strong>retourne</strong>. Elle propose l'atout.</p>
          <ol>
            <li><strong>Premier tour</strong> : en commençant par le joueur après le donneur, chacun peut <strong>prendre</strong> à la couleur de la retourne, ou <strong>passer</strong>.</li>
            <li>Si personne ne prend, <strong>second tour</strong> : chacun peut prendre en <strong>choisissant une autre couleur</strong> (pas celle de la retourne), ou passer.</li>
            <li>Si tout le monde passe encore, on <strong>redonne</strong> (le donneur change).</li>
          </ol>
          <p>Le preneur reçoit <strong>la retourne</strong> et 2 cartes de plus ; les autres joueurs reçoivent 3 cartes. Tout le monde a alors 8 cartes.</p>
          <h3>Quand prendre ?</h3>
          <ul>
            <li>Le <strong>valet</strong> et le <strong>9</strong> d'atout sont les deux atouts maîtres : avec les deux, prenez presque toujours.</li>
            <li>Avec la retourne, comptez-vous <strong>3 atouts ou plus</strong> dont une grosse carte ? Prenez.</li>
            <li>Les <strong>as</strong> hors atout rapportent des plis sûrs.</li>
            <li>Roi + dame d'atout vous donnent la <strong>belote-rebelote</strong> (+20).</li>
            <li>Au second tour, il faut moins : on veut éviter de redonner.</li>
          </ul>
          <p>Entraînez-vous :</p>` });
        d.append(drillBox('take'));
        return d;
      },
    },
    {
      title: 'Jouer un pli',
      body: () => {
        const d = el('div', { html: `
          <p>Le joueur après le donneur <strong>entame</strong>, puis le <strong>gagnant d'un pli entame le suivant</strong>. À son tour, on doit respecter, dans cet ordre :</p>
          <ol>
            <li><strong>Fournir</strong> : si vous avez la couleur demandée, vous devez en jouer une.</li>
            <li>Si on a demandé <strong>de l'atout</strong>, vous devez <strong>monter</strong> (jouer un atout plus fort que le meilleur déjà posé) si vous le pouvez ; sinon, vous jouez un atout quelconque.</li>
            <li>Si vous <strong>ne pouvez pas fournir</strong> : vous devez <strong>couper</strong> avec un atout — <em>sauf si votre partenaire est maître du pli</em> (il gagne actuellement), auquel cas vous jouez ce que vous voulez.</li>
            <li>Si un adversaire a déjà coupé, vous devez <strong>surcouper</strong> si possible ; sinon, vous jouez quand même un atout.</li>
            <li>Si vous n'avez ni la couleur ni atout, vous vous <strong>défaussez</strong> : n'importe quelle carte.</li>
          </ol>
          <p>Le pli est gagné par l'<strong>atout le plus fort</strong> s'il y en a, sinon par la <strong>plus forte carte de la couleur demandée</strong>.</p>` });
        d.append(el('h3', {}, 'Entraînez-vous'), drillBox('legal'), el('h3', {}, 'Qui gagne ?'), drillBox('winner'));
        return d;
      },
    },
    {
      title: 'Belote-rebelote, dix de der, capot',
      body: () => el('div', { html: `
        <ul>
          <li><strong>Belote-rebelote</strong> : si vous avez le <strong>roi et la dame d'atout</strong>, vous annoncez « <strong>belote</strong> » en jouant la première et « <strong>rebelote</strong> » en jouant la seconde : <strong>+20 points</strong> pour votre équipe, quoi qu'il arrive. Il faut jouer les deux.</li>
          <li><strong>Dix de der</strong> : l'équipe qui gagne le <strong>dernier pli</strong> marque <strong>10 points</strong> de plus.</li>
          <li><strong>Capot</strong> : une équipe qui gagne <strong>les 8 plis</strong> marque <strong>90 points</strong> de bonus (soit 252 points au total pour la donne).</li>
        </ul>
        <div class="note">Ces primes comptent dans les points de l'équipe. La belote reste acquise même si le preneur est dedans.</div>` }),
    },
    {
      title: 'Compter une donne',
      body: () => el('div', { html: `
        <p>Quand les 8 plis sont joués, chaque équipe compte les points de ses cartes (+10 de der, +20 de belote éventuelle).</p>
        <ul>
          <li>Si le <strong>preneur</strong> a fait <strong>82 points ou plus</strong> (belote comprise), il <strong>fait son contrat</strong> : chaque équipe marque ses points.</li>
          <li>Sinon, il est <strong>dedans</strong> : ses adversaires marquent <strong>162 points</strong> (252 en cas de capot) et le preneur ne garde que sa belote.</li>
          <li>Le <strong>capot</strong> compte 252 points pour l'équipe qui gagne tous les plis.</li>
        </ul>
        <div class="note"><strong>Exemple.</strong> Le preneur et son partenaire ont ramassé 95 points ; leurs adversaires 67 (dont les 10 de der). 95 ≥ 82 : contrat rempli, ils marquent 95 contre 67. S'ils n'avaient fait que 78 : <em>dedans</em> ! Leurs adversaires marqueraient 162 points.</div>
        <p>La partie se joue en <strong>1000 points</strong> (réglable dans l'écran Jouer). Dans ce jeu, les points ne sont pas arrondis à la dizaine.</p>` }),
    },
    {
      title: 'Premiers conseils',
      body: () => el('div', { html: `
        <h3>Si vous prenez</h3>
        <ul>
          <li>Jouez d'abord <strong>le valet d'atout</strong> (puis le 9) pour faire tomber les atouts adverses : une fois qu'ils n'en ont plus, vos autres cartes gagnent.</li>
          <li>Jouez ensuite vos <strong>as</strong> hors atout.</li>
        </ul>
        <h3>En défense</h3>
        <ul>
          <li>Faites tomber les <strong>as</strong> de vos adversaires et gardez vos points : on ne peut pas poser un 10 sur un pli que l'ennemi risque de remporter.</li>
          <li><strong>Coupez</strong> quand l'adversaire entame un as.</li>
        </ul>
        <h3>Avec votre partenaire</h3>
        <ul>
          <li>Quand il est <strong>maître du pli</strong>, <strong>chargez-le</strong> : donnez-lui votre carte la plus riche (un as, un 10).</li>
          <li>Quand il n'est pas sûr de gagner, jouez <strong>petit</strong>.</li>
        </ul>
        <p>À vous de jouer : <a href="#/belote/play">lancez une partie</a> avec le coach.</p>` }),
    },
  ];

  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/belote/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/belote/learn/${idx}` }, '← ' + LESSONS[idx - 1].title) : el('span'),
      idx < LESSONS.length - 1 ? el('a', { class: 'btn primary', href: `#/belote/learn/${idx + 2}` }, LESSONS[idx + 1].title + ' →')
        : el('a', { class: 'btn primary', href: '#/belote/play' }, 'Jouer une partie →'));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title}`), lesson.body(), pager)));
  }

  function practiceScreen(root, params) {
    const keys = Object.keys(B.Drills);
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Exercices'),
      el('div', { class: 'btn-row' }, keys.map(k => el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/belote/practice/${k}` }, B.Drills[k].title))), box));
    B.Drills[cur].fn(box);
  }

  function referenceScreen(root) {
    const gloss = [
      ['Atout', 'La couleur qui bat toutes les autres. Dans cette couleur, le valet et le 9 sont les plus forts.'],
      ['Retourne', 'La carte retournée après la distribution des 5 premières cartes : elle propose l\'atout.'],
      ['Prendre', 'Choisir l\'atout et s\'engager à faire au moins 82 points avec son partenaire.'],
      ['Preneur', 'Le joueur qui a pris. Il reçoit la retourne.'],
      ['Fournir', 'Jouer une carte de la couleur demandée.'],
      ['Couper', 'Jouer un atout parce qu\'on n\'a pas la couleur demandée.'],
      ['Surcouper', 'Couper avec un atout plus fort que celui d\'un adversaire déjà posé.'],
      ['Monter', 'Jouer un atout plus fort que le meilleur atout déjà posé.'],
      ['Maître', 'Qui est sûr de gagner le pli (ou le pli en cours) avec sa carte.'],
      ['Se défausser', 'Jouer une carte sans intérêt quand on n\'a ni la couleur ni atout (ou qu\'on n\'est pas obligé de couper).'],
      ['Belote-rebelote', 'Roi + dame d\'atout dans la même main : +20 points.'],
      ['Dix de der', '10 points pour le dernier pli.'],
      ['Capot', 'Gagner les 8 plis : +90 points.'],
      ['Dedans', 'Le preneur n\'a pas fait ses 82 points : ses adversaires marquent 162.'],
      ['Litige', 'Variante : à 81-81, les points du preneur sont mis de côté pour la donne suivante (non utilisée ici).'],
    ];
    root.append(el('div', { class: 'panel' }, el('h2', {}, 'Référence'),
      el('h3', {}, 'Les 32 cartes'), B.deckGuide(),
      el('h3', {}, 'Valeur des cartes'),
      el('table', { class: 't' }, el('tr', {}, el('th', {}, ''), ...['Valet', '9', 'As', '10', 'Roi', 'Dame', '8', '7'].map(x => el('th', {}, x))),
        el('tr', {}, el('th', {}, 'Atout'), ...[20, 14, 11, 10, 4, 3, 0, 0].map(x => el('td', {}, x))),
        el('tr', {}, el('th', {}, 'Hors atout'), ...[2, 0, 11, 10, 4, 3, 0, 0].map(x => el('td', {}, x)))),
      el('p', { class: 'muted' }, 'Ordre atout : valet > 9 > as > 10 > roi > dame > 8 > 7. Ordre hors atout : as > 10 > roi > dame > valet > 9 > 8 > 7.'),
      el('p', {}, el('strong', {}, 'Total : '), '152 points + 10 de der = 162 · preneur : 82 points minimum · capot : +90 · belote-rebelote : +20.'),
      el('h3', {}, 'Lexique'), el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, 'Variantes non implémentées'),
      el('ul', {}, ['La belote contrée (enchères en points, contre et surcontre).', 'La belote coinchée et ses annonces (tierce, cinquante, cent, carré).'].map(t => el('li', {}, t))),
      el('h3', {}, 'Simplifications de cette version'),
      el('ul', {}, ['Belote classique à 4 joueurs (vous + un partenaire bot contre 2 bots), jeu dans le sens inverse des aiguilles d\'une montre.', 'Les points ne sont pas arrondis à la dizaine. À 81-81 (litige), le preneur est simplement « dedans ».', 'La belote est annoncée automatiquement ; elle compte pour le preneur dans le total des 82 points.', 'Si tout le monde passe aux deux tours, on redonne.'].map(t => el('li', {}, t)))));
  }

  B.BeloteScreens = Object.assign(B.BeloteScreens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
})(window.Belote = window.Belote || {});
