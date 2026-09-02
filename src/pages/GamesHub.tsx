import React, { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SpeedMath from "@/components/games/SpeedMath";
import MemoryMatch from "@/components/games/MemoryMatch";

type Difficulty = "Easy" | "Medium" | "Hard";

interface Game {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  difficulty: Difficulty;
  category: string;
  accent: string; // gradient class
  ring: string; // hover ring color
  iconBg: string;
  iconColor: string;
  stat: string;
  statIcon: React.ComponentType<{ size?: number; className?: string }>;
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
];

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  Medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  Hard: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
};

const GamesHub = () => {
  // Toggles between the main Games Hub grid (null) and an individual game view.
  const [activeGame, setActiveGame] = useState<string | null>(null);

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
              <p className="text-2xl font-black mt-0.5">3</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Conditional View ───────────────────────────────────────── */}
      {/* Individual game views */}
      {activeGame === "speed-math-blitz" && (
        <SpeedMath onBack={() => setActiveGame(null)} />
      )}
      {activeGame === "memory-match" && (
        <MemoryMatch onBack={() => setActiveGame(null)} />
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
      ) : null}

      {/* "Coming soon" placeholder for games not yet implemented */}
      {activeGame !== null &&
        activeGame !== "speed-math-blitz" &&
        activeGame !== "memory-match" &&
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
