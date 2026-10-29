(function (S) {
  'use strict';
  window.Core.register('chinchon', {
    title: 'Chinchón',
    icon: '🎴',
    tagline: 'El rummy español: forma tríos y escaleras, y cierra la ronda con pocos puntos.',
    players: '2–4 players · you vs bots · 40-card Spanish deck',
    intro: 'Spain\'s favourite rummy. Draw, discard, build combinaciones and cierra before the others. Beware of the Chinchón: seven cards in a row wins the whole game!',
    screens: S.ChinchonScreens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Learn', text: 'Combinaciones, robar y descartar, cerrar, puntos y estrategia.' },
      { screen: 'practice', icon: '🧩', title: 'Practice', text: '¿Combinación válida?, puntos sueltos, ¿qué descartas?, ¿puedes cerrar?' },
      { screen: 'play', icon: '🎮', title: 'Play', text: 'A full game against 1–3 bots, with your hand grouped into combinations and a coach.' },
      { screen: 'advisor', icon: '🧠', title: 'Hand Advisor', text: 'Enter your 7–8 cards: what to take, what to throw, can you close?' },
      { screen: 'reference', icon: '📚', title: 'Reference', text: 'Rules, run order and glossary.' },
    ],
  });
})(window.Spanish);
