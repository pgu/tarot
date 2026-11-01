(function (Br) {
  'use strict';
  const a = (href, t) => window.Core.el('a', { href }, t);
  window.Core.register('bridge', {
    title: 'Le Bridge',
    icon: '♦️',
    tagline: 'Le bridge de rubber : enchères, jeu de la carte avec le mort, marque et manches.',
    players: '4 joueurs · 2 équipes · vous + 1 partenaire bot contre 2 bots · 52 cartes',
    intro: 'Apprenez le bridge par étapes : compter ses points, enchérir, jouer la carte. Puis jouez un rubber contre l\'ordinateur avec un coach à vos côtés.',
    start: () => ['Nouveau ? Commencez par ', a('#/bridge/learn', 'Apprendre'), ', puis essayez ', a('#/bridge/play', 'Jouer'), ' avec toutes les aides activées.'],
    screens: Br.BridgeScreens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Apprendre', text: 'Les plis, les points, les enchères, l\'ouverture et la réponse, le jeu de la carte et la marque.' },
      { screen: 'practice', icon: '🧩', title: 'S\'entraîner', text: 'Compter ses points, ouvrir, répondre, calculer la marque, qui gagne le pli.' },
      { screen: 'play', icon: '🎮', title: 'Jouer', text: 'Un rubber complet : enchères, jeu avec le mort, coach qui suggère enchères et cartes, journal expliqué.' },
      { screen: 'advisor', icon: '🧠', title: 'Conseiller', text: 'Vous jouez avec de vraies cartes ? Entrez vos 13 cartes : ouverture, réponse et entame conseillées.' },
      { screen: 'reference', icon: '📚', title: 'Référence', text: 'Points, enchères, marque du rubber et lexique.' },
    ],
  });
})(window.Bridge);
