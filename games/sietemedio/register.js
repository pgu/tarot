(function (S) {
  'use strict';
  window.Core.register('sietemedio', {
    title: 'El Siete y medio',
    icon: '7️⃣',
    tagline: 'El «blackjack» español: acércate a 7½ sin pasarte y gana a la banca.',
    players: '3–4 players · you vs bots · the bank rotates',
    intro: 'Ask for cards one by one, stand at the right moment and beat the bank. A game of nerve and numbers: the risk of going over decides everything.',
    screens: S.SMScreens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Learn', text: 'The values, the bank, the duel and the risk of going over.' },
      { screen: 'practice', icon: '🧩', title: 'Practice', text: 'La suma, ¿carta o me planto?, el duelo con la banca.' },
      { screen: 'play', icon: '🎮', title: 'Play', text: 'Rounds against bots (you are the bank in turn), with a coach that shows the risk.' },
      { screen: 'advisor', icon: '🧠', title: 'Hand Advisor', text: 'Enter your cards: total, risk and what to do.' },
      { screen: 'reference', icon: '📚', title: 'Reference', text: 'Values, rules, risk table and glossary.' },
    ],
  });
})(window.Spanish);
