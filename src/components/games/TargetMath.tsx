import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Calculator,
  ArrowLeft,
  RefreshCw,
  Trophy,
  Sparkles,
  Check,
  X,
  RotateCcw,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  saveTargetMathResult,
  loadTargetMathHighScore,
  loadTargetMathPuzzlesSolved,
  incrementGamesPlayed,
} from "@/lib/gameStats";

/**
 * Target Math Challenge
 * ─────────────────────
 * Each round presents 4 numbers and a randomly chosen target (20–100).
 * The player combines the numbers using + − × ÷ (each at most once) to reach
 * the target.  They can also choose to SKIP a round.
 *
 * Scoring:
 *   Perfect solution (all 4 numbers used)  → +20 pts
 *   Partial solution (3 numbers used)       → +10 pts
 *   Skip                                     → 0 pts
 *   Miss (wrong equation)                    → −5 pts  (3 misses = game over)
 *
 * High score and total puzzles solved are persisted in localStorage.
 */

type Op = "+" | "−" | "×" | "÷";

interface Equation {
  id: string;
  left: number;
  op: Op;
  right: number;
}

interface Puzzle {
  numbers: number[];
  target: number;
  solutions: Equation[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Attempts to build a puzzle where the target is reachable using some
 * subset of the 4 numbers.
 */
const buildPuzzle = (): Puzzle => {
  const ops: Op[] = ["+", "−", "×", "÷"];
  let attempts = 0;

  while (attempts < 200) {
    attempts++;
    // Pick 4 numbers in the range 1–9 (avoid zeros and ones for variety)
    const rawNumbers = shuffle([1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8, 9]);
    const numbers = rawNumbers.slice(0, 4);

    // Randomly pick two operators
    const op1 = ops[Math.floor(Math.random() * ops.length)];
    const op2 = ops[Math.floor(Math.random() * ops.length)];

    // Try both parenthesisation orders: ((a op1 b) op2 c)  and  (a op1 (b op2 c))
    const tryEval = (a: number, op: Op, b: number): number | null => {
      if (op === "+") return a + b;
      if (op === "−") return a - b;
      if (op === "×") return a * b;
      if (op === "÷") return b === 0 ? null : a % b === 0 ? a / b : null;
    };

    // Try all permutations of numbers to find a solution
    const perms = shuffle(numbers);
    const tried = new Set<string>();

    for (const a of perms) {
      for (const b of perms) {
        if (b === a) continue;
        for (const c of perms) {
          if (c === a || c === b) continue;
          const d = numbers.find((n) => n !== a && n !== b && n !== c)!;
          if (!d) continue;

          const configs = [
            { order: [a, b, c, d], ops: [op1, op2] as Op[] },
            { order: [b, a, c, d], ops: [op1, op2] as Op[] },
            { order: [a, c, b, d], ops: [op1, op2] as Op[] },
            { order: [c, b, a, d], ops: [op1, op2] as Op[] },
          ];

          for (const { order, ops: pOps } of configs) {
            const [n0, n1, n2, n3] = order;
            const key = [n0, n1, n2, n3].join(",");
            if (tried.has(key)) continue;
            tried.add(key);

            // Parenthesise as ((n0 op n1) op (n2 op n3))
            const inner = tryEval(n2, pOps[1], n3);
            if (inner === null) continue;
            const result = tryEval(n0, pOps[0], inner);
            if (result === null) continue;

            // Round to avoid floating-point weirdness
            const rounded = Math.round(result);
            if (rounded < 10 || rounded > 150) continue;

            const solutions: Equation[] = [
              { id: `${key}-1`, left: n0, op: pOps[0], right: n1 },
              { id: `${key}-2`, left: n2, op: pOps[1], right: n3 },
            ];

            return { numbers: shuffle(numbers), target: rounded, solutions };
          }
        }
      }
    }
  }

  // Fallback: generate a simple puzzle
  const numbers = [2, 3, 4, 6];
  const target = numbers.reduce((a, b) => a + b, 0);
  return { numbers, target, solutions: [] };
};

/** Evaluate a partial expression string to a number (or null if invalid). */
const evalExpression = (nums: number[], ops: Op[]): number | null => {
  if (nums.length === 0) return null;
  if (ops.length === 0) return nums[0];

  const tryOp = (a: number, op: Op, b: number): number | null => {
    if (op === "+") return a + b;
    if (op === "−") return a - b;
    if (op === "×") return a * b;
    if (op === "÷") return b === 0 || a % b !== 0 ? null : a / b;
  };

  // Build expression: nums[0] op0 nums[1] op1 nums[2] op2 nums[3]
  const steps: Array<{ left: number; op: Op; right: number }> = [];
  let current = nums[0];
  for (let i = 0; i < ops.length; i++) {
    const result = tryOp(current, ops[i], nums[i + 1]);
    if (result === null) return null;
    steps.push({ left: current, op: ops[i], right: nums[i + 1] });
    current = result;
  }
  return Math.round(current);
};

type Phase = "idle" | "playing" | "feedback" | "completed";

interface TargetMathProps {
  onBack: () => void;
}

const TargetMath: React.FC<TargetMathProps> = ({ onBack }) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedOps, setSelectedOps] = useState<Op[]>([]);
  const [score, setScore] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "skip" | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [puzzlesSolvedTotal, setPuzzlesSolvedTotal] = useState(0);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setHighScore(loadTargetMathHighScore());
    setPuzzlesSolvedTotal(loadTargetMathPuzzlesSolved());
  }, []);

  // ── Puzzle control ─────────────────────────────────────────────
  const nextPuzzle = useCallback(() => {
    setPuzzle(buildPuzzle());
    setSelectedNumbers([]);
    setSelectedOps([]);
    setFeedback(null);
    setShowHint(false);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setPuzzlesSolved(0);
    setMistakes(0);
    nextPuzzle();
    setPhase("playing");
    incrementGamesPlayed();
  }, [nextPuzzle]);

  // ── Player actions ─────────────────────────────────────────────
  const selectNumber = useCallback((num: number) => {
    if (selectedNumbers.length >= 4) return;
    setSelectedNumbers((prev) => [...prev, num]);
  }, [selectedNumbers]);

  const selectOp = useCallback((op: Op) => {
    if (selectedNumbers.length === 0 || selectedNumbers.length > 3) return;
    if (selectedOps.length >= 3) return;
    if (selectedOps.length < selectedNumbers.length - 1) return;
    setSelectedOps((prev) => [...prev, op]);
  }, [selectedNumbers, selectedOps]);

  const undoLast = useCallback(() => {
    if (selectedOps.length > 0) {
      setSelectedOps((prev) => prev.slice(0, -1));
    } else if (selectedNumbers.length > 0) {
      setSelectedNumbers((prev) => prev.slice(0, -1));
    }
  }, [selectedNumbers, selectedOps]);

  const clearSelection = useCallback(() => {
    setSelectedNumbers([]);
    setSelectedOps([]);
    setFeedback(null);
  }, []);

  const evaluateAnswer = useCallback(() => {
    if (selectedNumbers.length < 2 || selectedOps.length === 0) return;
    const result = evalExpression(selectedNumbers, selectedOps);
    if (result === null) {
      setFeedback("wrong");
      setMistakes((m) => m + 1);
      setScore((s) => Math.max(0, s - 5));
      setTimeout(() => setFeedback(null), 700);
      return;
    }

    const isCorrect = result === puzzle?.target;
    const usedAll = selectedNumbers.length === 4 && selectedOps.length === 3;

    if (isCorrect) {
      setFeedback("correct");
      const pts = usedAll ? 20 : 10;
      setScore((s) => s + pts);
      const next = puzzlesSolved + 1;
      setPuzzlesSolved(next);
      saveTargetMathResult(score + pts, 1);
      setHighScore(loadTargetMathHighScore());
      setPuzzlesSolvedTotal(loadTargetMathPuzzlesSolved());
    } else {
      setFeedback("wrong");
      setMistakes((m) => m + 1);
      setScore((s) => Math.max(0, s - 5));
    }

    setPhase("feedback");
    setTimeout(() => {
      setFeedback(null);
      setPhase("playing");
      nextPuzzle();
    }, isCorrect ? 1000 : 1200);
  }, [selectedNumbers, selectedOps, puzzle, score, puzzlesSolved, nextPuzzle]);

  const skipPuzzle = useCallback(() => {
    setFeedback("skip");
    setPhase("feedback");
    saveTargetMathResult(score, 0);
    setTimeout(() => {
      setFeedback(null);
      setPhase("playing");
      nextPuzzle();
    }, 900);
  }, [score, nextPuzzle]);

  // ── Game over ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "playing" && mistakes >= 3) {
      saveTargetMathResult(score, 0);
      setHighScore(loadTargetMathHighScore());
      setPhase("completed");
    }
  }, [mistakes, phase, score]);

  // ── Derived ────────────────────────────────────────────────────
  const previewResult = useMemo(() => {
    if (selectedNumbers.length === 0) return null;
    return evalExpression(selectedNumbers, selectedOps);
  }, [selectedNumbers, selectedOps]);

  const isReady = selectedNumbers.length >= 2 && selectedOps.length === selectedNumbers.length - 1;

  const isNumberSelected = (num: number) =>
    selectedNumbers.filter((n) => n === num).length <
    puzzle?.numbers.filter((n) => n === num).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
          className="rounded-2xl gap-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 self-start"
        >
          <ArrowLeft size={18} />
          Back to Games Hub
        </Button>

        {phase === "playing" && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 bg-amber-50 text-amber-700"
            >
              <Sparkles size={11} className="mr-1" /> Score {score}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 bg-emerald-50 text-emerald-700"
            >
              ✓ {puzzlesSolved} solved
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 ${
                mistakes >= 2 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              ✗ {mistakes}/3
            </Badge>
            {highScore > 0 && (
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 bg-violet-50 text-violet-700"
              >
                <Trophy size={11} className="mr-1" /> Best {highScore}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

        {/* Idle intro */}
        {phase === "idle" && (
          <div className="p-4 sm:p-6">
            <div className="text-center py-10 space-y-5">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-none">
                <Calculator size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Target Math Challenge
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-md mx-auto">
                  Four numbers, one target.  Combine them with{" "}
                  <strong>+ − × ÷</strong> to hit the target.  Use all 4 numbers
                  for a <strong>+20 bonus</strong>.  3 wrong answers = game over.
                </p>
              </div>
              <div className="flex flex-col gap-2 text-left max-w-sm mx-auto">
                {[
                  { nums: [2, 3, 4, 6], target: 24, hint: "(4 × 6) = 24" },
                ].map((ex) => (
                  <div
                    key={ex.target}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300"
                  >
                    Numbers: {ex.nums.join(", ")} → Target: {ex.target} — {ex.hint}
                  </div>
                ))}
              </div>
              <Button
                onClick={startGame}
                size="lg"
                className="rounded-2xl h-12 px-8 font-black text-sm gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 hover:shadow-xl active:scale-[0.98]"
              >
                <Sparkles size={18} />
                Start Challenge
              </Button>
            </div>
          </div>
        )}

        {/* Playing area */}
        {(phase === "playing" || phase === "feedback") && puzzle && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Target display */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Target Number
                </p>
                <div className="relative">
                  <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                    {puzzle.target}
                  </span>
                  {showHint && (
                    <div className="mt-1 text-[10px] font-mono text-amber-600 bg-amber-50 rounded px-2 py-0.5 inline-block">
                      Hint: try using × or ÷ first
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHint((v) => !v)}
                  className="rounded-xl gap-1.5 font-bold text-[11px] text-amber-600 hover:bg-amber-50 h-8 px-2"
                >
                  <HelpCircle size={12} />
                  Hint
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startGame}
                  className="rounded-xl gap-1.5 font-bold text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 h-8 px-2"
                >
                  <RotateCcw size={12} />
                  Restart
                </Button>
              </div>
            </div>

            {/* Expression display */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 min-h-[80px] flex items-center justify-center gap-2 flex-wrap">
              {selectedNumbers.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium italic">
                  Tap numbers below to build your equation…
                </p>
              ) : (
                <>
                  {selectedNumbers.map((n, idx) => (
                    <React.Fragment key={idx}>
                      <span
                        className={`text-3xl font-black transition-all duration-200 ${
                          feedback === "wrong" ? "text-rose-500" : feedback === "correct" ? "text-emerald-500" : "text-slate-800 dark:text-white"
                        }`}
                      >
                        {n}
                      </span>
                      {idx < selectedOps.length && (
                        <span className="text-3xl font-black text-amber-500">{selectedOps[idx]}</span>
                      )}
                    </React.Fragment>
                  ))}
                  {previewResult !== null && (
                    <ChevronRight size={24} className="text-slate-300" />
                  )}
                  {previewResult !== null && (
                    <span
                      className={`text-3xl font-black transition-all duration-200 ${
                        previewResult === puzzle.target
                          ? "text-emerald-500"
                          : "text-slate-400"
                      }`}
                    >
                      = {previewResult}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Feedback overlay */}
            {feedback && (
              <div
                className={`rounded-2xl p-4 text-center font-black text-lg transition-all ${
                  feedback === "correct"
                    ? "bg-emerald-50 text-emerald-700"
                    : feedback === "skip"
                    ? "bg-slate-100 text-slate-500"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {feedback === "correct"
                  ? "✓ Correct! "
                  : feedback === "skip"
                  ? "Skipped — next puzzle…"
                  : "✗ Wrong — try again!"}
                {feedback === "correct" && (
                  <span className="font-normal text-sm ml-2">
                    {selectedNumbers.length === 4 ? "+20" : "+10"} pts
                  </span>
                )}
                {feedback === "wrong" && (
                  <span className="font-normal text-sm ml-2">−5 pts</span>
                )}
              </div>
            )}

            {/* Operator buttons */}
            <div className="flex items-center justify-center gap-3">
              {(["+", "−", "×", "÷"] as Op[]).map((op) => (
                <button
                  key={op}
                  onClick={() => selectOp(op)}
                  disabled={
                    selectedNumbers.length === 0 ||
                    selectedNumbers.length > 3 ||
                    selectedOps.length >= 3 ||
                    selectedOps.length >= selectedNumbers.length - 1 ||
                    phase === "feedback"
                  }
                  className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-black text-2xl hover:bg-amber-200 dark:hover:bg-amber-900/50 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {op}
                </button>
              ))}
            </div>

            {/* Number buttons */}
            <div className="grid grid-cols-4 gap-3">
              {puzzle.numbers.map((num, idx) => {
                const usedCount = selectedNumbers.filter((n) => n === num).length;
                const maxCount = puzzle.numbers.filter((n) => n === num).length;
                const isSelected = usedCount < maxCount;

                return (
                  <button
                    key={idx}
                    onClick={() => selectNumber(num)}
                    disabled={
                      !isSelected ||
                      selectedNumbers.length >= 4 ||
                      phase === "feedback"
                    }
                    className={`
                      h-20 rounded-2xl text-3xl font-black transition-all active:scale-95
                      ${
                        isSelected
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      }
                      disabled:opacity-40
                    `}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={undoLast}
                disabled={
                  (selectedNumbers.length === 0 && selectedOps.length === 0) ||
                  phase === "feedback"
                }
                className="flex-1 rounded-2xl h-12 font-bold text-sm gap-2"
              >
                <RotateCcw size={16} />
                Undo
              </Button>
              <Button
                variant="outline"
                onClick={clearSelection}
                disabled={
                  selectedNumbers.length === 0 || phase === "feedback"
                }
                className="flex-1 rounded-2xl h-12 font-bold text-sm gap-2"
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={skipPuzzle}
                disabled={phase === "feedback"}
                className="flex-1 rounded-2xl h-12 font-bold text-sm gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
              >
                Skip
              </Button>
              <Button
                onClick={evaluateAnswer}
                disabled={!isReady || phase === "feedback"}
                className="flex-[2] rounded-2xl h-12 font-black text-sm gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg disabled:opacity-40"
              >
                <Check size={16} />
                Submit
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Game-over modal ──────────────────────────────────────── */}
      <Dialog
        open={phase === "completed"}
        onOpenChange={(o) => !o && setPhase("idle")}
      >
        <DialogContent className="rounded-3xl border-0 sm:max-w-md overflow-hidden p-0">
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner mb-3">
              <Trophy size={32} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white text-center">
                Challenge Over!
              </DialogTitle>
              <DialogDescription className="text-white/90 text-center font-medium">
                3 wrong answers.  Here's your final result.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Final Score
                </div>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {score}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Puzzles Solved
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {puzzlesSolved}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  All-Time Best
                </div>
                <div className="text-2xl font-black text-violet-600 mt-1">
                  {highScore}
                </div>
              </div>
            </div>

            {score >= highScore && score > 0 && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-center">
                <p className="text-sm font-black text-amber-800">
                  🎉 New high score!
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={startGame}
                className="flex-1 rounded-2xl h-12 font-black text-sm gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg"
              >
                <RefreshCw size={16} />
                Play Again
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

export default TargetMath;
