/* El Mus: 4 players, 2 couples (seats 0+2 vs 1+3), mus/descarte, 4 lances with envites, play to 40 piedras. No DOM. */
(function (S) {
  'use strict';

  const KINDS = ['grande', 'chica', 'pares', 'juego'];
  const team = p => p % 2;

  class Mus {
    constructor(opts) {
      opts = opts || {};
      this.target = opts.target || 40;
      this.names = opts.names || ['You', 'Ana', 'Marta', 'Luis'];
      this.scores = [0, 0];
      this.dealer = opts.dealer == null ? 3 : opts.dealer;
      this.handNo = 0;
      this.winner = null;
      this.newHand();
    }

    team(p) { return team(p); }
    seatOrder(from) { return [0, 1, 2, 3].map(k => (from + k) % 4); }

    newHand() {
      this.handNo++;
      this.dealer = (this.dealer + 1) % 4;
      this.mano = (this.dealer + 1) % 4;
      this.deck = S.shuffle(S.DECK.slice());
      this.discardPile = [];
      this.hands = [0, 1, 2, 3].map(() => []);
      this.seatOrder(this.mano).forEach(p => { this.hands[p] = S.sortCards(this.deck.splice(0, 4)); });
      this.phase = 'mus';
      this.musSpeaker = this.mano;
      this.musCount = 0; // how many have said "mus" in this round
      this.musRounds = 0;
      this.cutBy = null;
      this.discardIdx = 0;
      this.lanceIdx = -1;
      this.lance = null;
      this.results = [];
      this.handResult = null;
      this.log = [];
    }

    /* ---------------- mus & discard ---------------- */
    get actor() {
      if (this.phase === 'mus') return this.musSpeaker;
      if (this.phase === 'discard') return this.seatOrder(this.mano)[this.discardIdx];
      if (this.phase === 'lance' && this.lance && !this.lance.done) return this.lanceActor();
      return null;
    }

    musSay(p, yes) {
      if (this.phase !== 'mus' || p !== this.musSpeaker) throw new Error('Not your turn to speak');
      if (!yes) { this.cutBy = p; this.phase = 'lance'; this.nextLance(); return; }
      this.musCount++;
      if (this.musCount === 4) { this.phase = 'discard'; this.discardIdx = 0; this.pending = {}; } else this.musSpeaker = (p + 1) % 4;
    }

    discard(p, cards) {
      if (this.phase !== 'discard' || p !== this.actor) throw new Error('Not your turn to discard');
      if (!cards.every(c => this.hands[p].includes(c))) throw new Error('Card not in hand');
      this.pending[p] = cards;
      this.discardIdx++;
      if (this.discardIdx === 4) this.dealReplacements();
    }

    dealReplacements() {
      this.seatOrder(this.mano).forEach(p => {
        const out = this.pending[p] || [];
        this.hands[p] = this.hands[p].filter(c => !out.includes(c));
        this.discardPile.push(...out);
      });
      this.seatOrder(this.mano).forEach(p => {
        const need = 4 - this.hands[p].length;
        for (let k = 0; k < need; k++) {
          if (!this.deck.length) { this.deck = S.shuffle(this.discardPile); this.discardPile = []; }
          this.hands[p].push(this.deck.pop());
        }
        this.hands[p] = S.sortCards(this.hands[p]);
      });
      this.musRounds++;
      this.pending = {};
      this.phase = 'mus';
      this.musSpeaker = this.mano;
      this.musCount = 0;
    }

    /* ---------------- lances ---------------- */
    nextLance() {
      for (;;) {
        this.lanceIdx++;
        if (this.lanceIdx >= KINDS.length) { this.recuento(); return; }
        this.beginLance(KINDS[this.lanceIdx]);
        if (!this.lance.done) return;
      }
    }

    beginLance(name) {
      const order = this.seatOrder(this.mano);
      let kind = name;
      let participants = order;
      const declared = [null, null, null, null];
      if (name === 'pares') {
        order.forEach(p => { declared[p] = S.pares(this.hands[p]).type > 0; });
        participants = order.filter(p => declared[p]);
      } else if (name === 'juego') {
        order.forEach(p => { declared[p] = S.hasJuego(this.hands[p]); });
        participants = order.filter(p => declared[p]);
        if (!participants.length) { kind = 'punto'; participants = order; }
      }
      const L = { name, kind, participants, declared, stage: 'open', openIdx: 0, bet: null, responders: [], done: false, result: null };
      this.lance = L;
      if (!participants.length) { L.done = true; L.result = { name, kind, winnerTeam: null, points: 0, how: 'skipped', participants }; this.results.push(L.result); return; }
      const teams = new Set(participants.map(team));
      if (teams.size === 1 && (name === 'pares' || name === 'juego')) { // only one couple takes part: no betting
        this.finish(team(participants[0]), 0, 'solo', participants);
      }
    }

    lanceActor() {
      const L = this.lance;
      return L.stage === 'open' ? L.participants[L.openIdx] : L.responders[0];
    }

    /** Actions the actor may take. */
    options(p) {
      const L = this.lance;
      if (!L || L.done || p !== this.lanceActor()) return [];
      if (L.stage === 'open') return [{ type: 'paso' }, { type: 'envido', amount: 2 }, { type: 'envido', amount: 5 }, { type: 'ordago' }];
      const o = [{ type: 'quiero' }, { type: 'no' }];
      if (!L.bet.ordago) o.push({ type: 'subo', amount: 2 }, { type: 'subo', amount: 5 }, { type: 'ordago' });
      return o;
    }

    /** Opponents (among participants) of player p, in speaking order after p. */
    opponentsAfter(p) {
      const L = this.lance;
      const after = this.seatOrder((p + 1) % 4);
      return after.filter(q => L.participants.includes(q) && team(q) !== team(p));
    }

    act(p, a) {
      const L = this.lance;
      if (this.phase !== 'lance' || !L || L.done || p !== this.lanceActor()) throw new Error('Not your turn');
      this.step(p, a);
      if (L.done) this.afterLance();
    }

    afterLance() {
      if (this.phase === 'gameover') return;
      this.nextLance();
    }

    step(p, a) {
      const L = this.lance;
      if (L.stage === 'open') {
        if (a.type === 'paso') {
          L.openIdx++;
          if (L.openIdx >= L.participants.length) this.showdown(null);
        } else if (a.type === 'envido') this.openBet(p, { amount: a.amount, prev: 0, ordago: false });
        else if (a.type === 'ordago') this.openBet(p, { amount: 0, prev: 0, ordago: true });
        else throw new Error('Bad action');
        return;
      }
      const B = L.bet;
      if (a.type === 'quiero') this.showdown(B);
      else if (a.type === 'no') {
        L.responders.shift();
        if (!L.responders.length) this.finish(B.team, B.prev > 0 ? B.prev : 1, 'refused', L.participants);
      } else if (a.type === 'subo' && !B.ordago) this.openBet(p, { amount: B.amount + a.amount, prev: B.amount, ordago: false });
      else if (a.type === 'ordago') this.openBet(p, { amount: 0, prev: B.ordago ? B.prev : B.amount, ordago: true });
      else throw new Error('Bad action');
    }

    openBet(p, b) {
      const L = this.lance;
      L.bet = Object.assign({ team: team(p), by: p }, b);
      L.stage = 'respond';
      L.responders = this.opponentsAfter(p);
    }

    showdown(bet) {
      const L = this.lance;
      const w = S.lanceWinner(L.kind, this.hands, L.participants);
      const wt = team(w);
      if (bet && bet.ordago) {
        this.finish(wt, 0, 'ordago', L.participants, w);
        return;
      }
      const base = bet ? bet.amount : (L.kind === 'grande' || L.kind === 'chica' || L.kind === 'punto' ? 1 : 0);
      this.finish(wt, base, bet ? 'accepted' : 'passed', L.participants, w, true);
    }

    /** Close the lance. `withExtras`: also count pares/juego points of the winners. */
    finish(winnerTeam, stake, how, participants, winnerPlayer, withExtras) {
      const L = this.lance;
      let extras = 0;
      const detail = [];
      if (how === 'solo' || withExtras) {
        const wt = how === 'solo' ? team(participants[0]) : winnerTeam;
        winnerTeam = wt;
        participants.filter(q => team(q) === wt).forEach(q => {
          if (L.name === 'pares') { const pp = S.pares(this.hands[q]).points; extras += pp; detail.push({ player: q, points: pp }); }
          else if (L.name === 'juego' && L.kind === 'juego') { const pp = S.juegoPoints(this.hands[q]); extras += pp; detail.push({ player: q, points: pp }); }
        });
      }
      L.done = true;
      L.result = { name: L.name, kind: L.kind, winnerTeam, winnerPlayer, stake, extras, detail, points: stake + extras, how, participants, bet: L.bet };
      this.results.push(L.result);
      if (how === 'ordago') { this.scores[winnerTeam] = this.target; this.endGame(winnerTeam, L.result); }
    }

    recuento() {
      this.phase = 'recuento';
      const gained = [0, 0];
      let winner = null;
      for (const r of this.results) {
        if (r.winnerTeam == null || !r.points) continue;
        this.scores[r.winnerTeam] += r.points;
        gained[r.winnerTeam] += r.points;
        if (this.scores[r.winnerTeam] >= this.target) { winner = r.winnerTeam; break; }
      }
      this.handResult = { gained, results: this.results };
      if (winner != null) this.endGame(winner); else this.phase = 'handover';
    }

    endGame(w, r) {
      this.winner = w;
      this.phase = 'gameover';
      this.handResult = this.handResult || { gained: [0, 0], results: this.results };
      this.lance = this.lance || null;
      void r;
    }

    nextHand() { this.newHand(); }
  }

  S.Mus = Mus;
  S.MUS_KINDS = KINDS;
})(window.Spanish = window.Spanish || {});
