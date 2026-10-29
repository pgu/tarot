(function (P) {
  'use strict';
  window.Core.register('draw', {
    title: '5-Card Draw',
    icon: '✋',
    tagline: 'Classic home poker: five private cards, one draw, no community cards.',
    players: '4 seats · you vs 3 bots · no-limit',
    intro: 'The simplest poker: you get five cards, swap up to three, and the best hand wins. Learn what to keep and how to read opponents from the number of cards they draw.',
    screens: P.DrawScreens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Learn', text: 'The rules, hand rankings, the draw, what to keep and how to read opponents.' },
      { screen: 'practice', icon: '🧩', title: 'Practice', text: 'Name the hand, compare hands, and decide which cards to keep.' },
      { screen: 'play', icon: '🎮', title: 'Play', text: 'No-limit 5-card draw vs 3 bots, with a coach that suggests what to swap and shows your odds.' },
      { screen: 'advisor', icon: '🧠', title: 'Hand Advisor', text: 'Enter your five cards: what to keep and what you will probably end up with.' },
      { screen: 'reference', icon: '📚', title: 'Reference', text: 'Rankings, glossary and the flow of a hand.' },
    ],
  });
})(window.Poker);
