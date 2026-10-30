(function (S) {
  'use strict';
  window.Core.register('podrida', {
    title: 'La Podrida',
    icon: '🍂',
    tagline: 'Apuesta cuántas bazas harás… y hazlas exactamente.',
    players: '3–5 players · you vs bots · exact-tricks bidding',
    intro: 'The more you win, the better? Not here: you must win exactly the tricks you announced. A game of judgement, bluff and control, with a different number of cards every round.',
    screens: S.PodridaScreens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Learn', text: 'Cards, the triumph, the bids (and the dealer\'s forbidden bid), scoring.' },
      { screen: 'practice', icon: '🧩', title: 'Practice', text: '¿Cuántas bazas?, la apuesta prohibida, ¿qué puedes jugar?, los puntos.' },
      { screen: 'play', icon: '🎮', title: 'Play', text: 'A full game against 2–4 bots with a coach for your bids and plays.' },
      { screen: 'advisor', icon: '🧠', title: 'Hand Advisor', text: 'Enter your cards and the triumph: how many tricks to bid.' },
      { screen: 'reference', icon: '📚', title: 'Reference', text: 'Card order, rules, scoring and glossary.' },
    ],
  });
})(window.Spanish);
