/* El Mus drills. */
(function (S) {
  'use strict';
  const { el, cardEl } = S;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[rint(0, a.length - 1)];
  const nextBtn = run => el('button', { class: 'btn small', onclick: run }, 'Next exercise →');
  const verdict = (ok, text) => el('div', { class: ok ? 'ok' : 'bad' }, (ok ? '✔ ' : '✘ ') + text);
  const deal4 = () => S.sortCards(S.shuffle(S.DECK.slice()).slice(0, 4));
  const handRow = h => el('div', { class: 'hand flat' }, h.map(c => cardEl(c)));
  const D = h => S.musDescribe(h);

  function shell(box, title, intro, build) {
    const run = () => {
      box.innerHTML = '';
      const body = el('div', { class: 'drill' }, el('h4', {}, title), el('p', { class: 'muted' }, intro));
      box.append(body);
      build(body, run);
    };
    run();
  }

  /* ----- 1. grande / chica ----- */
  function compareDrill(box) {
    shell(box, '¿Quién gana?', 'Compare the two hands in this lance. Remember: reyes and treses count as reyes, ases and doses as ases.', (body, run) => {
      const kind = pick(['grande', 'chica']);
      let a, b;
      do { a = deal4(); b = deal4(); } while (a.some(c => b.includes(c)) || S.lanceValue(kind, a) === S.lanceValue(kind, b));
      const win = S.lanceValue(kind, a) > S.lanceValue(kind, b) ? 'A' : 'B';
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, [['A', 'Hand A'], ['B', 'Hand B']].map(([k, l]) => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(x => { x.disabled = true; });
        const desc = kind === 'grande' ? 'highest cards first' : 'lowest cards first';
        fb.append(verdict(k === win, k === win ? '¡Correcto!' : 'No exactamente.'),
          el('p', {}, `${kind === 'grande' ? 'Grande' : 'Chica'} compares ${desc}. A: ${D(a)[kind]} — B: ${D(b)[kind]}. `, el('strong', {}, `Hand ${win} wins.`)), nextBtn(run));
      } }, l)));
      body.append(el('p', {}, el('strong', {}, `Lance: ${kind === 'grande' ? 'Grande (the highest cards win)' : 'Chica (the lowest cards win)'}`)),
        el('div', { class: 'trick-line' }, el('div', { class: 'slot' }, handRow(a), 'Hand A'), el('div', { class: 'slot' }, handRow(b), 'Hand B')), row, fb);
    });
  }

  /* ----- 2. pares ----- */
  function paresDrill(box) {
    shell(box, 'Los pares', 'What do these four cards have? (par = 1 point, medias = three of a kind = 2, duples = two pairs or four of a kind = 3.)', (body, run) => {
      let h;
      for (let t = 0; t < 50; t++) {
        const d = S.shuffle(S.DECK.slice());
        h = d.slice(0, 4);
        if (Math.random() < 0.6) { const r = pick(S.RANKS); const same = S.DECK.filter(c => S.musRank(c) === (r === 3 ? 12 : r === 2 ? 1 : r)); S.shuffle(same); const n = pick([2, 2, 3, 4]); h = same.slice(0, n).concat(d.filter(c => !same.slice(0, n).includes(c))).slice(0, 4); }
        if (new Set(h.map(c => c.id)).size === 4) break;
      }
      h = S.sortCards(h);
      const pa = S.pares(h);
      const fb = el('div', { class: 'feedback' });
      const opts = [[0, 'Sin pares'], [1, 'Par'], [2, 'Medias'], [3, 'Duples']];
      const row = el('div', { class: 'btn-row' }, opts.map(([t, l]) => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(x => { x.disabled = true; });
        fb.append(verdict(t === pa.type, t === pa.type ? '¡Correcto!' : 'No exactamente.'),
          el('p', {}, `${D(h).pares}. `, pa.type ? `Worth ${pa.points} point${pa.points > 1 ? 's' : ''} if your couple wins the lance.` : 'You would say "no tengo pares".'),
          el('p', { class: 'muted' }, 'Reminder: 3 = rey and 2 = as in the 8 reyes game, so a 3 and a rey are a pair.'), nextBtn(run));
      } }, l)));
      body.append(handRow(h), row, fb);
    });
  }

  /* ----- 3. juego ----- */
  function juegoDrill(box) {
    shell(box, 'Juego o punto', 'Figures (sota, caballo, rey), treses count 10; ases and doses count 1. Add up the four cards.', (body, run) => {
      let h;
      do { h = deal4(); const s = S.juegoSum(h); if (Math.random() < 0.5 && (s < 28 || s > 41)) h = null; } while (!h);
      const sum = S.juegoSum(h);
      const input = el('input', { type: 'number', min: 0, max: 50, placeholder: 'sum' });
      const fb = el('div', { class: 'feedback' });
      const go = () => {
        if (input.value === '') return;
        input.disabled = true; btn.disabled = true;
        const ok = parseInt(input.value, 10) === sum;
        const j = sum >= 31;
        fb.append(verdict(ok, ok ? '¡Correcto!' : `The sum is ${sum}.`),
          el('p', {}, j ? `${sum} is juego${sum === 31 ? ' — the best one (3 piedras if your couple wins it)' : ' (2 piedras if your couple wins it)'}. Order: 31 > 32 > 40 > 37 > 36 > 35 > 34 > 33.`
            : `${sum} is not juego (it needs 31 or more). With nobody having juego, the lance is "punto": the closest to 30 wins.`), nextBtn(run));
      };
      const btn = el('button', { class: 'btn primary', onclick: go }, 'Check');
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      body.append(handRow(h), el('div', { class: 'btn-row' }, input, btn), fb);
    });
  }

  /* ----- 4. mus or no hay mus ----- */
  function musDrill(box) {
    shell(box, '¿Mus o no hay mus?', 'You are the first to speak. Do you ask for mus (to change cards) or cut with "no hay mus"?', (body, run) => {
      const h = deal4();
      const g = { hands: [h], musRounds: 0 };
      const d = S.MusBots.musDecision(g, 0, { deterministic: true });
      const fb = el('div', { class: 'feedback' });
      const row = el('div', { class: 'btn-row' }, [[true, 'Mus'], [false, 'No hay mus']].map(([m, l]) => el('button', { class: 'btn', onclick: () => {
        row.querySelectorAll('button').forEach(x => { x.disabled = true; });
        fb.append(verdict(m === d.mus, m === d.mus ? 'Matches the coach.' : 'The coach would choose differently.'),
          el('p', {}, el('strong', {}, d.mus ? 'Coach: mus. ' : 'Coach: no hay mus. '), d.reason), S.musDescTable(h),
          el('p', { class: 'muted' }, 'A rule of thumb only: strong players also count on their partner and on the table.'), nextBtn(run));
      } }, l)));
      body.append(handRow(h), row, fb);
    });
  }

  S.MusDrills = {
    compare: { title: '¿Quién gana?', fn: compareDrill },
    pares: { title: 'Los pares', fn: paresDrill },
    juego: { title: 'Juego o punto', fn: juegoDrill },
    mus: { title: '¿Mus?', fn: musDrill },
  };
})(window.Spanish = window.Spanish || {});
