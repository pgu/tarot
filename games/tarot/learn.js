/* Tutorial lessons + Practice screen + Reference screen (English / French). */
(function (T) {
  'use strict';
  const { el, cardEl, fmt } = T;
  const tr = window.Core.t;

  // Titles and bodies are functions: they are evaluated at render time so they follow the language.
  const LESSONS = [
    {
      title: () => tr('The big picture', 'Vue d\'ensemble'),
      body: () => el('div', { html: tr(`
        <p>This site teaches <strong>French Tarot</strong> (<em>Tarot français</em>), the card game played with a 78-card tarot deck.
        It is a <strong>trick-taking game</strong>, a bit like Bridge or Hearts. Here we use the classic <strong>4-player</strong> version.</p>
        <ul>
          <li>Each player gets <strong>18 cards</strong>. 6 cards are put aside face-down: the <strong>dog</strong> (<em>chien</em>).</li>
          <li>Players <strong>bid</strong>: who is confident enough to play alone against the other three?</li>
          <li>The winner of the bidding is the <strong>taker</strong> (<em>preneur</em>). They play <strong>alone</strong> against 3 <strong>defenders</strong> who team up.</li>
          <li>The deal is played in <strong>18 tricks</strong>. In each trick every player plays one card; the best card wins it.</li>
          <li>Won cards are worth points. The taker must collect <strong>enough points</strong> to fulfil their contract.</li>
        </ul>
        <div class="note">Don't worry about memorising everything. The next lessons go one step at a time, with small exercises, and in the <a href="#/tarot/play">Play</a> mode a coach can highlight legal cards and suggest moves.</div>`, `
        <p>Ce site vous enseigne le <strong>Tarot français</strong>, le jeu de cartes qui se joue avec un jeu de tarot de 78 cartes.
        C'est un <strong>jeu de levées</strong> (de plis), un peu comme le Bridge ou la Belote. Nous utilisons ici la version classique <strong>à 4 joueurs</strong>.</p>
        <ul>
          <li>Chaque joueur reçoit <strong>18 cartes</strong>. 6 cartes sont mises de côté face cachée : le <strong>chien</strong>.</li>
          <li>Les joueurs <strong>enchérissent</strong> : qui est assez sûr de lui pour jouer seul contre les trois autres ?</li>
          <li>Le gagnant des enchères est le <strong>preneur</strong>. Il joue <strong>seul</strong> contre les 3 <strong>défenseurs</strong>, qui font équipe.</li>
          <li>La donne se joue en <strong>18 plis</strong>. À chaque pli, chaque joueur pose une carte ; la meilleure carte remporte le pli.</li>
          <li>Les cartes gagnées valent des points. Le preneur doit récolter <strong>assez de points</strong> pour remplir son contrat.</li>
        </ul>
        <div class="note">Pas d'inquiétude : inutile de tout retenir d'un coup. Les leçons suivantes avancent pas à pas, avec de petits exercices, et dans le mode <a href="#/tarot/play">Jouer</a> un coach peut surligner les cartes jouables et suggérer des coups.</div>`) }),
    },
    {
      title: () => tr('The 78 cards', 'Les 78 cartes'),
      body: () => {
        const d = el('div', {});
        d.append(el('div', { html: tr(`
          <p>The deck has three kinds of cards:</p>
          <ul>
            <li><strong>4 suits</strong> (♠ ♥ ♣ ♦) of 14 cards each: 1 to 10, then <strong>J</strong>ack (<em>Valet</em>), Knight (<em>Cavalier</em>, shown as <strong>C</strong>), <strong>Q</strong>ueen (<em>Dame</em>) and <strong>K</strong>ing (<em>Roi</em>). The King is the highest.</li>
            <li><strong>21 trumps</strong> (<em>atouts</em>), numbered 1 to 21. Higher beats lower. Trumps beat all suit cards.</li>
            <li><strong>The Excuse</strong> (<em>l'Excuse</em>, the Fool): a special card that never wins a trick but lets you skip following suit.</li>
          </ul>
          <p>Cards with a <span class="tag">gold ring</span> are the three <strong>oudlers</strong> (<em>bouts</em>): trump 1 (the <em>Petit</em>), trump 21 (the <em>Monde</em>) and the Excuse. They are the most important cards in the game.</p>`, `
          <p>Le jeu comporte trois sortes de cartes :</p>
          <ul>
            <li><strong>4 couleurs</strong> (♠ ♥ ♣ ♦) de 14 cartes chacune : de l'as (1) au 10, puis le <strong>valet</strong> (V), le <strong>cavalier</strong> (C), la <strong>dame</strong> (D) et le <strong>roi</strong> (R). Le roi est la plus forte carte de la couleur.</li>
            <li><strong>21 atouts</strong>, numérotés de 1 à 21. Le plus haut l'emporte sur le plus bas. Les atouts battent toutes les cartes des couleurs.</li>
            <li><strong>L'Excuse</strong> : une carte à part, qui ne gagne jamais un pli mais qui vous dispense de fournir à la couleur demandée.</li>
          </ul>
          <p>Les cartes cerclées d'<span class="tag">or</span> sont les trois <strong>bouts</strong> : le 1 d'atout (le <em>Petit</em>), le 21 d'atout (le <em>Monde</em>) et l'Excuse. Ce sont les cartes les plus importantes du jeu.</p>`) }));
        d.append(T.deckGuide());
        return d;
      },
    },
    {
      title: () => tr('Points & contracts', 'Points et contrats'),
      body: () => {
        const d = el('div', { html: tr(`
          <p>Only some cards carry points. Total in the deck: <strong>91 points</strong>.</p>
          <table class="t"><tr><th>Card</th><th>Points</th></tr>
            <tr><td>King</td><td>4.5</td></tr><tr><td>Queen</td><td>3.5</td></tr>
            <tr><td>Knight (Cavalier)</td><td>2.5</td></tr><tr><td>Jack (Valet)</td><td>1.5</td></tr>
            <tr><td>Each oudler (Excuse, Petit, 21)</td><td>4.5</td></tr>
            <tr><td>Every other card</td><td>0.5</td></tr></table>
          <p>The more oudlers the taker holds at the end, the fewer points they need:</p>
          <table class="t"><tr><th>Oudlers</th><th>0</th><th>1</th><th>2</th><th>3</th></tr>
            <tr><td>Points needed</td><td>56</td><td>51</td><td>41</td><td>36</td></tr></table>
          <p>If the taker reaches the target, they <strong>win the contract</strong>. Otherwise they lose it. Let's practise counting:</p>`, `
          <p>Seules certaines cartes rapportent des points. Total dans le jeu : <strong>91 points</strong>.</p>
          <table class="t"><tr><th>Carte</th><th>Points</th></tr>
            <tr><td>Roi</td><td>4,5</td></tr><tr><td>Dame</td><td>3,5</td></tr>
            <tr><td>Cavalier</td><td>2,5</td></tr><tr><td>Valet</td><td>1,5</td></tr>
            <tr><td>Chaque bout (Excuse, Petit, 21)</td><td>4,5</td></tr>
            <tr><td>Toutes les autres cartes</td><td>0,5</td></tr></table>
          <p>Plus le preneur détient de bouts à la fin, moins il a besoin de points :</p>
          <table class="t"><tr><th>Bouts</th><th>0</th><th>1</th><th>2</th><th>3</th></tr>
            <tr><td>Points à faire</td><td>56</td><td>51</td><td>41</td><td>36</td></tr></table>
          <p>Si le preneur atteint son objectif, il <strong>remplit son contrat</strong>. Sinon, il le chute. Entraînons-nous à compter :</p>`) });
        const box = el('div', {});
        T.Drills.count.fn(box);
        d.append(box);
        return d;
      },
    },
    {
      title: () => tr('Bidding', 'Les enchères'),
      body: () => {
        const d = el('div', { html: tr(`
          <p>Starting with the player right after the dealer, each player speaks <strong>once</strong>: either <strong>pass</strong> or make a bid higher than the previous one.
          The highest bid wins and that player becomes the taker. If everybody passes, the cards are re-dealt.</p>
          <table class="t"><tr><th>Bid</th><th>Multiplier</th><th>The dog…</th></tr>
            <tr><td><strong>Petite</strong> (small)</td><td>×1</td><td>shown to all; the taker adds it to their hand and discards 6 cards</td></tr>
            <tr><td><strong>Garde</strong> (guard)</td><td>×2</td><td>same as Petite</td></tr>
            <tr><td><strong>Garde Sans</strong> (without)</td><td>×4</td><td>not used; its points count for the taker</td></tr>
            <tr><td><strong>Garde Contre</strong> (against)</td><td>×6</td><td>not used; its points count for the defenders</td></tr></table>
          <p>The multiplier scales your score: a bigger risk means a bigger reward (or penalty).</p>
          <h3>What makes a good hand?</h3>
          <ul>
            <li><strong>Trumps</strong>: 6 or more is a good sign, 8+ is strong. They also protect your kings.</li>
            <li><strong>Oudlers</strong>: each one lowers the target. The Petit alone with few trumps is fragile though.</li>
            <li><strong>Kings</strong> (and Queens): points that usually come home.</li>
            <li><strong>High trumps</strong> (15–21) win late tricks.</li>
            <li><strong>Voids</strong>: having no card in a suit lets you cut it with a trump.</li>
          </ul>
          <p>Try a few hands. The coach gives you the reasoning after each guess:</p>`, `
          <p>En commençant par le joueur situé juste après le donneur, chacun parle <strong>une seule fois</strong> : soit il <strong>passe</strong>, soit il annonce un contrat plus élevé que le précédent.
          La plus haute enchère l'emporte et ce joueur devient le preneur. Si tout le monde passe, on redistribue les cartes.</p>
          <table class="t"><tr><th>Contrat</th><th>Multiplicateur</th><th>Le chien…</th></tr>
            <tr><td><strong>Petite</strong></td><td>×1</td><td>montré à tous ; le preneur le prend dans sa main et fait un écart de 6 cartes</td></tr>
            <tr><td><strong>Garde</strong></td><td>×2</td><td>comme la Petite</td></tr>
            <tr><td><strong>Garde sans</strong> le chien</td><td>×4</td><td>non utilisé ; ses points comptent pour le preneur</td></tr>
            <tr><td><strong>Garde contre</strong> le chien</td><td>×6</td><td>non utilisé ; ses points comptent pour les défenseurs</td></tr></table>
          <p>Le multiplicateur amplifie votre score : plus le risque est grand, plus la récompense (ou la pénalité) l'est aussi.</p>
          <h3>Qu'est-ce qu'une bonne main ?</h3>
          <ul>
            <li><strong>Les atouts</strong> : 6 ou plus, c'est bon signe, 8 et plus, c'est solide. Ils protègent aussi vos rois.</li>
            <li><strong>Les bouts</strong> : chacun diminue l'objectif. Le Petit seul avec peu d'atouts est toutefois fragile.</li>
            <li><strong>Les rois</strong> (et les dames) : des points qui rentrent le plus souvent.</li>
            <li><strong>Les gros atouts</strong> (15 à 21) gagnent les derniers plis.</li>
            <li><strong>Les coupes</strong> : n'avoir aucune carte dans une couleur permet de la couper avec un atout.</li>
          </ul>
          <p>Essayez quelques mains. Le coach vous donne son raisonnement après chaque réponse :</p>`) });
        const box = el('div', {});
        T.Drills.bid.fn(box);
        d.append(box);
        return d;
      },
    },
    {
      title: () => tr('The dog', 'Le chien'),
      body: () => el('div', { html: tr(`
        <p>After a <strong>Petite</strong> or <strong>Garde</strong>, the 6 dog cards are turned face up. The taker adds them to their hand (24 cards), then <strong>discards 6 cards</strong> face down. These discards count as part of the taker's points at the end.</p>
        <p>Discard rules:</p>
        <ul>
          <li>You may <strong>never</strong> discard an oudler or a King.</li>
          <li>You may discard a trump <strong>only</strong> if you cannot find 6 other cards. The defenders then see which trumps you discarded.</li>
        </ul>
        <p><strong>Strategy tip:</strong> discard low cards of your shortest suits. If you empty a suit completely (a <em>void</em>), you can trump it later. In the Play mode, the coach can suggest your discards.</p>
        <p>With <strong>Garde Sans</strong> or <strong>Garde Contre</strong>, nobody looks at the dog during the game.</p>`, `
        <p>Après une <strong>Petite</strong> ou une <strong>Garde</strong>, les 6 cartes du chien sont retournées. Le preneur les ajoute à sa main (24 cartes), puis fait un <strong>écart de 6 cartes</strong> face cachée. Ces cartes écartées comptent dans les points du preneur à la fin de la donne.</p>
        <p>Règles de l'écart :</p>
        <ul>
          <li>On n'écarte <strong>jamais</strong> un bout ni un roi.</li>
          <li>On ne peut écarter un atout que si l'on ne trouve pas 6 autres cartes à écarter. Les défenseurs voient alors quels atouts vous avez écartés.</li>
        </ul>
        <p><strong>Conseil de stratégie :</strong> écartez de petites cartes de vos couleurs les plus courtes. Si vous faites une couleur entière (une <em>coupe</em>), vous pourrez la couper plus tard avec un atout. En mode Jouer, le coach peut vous suggérer votre écart.</p>
        <p>À la <strong>Garde sans</strong> ou à la <strong>Garde contre</strong>, personne ne regarde le chien pendant la partie.</p>`) }),
    },
    {
      title: () => tr('Playing a trick', 'Jouer un pli'),
      body: () => {
        const d = el('div', { html: tr(`
          <p>The player after the dealer leads the first trick, then the <strong>winner of each trick leads the next</strong>. Play goes counter-clockwise.</p>
          <p>When you play to a trick you have to respect, in this order:</p>
          <ol>
            <li><strong>Follow suit</strong>: if you have a card of the suit led, you must play one.</li>
            <li>If you can't follow, you <strong>must trump</strong> (play a trump).</li>
            <li>If a trump is already in the trick, you must play a <strong>higher trump</strong> if you can. If not, any trump.</li>
            <li>If you have no trump either, play <strong>any card</strong> (this is called discarding).</li>
            <li>When <strong>trump</strong> is led, the same logic applies: you must go higher if you can.</li>
          </ol>
          <p>The <strong>Excuse</strong> is always playable, whatever the rules say.</p>
          <p>The trick is won by the <strong>highest trump</strong> if there is one, otherwise by the <strong>highest card of the suit led</strong>.</p>
          <p>Practise the "which cards are legal?" rule until it feels natural:</p>`, `
          <p>Le joueur qui suit le donneur fait l'<strong>entame</strong> du premier pli, puis le <strong>gagnant de chaque pli entame le suivant</strong>. Le jeu tourne dans le sens inverse des aiguilles d'une montre.</p>
          <p>Quand vous jouez sur un pli, vous devez respecter, dans cet ordre :</p>
          <ol>
            <li><strong>Fournir</strong> : si vous avez une carte de la couleur demandée, vous devez en jouer une.</li>
            <li>Si vous ne pouvez pas fournir, vous devez <strong>couper</strong> (jouer un atout).</li>
            <li>Si un atout est déjà dans le pli, vous devez <strong>surcouper</strong> (jouer un atout plus fort) si vous le pouvez. Sinon, n'importe quel atout.</li>
            <li>Si vous n'avez pas d'atout non plus, jouez <strong>n'importe quelle carte</strong> (c'est ce qu'on appelle se défausser).</li>
            <li>Quand on entame à l'<strong>atout</strong>, le même principe s'applique : vous devez monter si vous le pouvez.</li>
          </ol>
          <p>L'<strong>Excuse</strong> peut toujours être jouée, quelles que soient les règles.</p>
          <p>Le pli est remporté par le <strong>plus fort atout</strong> s'il y en a un, sinon par la <strong>plus forte carte de la couleur demandée</strong>.</p>
          <p>Entraînez-vous à la règle « quelles cartes peut-on jouer ? » jusqu'à ce qu'elle devienne naturelle :</p>`) });
        const a = el('div', {}); T.Drills.legal.fn(a);
        const b = el('div', {}); T.Drills.winner.fn(b);
        d.append(a, el('p', {}, tr('Now, who wins?', 'Et maintenant, qui remporte le pli ?')), b);
        return d;
      },
    },
    {
      title: () => tr('The Excuse', 'L\'Excuse'),
      body: () => el('div', { html: tr(`
        <p>The Excuse is the odd one out:</p>
        <ul>
          <li>It <strong>never wins</strong> a trick, and never loses its value: the player who played it <strong>keeps it</strong> in their camp (the camp hands over a 0.5-point card in exchange).</li>
          <li>If you <strong>lead</strong> it, the next card played decides the suit of the trick.</li>
          <li>It saves you from being forced to follow suit or to trump. A classic use is to avoid giving away a valuable card.</li>
          <li><strong>Special case:</strong> if you play it in the very last trick, it goes to whoever wins that trick.</li>
        </ul>
        <p>Because it's an oudler, losing it is costly: never keep it too long hoping for a perfect moment!</p>`, `
        <p>L'Excuse est une carte à part :</p>
        <ul>
          <li>Elle ne <strong>gagne jamais</strong> un pli, mais ne perd jamais sa valeur : le joueur qui l'a jouée la <strong>garde</strong> dans son camp (le camp donne en échange une carte de 0,5 point).</li>
          <li>Si vous l'<strong>entamez</strong>, c'est la carte suivante qui détermine la couleur du pli.</li>
          <li>Elle vous évite d'avoir à fournir ou à couper. Un usage classique : ne pas donner une carte de valeur.</li>
          <li><strong>Cas particulier :</strong> si on la joue au tout dernier pli, elle revient à celui qui remporte ce pli.</li>
        </ul>
        <p>Comme c'est un bout, la perdre coûte cher : ne la gardez pas trop longtemps en attendant le moment parfait !</p>`) }),
    },
    {
      title: () => tr('Scoring a deal', 'Compter une donne'),
      body: () => {
        const name = 'Garde', pts = 47, mult = 2;
        const need = 41, diff = pts - need, base = 25 + diff, per = base * mult;
        return el('div', { html: tr(`
          <p>When all 18 tricks are played, each camp counts the points of the cards they won (the taker includes the dog discards).</p>
          <ol>
            <li>Count the taker's <strong>oudlers</strong> to find the points needed.</li>
            <li>Compute the <strong>difference</strong> between the points made and the points needed (rounded up to a whole number).</li>
            <li>Score = (<strong>25 + difference</strong>) × contract multiplier. It's positive if the taker made the contract, negative if not.</li>
            <li>The taker scores it <strong>three times</strong> (once for each defender). Each defender scores the opposite once. The deal is therefore zero-sum.</li>
          </ol>
          <div class="note"><strong>Example.</strong> The taker bid a <strong>${name}</strong> (×${mult}), finished with <strong>2 oudlers</strong> (needs ${need}) and collected <strong>${pts}</strong> points.
            Difference: ${pts} − ${need} = <strong>+${diff}</strong>. Score: (25 + ${diff}) × ${mult} = <strong>${per}</strong>.
            The taker gets <strong>+${per * 3}</strong>, each defender gets <strong>−${per}</strong>.</div>
          <p><strong>Petit au bout</strong> (“Petit at the end”): if the Petit (trump 1) is played in the <em>last</em> trick and its camp wins that trick, that camp gets a bonus of <strong>10 points × the multiplier</strong>. Risky but rewarding: protect your Petit until the very end!</p>
          <p class="muted">Not in this first version: <em>Poignée</em> (announcing a big trump hand), <em>Chelem</em> (winning all tricks), 3- and 5-player variants.</p>`, `
          <p>Quand les 18 plis sont joués, chaque camp compte les points des cartes qu'il a remportées (le preneur y ajoute les cartes de l'écart).</p>
          <ol>
            <li>Comptez les <strong>bouts</strong> du preneur pour connaître le nombre de points à faire.</li>
            <li>Calculez la <strong>différence</strong> entre les points réalisés et les points à faire (arrondie à l'entier supérieur).</li>
            <li>Score = (<strong>25 + différence</strong>) × multiplicateur du contrat. Il est positif si le preneur a réussi son contrat, négatif sinon.</li>
            <li>Le preneur marque ce score <strong>trois fois</strong> (une fois par défenseur). Chaque défenseur marque l'opposé une fois. La donne est donc à somme nulle.</li>
          </ol>
          <div class="note"><strong>Exemple.</strong> Le preneur a annoncé une <strong>${name}</strong> (×${mult}), a fini avec <strong>2 bouts</strong> (il fallait ${need} points) et a récolté <strong>${pts}</strong> points.
            Différence : ${pts} − ${need} = <strong>+${diff}</strong>. Score : (25 + ${diff}) × ${mult} = <strong>${per}</strong>.
            Le preneur marque <strong>+${per * 3}</strong>, chaque défenseur marque <strong>−${per}</strong>.</div>
          <p><strong>Petit au bout</strong> : si le Petit (1 d'atout) est joué au <em>dernier</em> pli et que son camp remporte ce pli, ce camp reçoit une prime de <strong>10 points × le multiplicateur</strong>. Risqué mais rémunérateur : protégez votre Petit jusqu'à la toute fin !</p>
          <p class="muted">Pas dans cette première version : la <em>poignée</em> (annoncer une grosse main d'atouts), le <em>chelem</em> (remporter tous les plis), les variantes à 3 et à 5 joueurs.</p>`) });
      },
    },
    {
      title: () => tr('First strategy tips', 'Premiers conseils de stratégie'),
      body: () => el('div', { html: tr(`
        <h3>As a defender</h3>
        <ul>
          <li>You have <strong>two partners</strong> even though you can't talk. If a partner is winning the trick, <strong>feed it</strong>: give high-value cards when you're sure no one behind you can win.</li>
          <li>The taker's oudlers and kings are your targets. Cut kings with trumps when the taker leads them.</li>
          <li>Try to lead short suits so you become void and can trump.</li>
          <li>Keep the <strong>Petit</strong> for the last trick only if you also hold the right to win it. Otherwise it is easily captured by the 21.</li>
        </ul>
        <h3>As the taker</h3>
        <ul>
          <li>With many trumps, <strong>draw them</strong> early by leading high trumps so the defenders can't cut your kings.</li>
          <li>Cash your kings early, before the defenders become void in the suit.</li>
          <li>Count points: you only need roughly half of the 91 points.</li>
        </ul>
        <h3>Everybody</h3>
        <ul>
          <li>Don't waste high trumps on tricks worth almost nothing.</li>
          <li>When you can't win a trick, give away your <strong>least valuable</strong> card.</li>
          <li>Keep count of which trumps have been played.</li>
        </ul>
        <p>Ready? Head to <a href="#/tarot/play">Play</a> with the learning aids on, or try the <a href="#/tarot/advisor">Hand Advisor</a>.</p>`, `
        <h3>En défense</h3>
        <ul>
          <li>Vous avez <strong>deux partenaires</strong>, même si vous ne pouvez pas parler. Si un partenaire gagne le pli, <strong>chargez-le</strong> : donnez des cartes de valeur quand vous êtes sûr que personne après vous ne peut le remporter.</li>
          <li>Les bouts et les rois du preneur sont vos cibles. Coupez les rois à l'atout quand le preneur les joue.</li>
          <li>Essayez d'entamer vos couleurs courtes pour devenir sec (sans carte dans la couleur) et pouvoir couper.</li>
          <li>Ne gardez le <strong>Petit</strong> pour le dernier pli que si vous avez aussi de quoi le remporter. Sinon il se fait facilement prendre par le 21.</li>
        </ul>
        <h3>En tant que preneur</h3>
        <ul>
          <li>Avec beaucoup d'atouts, <strong>tirez-les</strong> tôt en jouant de gros atouts, pour que les défenseurs ne puissent pas couper vos rois.</li>
          <li>Encaissez vos rois tôt, avant que les défenseurs ne soient secs dans la couleur.</li>
          <li>Comptez vos points : il vous en faut environ la moitié des 91.</li>
        </ul>
        <h3>Pour tout le monde</h3>
        <ul>
          <li>Ne gaspillez pas de gros atouts sur des plis qui ne valent presque rien.</li>
          <li>Quand vous ne pouvez pas gagner un pli, donnez votre carte la <strong>moins précieuse</strong>.</li>
          <li>Gardez en mémoire les atouts déjà tombés.</li>
        </ul>
        <p>Prêt ? Passez au mode <a href="#/tarot/play">Jouer</a> avec les aides à l'apprentissage activées, ou essayez le <a href="#/tarot/advisor">Conseiller de main</a>.</p>`) }),
    },
  ];

  /* ---------- Learn screen ---------- */
  function learnScreen(root, params) {
    const idx = Math.max(0, Math.min(LESSONS.length - 1, (parseInt(params[0], 10) || 1) - 1));
    const lesson = LESSONS[idx];
    const list = el('ul', { class: 'lesson-list' }, LESSONS.map((l, i) =>
      el('li', {}, el('a', { href: `#/tarot/learn/${i + 1}`, class: i === idx ? 'active' : '' }, `${i + 1}. ${l.title()}`))));
    const pager = el('div', { class: 'pager' },
      idx > 0 ? el('a', { class: 'btn', href: `#/tarot/learn/${idx}` }, '← ' + LESSONS[idx - 1].title()) : el('span'),
      idx < LESSONS.length - 1
        ? el('a', { class: 'btn primary', href: `#/tarot/learn/${idx + 2}` }, LESSONS[idx + 1].title() + ' →')
        : el('a', { class: 'btn primary', href: '#/tarot/play' }, tr('Play a game →', 'Jouer une partie →')));
    root.append(el('div', { class: 'learn' }, el('aside', {}, list),
      el('article', { class: 'panel lesson' }, el('h2', {}, `${idx + 1}. ${lesson.title()}`), lesson.body(), pager)));
  }

  /* ---------- Practice screen ---------- */
  function practiceScreen(root, params) {
    const keys = Object.keys(T.Drills).filter(k => k !== 'evalTable');
    const cur = keys.includes(params[0]) ? params[0] : keys[0];
    const tabs = el('div', { class: 'btn-row' }, keys.map(k =>
      el('a', { class: 'btn' + (k === cur ? ' primary' : ''), href: `#/tarot/practice/${k}` }, T.Drills[k].title)));
    const box = el('div', {});
    root.append(el('div', { class: 'panel' }, el('h2', {}, tr('Practice drills', 'Exercices')),
      el('p', { class: 'muted' }, tr('Short, endless exercises on one skill at a time.', 'Des exercices courts et sans fin, une compétence à la fois.')), tabs, box));
    T.Drills[cur].fn(box);
  }

  /* ---------- Reference screen ---------- */
  function referenceScreen(root) {
    const gloss = tr([
      ['Atout', 'Trump. One of the 21 numbered cards that beat any suit card.'],
      ['Bout / Oudler', 'The 21, the Petit (trump 1) and the Excuse. Each is worth 4.5 points and lowers the taker\'s target.'],
      ['Chien / Dog', 'The 6 cards put aside at the deal.'],
      ['Coupe / Ruff', 'Playing a trump on a suit you cannot follow.'],
      ['Défenseur', 'One of the 3 players opposing the taker.'],
      ['Écart / Discard', 'The 6 cards the taker puts aside after taking the dog.'],
      ['Excuse', 'The Fool. Never wins a trick, always playable.'],
      ['Monde', 'Trump 21, the highest trump.'],
      ['Petit', 'Trump 1, the lowest trump (an oudler).'],
      ['Petit au bout', 'Petit played in the last trick by the camp that wins it: 10 point bonus × multiplier.'],
      ['Poignée', 'Announcing 10+ trumps for a bonus (coming in a later version).'],
      ['Chelem / Slam', 'Winning all 18 tricks (coming in a later version).'],
      ['Preneur / Taker', 'The highest bidder, who plays alone against the 3 defenders.'],
      ['Pli / Trick', 'One card from each player; one winner.'],
      ['Renonce / Void', 'Having no card in a given suit.'],
      ['Surcouper / Overtrump', 'Playing a trump higher than a trump already in the trick.'],
    ], [
      ['Atout', 'Une des 21 cartes numérotées qui battent n\'importe quelle carte de couleur.'],
      ['Bout', 'Le 21, le Petit (1 d\'atout) et l\'Excuse. Chacun vaut 4,5 points et diminue l\'objectif du preneur.'],
      ['Chien', 'Les 6 cartes mises de côté à la donne.'],
      ['Coupe', 'Jouer un atout sur une couleur à laquelle on ne peut pas fournir.'],
      ['Défenseur', 'L\'un des 3 joueurs qui s\'opposent au preneur.'],
      ['Écart', 'Les 6 cartes que le preneur met de côté après avoir pris le chien.'],
      ['Entame', 'La première carte d\'un pli.'],
      ['Excuse', 'Le « fou ». Ne gagne jamais un pli, peut toujours être jouée.'],
      ['Fournir', 'Jouer une carte de la couleur demandée.'],
      ['Monde', 'Le 21 d\'atout, le plus fort des atouts.'],
      ['Petit', 'Le 1 d\'atout, le plus faible des atouts (un bout).'],
      ['Petit au bout', 'Le Petit joué au dernier pli par le camp qui remporte ce pli : prime de 10 points × multiplicateur.'],
      ['Poignée', 'Annoncer 10 atouts ou plus pour toucher une prime (dans une prochaine version).'],
      ['Chelem', 'Remporter les 18 plis (dans une prochaine version).'],
      ['Preneur', 'Le meilleur enchérisseur, qui joue seul contre les 3 défenseurs.'],
      ['Pli', 'Une carte de chaque joueur ; un seul gagnant.'],
      ['Sec / Coupe franche', 'N\'avoir aucune carte dans une couleur donnée.'],
      ['Surcouper', 'Jouer un atout plus fort que celui déjà présent dans le pli.'],
    ]);
    root.append(el('div', { class: 'panel' },
      el('h2', {}, tr('Reference', 'Référence')),
      el('h3', {}, tr('The deck', 'Le jeu')), T.deckGuide(),
      el('h3', {}, tr('Contracts & scoring', 'Contrats et décompte')),
      el('table', { class: 't' },
        el('tr', {}, el('th', {}, tr('Bid', 'Contrat')), el('th', {}, '×'), el('th', {}, tr('Dog', 'Chien'))),
        T.CONTRACT_ORDER.map(k => el('tr', {}, el('td', {}, T.CONTRACTS[k].name), el('td', {}, '×' + T.CONTRACTS[k].mult), el('td', {}, T.CONTRACTS[k].dog)))),
      el('p', {}, el('strong', {}, tr('Points needed: ', 'Points à faire : ')), tr('0 oudlers → 56 · 1 → 51 · 2 → 41 · 3 → 36.', '0 bout → 56 · 1 → 51 · 2 → 41 · 3 → 36.')),
      el('p', {}, el('strong', {}, tr('Card values: ', 'Valeur des cartes : ')), tr('K 4.5 · Q 3.5 · C 2.5 · J 1.5 · oudlers 4.5 · others 0.5 (total 91).', 'R 4,5 · D 3,5 · C 2,5 · V 1,5 · bouts 4,5 · autres 0,5 (total 91).')),
      el('p', {}, el('strong', {}, tr('Score: ', 'Score : ')), tr('(25 + |points − needed|) × multiplier, positive if made, negative if failed; ±10×multiplier for Petit au bout. The taker scores ×3, each defender scores the opposite.', '(25 + |points faits − points à faire|) × multiplicateur, positif si le contrat est rempli, négatif s\'il chute ; ±10 × multiplicateur pour le petit au bout. Le preneur marque ×3, chaque défenseur marque l\'opposé.')),
      el('h3', {}, tr('Glossary', 'Lexique')),
      el('table', { class: 't' }, gloss.map(([a, b]) => el('tr', {}, el('th', {}, a), el('td', {}, b)))),
      el('h3', {}, tr('Simplifications in this version', 'Simplifications de cette version')),
      el('ul', {}, tr([
        'Only the 4-player game. No Poignée, no Chelem announcements.',
        'The Excuse exchange is automatic: the camp that keeps the Excuse gives away 0.5 points instead of a specific card.',
        'If the Excuse is the first card of a trick, the next card played sets the suit.',
        'If everyone passes, the cards are simply re-dealt.',
      ], [
        'Seulement le jeu à 4 joueurs. Ni poignée, ni annonce de chelem.',
        'L\'échange de l\'Excuse est automatique : le camp qui garde l\'Excuse cède 0,5 point au lieu d\'une carte précise.',
        'Si l\'Excuse est la première carte d\'un pli, la carte suivante détermine la couleur.',
        'Si tout le monde passe, les cartes sont simplement redistribuées.',
      ]).map(t => el('li', {}, t)))));
  }

  T.Screens = Object.assign(T.Screens || {}, { learn: learnScreen, practice: practiceScreen, reference: referenceScreen });
  void cardEl; void fmt;
})(window.Tarot = window.Tarot || {});
