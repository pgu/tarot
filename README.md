# Tarot Academy

Learn and play **French Tarot** (4 players, 78 cards) in the browser. Static site: plain HTML/CSS/JS, no build step.

## Modes
- **Learn**: 9 short lessons (cards, points, bidding, dog, tricks, Excuse, scoring, strategy) with embedded exercises.
- **Practice**: endless drills: legal cards, trick winner, point counting, bid-or-pass.
- **Play**: full deal against 3 bots. Learning aids (toggleable): legal-card highlighting, rule explanation, card suggestions, bid advice, discard suggestions, bot reasoning in the log, live point count.
- **Hand Advisor**: enter your real 18 cards (and optionally the dog) to get a bid suggestion, discard advice and opening lead.
- **Reference**: deck, scoring cheat-sheet, glossary.

## Run locally
Open `index.html` directly, or `python3 -m http.server` and visit http://localhost:8000.

## Deploy on GitHub Pages
Repo **Settings → Pages → Deploy from a branch → `main` / root**.

## Tests
`node test/sim.js 1000` plays 1000 bot-only deals and checks invariants (78 cards accounted for, 91 points, zero-sum scores).

## Layout
| File | Role |
|---|---|
| `js/cards.js` | deck, point values |
| `js/rules.js` | legal moves, trick winner, contracts, discard validation |
| `js/bots.js` | hand evaluation, bidding, discard and card-play heuristics (also used by the coach) |
| `js/game.js` | one-deal state machine and scoring (no DOM) |
| `js/ui.js`, `js/play.js`, `js/learn.js`, `js/drills.js`, `js/advisor.js`, `js/app.js` | screens and router |

## Not yet in v1
Poignée, Chelem, 3- and 5-player variants, exact Excuse exchange, multiplayer, smarter bots (card counting).
