# Brick Breaker

A classic brick–breaker arcade game built in vanilla JavaScript, with modern gameplay extras such as power-ups, power-downs and a persistent local leaderboard.

The project is fully client-side (no database) and is served by a small Node/Express server, making it easy to deploy on Render, Netlify, or any Node-compatible platform.

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
  - **Multi-ball hook** – state and power-up prepared for future multi-ball support.

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
│   │   ├── config.js       # Global configuration (sizes, speeds, constants)
│   │   ├── dom.js          # DOM element lookups
│   │   ├── hud.js          # HUD updates (score, time, level, FPS)
│   │   └── overlays.js     # Pause and game-over overlays
│   └── main.js             # Game entry point and orchestration
├── index.html              # Main HTML shell
├── server.js               # Small Express server to serve the static game
├── package.json            # Node/Express configuration and scripts
└── README.md               # Project documentation (this file)
```

---

## 🔧 Technologies

- **HTML5 / CSS3 / JavaScript (ES Modules)**
- **Node.js + Express** (static server)
- **LocalStorage** for persistent leaderboard

---

## 🚀 Getting started (local)

### 1. Prerequisites

- **Node.js** (LTS recommended)
- **npm** (comes with Node)

> 💡 En Kali u otras distros Linux, es recomendable instalar Node usando **nvm** en lugar de `apt`, para evitar conflictos con paquetes del sistema.

---

### 2. Install dependencies

From the project root:

```bash
npm install
```

## This installs express and any other dependencies defined in package.json.

### 3. Run the server

```bash
npm start
```

By default, server.js will:

- Read the port from process.env.PORT (for platforms like Render).

- Fallback to a local port (e.g. 3000) when running manually.

Then open your browser at:

```bash
http://localhost:3000
```

(or the port printed in your terminal).

## 🎯 How to play

- **Move paddle:** Left / Right arrow keys (or **A / D**, depending on input setup).

- **Launch ball:** Press **Space** when the ball is on the paddle.

- **Pause / unpause:** Press **Space** during gameplay.

Break all bricks to advance to the next level.

⚠️ Watch out for **red power-downs** once your paddle gets really big!

---

## 🍀 Power-ups summary

| Type          | Colour        | Effect                                            |
| ------------- | ------------- | ------------------------------------------------- |
| Extra life    | Green         | +1 life                                           |
| Widen paddle  | Blue          | Increases paddle width up to a maximum limit      |
| Shrink paddle | Red           | Decreases paddle width towards the original size  |
| Slow          | (e.g. purple) | Temporarily halves ball speed                     |
| Score ×2      | (e.g. yellow) | Temporarily doubles all score gained              |
| Multi-ball    | –             | State/plumbing prepared for future implementation |

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

## 🌐 Deploying to Render

1. Push this repository to **GitHub**.
2. In **Render**:
   - Create a new **Web Service**.
   - Connect your GitHub repo.
   - Set:
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
3. Deploy.

Render will run `server.js`, which serves:

- `index.html`
- `/css`
- `/js`

as static assets.

---

## 🧪 Ideas for future improvements

- Full multi-ball support (multiple balls in physics/collision/render).
- Sound effects + background music.
- Mobile / touch controls.
- More brick types (HP bricks, unbreakable bricks, bonus bricks).
- Settings menu (difficulty presets, toggle SFX/music, adjust speed).
