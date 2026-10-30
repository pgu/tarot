# Card Academy

Learn and play classic card games in the browser, with lessons, practice drills, games against bots with a coach, and a hand advisor for real cards. Static site: plain HTML/CSS/JS, no build step.

## Games
| Game | Status |
|---|---|
| **French Tarot** (4 players, 78 cards) | available · EN / FR switch |
| **Texas Hold'em** (no-limit, you + 3 bots) | available |
| **5-Card Draw** (no-limit, you + 3 bots) | available |
| **La Escoba** (2 players, Spanish deck) | available |
| **Chinchón** (2–4 players, Spanish deck) | available |
| **El Tute** (tute arrastrado, 2 players) | available |
| **Le Rami** (2–4 players, 108 cards) | available · French only |
| **El Mus** (2 couples, mus a 8 reyes) | available |
| **La Brisca** (2 players) | available |
| **El Cinquillo** (3–4 players, classic rule) | available |
| **El Siete y medio** (3–4 players) | available |
| **La Podrida** (3–5 players) | available |

Each game offers: **Learn** (lessons), **Practice** (drills), **Play** (vs bots, with coach and learning aids), **Hand Advisor** (enter your real cards) and **Reference** (rules, glossary).

## Run locally
Open `index.html` directly, or `python3 -m http.server` and visit http://localhost:8000.

## Deploy on GitHub Pages
Repo **Settings → Pages → Deploy from a branch → `main` / root**.

## Tests
```
node test/tarot.sim.js 1000   # bot-only Tarot deals: 78 cards accounted for, 91 points, zero-sum scores (LANG_FR=1 to run in French)
node test/poker.eval.js       # hand evaluator, equity, outs, Chen score
node test/poker.sim.js 1500   # bot-only Hold'em hands: chips conserved, side pots add up
node test/draw.sim.js 1500    # bot-only 5-card draw hands (draw phase, chips, pots)
node test/escoba.sim.js 300   # bot-only Escoba games: all 40 cards end up in piles, scoring
node test/chinchon.sim.js 200 # bot-only Chinchón games (2-4 players): meld rules, closing, 40 cards conserved
node test/tute.sim.js 500     # bot-only Tute hands: trick rules, 120 card points, cantes, 40 cards conserved
node test/mus.sim.js 100      # Mus rules (grande, chica, pares, juego) + bot-only games to 40 piedras
node test/brisca.sim.js 500   # bot-only Brisca hands: 120 points, 40 cards conserved
node test/cinquillo.sim.js 200 # bot-only Cinquillo games (3-4 players): every round ends, cards conserved
node test/sietemedio.sim.js 200 # Siete y medio: values, risk maths, bot-only games
node test/podrida.sim.js 100  # Podrida: scoring, schedule, legal cards, dealer's forbidden bid, bot-only games
node test/rami.eval.js        # Rami combination rules (sets, runs, jokers, ace, arrangement search)
node test/rami.sim.js 12      # bot-only Rami games: 108 cards conserved, every round ends
```

## Layout
```
index.html            shell; loads every game's scripts
css/style.css         shared styles (cards, table, panels)
js/core.js            DOM helper + game registry (Core.register)
js/app.js             router (#/<game>/<screen>/<params>) and game hub
games/<game>/         one folder per game, registered in register.js
                      (games/draw/ builds on the engine in games/poker/, games/rami/ reuses its card faces;
                       games/escoba/ and future Spanish games share games/spanish/)
  cards, rules/game, bots   engine and AI (no DOM, testable in Node)
  ui, learn, drills, play, advisor   screens
```
**Languages:** a game that supports several languages declares `langs: ['en', 'fr']` in `Core.register` and writes every visible string as `Core.t(english, french)` (evaluated at render time). The header then shows an EN / FR switch (remembered in the browser; switching restarts the current screen). Card names and rule texts are getters so they follow the language. Games without `langs` show no switch.

To add a game: create `games/<id>/`, build screens as `fn(root, params)`, call `Core.register('<id>', {...})` and add the scripts to `index.html`.

Old Tarot URLs (`#/play`, `#/learn/3`, ...) redirect to `#/tarot/...`.

## Known simplifications
- **Tarot:** no Poignée, Chelem or 3/5-player variants; automatic Excuse exchange.
- **Brisca:** 2 players only, no "cambiar el siete". Reuses the Tute card order, points and trick AI (games/tute).
- **Cinquillo:** 3-4 players, passing only when no card is playable (free), scoring = cards left in the others' hands, to 30.
- **Siete y medio:** no chips or bets: each duel won against the bank is 1 point (2 with a natural 7½); the bank rotates; to 12.
- **Podrida:** exact bid = 10 + 2 per trick bid, otherwise -2 per trick of difference; ace-high order; no obligation to overtake; short (1→5→1) or full game.
- **Mus:** mus a 8 reyes, one game to 40 piedras (no vacas), bets of 2 or 5 plus órdago, no señas (your partner is a bot).
- **Rami:** opening at 51 + a pure suite; at most one joker per combination; unopened players count a flat 100 penalty; fixed number of rounds.
- **Tute:** 2-player tute arrastrado only; no swap of the 2 of triumph; no obligation to lead from a sung pair.
- **Chinchón:** no comodines (jokers); a round nobody can close after 60 turns is void (tablas).
- **Escoba:** 2 players only; a card that can capture must capture.
- **Poker (Hold'em and Draw):** one table format (fixed blinds $10/$20, 4 seats), no tournaments; a short all-in raise reopens the betting. Bots use hand strength + Monte Carlo equity vs pot odds, not opponent modelling.
