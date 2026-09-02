import React, { useState, useCallback, useEffect } from "react";
import {
  Type,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Trophy,
  SkipForward,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Brain,
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
  saveWordResult,
  incrementGamesPlayed,
} from "@/lib/gameStats";

interface WordEntry {
  word: string;
  hint: string;
}

const WORD_BANK: WordEntry[] = [
  { word: "photosynthesis", hint: "Process by which plants convert sunlight into energy" },
  { word: "ecosystem", hint: "Community of living organisms interacting with their environment" },
  { word: "democracy", hint: "System of government by the whole population or eligible members" },
  { word: "algorithm", hint: "Step-by-step procedure for solving a problem or accomplishing a task" },
  { word: "friction", hint: "Force that opposes the relative motion or tendency of motion between surfaces" },
  { word: "metabolism", hint: "Chemical processes that occur within a living organism to maintain life" },
  { word: "precipitation", hint: "Water falling from clouds in the form of rain, snow, or hail" },
  { word: "gravity", hint: "Force that attracts a body toward the center of the earth" },
  { word: "evaporation", hint: "Process by which water changes from liquid to gas on heating" },
  { word: "magnesium", hint: "Shiny gray alkaline earth metal element with symbol Mg" },
  { word: "velocity", hint: "Speed of something in a given direction" },
  { word: "hemisphere", hint: "Half of a sphere, or the left or right half of the brain" },
  { word: "continent", hint: "Any of the world's main continuous expanses of land (e.g. Africa, Europe)" },
  { word: "velocity", hint: "Speed of something in a given direction" },
  { word: "mitochondria", hint: "The powerhouse of the cell — organelle that produces ATP" },
  { word: "syllable", hint: "A unit of pronunciation having one vowel sound" },
  { word: "chromosome", hint: "Thread-like structure of nucleic acids carrying genetic information" },
  { word: "tectonic", hint: "Relating to the structure of the earth's crust and the forces that shape it" },
  { word: "bacteria", hint: "Microscopic organisms that can be beneficial or cause disease" },
  { word: "velocity", hint: "Speed of something in a given direction" },
  { word: "convection", hint: "Transfer of heat by the movement of a fluid" },
  { word: "inertia", hint: "A body's resistance to changes in its state of motion" },
  { word: "nucleus", hint: "The positively charged central core of an atom, or the control center of a cell" },
  { word: "isotope", hint: "Each of two or more forms of the same element with different neutron numbers" },
  { word: "velocity", hint: "Speed of something in a given direction" },
];

const shuffleString = (s: string): string => {
  const arr = s.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Keep shuffling if result matches original
  if (arr.join("") === s) return shuffleString(s);
  return arr.join("");
};

const pickWords = (count: number): WordEntry[] => {
  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

interface WordScrambleProps {
  onBack: () => void;
}

const WordScramble: React.FC<WordScrambleProps> = ({ onBack }) => {
  const [wordList] = useState<WordEntry[]>(() => pickWords(10));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scrambled, setScrambled] = useState(() => shuffleString(wordList[0].word));
  const [input, setInput] = useState("");
  const [hint, setHint] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [phase, setPhase] = useState<"playing" | "done">("playing");
  const [shake, setShake] = useState(false);

  const currentWord = wordList[currentIdx];

  const nextWord = useCallback(() => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= wordList.length) {
      // Persist words completed for this round
      const wordsCompleted = wordList.length - skipped;
      saveWordResult(score, wordsCompleted);
      setPhase("done");
      return;
    }
    setCurrentIdx(nextIdx);
    setScrambled(shuffleString(wordList[nextIdx].word));
    setInput("");
    setHint("");
    setShowHint(false);
    setFeedback("idle");
  }, [currentIdx, wordList, score, skipped]);

  const checkAnswer = useCallback(() => {
    if (input.trim() === "") return;
    const isCorrect =
      input.trim().toLowerCase() === currentWord.word.toLowerCase();
    if (isCorrect) {
      const bonus = showHint ? 0 : 1; // no bonus if hint was used
      setScore((s) => s + 1 + bonus);
      setStreak((s) => s + 1);
      setFeedback("correct");
      setTimeout(() => {
        setFeedback("idle");
        nextWord();
      }, 800);
    } else {
      setStreak(0);
      setFeedback("wrong");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setTimeout(() => setFeedback("idle"), 800);
    }
  }, [input, currentWord.word, showHint, nextWord]);

  const skip = useCallback(() => {
    setSkipped((s) => s + 1);
    setStreak(0);
    nextWord();
  }, [nextWord]);

  const revealHint = () => {
    if (!showHint) {
      setHintsUsed((h) => h + 1);
    }
    setShowHint(true);
    setHint(currentWord.hint);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      checkAnswer();
    }
  };

  const restart = () => {
    const fresh = pickWords(10);
    setCurrentIdx(0);
    setScrambled(shuffleString(fresh[0].word));
    setInput("");
    setHint("");
    setShowHint(false);
    setHintsUsed(0);
    setFeedback("idle");
    setScore(0);
    setStreak(0);
    setSkipped(0);
    setPhase("playing");
    incrementGamesPlayed();
  };

  const accuracy =
    currentIdx - skipped === 0
      ? 100
      : Math.round(((score) / (currentIdx - skipped + (currentIdx < wordList.length ? 1 : 0))) * 100);

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
          <div className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 px-3 py-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
            <Trophy size={14} className="text-amber-500" />
            Score: {score}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-2xl bg-sky-100 dark:bg-sky-950/40 px-3 py-1.5 text-sky-700 dark:text-sky-300 font-bold text-xs">
            <Brain size={14} />
            {currentIdx}/{wordList.length}
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Trophy size={16} className="text-emerald-500" />}
          label="Score"
          value={score}
          colorClass="text-emerald-600"
        />
        <StatCard
          icon={<SkipForward size={16} className="text-slate-500" />}
          label="Skipped"
          value={skipped}
          colorClass="text-slate-600"
        />
        <StatCard
          icon={<Lightbulb size={16} className="text-amber-500" />}
          label="Hints Used"
          value={hintsUsed}
          colorClass="text-amber-600"
        />
      </div>

      {/* ── Main card ─────────────────────────────────────────── */}
      <div
        className={`rounded-3xl border-2 overflow-hidden transition-all duration-200 ${
          feedback === "correct"
            ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20"
            : feedback === "wrong"
            ? "border-rose-300 bg-rose-50/60 dark:bg-rose-950/20"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        } ${shake ? "animate-[wiggle_0.4s_ease-in-out]" : ""}`}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

        <div className="p-6 sm:p-10 text-center space-y-6">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Progress</span>
              <span>{currentIdx}/{wordList.length} words</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-500 rounded-full"
                style={{ width: `${(currentIdx / wordList.length) * 100}%` }}
              />
            </div>
          </div>

          {phase === "playing" && (
            <>
              {/* Scrambled letters */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Unscramble this word
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {scrambled.split("").map((letter, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xl sm:text-2xl shadow-md flex items-center justify-center"
                    >
                      {letter.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hint section */}
              {showHint && (
                <div className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-2xl px-4 py-2 max-w-md mx-auto border border-amber-200 dark:border-amber-800">
                  <Lightbulb size={14} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    {hint}
                  </p>
                </div>
              )}

              {/* Input */}
              <div className="max-w-sm mx-auto space-y-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Type your answer..."
                  className={`text-center text-lg font-black h-12 rounded-2xl border-2 ${
                    feedback === "correct"
                      ? "border-emerald-400 bg-emerald-50"
                      : feedback === "wrong"
                      ? "border-rose-400 bg-rose-50"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={checkAnswer}
                    className="flex-1 rounded-2xl h-11 font-black text-sm gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg"
                  >
                    <CheckCircle2 size={16} />
                    Submit
                  </Button>
                  <Button
                    onClick={skip}
                    variant="outline"
                    className="flex-1 rounded-2xl h-11 font-bold text-sm gap-2 border-slate-200 dark:border-slate-700"
                  >
                    <SkipForward size={16} />
                    Skip
                  </Button>
                </div>
                <Button
                  onClick={revealHint}
                  variant="ghost"
                  className="w-full rounded-2xl h-10 font-bold text-xs gap-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <Lightbulb size={14} />
                  {showHint ? "Hint revealed" : "Show Hint"}
                </Button>
              </div>

              {/* Feedback chip */}
              <div className="h-6 flex items-center justify-center">
                {feedback === "correct" && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 size={16} /> Correct! Well done.
                  </span>
                )}
                {feedback === "wrong" && (
                  <span className="inline-flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                    <XCircle size={16} /> Not quite — try again or skip!
                  </span>
                )}
              </div>
            </>
          )}

          {phase === "playing" && currentIdx === 0 && score === 0 && skipped === 0 && (
            <div className="space-y-3 py-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg">
                <Type size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Word Scramble
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Unscramble the letters to reveal the word. Use the hint if you
                  get stuck. No hint bonus points available!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Completion modal ──────────────────────────────────── */}
      <Dialog
        open={phase === "done"}
        onOpenChange={(o) => !o && setPhase("done")}
      >
        <DialogContent className="rounded-3xl border-0 sm:max-w-md overflow-hidden p-0">
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner mb-3">
              <Trophy size={32} />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white text-center">
                Round Complete!
              </DialogTitle>
              <DialogDescription className="text-white/90 text-center font-medium">
                You worked through all {wordList.length} words.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-3 gap-3 text-center">
              <ResultStat label="Score" value={score} accent="text-emerald-600" />
              <ResultStat label="Skipped" value={skipped} accent="text-slate-600" />
              <ResultStat label="Hints Used" value={hintsUsed} accent="text-amber-600" />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={restart}
                className="flex-1 rounded-2xl h-12 font-black text-sm gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md hover:shadow-lg"
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

export default WordScramble;
