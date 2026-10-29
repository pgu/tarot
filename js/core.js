/* Shared core: DOM helper and game registry. */
(function () {
  'use strict';

  function el(tag, props, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    const append = k => {
      if (k == null || k === false) return;
      if (Array.isArray(k)) k.forEach(append);
      else e.append(k.nodeType ? k : document.createTextNode(String(k)));
    };
    kids.forEach(append);
    return e;
  }

  const games = {};
  /** def: {title, icon, tagline, players, intro, screens:{name:fn(root, params)}, menu:[{screen, icon, title, text}]} */
  function register(id, def) { games[id] = Object.assign({ id }, def); }

  window.Core = { el, games, register };
})();
