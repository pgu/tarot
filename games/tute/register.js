(function (S) {
  'use strict';
  window.Core.register('tute', {
    title: 'El Tute',
    icon: '🇪🇸',
    tagline: 'El gran juego de bazas español: triunfos, cantes y arrastre.',
    players: '2 players · you vs the bot · tute arrastrado',
    intro: 'Win tricks, sing las veinte and las cuarenta, swap the 7 for the pinta and survive the arrastre. ¡Y si tienes cuatro reyes, tute!',
    screens: S.TuteScreens,
    menu: [
      { screen: 'learn', icon: '📖', title: 'Learn', text: 'La baraja, las bazas, el arrastre, cantes y estrategia.' },
      { screen: 'practice', icon: '🧩', title: 'Practice', text: '¿Quién gana?, cuenta los puntos, el arrastre, los cantes.' },
      { screen: 'play', icon: '🎮', title: 'Play', text: 'A full hand against the bot: cantes, cambiar el 7, arrastre, with a coach.' },
      { screen: 'advisor', icon: '🧠', title: 'Hand Advisor', text: 'Enter your cards and the pinta: what to sing and what to play.' },
      { screen: 'reference', icon: '📚', title: 'Reference', text: 'Order, points, rules and glossary.' },
    ],
  });
})(window.Spanish);
