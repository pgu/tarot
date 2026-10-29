# Card Academy

Learn and play classic card games in the browser, with lessons, practice drills, games against bots with a coach, and a hand advisor for real cards. Static site: plain HTML/CSS/JS, no build step.

## Games
| Game | Status |
|---|---|
| **French Tarot** (4 players, 78 cards) | available |
| **Texas Hold'em** (no-limit, you + 3 bots) | available |
| Rami, Chinchón, La Escoba, El Tute | planned |

Each game offers: **Learn** (lessons), **Practice** (drills), **Play** (vs bots, with coach and learning aids), **Hand Advisor** (enter your real cards) and **Reference** (rules, glossary).

## Run locally
Open `index.html` directly, or `python3 -m http.server` and visit http://localhost:8000.

## Deploy on GitHub Pages
Repo **Settings → Pages → Deploy from a branch → `main` / root**.

## Tests
```
node test/tarot.sim.js 1000   # bot-only Tarot deals: 78 cards accounted for, 91 points, zero-sum scores
node test/poker.eval.js       # hand evaluator, equity, outs, Chen score
node test/poker.sim.js 1500   # bot-only poker hands: chips conserved, side pots add up
```

## Layout
```
index.html            shell; loads every game's scripts
css/style.css         shared styles (cards, table, panels)
js/core.js            DOM helper + game registry (Core.register)
js/app.js             router (#/<game>/<screen>/<params>) and game hub
games/<game>/         one folder per game, registered in register.js
  cards, rules/game, bots   engine and AI (no DOM, testable in Node)
  ui, learn, drills, play, advisor   screens
```
To add a game: create `games/<id>/`, build screens as `fn(root, params)`, call `Core.register('<id>', {...})` and add the scripts to `index.html`.

Old Tarot URLs (`#/play`, `#/learn/3`, ...) redirect to `#/tarot/...`.

## Known simplifications
- **Tarot:** no Poignée, Chelem or 3/5-player variants; automatic Excuse exchange.
- **Poker:** one table format (fixed blinds $10/$20, 4 seats), no tournaments; a short all-in raise reopens the betting. Bots use hand strength + Monte Carlo equity vs pot odds, not opponent modelling.
