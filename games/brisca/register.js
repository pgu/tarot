(function (S) {
  'use strict';
  window.Core.register('brisca', {
    title: 'La Brisca',
    icon: '🎯',
    tagline: 'El clásico familiar de bazas: sin obligaciones, triunfos y 120 puntos.',
    players: '2 players · you vs the bot',
    intro: 'The easiest trick-taking game with the Spanish deck. Win the As and the Tres, save your triunfos and get more than 60 points.',
    screens: S.BriscaScreens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Learn', text: 'The cards, the hand and the strategy of the brisca.' },
      { screen: 'practice', icon: '🧩', title: 'Practice', text: '¿Quién gana?, cuenta los puntos, ¿qué juegas?' },
      { screen: 'play', icon: '🎮', title: 'Play', text: 'A hand against the bot, with a coach that suggests the card to play.' },
      { screen: 'advisor', icon: '🧠', title: 'Hand Advisor', text: 'Enter your cards and the pinta: which card to play?' },
      { screen: 'reference', icon: '📚', title: 'Reference', text: 'Order, points, rules and glossary.' },
    ],
  });
})(window.Spanish);
