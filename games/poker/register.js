(function (P) {
  'use strict';
  window.Core.register('poker', {
    title: "Texas Hold'em",
    icon: '♠️',
    tagline: 'The world\'s most popular poker game: bluff, bet and build the best five-card hand.',
    players: '4 seats · you vs 3 bots · no-limit',
    intro: "Learn Texas Hold'em poker from zero: hand rankings, betting, odds, then play against bots with a coach showing your win chances.",
    screens: P.Screens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Learn', text: 'Hand rankings, how a hand works, betting, showdown, odds and starting hands.' },
      { screen: 'practice', icon: '🧩', title: 'Practice', text: 'Name the hand, who wins, best five of seven, outs & pot odds, preflop decisions.' },
      { screen: 'play', icon: '🎮', title: 'Play', text: 'No-limit Hold\'em against 3 bots. The coach shows your win chance, pot odds and a suggested action.' },
      { screen: 'advisor', icon: '🧠', title: 'Hand Advisor', text: 'Playing with real cards? Enter your hand and the board for odds and advice.' },
      { screen: 'reference', icon: '📚', title: 'Reference', text: 'Hand rankings, quick maths and glossary.' },
    ],
  });
})(window.Poker);
