import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Brain,
  ArrowLeft,
  RefreshCw,
  Trophy,
  Sparkles,
  RotateCcw,
  Play,
  Zap,
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
  savePatternMemoryResult,
  loadPatternMemoryBestRound,
  incrementGamesPlayed,
} from "@/lib/gameStats";

/**
 * Pattern Memory — Simon Says Memory Game
 * ────────────────────────────────────────
 * The game flashes a sequence of coloured cells (lights) in order.
 * The player must repeat the exact sequence by tapping the cells.
 * Each successful round adds one more step to the sequence.
 * Three consecutive mistakes end the game.
 *
 * Sequence starts at length 3 and grows by 1 each round.
 * High score (longest round reached) is persisted in localStorage.
 */

type PadColor = 0 | 1 | 2 | 3;

const PAD_COLORS: Record<
  PadColor,
  { base: string; lit: string; glow: string; active: string; label: string }
> = {
  0: {
    base: "bg-rose-200 dark:bg-rose-900/50",
    lit: "bg-rose-400",
    glow: "shadow-rose-400/60",
    active: "ring-rose-400",
    label: "Red",
  },
  1: {
    base: "bg-blue-200 dark:bg-blue-900/50",
    lit: "bg-blue-400",
    glow: "shadow-blue-400/60",
    active: "ring-blue-400",
    label: "Blue",
  },
  2: {
    base: "bg-amber-200 dark:bg-amber-900/50",
    lit: "bg-amber-400",
    glow: "shadow-amber-400/60",
    active: "ring-amber-400",
    label: "Yellow",
  },
  3: {
    base: "bg-emerald-200 dark:bg-emerald-900/50",
    lit: "bg-emerald-400",
    glow: "shadow-emerald-400/60",
    active: "ring-emerald-400",
    label: "Green",
  },
};

const LIGHT_DURATION_MS = 500; // how long a pad lights up
const FLASH_GAP_MS = 250; // gap between flashes in sequence
const PLAYER_TAP_FEEDBACK_MS = 200; // how long player's tap lights up

type Phase =
  | "idle"
  | "showing"
  | "waiting"
  | "correct"
  | "wrong"
  | "completed";

interface PatternMemoryProps {
  onBack: () => void;
}

const PatternMemory: React.FC<PatternMemoryProps> = ({ onBack }) => {
  const [sequence, setSequence] = useState<PadColor[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [activePad, setActivePad] = useState<PadColor | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [round, setRound] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [gameKey, setGameKey] = useState(0); // increment to reset all timers

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showingRef = useRef(false);

  // ── Timer helpers ─────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  // ── Load high score ──────────────────────────────────────────
  useEffect(() => {
    setHighScore(loadPatternMemoryBestRound());
  }, []);

  // ── Phase transitions ─────────────────────────────────────────
  useEffect(() => {
    if (phase === "completed") {
      clearTimers();
      const finalRound = round - 1; // game ended on this round
      if (finalRound > 0) {
        savePatternMemoryResult(finalRound);
        setHighScore(loadPatternMemoryBestRound());
      }
    }
  }, [phase, round, clearTimers]);

  // ── Show sequence to player ───────────────────────────────────
  const showSequence = useCallback(
    (seq: PadColor[], key: number) => {
      if (showingRef.current) return;
      showingRef.current = true;
      setPhase("showing");
      setPlayerIndex(0);
      setActivePad(null);

      let delay = 400; // initial pause before sequence starts

      seq.forEach((pad, idx) => {
        const showTimeout = delay + idx * (LIGHT_DURATION_MS + FLASH_GAP_MS);
        const hideTimeout = showTimeout + LIGHT_DURATION_MS;

        timerRef.current = setTimeout(() => {
          setActivePad(pad);
        }, showTimeout);

        timerRef.current = setTimeout(() => {
          setActivePad(null);
        }, hideTimeout);
      });

      const doneTimeout =
        delay + seq.length * (LIGHT_DURATION_MS + FLASH_GAP_MS) + 300;

      timerRef.current = setTimeout(() => {
        showingRef.current = false;
        setPhase("waiting");
      }, doneTimeout);
    },
    [clearTimers]
  );

  // ── Game control ─────────────────────────────────────────────
  const startGame = useCallback(() => {
    clearTimers();
    // Start with a sequence of length 3
    const initial: PadColor[] = [
      Math.floor(Math.random() * 4) as PadColor,
      Math.floor(Math.random() * 4) as PadColor,
      Math.floor(Math.random() * 4) as PadColor,
    ];
    setSequence(initial);
    setRound(1);
    setMistakes(0);
    setPlayerIndex(0);
    setActivePad(null);
    setGameKey((k) => k + 1);
    setPhase("showing");
    incrementGamesPlayed();

    // Small delay before showing sequence
    timerRef.current = setTimeout(() => {
      showSequence(initial, 1);
    }, 400);
  }, [clearTimers, showSequence]);

  // ── Advance to next round ────────────────────────────────────
  const advanceRound = useCallback(
    (currentSeq: PadColor[], key: number) => {
      const nextPad = Math.floor(Math.random() * 4) as PadColor;
      const nextSeq = [...currentSeq, nextPad];
      setSequence(nextSeq);
      const nextRound = currentSeq.length + 1;
      setRound(nextRound);
      setPlayerIndex(0);
      setActivePad(null);

      timerRef.current = setTimeout(() => {
        showSequence(nextSeq, key + 1);
      }, 800);
    },
    [clearTimers, showSequence]
  );

  // ── Player tap ───────────────────────────────────────────────
  const handlePadTap = useCallback(
    (pad: PadColor) => {
      if (phase !== "waiting") return;

      // Flash the pad briefly for feedback
      setActivePad(pad);
      timerRef.current = setTimeout(() => {
        setActivePad(null);
      }, PLAYER_TAP_FEEDBACK_MS);

      const expected = sequence[playerIndex];

      if (pad === expected) {
        const nextIndex = playerIndex + 1;
        if (nextIndex === sequence.length) {
          // ✅ Completed the sequence — advance to next round
          setPhase("correct");
          const nextRound = sequence.length + 1;
          setRound(nextRound);
          timerRef.current = setTimeout(() => {
            advanceRound(sequence, gameKey);
          }, 600);
        } else {
          setPlayerIndex(nextIndex);
        }
      } else {
        // ❌ Wrong — mistake
        setMistakes((m) => {
          const next = m + 1;
          if (next >= 3) {
            setPhase("completed");
          } else {
            setPhase("wrong");
            timerRef.current = setTimeout(() => {
              // Retry the same sequence
              setMistakes(next);
              setPlayerIndex(0);
              setActivePad(null);
              timerRef.current = setTimeout(() => {
                showSequence(sequence, gameKey);
              }, 600);
            }, 600);
          }
          return next;
        });
      }
    },
    [phase, sequence, playerIndex, advanceRound, clearTimers, showSequence, gameKey]
  );

  // ── Derived ──────────────────────────────────────────────────
  const progress =
    phase === "waiting" && sequence.length > 0
      ? playerIndex / sequence.length
      : 0;

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

        {(phase === "showing" || phase === "waiting" || phase === "correct" || phase === "wrong") && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 bg-violet-50 text-violet-700"
            >
              Round {round}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 bg-indigo-50 text-indigo-700"
            >
              <Sparkles size={11} className="mr-1" />
              {sequence.length} steps
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 ${
                mistakes >= 2
                  ? "bg-rose-50 text-rose-700"
                  : mistakes === 1
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              ✗ {mistakes}/3
            </Badge>
            {highScore > 0 && (
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 bg-amber-50 text-amber-700"
              >
                <Trophy size={11} className="mr-1" />
                Best {highScore}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

        {/* Idle intro */}
        {phase === "idle" && (
          <div className="p-4 sm:p-6">
            <div className="text-center py-10 space-y-5">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-none">
                <Brain size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Pattern Memory
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-md mx-auto">
                  Watch the coloured lights flash in sequence, then repeat the
                  pattern by tapping the pads.  Each round adds one more step.
                  How far can you go?
                </p>
              </div>

              {/* 2×2 pad preview */}
              <div className="flex justify-center">
                <div className="grid grid-cols-2 gap-2 w-40 h-40 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  {([0, 1, 2, 3] as PadColor[]).map((pad) => (
                    <div
                      key={pad}
                      className={`${PAD_COLORS[pad].base} flex items-center justify-center transition-all duration-200`}
                    >
                      <Zap size={20} className="opacity-40 text-white" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="text-lg font-black text-slate-600">{n}</span>
                    <div className="w-6 h-6 rounded-full bg-violet-400" />
                    <span className="text-[10px] text-slate-400">
                      {n === 1 ? "Round 1" : n === 2 ? "Round 5" : "Round 10"}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={startGame}
                size="lg"
                className="rounded-2xl h-12 px-8 font-black text-sm gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-200 hover:shadow-xl active:scale-[0.98]"
              >
                <Play size={18} />
                Start Game
              </Button>
            </div>
          </div>
        )}

        {/* Active game */}
        {(phase === "showing" ||
          phase === "waiting" ||
          phase === "correct" ||
          phase === "wrong") && (
          <div className="p-4 sm:p-6 space-y-6" key={gameKey}>
            {/* Status bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Round {round}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {sequence.length - playerIndex} steps remaining
                </span>
              </div>
              <div className="flex gap-2">
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

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* Phase indicator */}
            <div
              className={`rounded-xl px-4 py-2 text-center text-xs font-black uppercase tracking-widest transition-all ${
                phase === "showing"
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 animate-pulse"
                  : phase === "waiting"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : phase === "correct"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
              }`}
            >
              {phase === "showing"
                ? "Watch the sequence…"
                : phase === "waiting"
                ? "Your turn! Tap the pads"
                : phase === "correct"
                ? "✓ Correct! Next round…"
                : "✗ Wrong pad — try again!"}
            </div>

            {/* 2×2 Pad grid */}
            <div className="flex justify-center">
              <div className="grid grid-cols-2 gap-3 w-64 h-64 rounded-2xl overflow-hidden">
                {([0, 1, 2, 3] as PadColor[]).map((pad) => {
                  const colors = PAD_COLORS[pad];
                  const isLit = activePad === pad;
                  return (
                    <button
                      key={pad}
                      onClick={() => handlePadTap(pad)}
                      disabled={phase !== "waiting"}
                      className={`
                        relative rounded-2xl transition-all duration-150
                        flex items-center justify-center
                        ${
                          isLit
                            ? `${colors.lit} scale-95 ${colors.glow} shadow-lg`
                            : `${colors.base} ${
                                phase === "waiting"
                                  ? "hover:brightness-105 active:scale-95 cursor-pointer"
                                  : "cursor-default"
                              }`
                        }
                        ${
                          phase === "waiting"
                            ? `ring-2 ring-offset-1 ring-transparent hover:${colors.active}/50`
                            : ""
                        }
                        disabled:cursor-default
                      `}
                    >
                      {isLit && (
                        <Zap size={32} className="text-white drop-shadow-md" />
                      )}
                      {!isLit && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                          {colors.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sequence hint (subtle) */}
            {phase === "waiting" && (
              <p className="text-center text-[11px] text-slate-400 font-medium">
                Repeat the full sequence from the beginning
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Game-over modal ──────────────────────────────────────── */}
      <Dialog
        open={phase === "completed"}
        onOpenChange={(o) => !o && setPhase("idle")}
      >
        <DialogContent className="rounded-3xl border-0 sm:max-w-md overflow-hidden p-0">
          <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner mb-3">
              <Trophy size={32} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white text-center">
                Game Over!
              </DialogTitle>
              <DialogDescription className="text-white/90 text-center font-medium">
                You reached round {round - 1} with {sequence.length} steps.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Round Reached
                </div>
                <div className="text-2xl font-black text-violet-600 mt-1">
                  {round - 1}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Best Record
                </div>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {highScore}
                </div>
              </div>
            </div>

            {round - 1 >= highScore && round > 1 && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-center">
                <p className="text-sm font-black text-amber-800">
                  🎉 New personal best!
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={startGame}
                className="flex-1 rounded-2xl h-12 font-black text-sm gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md hover:shadow-lg"
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

export default PatternMemory;
