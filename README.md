# Brick Breaker

A classic brick–breaker arcade game built in vanilla JavaScript, with modern gameplay extras such as power-ups, power-downs and a persistent local leaderboard.

The project is fully client-side (no database). Locally it can be served with Python's built-in `http.server`; on Render it uses a tiny dependency-free Node static server.

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

- **Leaderboard (LocalStorage)**
  - Persistent **top-5 leaderboard**, stored in the browser using `localStorage`.
  - Player can enter a nickname (up to 10 characters).
  - New score is inserted in the correct position and the table is kept sorted.
  - If more than 5 scores are present, the lowest one is removed.
  - The last inserted score row is visually highlighted.

---

## 🗂 Project structure

```text
make-your-game/
├── css/
│   └── style.css           # All styles for HUD, game area, overlays and leaderboard
├── js/
│   ├── core/
│   │   ├── input.js        # Keyboard input handling (movement, pause, launch ball)
│   │   ├── loop.js         # Main game loop (update + render + FPS)
│   │   └── state.js        # Initial game state and state structure
│   ├── systems/
│   │   ├── collision.js    # Ball collisions with walls, paddle and bricks
│   │   ├── highscores.js   # LocalStorage leaderboard utilities
│   │   ├── physics.js      # Ball & paddle physics (movement, slow effect)
│   │   └── rules.js        # Game rules, levels, power-ups & power-downs
│   ├── ui/
│   │   ├── dom.js          # DOM element lookups
│   │   ├── hud.js          # HUD updates (score, time, level, FPS)
│   │   └── overlays.js     # Pause and game-over overlays
│   │── config.js           # Global configuration (sizes, speeds, constants)
│   └── main.js             # Game entry point and orchestration
├── index.html              # Main HTML shell
├── package.json            # Render start script
├── server.js               # Dependency-free static server for Render
└── README.md               # Project documentation (this file)
```

---

## 🔧 Technologies

- **HTML5 / CSS3 / JavaScript (ES Modules)**
- **Python `http.server`** (local static server)
- **Node.js built-in HTTP server** (Render)
- **LocalStorage** for persistent leaderboard

---

## 🚀 Getting Started

Run a local static server from the project root:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
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

Scores are stored in **localStorage** under a `highscores` key.

Each entry includes:

- `nickname` – string, up to **10 characters**
- `score` – numeric final score

### When the game ends:

1. The player enters a nickname and clicks **“Save Score”**.
2. The new score is:
   - Inserted in the correct sorted position (**highest → lowest**).
   - Limited to **top 5 entries** (the lowest is removed if needed).
3. The leaderboard is rendered in the Game Over overlay.
4. The newly inserted row is **highlighted**.

Leaderboard data is **per browser and per device**.

## 🌐 Deploying

Render Web Service settings:

```text
Environment: Node
Build Command: npm install
Start Command: npm start
```

The Node server only serves the static files; it does not use Express or external dependencies.

---

## 🧪 Ideas for future improvements

- Sound effects + background music.
- Mobile / touch controls.
- More brick types (HP bricks, unbreakable bricks, bonus bricks).
- Settings menu (difficulty presets, toggle SFX/music, adjust speed).
