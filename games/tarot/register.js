(function (T) {
  'use strict';
  const tr = window.Core.t;
  window.Core.register('tarot', {
    langs: ['en', 'fr'],
    title: () => tr('French Tarot', 'Tarot français'),
    icon: '🃏',
    tagline: () => tr('Trick-taking game with a 78-card deck: bid, take the dog, win points.', 'Jeu de plis avec 78 cartes : annoncez, prenez le chien, marquez des points.'),
    players: () => tr('4 players · you vs 3 bots', '4 joueurs · vous contre 3 bots'),
    intro: () => tr('Learn French Tarot from scratch, practise the rules, and play against the computer with a friendly coach at your side.',
      'Apprenez le Tarot français depuis zéro, entraînez-vous aux règles et jouez contre l\'ordinateur avec un coach à vos côtés.'),
    start: () => [tr('New here? Start with ', 'Nouveau ? Commencez par '), Core_a('learn', tr('Learn', 'Apprendre')), tr(', then try ', ', puis essayez '), Core_a('play', tr('Play', 'Jouer')), tr(' with all the learning aids on.', ' avec toutes les aides activées.')],
    screens: T.Screens,
    menu: [
      { screen: 'learn', icon: '📖', title: () => tr('Learn', 'Apprendre'), text: () => tr('Step-by-step lessons: the cards, points, bidding, tricks and scoring. Zero knowledge required.', 'Leçons pas à pas : les cartes, les points, les enchères, les plis et le décompte. Aucune connaissance requise.') },
      { screen: 'practice', icon: '🧩', title: () => tr('Practice', 'S\'entraîner'), text: () => tr('Endless mini-exercises: which cards are legal, who wins the trick, count points, bid or pass.', 'Mini-exercices à volonté : quelles cartes sont permises, qui gagne le pli, compter les points, annoncer ou passer.') },
      { screen: 'play', icon: '🎮', title: () => tr('Play', 'Jouer'), text: () => tr("A full game against 3 bots, with a coach that highlights legal cards, suggests moves and explains the bots' choices.", 'Une partie complète contre 3 bots, avec un coach qui montre les cartes permises, suggère des coups et explique les choix des bots.') },
      { screen: 'advisor', icon: '🧠', title: () => tr('Hand Advisor', 'Conseiller'), text: () => tr('Playing with real cards? Enter your hand and get bid, discard and opening-lead advice.', 'Vous jouez avec de vraies cartes ? Entrez votre main : annonce, écart et entame conseillés.') },
      { screen: 'reference', icon: '📚', title: () => tr('Reference', 'Référence'), text: () => tr('Deck, scoring cheat-sheet and glossary of French tarot terms.', 'Jeu de cartes, aide-mémoire du décompte et lexique du tarot.') },
    ],
  });
  function Core_a(screen, label) { return window.Core.el('a', { href: `#/tarot/${screen}` }, label); }
})(window.Tarot);
