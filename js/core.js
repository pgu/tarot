/* Shared core: DOM helper and game registry. */
(function () {
  'use strict';

  // Make Element.append tolerant: skip null/undefined/false and flatten arrays (native append would print "null").
  const nativeAppend = Element.prototype.append;
  Element.prototype.append = function (...nodes) {
    return nativeAppend.apply(this, nodes.flat(Infinity).filter(n => n != null && n !== false));
  };

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

  /* ---- language: games that support several languages call Core.t(en, fr) at render time ---- */
  const LANG_KEY = 'cardacademy.lang';
  let lang = 'en';
  try { const saved = localStorage.getItem(LANG_KEY); if (saved === 'fr' || saved === 'en') lang = saved; } catch (e) { /* ignore */ }
  const langListeners = [];
  const t = (en, fr) => (lang === 'fr' && fr != null ? fr : en);
  function setLang(l) {
    if (l !== 'en' && l !== 'fr') return;
    lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* ignore */ }
    document.documentElement.lang = l;
    langListeners.forEach(fn => fn(l));
  }

  const games = {};
  /** def: {title, icon, tagline, players, intro, screens:{name:fn(root, params)}, menu:[{screen, icon, title, text}]} */
  function register(id, def) { games[id] = Object.assign({ id }, def); }

  window.Core = {
    el, games, register, t, setLang,
    get lang() { return lang; },
    onLang(fn) { langListeners.push(fn); },
  };
  document.documentElement.lang = lang;
})();
