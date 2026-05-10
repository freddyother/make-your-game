CREATE TABLE IF NOT EXISTS highscores (
  id BIGSERIAL PRIMARY KEY,
  nickname VARCHAR(10) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_highscores_leaderboard
  ON highscores (score DESC, created_at ASC, id ASC);
