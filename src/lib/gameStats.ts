// Shared localStorage keys and helpers for the Games Hub

const PREFIX = "munyaka:games";

// ── Key builders ────────────────────────────────────────────────────────────
const key = (suffix: string) => `${PREFIX}:${suffix}`;

export const KEYS = {
  // Meta
  meta: key("meta"),        // aggregate stats across all games

  // Speed Math Blitz
  speedMathHighScore: key("speed-math:high-score"),
  speedMathBestStreak: key("speed-math:best-streak"),

  // Memory Match
  memoryMatchesCompleted: key("memory:matches-completed"),
  memoryBestTime: key("memory:best-time"),
  memoryBestMoves: key("memory:best-moves"),

  // Word Scramble
  wordBestScore: key("word:best-score"),
  wordWordsCompleted: key("word:words-completed"),

  // Sudoku Mini
  sudokuPuzzlesSolved: key("sudoku:puzzles-solved"),
} as const;

// ── Generic helpers ─────────────────────────────────────────────────────────
const safeGet = (k: string, fallback: number): number => {
  try {
    return parseInt(localStorage.getItem(k) ?? String(fallback), 10) || fallback;
  } catch {
    return fallback;
  }
};

const safeSet = (k: string, value: number) => {
  try {
    localStorage.setItem(k, String(value));
  } catch {
    // ignore quota / privacy errors
  }
};

// ── Aggregate meta ──────────────────────────────────────────────────────────
interface GameMeta {
  totalGamesPlayed: number;
}

export const loadMeta = (): GameMeta => {
  try {
    const raw = localStorage.getItem(KEYS.meta);
    if (!raw) return { totalGamesPlayed: 0 };
    return JSON.parse(raw) as GameMeta;
  } catch {
    return { totalGamesPlayed: 0 };
  }
};

export const saveMeta = (meta: GameMeta) => {
  try {
    localStorage.setItem(KEYS.meta, JSON.stringify(meta));
  } catch {
    // ignore
  }
};

export const incrementGamesPlayed = () => {
  const meta = loadMeta();
  saveMeta({ totalGamesPlayed: meta.totalGamesPlayed + 1 });
};

// ── Per-game helpers ────────────────────────────────────────────────────────
export const getHighScore = (gameKey: string) => safeGet(key(`${gameKey}:high-score`), 0);
export const setHighScore = (gameKey: string, value: number) => {
  const current = getHighScore(gameKey);
  if (value > current) safeSet(key(`${gameKey}:high-score`), value);
};

// Speed Math
export const loadSpeedMathBestStreak = () => safeGet(KEYS.speedMathBestStreak, 0);
export const saveSpeedMathBestStreak = (v: number) => {
  const current = loadSpeedMathBestStreak();
  if (v > current) safeSet(KEYS.speedMathBestStreak, v);
};

// Memory Match
export const loadMemoryMatchesCompleted = () => safeGet(KEYS.memoryMatchesCompleted, 0);
export const loadMemoryBestTime = () => safeGet(KEYS.memoryBestTime, 9999); // lower is better — 9999 = not set
export const loadMemoryBestMoves = () => safeGet(KEYS.memoryBestMoves, 999);

export const saveMemoryResult = (time: number, moves: number) => {
  const completed = loadMemoryMatchesCompleted() + 1;
  safeSet(KEYS.memoryMatchesCompleted, completed);
  if (time < loadMemoryBestTime()) safeSet(KEYS.memoryBestTime, time);
  if (moves < loadMemoryBestMoves()) safeSet(KEYS.memoryBestMoves, moves);
};

// Word Scramble
export const loadWordBestScore = () => safeGet(KEYS.wordBestScore, 0);
export const loadWordWordsCompleted = () => safeGet(KEYS.wordWordsCompleted, 0);
export const saveWordResult = (score: number, wordsCompleted: number) => {
  safeSet(KEYS.wordBestScore, Math.max(loadWordBestScore(), score));
  safeSet(KEYS.wordWordsCompleted, loadWordWordsCompleted() + wordsCompleted);
};

// Sudoku Mini
export const loadSudokuPuzzlesSolved = () => safeGet(KEYS.sudokuPuzzlesSolved, 0);
export const saveSudokuSolved = () => {
  safeSet(KEYS.sudokuPuzzlesSolved, loadSudokuPuzzlesSolved() + 1);
};
