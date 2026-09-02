import React, { useState, useCallback, useMemo } from "react";
import {
  Grid3x3,
  RotateCcw,
  ArrowLeft,
  Trophy,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  saveSudokuSolved,
  incrementGamesPlayed,
} from "@/lib/gameStats";

// ─── Mini Sudoku generation ─────────────────────────────────────────────────
// 4×4 Mini Sudoku uses numbers 1–4. Each row, column, and 2×2 block must be
// a permutation of {1,2,3,4}. We generate a valid grid by shuffling canonical
// rows, then pre-fill some cells as given clues.

type CellValue = number | null;
type Grid = CellValue[][];

// Build a valid 4×4 grid from four shuffled base rows.
const BASE_ROWS: number[][] = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

const shuffleRow = (row: number[]): number[] => {
  const a = [...row];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const shuffleBlockPair = (grid: Grid, blockRow: number): Grid => {
  // Swap two rows within the same 2×2 block
  const rows = [...grid.map((r) => [...r])];
  const r1 = blockRow;
  const r2 = blockRow + 1;
  [rows[r1], rows[r2]] = [rows[r2], rows[r1]];
  return rows;
};

const shuffleCols = (grid: Grid): Grid => {
  // Swap two columns within the same 2×2 block
  const g = grid.map((r) => [...r]);
  const [c1, c2] = Math.random() > 0.5 ? [0, 1] : [2, 3];
  for (const row of g) {
    [row[c1], row[c2]] = [row[c2], row[c1]];
  }
  return g;
};

const generateGrid = (): { solution: Grid; given: boolean[][] } => {
  // Start from base rows and shuffle
  let grid: Grid = BASE_ROWS.map(shuffleRow);

  // Randomly swap row pairs within each 2×2 block
  grid = shuffleBlockPair(grid, 0);
  grid = shuffleBlockPair(grid, 2);

  // Randomly swap column pairs within each 2×2 block
  grid = shuffleCols(grid);
  grid = shuffleCols(grid);

  const solution = grid.map((r) => [...r]);

  // Remove some cells to create clues (keep ~8–10 cells given)
  const given: boolean[][] = Array.from({ length: 4 }, () =>
    Array(4).fill(false)
  );
  const positions: [number, number][] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) positions.push([r, c]);
  // Shuffle and keep ~9 positions as given
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  const keep = 9;
  for (let i = 0; i < keep; i++) {
    const [r, c] = positions[i];
    given[r][c] = true;
  }

  return { solution, given };
};

interface SudokuMiniProps {
  onBack: () => void;
}

const SudokuMini: React.FC<SudokuMiniProps> = ({ onBack }) => {
  const [newGame, setNewGame] = useState(() => generateGrid());
  const [grid, setGrid] = useState<Grid>(() =>
    newGame.given.map((row) => row.map((g, ci) => (g ? newGame.solution[0][ci] : null)))
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");

  const { given } = newGame;

  // ── Check if grid is complete and valid ──────────────────────────
  const checkWin = useCallback((g: Grid) => {
    // Check all rows, cols, blocks have 1-4
    for (let i = 0; i < 4; i++) {
      const rowVals = g[i].filter((v) => v !== null);
      if (new Set(rowVals).size !== rowVals.length) return false;
      const colVals = g.map((r) => r[i]).filter((v) => v !== null);
      if (new Set(colVals).size !== colVals.length) return false;
    }
    // Check 2×2 blocks
    for (let br = 0; br < 4; br += 2) {
      for (let bc = 0; bc < 4; bc += 2) {
        const blockVals: number[] = [];
        for (let r = br; r < br + 2; r++)
          for (let c = bc; c < bc + 2; c++) {
            if (g[r][c] !== null) blockVals.push(g[r][c]!);
          }
        if (new Set(blockVals).size !== blockVals.length) return false;
      }
    }
    // Check full
    if (g.some((r) => r.some((c) => c === null))) return false;
    return true;
  }, []);

  // ── Conflict detection ───────────────────────────────────────────
  const computeErrors = useCallback(
    (g: Grid): Set<string> => {
      const errs = new Set<string>();
      const getKey = (r: number, c: number) => `${r},${c}`;

      const addErr = (r: number, c: number) => errs.add(getKey(r, c));

      for (let r = 0; r < 4; r++) {
        const rowVals = g[r].map((v, c) => ({ v, c })).filter((x) => x.v !== null);
        for (let i = 0; i < rowVals.length; i++) {
          for (let j = i + 1; j < rowVals.length; j++) {
            if (rowVals[i].v === rowVals[j].v) {
              addErr(r, rowVals[i].c);
              addErr(r, rowVals[j].c);
            }
          }
        }
      }

      for (let c = 0; c < 4; c++) {
        const colVals: { v: number; r: number }[] = [];
        for (let r = 0; r < 4; r++) if (g[r][c] !== null) colVals.push({ v: g[r][c]!, r });
        for (let i = 0; i < colVals.length; i++) {
          for (let j = i + 1; j < colVals.length; j++) {
            if (colVals[i].v === colVals[j].v) {
              addErr(colVals[i].r, c);
              addErr(colVals[j].r, c);
            }
          }
        }
      }

      for (let br = 0; br < 4; br += 2) {
        for (let bc = 0; bc < 4; bc += 2) {
          const block: { v: number; r: number; c: number }[] = [];
          for (let r = br; r < br + 2; r++)
            for (let c = bc; c < bc + 2; c++)
              if (g[r][c] !== null) block.push({ v: g[r][c]!, r, c });
          for (let i = 0; i < block.length; i++) {
            for (let j = i + 1; j < block.length; j++) {
              if (block[i].v === block[j].v) {
                addErr(block[i].r, block[i].c);
                addErr(block[j].r, block[j].c);
              }
            }
          }
        }
      }

      return errs;
    },
    []
  );

  // ── Place a number ───────────────────────────────────────────────
  const placeNumber = useCallback(
    (num: number | null) => {
      if (selectedCell === null) return;
      const [r, c] = selectedCell;
      if (given[r][c]) return; // can't overwrite given cells

      const next: Grid = grid.map((row) => [...row]);
      next[r][c] = num;

      setGrid(next);

      if (num !== null) {
        const newErrors = computeErrors(next);
        setErrors(newErrors);

        if (checkWin(next)) {
          setCompleted(true);
          setPhase("done");
          saveSudokuSolved();
        }
      } else {
        setErrors(new Set());
      }
    },
    [selectedCell, given, grid, computeErrors, checkWin]
  );

  // ── Clear selected cell ─────────────────────────────────────────
  const clearCell = useCallback(() => {
    placeNumber(null);
  }, [placeNumber]);

  // ── Start / restart ─────────────────────────────────────────────
  const startGame = useCallback(() => {
    const fresh = generateGrid();
    setNewGame(fresh);
    setGrid(fresh.given.map((row, r) => row.map((g, c) => (g ? fresh.solution[r][c] : null))));
    setSelectedCell(null);
    setErrors(new Set());
    setCompleted(false);
    setPhase("playing");
    incrementGamesPlayed();
  }, []);

  // ── Derived state ──────────────────────────────────────────────
  const filledCount = useMemo(
    () => grid.flat().filter((v) => v !== null).length,
    [grid]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
          className="rounded-2xl gap-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 self-start"
        >
          <ArrowLeft size={18} />
          Back to Games Hub
        </Button>

        <div className="inline-flex items-center gap-2 rounded-2xl bg-sky-100 dark:bg-sky-950/40 px-4 py-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600">
            Filled
          </span>
          <span className="text-lg font-black text-sky-700">
            {filledCount}/16
          </span>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Grid3x3 size={16} className="text-sky-500" />}
          label="Filled"
          value={`${filledCount}/16`}
          colorClass="text-sky-600"
        />
        <StatCard
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          label="Errors"
          value={errors.size}
          colorClass={errors.size > 0 ? "text-rose-600" : "text-emerald-600"}
        />
      </div>

      {/* ── Main Sudoku card ─────────────────────────────────── */}
      <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />

        <div className="p-6 sm:p-8 space-y-6">
          {phase === "idle" && (
            <div className="text-center space-y-5 py-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-200 dark:shadow-none">
                <Grid3x3 size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Sudoku Mini
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto font-medium">
                  Fill the 4×4 grid so every row, column, and 2×2 block
                  contains the numbers 1–4. Tap a cell, then tap a number.
                </p>
              </div>
              <Button
                onClick={startGame}
                size="lg"
                className="rounded-2xl h-12 px-8 font-black text-sm gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-200 hover:shadow-xl active:scale-[0.98]"
              >
                <Sparkles size={18} />
                Start Game
              </Button>
            </div>
          )}

          {phase !== "idle" && (
            <>
              {/* Sudoku grid */}
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {grid.map((row, r) =>
                    row.map((cell, c) => {
                      const isGiven = given[r][c];
                      const isSelected =
                        selectedCell !== null &&
                        selectedCell[0] === r &&
                        selectedCell[1] === c;
                      const hasError = errors.has(`${r},${c}`);
                      const isFilled = cell !== null;

                      // 2×2 block border
                      const borderR = r % 2 === 0 ? "border-r-2 border-slate-300 dark:border-slate-600" : "";
                      const borderB = c % 2 === 0 ? "border-b-2 border-slate-300 dark:border-slate-600" : "";

                      return (
                        <button
                          key={`${r}-${c}`}
                          onClick={() => {
                            if (!isGiven || cell !== null) {
                              setSelectedCell([r, c]);
                            }
                          }}
                          className={`
                            relative aspect-square rounded-2xl font-black text-xl sm:text-2xl
                            transition-all duration-150 select-none
                            ${borderR} ${borderB}
                            ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-md scale-105 ring-2 ring-indigo-400"
                                : hasError
                                ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                                : isGiven
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-default"
                                : isFilled
                                ? "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border-2 border-dashed border-slate-200 dark:border-slate-700"
                            }
                          `}
                        >
                          {cell ?? ""}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Number selector */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
                  {selectedCell !== null
                    ? "Tap a number to place"
                    : "Tap an empty cell first"}
                </p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        if (selectedCell) {
                          placeNumber(n);
                        }
                      }}
                      disabled={selectedCell === null}
                      className={`
                        w-14 h-14 rounded-2xl font-black text-2xl
                        transition-all duration-150 active:scale-90
                        ${
                          selectedCell === null
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed"
                            : "bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md hover:shadow-lg"
                        }
                      `}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={clearCell}
                    disabled={selectedCell === null}
                    variant="outline"
                    className="rounded-2xl h-10 font-bold text-xs gap-1.5 border-slate-200 dark:border-slate-700 disabled:opacity-40"
                  >
                    ✕ Clear
                  </Button>
                  <Button
                    onClick={startGame}
                    variant="ghost"
                    className="rounded-2xl h-10 font-bold text-xs gap-1.5 text-slate-500"
                  >
                    <RotateCcw size={13} />
                    New Grid
                  </Button>
                </div>
              </div>

              {/* Conflict notice */}
              {errors.size > 0 && (
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-4 py-2 text-center">
                  <p className="text-xs font-bold text-rose-600">
                    {errors.size} cell{errors.size > 1 ? "s have" : " has"} a
                    conflict — check rows, columns, or blocks.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Win modal ────────────────────────────────────────── */}
      <Dialog
        open={phase === "done"}
        onOpenChange={(o) => !o && setPhase("done")}
      >
        <DialogContent className="rounded-3xl border-0 sm:max-w-md overflow-hidden p-0">
          <div className="bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner mb-3">
              <Trophy size={32} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white text-center">
                Sudoku Solved!
              </DialogTitle>
              <DialogDescription className="text-white/90 text-center font-medium">
                Perfect logic — you cracked the grid.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Filled
                </div>
                <div className="text-2xl font-black text-sky-600 mt-1">
                  16/16
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Conflicts
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  0
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={startGame}
                className="flex-1 rounded-2xl h-12 font-black text-sm gap-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md hover:shadow-lg"
              >
                <RotateCcw size={16} />
                New Grid
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="flex-1 rounded-2xl h-12 font-bold text-sm gap-2"
              >
                <ArrowLeft size={16} />
                Back to Hub
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  colorClass = "text-slate-700 dark:text-slate-200",
}) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm">
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {icon}
      {label}
    </div>
    <div className={`mt-1 text-2xl sm:text-3xl font-black tabular-nums ${colorClass}`}>
      {value}
    </div>
  </div>
);

export default SudokuMini;
