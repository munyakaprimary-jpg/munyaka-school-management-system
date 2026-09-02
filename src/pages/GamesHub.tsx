import React, { useState, useCallback } from "react";
import {
  Gamepad2,
  Zap,
  Brain,
  Type,
  Grid3x3,
  Play,
  ArrowLeft,
  Sparkles,
  Trophy,
  Clock,
  Star,
  Flame,
  Puzzle,
  Lock,
  Target,
  BrainCircuit,
  BarChart3,
  Zap as ZapIcon,
  Languages,
  Calculator,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import SpeedMath from "@/components/games/SpeedMath";
import MemoryMatch from "@/components/games/MemoryMatch";
import WordScramble from "@/components/games/WordScramble";
import SudokuMini from "@/components/games/SudokuMini";
import BilingualMatch from "@/components/games/BilingualMatch";
import TargetMath from "@/components/games/TargetMath";
import PatternMemory from "@/components/games/PatternMemory";
import {
  loadMeta,
  getHighScore,
  loadMemoryMatchesCompleted,
  loadWordWordsCompleted,
  loadSudokuPuzzlesSolved,
  loadBilingualBestScore,
  loadBilingualMatchesCompleted,
  loadTargetMathHighScore,
  loadTargetMathPuzzlesSolved,
  loadPatternMemoryBestRound,
} from "@/lib/gameStats";

type Difficulty = "Easy" | "Medium" | "Hard";

interface Game {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  difficulty: Difficulty;
  category: string;
  accent: string; // gradient class
  ring: string; // hover ring color
  iconBg: string;
  iconColor: string;
  stat: string;
  statIcon: LucideIcon;
}

const GAMES: Game[] = [
  {
    id: "speed-math-blitz",
    title: "Speed Math Blitz",
    description: "Race the clock to solve rapid-fire arithmetic challenges and stack your streak.",
    icon: Zap,
    difficulty: "Medium",
    category: "Math",
    accent: "from-amber-400 via-orange-500 to-rose-500",
    ring: "hover:ring-amber-300/60",
    iconBg: "bg-amber-100 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    stat: "60s rounds",
    statIcon: Clock,
  },
  {
    id: "memory-match",
    title: "Memory Match",
    description: "Flip, match, and memorize card pairs before time runs out in this classic brain trainer.",
    icon: Brain,
    difficulty: "Easy",
    category: "Memory",
    accent: "from-violet-500 via-purple-500 to-fuchsia-500",
    ring: "hover:ring-violet-300/60",
    iconBg: "bg-violet-100 dark:bg-violet-950/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    stat: "Pattern play",
    statIcon: Sparkles,
  },
  {
    id: "word-scramble",
    title: "Word Scramble",
    description: "Unscramble jumbled letters to form words and expand your vocabulary every day.",
    icon: Type,
    difficulty: "Medium",
    category: "Words",
    accent: "from-emerald-400 via-teal-500 to-cyan-500",
    ring: "hover:ring-emerald-300/60",
    iconBg: "bg-emerald-100 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    stat: "Daily words",
    statIcon: Star,
  },
  {
    id: "sudoku-mini",
    title: "Sudoku Mini",
    description: "Crack the 6×6 logic grid, sharpen reasoning, and chase the perfect no-mistake run.",
    icon: Grid3x3,
    difficulty: "Hard",
    category: "Logic",
    accent: "from-sky-500 via-blue-500 to-indigo-500",
    ring: "hover:ring-sky-300/60",
    iconBg: "bg-sky-100 dark:bg-sky-950/40",
    iconColor: "text-sky-600 dark:text-sky-400",
    stat: "6×6 grids",
    statIcon: Puzzle,
  },
  {
    id: "bilingual-match",
    title: "Word Match",
    description: "Pair Kiswahili vocabulary with their English translations and master bilingual fluency.",
    icon: Languages,
    difficulty: "Easy",
    category: "Languages",
    accent: "from-teal-400 via-emerald-500 to-green-500",
    ring: "hover:ring-teal-300/60",
    iconBg: "bg-teal-100 dark:bg-teal-950/40",
    iconColor: "text-teal-600 dark:text-teal-400",
    stat: "Swahili & English",
    statIcon: Languages,
  },
  {
    id: "target-math",
    title: "Target Math",
    description: "Use four numbers and standard operations to hit the exact target value. Think, combine, solve!",
    icon: Calculator,
    difficulty: "Hard",
    category: "Math",
    accent: "from-rose-400 via-pink-500 to-fuchsia-500",
    ring: "hover:ring-rose-300/60",
    iconBg: "bg-rose-100 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    stat: "Equation puzzles",
    statIcon: Target,
  },
  {
    id: "pattern-memory",
    title: "Pattern Memory",
    description: "Watch the light sequence flash, then repeat it. One wrong tap and the round resets!",
    icon: Brain,
    difficulty: "Medium",
    category: "Memory",
    accent: "from-orange-400 via-amber-500 to-yellow-500",
    ring: "hover:ring-orange-300/60",
    iconBg: "bg-orange-100 dark:bg-orange-950/40",
    iconColor: "text-orange-600 dark:text-orange-400",
    stat: "Simon Says mode",
    statIcon: Sparkles,
  },
];

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  Medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  Hard: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
};

const GamesHub = () => {
  // Toggles between the main Games Hub grid (null) and an individual game view.
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Persisted stats — reloaded whenever the user returns to the hub.
  const [stats, setStats] = useState({
    totalGamesPlayed: 0,
    topMathScore: 0,
    memoryMatchesCompleted: 0,
    wordsCompleted: 0,
    sudokuPuzzlesSolved: 0,
    bilingualBestScore: 0,
    bilingualMatchesCompleted: 0,
    targetMathHighScore: 0,
    targetMathPuzzlesSolved: 0,
    patternMemoryBestRound: 0,
  });

  const reloadStats = useCallback(() => {
    setStats({
      totalGamesPlayed: loadMeta().totalGamesPlayed,
      topMathScore: getHighScore("speed-math"),
      memoryMatchesCompleted: loadMemoryMatchesCompleted(),
      wordsCompleted: loadWordWordsCompleted(),
      sudokuPuzzlesSolved: loadSudokuPuzzlesSolved(),
      bilingualBestScore: loadBilingualBestScore(),
      bilingualMatchesCompleted: loadBilingualMatchesCompleted(),
      targetMathHighScore: loadTargetMathHighScore(),
      targetMathPuzzlesSolved: loadTargetMathPuzzlesSolved(),
      patternMemoryBestRound: loadPatternMemoryBestRound(),
    });
  }, []);

  // Reload stats every time the hub becomes active (i.e., user returns from a game).
  React.useEffect(() => {
    if (activeGame === null) reloadStats();
  }, [activeGame, reloadStats]);

  const selectedGame = GAMES.find((g) => g.id === activeGame) ?? null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-3xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 sm:p-10 text-white shadow-xl shadow-indigo-200/40 dark:shadow-none">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-fuchsia-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-widest">
              <Flame size={14} className="text-amber-300" />
              Learning Arcade
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Gamepad2 size={26} />
              </span>
              Games Hub
            </h1>
            <p className="text-white/85 text-sm sm:text-base font-medium leading-relaxed">
              Quick, playful challenges that sharpen memory, math, words, and logic.
              Pick a game and start a streak in seconds.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 min-w-[110px]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
                <Trophy size={12} className="text-amber-300" /> Games
              </div>
              <p className="text-2xl font-black mt-0.5">{GAMES.length}</p>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 min-w-[110px]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
                <Sparkles size={12} className="text-cyan-300" /> Modes
              </div>
              <p className="text-2xl font-black mt-0.5">{GAMES.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Conditional View ───────────────────────────────────────── */}
      {/* Global stats banner — always visible above the hub grid */}
      {activeGame === null && (
        <section
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 animate-in slide-in-from-top-4 fade-in duration-700"
          aria-label="Global game statistics"
        >
          <StatBanner
            icon={<BarChart3 size={16} className="text-indigo-500" />}
            label="Games Played"
            value={stats.totalGamesPlayed}
            accent="bg-indigo-100 dark:bg-indigo-950/40"
            textAccent="text-indigo-700 dark:text-indigo-300"
            subValue="across all titles"
          />
          <StatBanner
            icon={<ZapIcon size={16} className="text-amber-500" />}
            label="Top Math Score"
            value={stats.topMathScore}
            accent="bg-amber-100 dark:bg-amber-950/40"
            textAccent="text-amber-700 dark:text-amber-300"
            subValue="best of all time"
          />
          <StatBanner
            icon={<BrainCircuit size={16} className="text-violet-500" />}
            label="Memory Matches"
            value={stats.memoryMatchesCompleted}
            accent="bg-violet-100 dark:bg-violet-950/40"
            textAccent="text-violet-700 dark:text-violet-300"
            subValue="puzzles completed"
          />
          <StatBanner
            icon={<Target size={16} className="text-sky-500" />}
            label="Sudoku Solved"
            value={stats.sudokuPuzzlesSolved}
            accent="bg-sky-100 dark:bg-sky-950/40"
            textAccent="text-sky-700 dark:text-sky-300"
            subValue={`${stats.wordsCompleted} words too`}
          />
          <StatBanner
            icon={<Languages size={16} className="text-teal-500" />}
            label="Word Matches"
            value={stats.bilingualBestScore}
            accent="bg-teal-100 dark:bg-teal-950/40"
            textAccent="text-teal-700 dark:text-teal-300"
            subValue={`${stats.bilingualMatchesCompleted} rounds`}
          />
          <StatBanner
            icon={<Calculator size={16} className="text-rose-500" />}
            label="Target Math"
            value={stats.targetMathHighScore}
            accent="bg-rose-100 dark:bg-rose-950/40"
            textAccent="text-rose-700 dark:text-rose-300"
            subValue={`${stats.targetMathPuzzlesSolved} puzzles`}
          />
        </section>
      )}


      {/* Individual game views */}
      {activeGame === "speed-math-blitz" && (
        <SpeedMath onBack={() => setActiveGame(null)} />
      )}
      {activeGame === "memory-match" && (
        <MemoryMatch onBack={() => setActiveGame(null)} />
      )}
      {activeGame === "word-scramble" && (
        <WordScramble onBack={() => setActiveGame(null)} />
      )}
      {activeGame === "sudoku-mini" && (
        <SudokuMini onBack={() => setActiveGame(null)} />
      )}
      {activeGame === "bilingual-match" && (
        <BilingualMatch onBack={() => setActiveGame(null)} />
      )}
      {activeGame === "target-math" && (
        <TargetMath onBack={() => setActiveGame(null)} />
      )}
      {activeGame === "pattern-memory" && (
        <PatternMemory onBack={() => setActiveGame(null)} />
      )}

      {/* Game Hub grid — shown when no game is active */}
      {activeGame === null && (
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Playable Games
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                Tap a card to launch a quick session.
              </p>
            </div>
            <Badge
              variant="secondary"
              className="hidden sm:inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
            >
              New games weekly
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {GAMES.map((game) => {
              const Icon = game.icon;
              const StatIcon = game.statIcon;
              return (
                <Card
                  key={game.id}
                  className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:ring-4 ${game.ring} transition-all duration-300 cursor-pointer`}
                  onClick={() => setActiveGame(game.id)}
                >
                  {/* Accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${game.accent}`} />

                  <CardContent className="p-5 flex flex-col h-full gap-4">
                    {/* Icon + category */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-14 h-14 rounded-2xl ${game.iconBg} flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                      >
                        <Icon size={28} className={game.iconColor} />
                      </div>
                      <Badge
                        variant="outline"
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${DIFFICULTY_STYLES[game.difficulty]}`}
                      >
                        {game.difficulty}
                      </Badge>
                    </div>

                    {/* Title + desc */}
                    <div className="space-y-1.5 flex-1">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                        {game.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
                        {game.description}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <StatIcon size={13} />
                        {game.stat}
                      </span>
                      <span className="uppercase tracking-widest text-[10px] text-slate-400">
                        {game.category}
                      </span>
                    </div>

                    {/* Play button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveGame(game.id);
                      }}
                      className={`w-full rounded-2xl h-11 font-black text-sm gap-2 text-white bg-gradient-to-r ${game.accent} shadow-md hover:shadow-lg active:scale-[0.98] transition-all`}
                    >
                      <Play size={16} className="fill-white" />
                      Play Game
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* "Coming soon" placeholder for games not yet implemented */}
      {activeGame !== null &&
        activeGame !== "speed-math-blitz" &&
        activeGame !== "memory-match" &&
        activeGame !== "word-scramble" &&
        activeGame !== "sudoku-mini" &&
        activeGame !== "bilingual-match" &&
        activeGame !== "target-math" &&
        activeGame !== "pattern-memory" &&
        selectedGame && (
          <section className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setActiveGame(null)}
              className="rounded-2xl gap-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={18} />
              Back to Games Hub
            </Button>

            <Card
              className={`overflow-hidden rounded-3xl border-0 shadow-xl bg-gradient-to-br ${selectedGame.accent} text-white`}
            >
              <CardContent className="p-8 sm:p-12 text-center space-y-5">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                  <Lock size={36} className="text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                    {selectedGame.title}
                  </h2>
                  <p className="text-white/90 font-medium max-w-xl mx-auto">
                    This game is in development. Check back soon!
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 text-[11px] font-bold border-white/40 bg-white/15 text-white"
                >
                  Coming Soon
                </Badge>
                <div className="pt-2">
                  <Button
                    onClick={() => setActiveGame(null)}
                    className="rounded-2xl h-12 px-8 font-black text-sm gap-2 bg-white text-slate-900 hover:bg-white/90 active:scale-[0.98] shadow-lg"
                  >
                    <ArrowLeft size={18} className="text-slate-900" />
                    Back to Games
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
    </div>
  );
};

export default GamesHub;

interface StatBannerProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  textAccent: string;
  subValue?: string;
}

const StatBanner: React.FC<StatBannerProps> = ({
  icon,
  label,
  value,
  accent,
  textAccent,
  subValue,
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-all duration-300">
    <div
      className={`absolute top-0 right-0 w-20 h-20 ${accent} rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`}
    />
    <div className="relative space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {icon}
        {label}
      </div>
      <div className={`text-3xl sm:text-4xl font-black tabular-nums ${textAccent}`}>
        {value.toLocaleString()}
      </div>
      {subValue && (
        <div className="text-[10px] font-bold text-slate-400 mt-0.5">
          {subValue}
        </div>
      )}
    </div>
  </div>
);
