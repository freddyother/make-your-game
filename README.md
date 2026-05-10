# Brick Breaker

A classic brick–breaker arcade game built in vanilla JavaScript, with modern gameplay extras such as power-ups, power-downs and a persistent PostgreSQL leaderboard.

The project uses a small Node server for static files and leaderboard API routes. PostgreSQL stores player scores.

---

## 🎮 Features

- **Core gameplay**

  - Single ball brick-breaker with multiple levels.
  - Increasing ball speed as levels go up.
  - Limited lives and game-over screen.

- **Power-ups & power-downs**

  - **Extra life** (green).
  - **Widen paddle** (blue) – paddle grows incrementally up to a maximum size.
  - **Shrink paddle** (red, power-down) – paddle shrinks back down in steps towards the original size.
  - **Slow motion** – temporarily reduces ball speed.
  - **Score ×2** – temporary score multiplier.
  - **Multi-ball hook** – Collecting this power-up splits the main ball into several active balls, allowing multiple brick hits at once.

- **HUD**

  - Live display of: time, score, level, lives and FPS.

- **Pause & restart**

  - In-game pause overlay.
  - Restart from pause or from game-over.

- **Leaderboard (PostgreSQL)**
  - Persistent **top-5 leaderboard**, stored in PostgreSQL.
  - Player can enter a nickname (up to 10 characters).
  - New score is inserted in the correct position and the table is kept sorted.
  - The table displays the top 5 while the database keeps a bounded top-score history.
  - The last inserted score row is visually highlighted.

---

## 🗂 Project structure

```text
make-your-game/
├── css/
│   └── style.css           # All styles for HUD, game area, overlays and leaderboard
├── db/
│   └── init/
│       └── 001_highscores.sql # PostgreSQL schema for leaderboard scores
├── js/
│   ├── core/
│   │   ├── input.js        # Keyboard input handling (movement, pause, launch ball)
│   │   ├── loop.js         # Main game loop (update + render + FPS)
│   │   └── state.js        # Initial game state and state structure
│   ├── systems/
│   │   ├── collision.js    # Ball collisions with walls, paddle and bricks
│   │   ├── highscores.js   # Leaderboard API client
│   │   ├── physics.js      # Ball & paddle physics (movement, slow effect)
│   │   ├── rules.js        # Game rules, levels, power-ups & power-downs
│   │   └── sound.js        # Generated Web Audio sound effects
│   ├── ui/
│   │   ├── dom.js          # DOM element lookups
│   │   ├── hud.js          # HUD updates (score, time, level, FPS)
│   │   └── overlays.js     # Pause and game-over overlays
│   │── config.js           # Global configuration (sizes, speeds, constants)
│   └── main.js             # Game entry point and orchestration
├── index.html              # Main HTML shell
├── docker-compose.yml      # Local PostgreSQL service
├── package.json            # Node dependencies and start script
├── server.js               # Static server and leaderboard API
└── README.md               # Project documentation (this file)
```

---

## 🔧 Technologies

- **HTML5 / CSS3 / JavaScript (ES Modules)**
- **Node.js built-in HTTP server**
- **PostgreSQL** for persistent leaderboard scores
- **Docker Compose** for local PostgreSQL

---

## 🚀 Getting Started

Install dependencies:

```bash
npm install
```

Start PostgreSQL:

```bash
npm run db:up
```

Start the game server:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

Default local database settings are:

```text
PGHOST=localhost
PGPORT=5434
PGDATABASE=make_your_game
PGUSER=postgres
PGPASSWORD=postgres
```

## 🎯 How to play

- **Move paddle:** Left / Right arrow keys (or **A / D**, depending on input setup).

- **Launch ball:** Press **Space** when the ball is on the paddle.

- **Pause / unpause:** Press **Space** during gameplay.

Break all bricks to advance to the next level.

⚠️ Watch out for **red power-downs** once your paddle gets really big!

---

## 🍀 Power-ups summary

| Type          | Colour | Effect                                            |
| ------------- | ------ | ------------------------------------------------- |
| Extra life    | Green  | +1 life                                           |
| Widen paddle  | Blue   | Increases paddle width up to a maximum limit      |
| Shrink paddle | Red    | Decreases paddle width towards the original size  |
| Slow          | Purple | Temporarily halves ball speed                     |
| Score ×2      | Yellow | Temporarily doubles all score gained              |
| Multi-ball    | Red    | State/plumbing prepared for future implementation |

_(Colours depend on your final CSS classes.)_

---

## 🥇 Leaderboard details

Scores are stored in PostgreSQL in the `highscores` table.

Each entry includes:

- `nickname` – string, up to **10 characters**
- `score` – numeric final score

### When the game ends:

1. The player enters a nickname and clicks **“Save Score”**.
2. The browser posts the score to `POST /api/highscores`.
3. The server inserts the score in PostgreSQL and returns the current top 5 sorted **highest → lowest**.
4. The leaderboard is rendered in the Game Over overlay.
5. The newly inserted row is **highlighted** if it enters the top 5.

Leaderboard data is shared by every player connected to the same database. The server keeps the best 500 stored rows to avoid unbounded table growth.

## 🌐 Deploying

Render Web Service settings:

```text
Environment: Node
Build Command: npm install
Start Command: npm start
```

Set a PostgreSQL `DATABASE_URL` environment variable for production. If your provider requires SSL, also set `PGSSLMODE=require`.

Recommended production environment variables:

```text
NODE_ENV=production
DATABASE_URL=postgres://...
PGSSLMODE=require
TRUST_PROXY=true
```

Use `TRUST_PROXY=true` only when the app is behind a trusted reverse proxy or CDN that sets `X-Forwarded-For` / `CF-Connecting-IP`.

## 🔐 Security notes

- Serve the game with `npm start`, not `python3 -m http.server`, because the leaderboard API and PostgreSQL live in `server.js`.
- The Node server only serves `index.html`, `css/`, `js/` and `assets/`; internal files such as `.env`, `server.js`, `package.json`, `db/` and Docker files are blocked.
- Score submissions are JSON-only, rate-limited per client IP and validated server-side.
- Nicknames are normalised to uppercase letters, numbers, spaces, `_` and `-`, max 10 characters.
- Scores must be between `0` and `999999999`.
- The leaderboard is suitable for a casual public game. A fully competitive anti-cheat would require server-authoritative gameplay or score verification beyond this client-side game.
- Keep secrets in environment variables. Do not deploy a real `.env` file into the public web root.
- Terminate HTTPS at your platform, reverse proxy or CDN before traffic reaches the Node app.

---

## 🧪 Ideas for future improvements

- Sound effects + background music.
- Mobile / touch controls.
- More brick types (HP bricks, unbreakable bricks, bonus bricks).
- Settings menu (difficulty presets, toggle SFX/music, adjust speed).
