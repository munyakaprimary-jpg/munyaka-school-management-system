import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Zap,
  Timer,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Trophy,
  Flame,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  KEYS,
  loadMeta,
  getHighScore,
  setHighScore,
  saveSpeedMathBestStreak,
  incrementGamesPlayed,
} from "@/lib/gameStats";

type Operator = "+" | "-" | "*";
type Feedback = "idle" | "correct" | "wrong";

interface Problem {
  a: number;
  b: number;
  op: Operator;
  answer: number;
}

const GAME_DURATION = 60; // seconds

const buildProblem = (): Problem => {
  const ops: Operator[] = ["+", "-", "*"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = 0;
  let b = 0;
  if (op === "*") {
    // Keep multiplication small and fast.
    a = Math.floor(Math.random() * 12) + 1;
    b = Math.floor(Math.random() * 12) + 1;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 50) + 10;
    b = Math.floor(Math.random() * (a - 1)) + 1; // ensure positive result
  } else {
    a = Math.floor(Math.random() * 50) + 1;
    b = Math.floor(Math.random() * 50) + 1;
  }
  const answer =
    op === "+" ? a + b : op === "-" ? a - b : a * b;
  return { a, b, op, answer };
};

interface SpeedMathProps {
  onBack: () => void;
}

const SpeedMath: React.FC<SpeedMathProps> = ({ onBack }) => {
  const [problem, setProblem] = useState<Problem>(() => buildProblem());
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(GAME_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [highScore, setHighScoreState] = useState<number>(() => getHighScore("speed-math"));
  const [shake, setShake] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const correctCountRef = useRef(0);
  const totalAnsweredRef = useRef(0);

  // ── Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft <= 0) {
      setIsRunning(false);
      setIsOver(true);
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [isRunning, secondsLeft]);

  // Focus input whenever a new round starts
  useEffect(() => {
    if (isRunning) inputRef.current?.focus();
  }, [isRunning, problem]);

  // Persist high score on game over
  useEffect(() => {
    if (isOver) {
      if (score > highScore) {
        setHighScore("speed-math", score);
        setHighScoreState(score);
      }
      saveSpeedMathBestStreak(bestStreak);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOver]);

  // ── Game actions ──────────────────────────────────────────────
  const startGame = useCallback(() => {
    setProblem(buildProblem());
    setInput("");
    setFeedback("idle");
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSecondsLeft(GAME_DURATION);
    setIsOver(false);
    correctCountRef.current = 0;
    totalAnsweredRef.current = 0;
    setIsRunning(true);
    incrementGamesPlayed();
  }, []);

  const submit = useCallback(() => {
    if (!isRunning || isOver) return;
    const trimmed = String(input || '').trim();
    if (trimmed === "") return;
    const guess = parseInt(trimmed, 10);
    if (Number.isNaN(guess)) return;

    totalAnsweredRef.current += 1;

    if (guess === problem.answer) {
      // ✅ Correct
      const bonus = streak >= 3 ? 2 : 0; // small streak bonus
      setScore((s) => s + 1 + bonus);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
      setFeedback("correct");
      setProblem(buildProblem());
      setInput("");
    } else {
      // ❌ Wrong
      setStreak(0);
      setFeedback("wrong");
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
    }
  }, [input, problem, isRunning, isOver, streak]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  // Auto-clear feedback tint after a moment so the next round is visually fresh
  useEffect(() => {
    if (feedback === "idle") return;
    const t = window.setTimeout(() => setFeedback("idle"), 350);
    return () => window.clearTimeout(t);
  }, [feedback, problem]);

  // ── Derived UI state ──────────────────────────────────────────
  const accuracy = useMemo(() => {
    if (totalAnsweredRef.current === 0) return 0;
    return Math.round(
      (correctCountRef.current / totalAnsweredRef.current) * 100
    );
  }, [score, isOver]); // recompute when score or isOver changes

  // Track correct answers via ref mirror so accuracy updates when game ends
  useEffect(() => {
    if (feedback === "correct") correctCountRef.current += 1;
  }, [feedback]);

  const timerColor =
    secondsLeft <= 10
      ? "text-rose-600"
      : secondsLeft <= 25
      ? "text-amber-600"
      : "text-slate-700 dark:text-slate-200";

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

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 shadow-md">
            <Trophy size={16} className="text-amber-100" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
              Best
            </span>
            <span className="text-lg font-black leading-none">{highScore}</span>
          </div>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={<Timer size={18} />}
          label="Time"
          value={`${secondsLeft}s`}
          colorClass={timerColor}
        />
        <StatCard
          icon={<Zap size={18} className="text-amber-500" />}
          label="Score"
          value={score}
          colorClass="text-amber-600"
        />
        <StatCard
          icon={<Flame size={18} className="text-rose-500" />}
          label="Streak"
          value={streak}
          subValue={`Best ${bestStreak}`}
          colorClass="text-rose-600"
        />
      </div>

      {/* ── Main play card ───────────────────────────────────── */}
      <div
        className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-200 ${
          feedback === "correct"
            ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20"
            : feedback === "wrong"
            ? "border-rose-300 bg-rose-50/60 dark:bg-rose-950/20"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        } ${shake ? "animate-[wiggle_0.4s_ease-in-out]" : ""}`}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
        <div className="p-6 sm:p-10 text-center space-y-6">
          {!isRunning && !isOver && (
            <div className="space-y-4 py-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-200">
                <Zap size={32} className="text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Speed Math Blitz
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto font-medium">
                60 seconds. Random +, −, × problems. Type the answer and hit
                Enter. Build a streak to earn bonus points.
              </p>
              <Button
                onClick={startGame}
                size="lg"
                className="rounded-2xl h-12 px-8 font-black text-sm gap-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-rose-200 hover:shadow-xl active:scale-[0.98]"
              >
                <Sparkles size={18} />
                Start Game
              </Button>
            </div>
          )}

          {isRunning && (
            <>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Solve
                </p>
                <p
                  className={`text-5xl sm:text-6xl font-black tracking-tight tabular-nums transition-colors ${
                    feedback === "correct"
                      ? "text-emerald-600"
                      : feedback === "wrong"
                      ? "text-rose-600"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {problem.a} {problem.op} {problem.b} = ?
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-3">
                <Input
                  ref={inputRef}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Type answer"
                  className={`text-center text-2xl font-black h-14 rounded-2xl border-2 ${
                    feedback === "correct"
                      ? "border-emerald-400 bg-emerald-50"
                      : feedback === "wrong"
                      ? "border-rose-400 bg-rose-50"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                  autoComplete="off"
                />
                <Button
                  onClick={submit}
                  className="w-full rounded-2xl h-12 font-black text-sm gap-2 bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Submit
                </Button>
              </div>

              {/* Live feedback chip */}
              <div className="h-6 flex items-center justify-center">
                {feedback === "correct" && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 size={16} /> Correct!
                  </span>
                )}
                {feedback === "wrong" && (
                  <span className="inline-flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                    <XCircle size={16} /> Wrong — try the next one
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Game Over modal ──────────────────────────────────── */}
      <Dialog open={isOver} onOpenChange={(o) => !o && setIsOver(false)}>
        <DialogContent className="rounded-3xl border-0 sm:max-w-md overflow-hidden p-0">
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner mb-3">
              <Trophy size={32} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white text-center">
                Time's Up!
              </DialogTitle>
              <DialogDescription className="text-white/90 text-center font-medium">
                {score > highScore
                  ? "🏆 New personal best!"
                  : "Nice run — give it another go."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-3 gap-3 text-center">
              <ResultStat label="Score" value={score} accent="text-amber-600" />
              <ResultStat
                label="Best Streak"
                value={bestStreak}
                accent="text-rose-600"
              />
              <ResultStat
                label="Accuracy"
                value={`${accuracy}%`}
                accent="text-emerald-600"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={startGame}
                className="flex-1 rounded-2xl h-12 font-black text-sm gap-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md hover:shadow-lg"
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

      {/* Tailwind keyframes for the shake feedback */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subValue?: string;
  colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subValue,
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
    {subValue && (
      <div className="text-[10px] font-bold text-slate-400 mt-0.5">
        {subValue}
      </div>
    )}
  </div>
);

const ResultStat: React.FC<{
  label: string;
  value: React.ReactNode;
  accent: string;
}> = ({ label, value, accent }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {label}
    </div>
    <div className={`text-2xl font-black mt-1 tabular-nums ${accent}`}>
      {value}
    </div>
  </div>
);

export default SpeedMath;
