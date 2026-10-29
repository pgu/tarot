/* Router, game hub and per-game menus. */
(function () {
  'use strict';
  const { el, games } = window.Core;
  const app = document.getElementById('app');
  const nav = document.getElementById('nav');
  let cleanup = null;

  const COMING = [
    ['🂡', 'Rami', 'Rummy-style: form sets and runs, then go out.'],
    ['🇪🇸', 'El Tute', 'Spanish trick-taking game with the 40-card deck.'],
  ];

  function hub(root) {
    root.append(
      el('section', { class: 'hero' },
        el('h1', {}, '🃏 Card Academy'),
        el('p', {}, 'Learn card games from scratch: lessons, practice drills, games against the computer with a coach, and advice on your real hands.')),
      el('section', { class: 'modes' },
        Object.values(games).map(g => el('a', { class: 'mode', href: `#/${g.id}` },
          el('div', { class: 'ico' }, g.icon), el('h3', {}, g.title), el('p', {}, g.tagline),
          el('p', { style: 'margin-top:8px' }, el('span', { class: 'tag' }, g.players)))),
        COMING.map(([ico, t, d]) => el('div', { class: 'mode soon' },
          el('div', { class: 'ico' }, ico), el('h3', {}, t), el('p', {}, d), el('p', { style: 'margin-top:8px' }, el('span', { class: 'tag' }, 'coming soon'))))));
  }

  function gameHome(root, g) {
    root.append(
      el('section', { class: 'hero' }, el('h1', {}, `${g.icon} ${g.title}`), el('p', {}, g.intro)),
      el('section', { class: 'modes' }, g.menu.map(m =>
        el('a', { class: 'mode', href: `#/${g.id}/${m.screen}` }, el('div', { class: 'ico' }, m.icon), el('h3', {}, m.title), el('p', {}, m.text)))),
      el('p', { class: 'muted', style: 'text-align:center;margin-top:28px' }, 'New here? Start with ',
        el('a', { href: `#/${g.id}/learn` }, 'Learn'), ', then try ', el('a', { href: `#/${g.id}/play` }, 'Play'), ' with all the learning aids on.'));
  }

  function renderNav(g, screen) {
    nav.innerHTML = '';
    if (!g) return;
    nav.append(el('a', { href: `#/${g.id}`, class: !screen ? 'active' : '' }, `${g.icon} ${g.title}`),
      ...g.menu.map(m => el('a', { href: `#/${g.id}/${m.screen}`, class: m.screen === screen ? 'active' : '' }, m.title)));
  }

  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    // Old Tarot-only URLs (#/play, #/learn/3, ...) keep working.
    if (parts.length && !games[parts[0]] && games.tarot && games.tarot.screens[parts[0]]) {
      location.replace('#/tarot/' + parts.join('/'));
      return;
    }
    const [gid, screen, ...params] = parts;
    const g = games[gid];
    app.innerHTML = '';
    if (!g) { renderNav(null); hub(app); }
    else if (!screen || !g.screens[screen]) { renderNav(g); gameHome(app, g); }
    else { renderNav(g, screen); cleanup = g.screens[screen](app, params) || null; }
    document.title = (g ? g.title + ' – ' : '') + 'Card Academy';
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  window.__startRouter = route;
})();
