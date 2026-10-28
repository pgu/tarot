/* Router + home screen. */
(function (T) {
  'use strict';
  const { el } = T;
  const app = document.getElementById('app');
  let cleanup = null;

  function home(root) {
    const modes = [
      ['📖', 'Learn', '#/learn', 'Step-by-step lessons: the cards, points, bidding, tricks and scoring. Zero knowledge required.'],
      ['🧩', 'Practice', '#/practice', 'Endless mini-exercises: which cards are legal, who wins the trick, count points, bid or pass.'],
      ['🎮', 'Play', '#/play', 'A full game against 3 bots, with a coach that highlights legal cards, suggests moves and explains the bots\' choices.'],
      ['🧠', 'Hand Advisor', '#/advisor', 'Playing with real cards? Enter your hand and get bid, discard and opening-lead advice.'],
      ['📚', 'Reference', '#/reference', 'Deck, scoring cheat-sheet and glossary of French tarot terms.'],
    ];
    root.append(
      el('section', { class: 'hero' },
        el('h1', {}, '🃏 Tarot Academy'),
        el('p', {}, 'Learn French Tarot from scratch, practise the rules, and play against the computer with a friendly coach at your side.')),
      el('section', { class: 'modes' }, modes.map(([ico, title, href, text]) =>
        el('a', { class: 'mode', href }, el('div', { class: 'ico' }, ico), el('h3', {}, title), el('p', {}, text)))),
      el('p', { class: 'muted', style: 'text-align:center;margin-top:28px' }, 'New here? Start with ', el('a', { href: '#/learn' }, 'Learn'), ', then try ', el('a', { href: '#/play' }, 'Play'), ' with all the learning aids on.'));
  }

  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    const [name, ...params] = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
    const screens = Object.assign({ home }, T.Screens);
    const screen = screens[name] || home;
    app.innerHTML = '';
    document.querySelectorAll('.topbar nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#/' + name));
    cleanup = screen(app, params) || null;
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  route();
})(window.Tarot = window.Tarot || {});
