import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Languages,
  ArrowLeft,
  RefreshCw,
  Trophy,
  Sparkles,
  Check,
  X,
  RotateCcw,
  Lightbulb,
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
  saveBilingualResult,
  loadBilingualBestScore,
  incrementGamesPlayed,
} from "@/lib/gameStats";

/**
 * Kiswahili & English Word Match
 * ─────────────────────────────
 * Players are shown 4 Kiswahili words and must pair each one with its
 * correct English translation from 4 candidate cards.  Each round grants
 * +10 points for a correct match and a -3 second penalty for a wrong
 * guess.  The round cycle continues until the player misses 3 times.
 *
 * High score and total matches completed are persisted in localStorage
 * via the shared gameStats helpers.
 */

interface WordPair {
  id: string;
  sw: string; // Kiswahili
  en: string; // English translation
}

const WORD_BANK: WordPair[] = [
  { id: "w1", sw: "Mwalimu", en: "Teacher" },
  { id: "w2", sw: "Mwanafunzi", en: "Student" },
  { id: "w3", sw: "Shule", en: "School" },
  { id: "w4", sw: "Kitabu", en: "Book" },
  { id: "w5", sw: "Karatasi", en: "Paper" },
  { id: "w6", sw: "Penseli", en: "Pencil" },
  { id: "w7", sw: "Mfuko", en: "Bag" },
  { id: "w8", sw: "Maji", en: "Water" },
  { id: "w9", sw: "Chakula", en: "Food" },
  { id: "w10", sw: "Nyumba", en: "House" },
  { id: "w11", sw: "Mlango", en: "Door" },
  { id: "w12", sw: "Dirisha", en: "Window" },
  { id: "w13", sw: "Meza", en: "Table" },
  { id: "w14", sw: "Kiti", en: "Chair" },
  { id: "w15", sw: "Jua", en: "Sun" },
  { id: "w16", sw: "Mwezi", en: "Moon" },
  { id: "w17", sw: "Nyota", en: "Star" },
  { id: "w18", sw: "Mti", en: "Tree" },
  { id: "w19", sw: "Tunda", en: "Fruit" },
  { id: "w20", sw: "Mvua", en: "Rain" },
  { id: "w21", sw: "Baba", en: "Father" },
  { id: "w22", sw: "Mama", en: "Mother" },
  { id: "w23", sw: "Kaka", en: "Brother" },
  { id: "w24", sw: "Dada", en: "Sister" },
  { id: "w25", sw: "Paka", en: "Cat" },
  { id: "w26", sw: "Mbwa", en: "Dog" },
  { id: "w27", sw: "Ndege", en: "Bird" },
  { id: "w28", sw: "Samaki", en: "Fish" },
  { id: "w29", sw: "Chungwa", en: "Orange" },
  { id: "w30", sw: "Ndizi", en: "Banana" },
  { id: "w31", sw: "Soksi", en: "Socks" },
  { id: "w32", sw: "Viatu", en: "Shoes" },
  { id: "w33", sw: "Nguo", en: "Clothes" },
  { id: "w34", sw: "Barabara", en: "Road" },
  { id: "w35", sw: "Gari", en: "Car" },
  { id: "w36", sw: "Basi", en: "Bus" },
  { id: "w37", sw: "Nchi", en: "Country" },
  { id: "w38", sw: "Mji", en: "Town" },
  { id: "w39", sw: "Soko", en: "Market" },
  { id: "w40", sw: "Duka", en: "Shop" },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pickRandom = <T,>(arr: T[], n: number): T[] =>
  shuffle(arr).slice(0, Math.min(n, arr.length));

interface RoundData {
  pairs: WordPair[]; // 4 words
  enOptions: string[]; // 4 English candidates (shuffled)
}

const buildRound = (bank: WordPair[], excludeIds: Set<string> = new Set()): RoundData => {
  // Try to avoid re-using words from the previous round
  const filtered = bank.filter((w) => !excludeIds.has(w.id));
  const source = filtered.length >= 4 ? filtered : bank;
  const pairs = pickRandom(source, 4);
  const enOptions = shuffle(pairs.map((p) => p.en));
  return { pairs, enOptions };
};

type Phase = "idle" | "playing" | "completed";

interface BilingualMatchProps {
  onBack: () => void;
}

const BilingualMatch: React.FC<BilingualMatchProps> = ({ onBack }) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [selectedSw, setSelectedSw] = useState<string | null>(null);
  const [selectedEn, setSelectedEn] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [matchesCompleted, setMatchesCompleted] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [highScore, setHighScore] = useState(0);
  const checkingRef = useRef(false);

  useEffect(() => {
    setHighScore(loadBilingualBestScore());
  }, []);

  // ── Round control ─────────────────────────────────────────────
  const startNewRound = useCallback((previousIds: string[] = []) => {
    const data = buildRound(WORD_BANK, new Set(previousIds));
    setRoundData(data);
    setSelectedSw(null);
    setSelectedEn(null);
    setMatchedIds(new Set());
    setFeedback(null);
    setMistakes(0);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setMatchesCompleted(0);
    setMistakes(0);
    startNewRound();
    setPhase("playing");
    incrementGamesPlayed();
  }, [startNewRound]);

  // ── Match evaluation ──────────────────────────────────────────
  useEffect(() => {
    if (!roundData) return;
    if (selectedSw === null || selectedEn === null) return;
    if (checkingRef.current) return;

    checkingRef.current = true;
    const pair = roundData.pairs.find((p) => p.sw === selectedSw);

    if (pair && pair.en === selectedEn) {
      // ✅ correct
      setFeedback("correct");
      setScore((s) => s + 10);
      setMatchedIds((prev) => {
        const next = new Set(prev);
        next.add(pair.id);
        return next;
      });
      setTimeout(() => {
        setSelectedSw(null);
        setSelectedEn(null);
        setFeedback(null);
        checkingRef.current = false;
      }, 600);
    } else {
      // ❌ wrong
      setFeedback("wrong");
      setMistakes((m) => m + 1);
      setScore((s) => Math.max(0, s - 3));
      setTimeout(() => {
        setSelectedSw(null);
        setSelectedEn(null);
        setFeedback(null);
        checkingRef.current = false;
      }, 700);
    }
  }, [selectedSw, selectedEn, roundData]);

  // ── Round complete → next round or game over ───────────────────
  useEffect(() => {
    if (phase !== "playing" || !roundData) return;
    if (matchedIds.size === 4) {
      const next = matchesCompleted + 1;
      setMatchesCompleted(next);
      // Persist score & matches immediately (so closing the tab keeps progress)
      saveBilingualResult(score, 1);
      setHighScore(loadBilingualBestScore());
      // Queue the next round
      const finishedIds = roundData.pairs.map((p) => p.id);
      const t = setTimeout(() => {
        startNewRound(finishedIds);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [matchedIds, phase, roundData, score, matchesCompleted, startNewRound]);

  // ── Game over ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    if (mistakes >= 5) {
      saveBilingualResult(score, 0);
      setHighScore(loadBilingualBestScore());
      setPhase("completed");
    }
  }, [mistakes, phase, score]);

  const matchedSw = useMemo(() => {
    if (!roundData) return new Set<string>();
    return new Set(
      roundData.pairs.filter((p) => matchedIds.has(p.id)).map((p) => p.sw)
    );
  }, [roundData, matchedIds]);

  const matchedEn = useMemo(() => {
    if (!roundData) return new Set<string>();
    return new Set(
      roundData.pairs.filter((p) => matchedIds.has(p.id)).map((p) => p.en)
    );
  }, [roundData, matchedIds]);

  const remainingEn = useMemo(
    () =>
      (roundData?.enOptions ?? []).filter((w) => !matchedEn.has(w)),
    [roundData, matchedEn]
  );

  const remainingSw = useMemo(
    () => (roundData?.pairs ?? []).filter((p) => !matchedIds.has(p.id)),
    [roundData, matchedIds]
  );

  const correctPair = useMemo(() => {
    if (!roundData || !selectedSw) return null;
    return roundData.pairs.find((p) => p.sw === selectedSw) ?? null;
  }, [roundData, selectedSw]);

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
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 bg-indigo-50 text-indigo-700"
            >
              <Sparkles size={11} className="mr-1" /> Score {score}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 bg-emerald-50 text-emerald-700"
            >
              ✓ {matchesCompleted} rounds
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border-0 ${
                mistakes >= 3
                  ? "bg-rose-50 text-rose-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              ✗ {mistakes}/5
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
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500" />
        <div className="p-4 sm:p-6">
          {/* Idle intro */}
          {phase === "idle" && (
            <div className="text-center py-10 space-y-5">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-none">
                <Languages size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Kiswahili & English Match
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-md mx-auto">
                  Tap a Kiswahili word, then tap its English translation.  Each
                  correct match gives you <strong>+10 points</strong>; each miss
                  costs <strong>-3 points</strong>.  Survive 5 mistakes to set a
                  new high score!
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { sw: "Mwalimu", en: "Teacher" },
                  { sw: "Shule", en: "School" },
                ].map((p) => (
                  <div
                    key={p.sw}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold"
                  >
                    <span className="text-pink-600">{p.sw}</span>
                    <span className="text-slate-400">↔</span>
                    <span className="text-orange-600">{p.en}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={startGame}
                size="lg"
                className="rounded-2xl h-12 px-8 font-black text-sm gap-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-rose-200 hover:shadow-xl active:scale-[0.98]"
              >
                <Sparkles size={18} />
                Start Game
              </Button>
            </div>
          )}

          {/* Playing board */}
          {phase === "playing" && roundData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Match 4 Kiswahili words with their English translations
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Kiswahili column */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-pink-600">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    Kiswahili
                  </div>
                  {remainingSw.map((pair) => {
                    const isSelected = selectedSw === pair.sw;
                    const isMatched = matchedSw.has(pair.sw);
                    return (
                      <button
                        key={pair.id}
                        onClick={() => !isMatched && setSelectedSw(pair.sw)}
                        disabled={isMatched}
                        className={`
                          w-full text-left rounded-2xl border-2 p-4 transition-all duration-200
                          flex items-center justify-between gap-3
                          ${
                            isMatched
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 opacity-60 cursor-default"
                              : isSelected
                              ? feedback === "wrong"
                                ? "bg-rose-50 border-rose-400 ring-2 ring-rose-200 scale-[0.99]"
                                : "bg-pink-50 border-pink-400 ring-2 ring-pink-200 scale-[0.99]"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-600 hover:-translate-y-0.5"
                          }
                        `}
                      >
                        <span
                          className={`text-base font-black ${
                            isMatched
                              ? "text-emerald-700 line-through"
                              : "text-slate-800 dark:text-white"
                          }`}
                        >
                          {pair.sw}
                        </span>
                        {isMatched && (
                          <Check size={18} className="text-emerald-600" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* English column */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    English
                  </div>
                  {remainingEn.map((en) => {
                    const isMatched = matchedEn.has(en);
                    const isSelected = selectedEn === en;
                    return (
                      <button
                        key={en}
                        onClick={() => !isMatched && setSelectedEn(en)}
                        disabled={isMatched}
                        className={`
                          w-full text-left rounded-2xl border-2 p-4 transition-all duration-200
                          flex items-center justify-between gap-3
                          ${
                            isMatched
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 opacity-60 cursor-default"
                              : isSelected
                              ? feedback === "wrong"
                                ? "bg-rose-50 border-rose-400 ring-2 ring-rose-200 scale-[0.99]"
                                : "bg-orange-50 border-orange-400 ring-2 ring-orange-200 scale-[0.99]"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 hover:-translate-y-0.5"
                          }
                        `}
                      >
                        <span
                          className={`text-base font-black ${
                            isMatched
                              ? "text-emerald-700 line-through"
                              : "text-slate-800 dark:text-white"
                          }`}
                        >
                          {en}
                        </span>
                        {isMatched && (
                          <Check size={18} className="text-emerald-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback / hint row */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-4 flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                {selectedSw && selectedEn ? (
                  feedback === "correct" ? (
                    <>
                      <Check size={18} className="text-emerald-500" />
                      <span>
                        <strong className="text-emerald-700">Sahihi!</strong>{" "}
                        {selectedSw} = {selectedEn}
                      </span>
                    </>
                  ) : (
                    <>
                      <X size={18} className="text-rose-500" />
                      <span>
                        <strong className="text-rose-700">Si sahihi.</strong>{" "}
                        Try again.
                      </span>
                    </>
                  )
                ) : selectedSw ? (
                  <>
                    <Lightbulb
                      size={18}
                      className="text-amber-500 animate-pulse"
                    />
                    <span>
                      Now tap the English word for{" "}
                      <strong className="text-pink-600">{selectedSw}</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <Lightbulb size={18} className="text-slate-400" />
                    <span>Tap a Kiswahili word to begin a match.</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Game-over modal ──────────────────────────────────────── */}
      <Dialog
        open={phase === "completed"}
        onOpenChange={(o) => !o && setPhase("idle")}
      >
        <DialogContent className="rounded-3xl border-0 sm:max-w-md overflow-hidden p-0">
          <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner mb-3">
              <Trophy size={32} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white text-center">
                Mchezo Umeisha!
              </DialogTitle>
              <DialogDescription className="text-white/90 text-center font-medium">
                Game over — 5 mistakes.  Here's how you did.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Final Score
                </div>
                <div className="text-2xl font-black text-pink-600 mt-1">
                  {score}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Rounds Won
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {matchesCompleted}
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
                className="flex-1 rounded-2xl h-12 font-black text-sm gap-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md hover:shadow-lg"
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

export default BilingualMatch;
