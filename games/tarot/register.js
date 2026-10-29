(function (T) {
  'use strict';
  window.Core.register('tarot', {
    title: 'French Tarot',
    icon: '🃏',
    tagline: 'Trick-taking game with a 78-card deck: bid, take the dog, win points.',
    players: '4 players · you vs 3 bots',
    intro: 'Learn French Tarot from scratch, practise the rules, and play against the computer with a friendly coach at your side.',
    screens: T.Screens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Learn', text: 'Step-by-step lessons: the cards, points, bidding, tricks and scoring. Zero knowledge required.' },
      { screen: 'practice', icon: '🧩', title: 'Practice', text: 'Endless mini-exercises: which cards are legal, who wins the trick, count points, bid or pass.' },
      { screen: 'play', icon: '🎮', title: 'Play', text: "A full game against 3 bots, with a coach that highlights legal cards, suggests moves and explains the bots' choices." },
      { screen: 'advisor', icon: '🧠', title: 'Hand Advisor', text: 'Playing with real cards? Enter your hand and get bid, discard and opening-lead advice.' },
      { screen: 'reference', icon: '📚', title: 'Reference', text: 'Deck, scoring cheat-sheet and glossary of French tarot terms.' },
    ],
  });
})(window.Tarot);
