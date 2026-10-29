(function (S) {
  'use strict';
  window.Core.register('mus', {
    title: 'El Mus',
    icon: '🂱',
    tagline: 'El juego de envites y faroles español: dos parejas, cuatro lances.',
    players: '4 players · you + Marta vs Ana + Luis · mus a 8 reyes',
    intro: 'Cut or ask for mus, then bet on grande, chica, pares and juego. Bluff, trust your partner and be the first couple to reach 40 piedras!',
    screens: Object.fromEntries(Object.entries(S.MusScreens).map(([name, fn]) => [name, (root, params) => {
      S.badge = S.musBadge; // 8 reyes: show that the 3 is a rey and the 2 an as
      const cleanup = fn(root, params);
      return () => { S.badge = null; if (cleanup) cleanup(); };
    }])),
    menu: [
      { screen: 'learn', icon: '📖', title: 'Learn', text: 'The cards, mus y descarte, the four lances and the envites.' },
      { screen: 'practice', icon: '🧩', title: 'Practice', text: '¿Quién gana?, los pares, juego o punto, ¿mus o no hay mus?' },
      { screen: 'play', icon: '🎮', title: 'Play', text: 'A game to 40 piedras with your partner Marta, with a coach that reads your hand.' },
      { screen: 'advisor', icon: '🧠', title: 'Hand Advisor', text: 'Enter your four cards: what are they worth, mus or corte, what to discard.' },
      { screen: 'reference', icon: '📚', title: 'Reference', text: 'Order, values, scoring and glossary.' },
    ],
  });
})(window.Spanish);
