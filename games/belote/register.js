(function (B) {
  'use strict';
  window.Core.register('belote', {
    title: 'La Belote',
    icon: '♠️',
    tagline: 'La belote classique : prenez l\'atout, jouez 8 plis avec votre partenaire, annoncez belote-rebelote.',
    players: '4 joueurs · 2 équipes · vous + 1 partenaire bot contre 2 bots · 32 cartes',
    intro: 'Apprenez la belote depuis zéro, entraînez-vous aux règles et jouez contre l\'ordinateur avec un coach à vos côtés.',
    start: () => ['Nouveau ? Commencez par ', window.Core.el('a', { href: '#/belote/learn' }, 'Apprendre'), ', puis essayez ', window.Core.el('a', { href: '#/belote/play' }, 'Jouer'), ' avec toutes les aides activées.'],
    screens: B.BeloteScreens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Apprendre', text: 'Les cartes, l\'atout, les enchères, les plis, belote-rebelote et le décompte.' },
      { screen: 'practice', icon: '🧩', title: 'S\'entraîner', text: 'Cartes jouables, qui gagne le pli, compter les points, prendre ou passer.' },
      { screen: 'play', icon: '🎮', title: 'Jouer', text: 'Une partie complète avec un partenaire bot, un coach qui montre les cartes permises, suggère des coups et explique les choix des bots.' },
      { screen: 'advisor', icon: '🧠', title: 'Conseiller', text: 'Vous jouez avec de vraies cartes ? Entrez votre main et la retourne : prendre ou passer ?' },
      { screen: 'reference', icon: '📚', title: 'Référence', text: 'Valeur des cartes, ordre de l\'atout, règles et lexique.' },
    ],
  });
})(window.Belote);
