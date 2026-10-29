(function (R) {
  'use strict';
  window.Core.register('rami', {
    title: 'Le Rami',
    icon: '🂡',
    tagline: 'Le rami français : brelans, carrés, suites, jokers et ouverture à 51 points.',
    players: '2 à 4 joueurs · vous contre les bots · 2 jeux + 4 jokers',
    intro: 'Piochez, posez, défaussez. Ouvrez avec 51 points, posez vos combinaisons, récupérez les jokers et soyez le premier à vous coucher en faisant Rami !',
    screens: R.RamiScreens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Apprendre', text: 'Les combinaisons, le tour de jeu, l\'ouverture à 51, les jokers et le décompte des points.' },
      { screen: 'practice', icon: '🧩', title: 'S\'entraîner', text: 'Combinaison valide ?, points, ouverture, récupérer un joker.' },
      { screen: 'play', icon: '🎮', title: 'Jouer', text: 'Une partie complète contre 1 à 3 bots, avec un coach qui trouve vos combinaisons.' },
      { screen: 'advisor', icon: '🧠', title: 'Conseiller', text: 'Entrez vos 13 ou 14 cartes : pouvez-vous ouvrir ? que défausser ?' },
      { screen: 'reference', icon: '📚', title: 'Référence', text: 'Valeurs des cartes, règles et lexique.' },
    ],
  });
})(window.Rami);
