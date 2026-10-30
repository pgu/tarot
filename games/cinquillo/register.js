(function (S) {
  'use strict';
  window.Core.register('cinquillo', {
    title: 'El Cinquillo',
    icon: '🔟',
    tagline: 'Construye los cuatro palos desde el cinco y quédate sin cartas el primero.',
    players: '3–4 players · you vs bots · classic rule (no fee to pass)',
    intro: 'A game of patience and blocking with the Spanish deck. Start with the 5 de oros, build each suit up and down, and keep the cards that block your rivals.',
    screens: S.CinquilloScreens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Learn', text: 'The order of a suit, how to play, scoring and strategy.' },
      { screen: 'practice', icon: '🧩', title: 'Practice', text: '¿Qué puedes jugar? ¿Qué juegas?' },
      { screen: 'play', icon: '🎮', title: 'Play', text: 'A game to 30 points against 2–3 bots, with a coach.' },
      { screen: 'advisor', icon: '🧠', title: 'Hand Advisor', text: 'Mark your hand and the table: playable cards and best play.' },
      { screen: 'reference', icon: '📚', title: 'Reference', text: 'Rules and glossary.' },
    ],
  });
})(window.Spanish);
