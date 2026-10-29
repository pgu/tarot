(function (S) {
  'use strict';
  window.Core.register('escoba', {
    title: 'La Escoba',
    icon: '🧹',
    tagline: 'Spanish capture game: make 15 with cards from the table and sweep it clean.',
    players: '2 players · you vs the bot · 40-card Spanish deck',
    intro: "Spain's classic beginner game. Play a card, grab table cards that add up to 15, and try to sweep the table for bonus points.",
    screens: Object.fromEntries(Object.entries(S.EscobaScreens).map(([name, fn]) => [name, (root, params) => {
      S.badge = c => (c.rank >= 10 ? '=' + S.escobaValue(c) : null); // in Escoba: Sota 8, Caballo 9, Rey 10
      const cleanup = fn(root, params);
      return () => { S.badge = null; if (cleanup) cleanup(); };
    }])),
    menu: [
      { screen: 'learn', icon: '📖', title: 'Learn', text: 'The Spanish deck, making 15, sweeps and scoring.' },
      { screen: 'practice', icon: '🧩', title: 'Practice', text: 'Make 15, score a round, pick the best play.' },
      { screen: 'play', icon: '🎮', title: 'Play', text: 'A full game to 15 points against a bot, with a coach.' },
      { screen: 'advisor', icon: '🧠', title: 'Hand Advisor', text: 'Enter your hand and the table: every play ranked.' },
      { screen: 'reference', icon: '📚', title: 'Reference', text: 'Values, scoring and glossary.' },
    ],
  });
})(window.Spanish);
