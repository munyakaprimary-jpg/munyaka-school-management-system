import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Brain,
  Calculator,
  BookOpen,
  Globe,
  Music,
  Palette,
  Beaker,
  Microscope,
  ArrowLeft,
  RefreshCw,
  Trophy,
  Sparkles,
  RotateCcw,
  Clock,
  Zap,
  type LucideIcon,
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
  saveMemoryResult,
  incrementGamesPlayed,
} from "@/lib/gameStats";

type CardSymbol = {
  id: string;
  Icon: LucideIcon;
  colorClass: string;
  bgClass: string;
};

const CARD_POOL: CardSymbol[] = [
  { id: "calc", Icon: Calculator, colorClass: "text-blue-600", bgClass: "bg-blue-100 dark:bg-blue-950/40" },
  { id: "book", Icon: BookOpen, colorClass: "text-emerald-600", bgClass: "bg-emerald-100 dark:bg-emerald-950/40" },
  { id: "globe", Icon: Globe, colorClass: "text-sky-600", bgClass: "bg-sky-100 dark:bg-sky-950/40" },
  { id: "music", Icon: Music, colorClass: "text-violet-600", bgClass: "bg-violet-100 dark:bg-violet-950/40" },
  { id: "palette", Icon: Palette, colorClass: "text-pink-600", bgClass: "bg-pink-100 dark:bg-pink-950/40" },
  { id: "beaker", Icon: Beaker, colorClass: "text-amber-600", bgClass: "bg-amber-100 dark:bg-amber-950/40" },
  { id: "microscope", Icon: Microscope, colorClass: "text-teal-600", bgClass: "bg-teal-100 dark:bg-teal-950/40" },
  { id: "brain", Icon: Brain, colorClass: "text-rose-600", bgClass: "bg-rose-100 dark:bg-rose-950/40" },
];

interface Card {
  uid: string; // unique per slot (even pairs have different uids)
  symbolId: string;
  Icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  flipped: boolean;
  matched: boolean;
}

type GamePhase = "idle" | "playing" | "checking" | "completed";

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildDeck = (): Card[] => {
  const pairs = CARD_POOL.flatMap((s, idx) => {
    const uid = (n: number) => `${s.id}-${n}`;
    return [
      { uid: uid(0), symbolId: s.id, Icon: s.Icon, colorClass: s.colorClass, bgClass: s.bgClass, flipped: false, matched: false },
      { uid: uid(1), symbolId: s.id, Icon: s.Icon, colorClass: s.colorClass, bgClass: s.bgClass, flipped: false, matched: false },
    ];
  });
  return shuffle(pairs);
};

interface MemoryMatchProps {
  onBack: () => void;
}

const MemoryMatch: React.FC<MemoryMatchProps> = ({ onBack }) => {
  const [deck, setDeck] = useState<Card[]>(() => buildDeck());
  const [selected, setSelected] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("idle");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkingRef = useRef(false);
  const movesRef = useRef(0);
  const elapsedRef = useRef(0);

  // ── Timer ─────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  // Stop timer when completed
  useEffect(() => {
    if (phase === "completed") clearTimer();
  }, [phase, clearTimer]);

  // ── Game controls ─────────────────────────────────────────────
  const startGame = useCallback(() => {
    clearTimer();
    setDeck(buildDeck());
    setSelected([]);
    setMoves(0);
    setElapsed(0);
    setPhase("playing");
    startTimer();
    incrementGamesPlayed();
  }, [clearTimer, startTimer]);

  // ── Card flip logic ───────────────────────────────────────────
  const flipCard = useCallback(
    (uid: string) => {
      if (phase !== "playing") return;
      if (checkingRef.current) return;
      if (selected.includes(uid)) return;

      // Prevent double-clicking same card
      const card = deck.find((c) => c.uid === uid);
      if (!card || card.matched) return;

      const next = [...selected, uid];
      setSelected(next);

      if (next.length === 2) {
        setMoves((m) => m + 1);
        setPhase("checking");
        checkingRef.current = true;

        const [firstUid, secondUid] = next;
        const first = deck.find((c) => c.uid === firstUid)!;
        const second = deck.find((c) => c.uid === secondUid)!;

        if (first.symbolId === second.symbolId) {
          // ✅ Match!
          setTimeout(() => {
            setDeck((d) =>
              d.map((c) =>
                c.uid === firstUid || c.uid === secondUid
                  ? { ...c, matched: true }
                  : c
              )
            );
            setSelected([]);
            setPhase("playing");
            checkingRef.current = false;
          }, 500);
        } else {
          // ❌ No match — flip back
          setTimeout(() => {
            setSelected([]);
            setPhase("playing");
            checkingRef.current = false;
          }, 900);
        }
      }
    },
    [phase, selected, deck]
  );

  // Keep refs in sync with state
  useEffect(() => { movesRef.current = moves; }, [moves]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  // Check for completion
  useEffect(() => {
    if (phase === "playing" && deck.length > 0 && deck.every((c) => c.matched)) {
      setPhase("completed");
      // Use refs to avoid stale closure values
      saveMemoryResult(elapsedRef.current, movesRef.current);
    }
  }, [phase, deck]);

  // ── Derived ───────────────────────────────────────────────────
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const stars = moves <= 12 ? 3 : moves <= 20 ? 2 : 1;

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

        {phase === "playing" && (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-violet-100 dark:bg-violet-950/40 px-3 py-1.5 text-violet-700 dark:text-violet-300 font-bold text-xs">
              <Brain size={14} />
              Moves: {moves}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-2xl bg-sky-100 dark:bg-sky-950/40 px-3 py-1.5 text-sky-700 dark:text-sky-300 font-bold text-xs">
              ⏱ {formatTime(elapsed)}
            </div>
          </div>
        )}
      </div>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
        <div className="p-4 sm:p-6">
          {/* Idle / completed intro */}
          {phase === "idle" && (
            <div className="text-center py-10 space-y-5">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-none">
                <Brain size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Memory Match
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-sm mx-auto">
                  Flip cards to find matching pairs. Keep track of your moves
                  and time. Fewer moves = more stars!
                </p>
              </div>
              <div className="flex justify-center gap-3">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      s <= 3
                        ? "bg-amber-400 text-amber-900"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                    }`}
                  >
                    ⭐
                  </div>
                ))}
                <span className="text-xs text-slate-400 font-bold self-center ml-1">
                  = difficulty
                </span>
              </div>
              <Button
                onClick={startGame}
                size="lg"
                className="rounded-2xl h-12 px-8 font-black text-sm gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-200 hover:shadow-xl active:scale-[0.98]"
              >
                <Sparkles size={18} />
                Start Game
              </Button>
            </div>
          )}

          {/* 4×4 grid */}
          {(phase === "playing" || phase === "checking") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {8 - deck.filter((c) => c.matched).length / 2} pairs left
                </p>
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

              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {deck.map((card) => {
                  const isSelected = selected.includes(card.uid);
                  const isRevealed = isSelected || card.matched;
                  const Icon = card.Icon;

                  return (
                    <button
                      key={card.uid}
                      onClick={() => flipCard(card.uid)}
                      disabled={!isSelected && (phase !== "playing" || card.matched)}
                      className={`
                        relative aspect-square rounded-2xl border-2 transition-all duration-300
                        flex items-center justify-center overflow-hidden
                        ${
                          isRevealed
                            ? card.matched
                              ? `${card.bgClass} border-transparent shadow-inner`
                              : `${card.bgClass} border-slate-300 dark:border-slate-600 shadow-sm`
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-600 active:scale-95"
                        }
                        ${
                          phase === "checking" && !isSelected && !card.matched
                            ? "pointer-events-none"
                            : "cursor-pointer"
                        }
                      `}
                    >
                      {isRevealed ? (
                        <Icon
                          size={28}
                          className={`${card.colorClass} transition-all duration-300 ${
                            isSelected && !card.matched ? "scale-110" : "scale-100"
                          }`}
                        />
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-2xl font-black select-none">
                          ?
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Completion modal ──────────────────────────────────── */}
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
                You Did It!
              </DialogTitle>
              <DialogDescription className="text-white/90 text-center font-medium">
                All 8 pairs matched. Excellent memory!
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5 bg-white dark:bg-slate-900">
            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                    s <= stars
                      ? "bg-amber-400 text-amber-900 shadow-md shadow-amber-200 scale-100"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 scale-90"
                  }`}
                >
                  ⭐
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Moves
                </div>
                <div className="text-2xl font-black text-violet-600 mt-1">
                  {moves}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Time
                </div>
                <div className="text-2xl font-black text-sky-600 mt-1">
                  {formatTime(elapsed)}
                </div>
              </div>
            </div>

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

export default MemoryMatch;
