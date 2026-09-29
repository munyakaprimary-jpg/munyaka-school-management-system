import React, { useState, useMemo } from "react";
import {
  Gamepad2,
  Trophy,
  Sparkles,
  Search,
  Filter,
  ShieldAlert,
  Wrench,
  BookOpen,
  ArrowRight,
  Flame,
  Award,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface CbcGameSport {
  id: string;
  title: string;
  category: "Indigenous/Traditional" | "Team Sports" | "Target & Field" | "Gymnastics & Athletics";
  gradeLevel: "Grade 4-6" | "Grade 7-9" | "Grade 4-9";
  competencies: string[];
  rules: string[];
  equipment: string[] | "Zero Equipment";
  safetyNotes: string;
  description: string;
  accent: string;
}

export const CBC_GAMES_DATASET: CbcGameSport[] = [
  {
    id: "kabaddi",
    title: "Kabaddi",
    category: "Team Sports",
    gradeLevel: "Grade 7-9",
    competencies: ["Collaboration", "Spatial Awareness", "Critical Thinking", "Agility"],
    rules: [
      "Raider enters opponent's half chanting 'Kabaddi' continuously on a single breath.",
      "Raider tags as many defenders as possible and returns safely across the midline.",
      "Defenders coordinate to trap and halt the raider before they reach safety.",
      "Points are scored for every defender tagged and successfully returning."
    ],
    equipment: "Zero Equipment",
    safetyNotes: "Ensure soft landing turf; forbid tackling by hair or clothes; monitor controlled breathing.",
    description: "An exhilarating team raid and evasion sport testing breath control, tactical teamwork, and agility.",
    accent: "from-amber-500 to-orange-600"
  },
  {
    id: "bao-ajua",
    title: "Bao / Ajua",
    category: "Indigenous/Traditional",
    gradeLevel: "Grade 4-9",
    competencies: ["Critical Thinking", "Logical Reasoning", "Numeracy", "Concentration"],
    rules: [
      "Board consists of 4 rows of pits with seeds distributed among starting holes.",
      "Players sow seeds anticlockwise across their pits according to tactical rules.",
      "Capturing opponent seeds occurs when the last seed lands in an occupied pit.",
      "The game ends when one player captures all movable seeds or reduces the opponent."
    ],
    equipment: ["Bao Board / Wooden Box", "Seeds, Pebbles, or Marbles (64 total)"],
    safetyNotes: "Keep small seeds away from younger children; ensure calm, respectful play.",
    description: "A prestigious traditional African mancala board game enhancing mental arithmetic, forward planning, and focus.",
    accent: "from-emerald-500 to-teal-700"
  },
  {
    id: "nyoka-kuku",
    title: "Nyoka & Kuku na Mwewe",
    category: "Indigenous/Traditional",
    gradeLevel: "Grade 4-6",
    competencies: ["Spatial Awareness", "Collaboration", "Reflexes", "Agility"],
    rules: [
      "One player acts as the Hawk (Mwewe) and another as the Hen (Kuku).",
      "The remaining players form a line behind the Hen holding each other's waists (the Chicks).",
      "The Hawk tries to tag the last Chick in the line while the Hen blocks with outstretched arms.",
      "If the line breaks or a Chick is tagged, roles shift."
    ],
    equipment: "Zero Equipment",
    safetyNotes: "Play on flat grassy grounds; no rough pulling or clothes-grabbing during defense.",
    description: "Traditional Kenyan tag and evasion games developing swift reflexes, defensive coordination, and endurance.",
    accent: "from-violet-500 to-purple-700"
  },
  {
    id: "tag-rugby",
    title: "Tag / Touch Rugby",
    category: "Team Sports",
    gradeLevel: "Grade 4-9",
    competencies: ["Collaboration", "Spatial Awareness", "Communication", "Speed"],
    rules: [
      "Non-contact game where defenders remove tag ribbons from the ball carrier to effect a tackle.",
      "Ball carrier must pass backward upon being tagged within 3 seconds or stop.",
      "Tackled player has 3 seconds to pass to a teammate.",
      "Try is scored by grounding the ball over the opponent's try line."
    ],
    equipment: ["Tag Belts & Velcro Ribbons", "Rugby Ball (Size 4 or 3)"],
    safetyNotes: "Strictly non-contact; no hand-offs, tackling, or diving into players.",
    description: "Fast-paced invasion team sport cultivating lateral passing skills, tactical positioning, and teamwork.",
    accent: "from-blue-500 to-indigo-700"
  },
  {
    id: "frisbee-ultimate",
    title: "Frisbee Ultimate",
    category: "Target & Field",
    gradeLevel: "Grade 7-9",
    competencies: ["Spatial Awareness", "Collaboration", "Hand-Eye Coordination", "Fair Play"],
    rules: [
      "Players cannot run while holding the disc; they must pivot and throw to teammates.",
      "Passing is allowed in any direction on the field.",
      "A score is made by catching a pass in the opponent's end zone.",
      "Self-refereed game emphasizing sportsmanship and Spirit of the Game."
    ],
    equipment: ["Flying Disc (Frisbee 175g)"],
    safetyNotes: "Maintain spacing to avoid collisions; no stripping discs from opponent's hands.",
    description: "Non-contact flying disc sport prioritizing accurate throwing mechanics, stamina, and honesty.",
    accent: "from-cyan-500 to-blue-600"
  },
  {
    id: "goalball",
    title: "Goalball",
    category: "Target & Field",
    gradeLevel: "Grade 4-9",
    competencies: ["Auditory Concentration", "Spatial Awareness", "Inclusion", "Teamwork"],
    rules: [
      "Played by rolling a ball with internal bells across the floor toward the opponent's goal.",
      "All players wear opaque blindfolds to equalize vision and rely purely on sound.",
      "Defenders listen for the rolling ball and block it with their bodies.",
      "Silence is required from spectators so players can track the ball."
    ],
    equipment: ["Goalball (with bells inside)", "Blindfolds/Shades", "Floor Mats / Court Markings"],
    safetyNotes: "Ensure smooth playing surface free of obstacles; supervise players when blindfolded.",
    description: "An inclusive Paralympic team sport cultivating acute auditory awareness, teamwork, and empathy.",
    accent: "from-rose-500 to-pink-700"
  },
  {
    id: "futsal-5aside",
    title: "Futsal / 5-a-side Football",
    category: "Team Sports",
    gradeLevel: "Grade 4-9",
    competencies: ["Ball Control", "Quick Decision Making", "Collaboration", "Agility"],
    rules: [
      "Played on a hard or artificial turf small court with boundaries.",
      "Lower-bounce ball encourages close-quarters footwork and quick passing.",
      "No sliding tackles allowed to ensure player safety.",
      "All restarts (kick-ins, corner kicks) must be executed within 4 seconds."
    ],
    equipment: ["Futsal Ball (Low bounce size 3/4)", "Goal Posts", "Bibs"],
    safetyNotes: "Wear appropriate indoor court shoes; strict ban on sliding tackles.",
    description: "Dynamic small-sided football variant maximizing ball touches, agility, and tactical intelligence.",
    accent: "from-emerald-600 to-green-800"
  },
  {
    id: "rounders-softball",
    title: "Rounders & Softball",
    category: "Target & Field",
    gradeLevel: "Grade 4-9",
    competencies: ["Hand-Eye Coordination", "Batting Mechanics", "Strategic Placement", "Speed"],
    rules: [
      "Batter strikes the pitched ball and runs around designated bases to score rounders.",
      "Fielders retrieve the ball and throw to base defenders to stump runners.",
      "Batters score a full rounder for hitting and running home in one turn.",
      "Innings alternate between batting and fielding teams."
    ],
    equipment: ["Rounders Bat / Soft Bat", "Softballs / Tennis Balls", "Base Markers"],
    safetyNotes: "Keep safe distance behind the batter; clear batting swing zone.",
    description: "Classic striking and fielding game building exceptional hand-eye coordination and base-running tactics.",
    accent: "from-amber-600 to-yellow-700"
  }
];

export function useCbcGamesHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedGrade, setSelectedGrade] = useState<string>("All");

  const filteredGames = useMemo(() => {
    return CBC_GAMES_DATASET.filter((game) => {
      const matchesSearch = 
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.competencies.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
      const matchesGrade = selectedGrade === "All" || game.gradeLevel === selectedGrade || game.gradeLevel === "Grade 4-9";

      return matchesSearch && matchesCategory && matchesGrade;
    });
  }, [searchQuery, selectedCategory, selectedGrade]);

  return {
    games: CBC_GAMES_DATASET,
    filteredGames,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedGrade,
    setSelectedGrade,
  };
}

export default function CbcGamesHubExtensionView() {
  const {
    filteredGames,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedGrade,
    setSelectedGrade,
  } = useCbcGamesHub();

  const [activeModalGame, setActiveModalGame] = useState<CbcGameSport | null>(null);

  const categories = ["All", "Indigenous/Traditional", "Team Sports", "Target & Field", "Gymnastics & Athletics"];
  const grades = ["All", "Grade 4-6", "Grade 7-9", "Grade 4-9"];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Banner */}
      <header className="relative overflow-hidden rounded-3xl border border-emerald-100 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-widest">
              <Flame size={14} className="text-amber-300" />
              CBC Physical Education & Sports
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <span className="inline-flex w-10 h-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Trophy size={22} className="text-amber-300" />
              </span>
              CBC Games & Sports Hub (Grades 4–9)
            </h1>
            <p className="text-white/90 text-sm font-medium leading-relaxed">
              Explore indigenous traditions, team sports, target games, and inclusive activities designed for CBC competency-based curriculum delivery.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 min-w-[100px] text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 block">Curriculum</span>
              <span className="text-xl font-black mt-0.5">CBC Gr. 4–9</span>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-3 min-w-[100px] text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 block">Activities</span>
              <span className="text-xl font-black mt-0.5">{CBC_GAMES_DATASET.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filter & Search Controls */}
      <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 p-5">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games, skills, equipment..."
              className="pl-10 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1 hidden xl:inline">Category:</span>
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl h-9 text-xs font-bold ${
                  selectedCategory === cat
                    ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:bg-slate-800"
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Grade Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1 hidden xl:inline">Grade:</span>
            {grades.map((gr) => (
              <Button
                key={gr}
                size="sm"
                variant={selectedGrade === gr ? "default" : "outline"}
                onClick={() => setSelectedGrade(gr)}
                className={`rounded-xl h-9 text-xs font-bold ${
                  selectedGrade === gr
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:bg-slate-800"
                }`}
              >
                {gr}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGames.map((game) => (
          <Card
            key={game.id}
            className="group relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            onClick={() => setActiveModalGame(game)}
          >
            <div className={`h-2 bg-gradient-to-r ${game.accent}`} />
            <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {game.category}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900">
                    {game.gradeLevel}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1 line-clamp-2">
                    {game.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {game.competencies.slice(0, 3).map((comp, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-lg">
                      <Sparkles size={10} /> {comp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="truncate max-w-[180px]">
                  🎒 {Array.isArray(game.equipment) ? game.equipment.join(", ") : game.equipment}
                </span>
                <span className="text-teal-600 dark:text-teal-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Rules <ArrowRight size={14} />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-16 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <BookOpen size={36} className="mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No games found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search query or clearing your category and grade filters.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {activeModalGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {activeModalGame.category}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border-indigo-200 text-indigo-700 bg-indigo-50">
                    {activeModalGame.gradeLevel}
                  </Badge>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {activeModalGame.title}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModalGame(null)}
                className="rounded-full w-9 h-9 p-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 font-bold"
              >
                ✕
              </Button>
            </div>

            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              {activeModalGame.description}
            </p>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Award size={14} className="text-teal-500" /> CBC Core Competencies
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeModalGame.competencies.map((comp, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200/50">
                    ✓ {comp}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-500" /> Step-by-Step Rules
              </h4>
              <ol className="space-y-2">
                {activeModalGame.rules.map((rule, idx) => (
                  <li key={idx} className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 p-4 rounded-2xl space-y-2">
                <h5 className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Wrench size={13} /> Equipment Needed
                </h5>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {Array.isArray(activeModalGame.equipment) ? activeModalGame.equipment.join(", ") : activeModalGame.equipment}
                </p>
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 p-4 rounded-2xl space-y-2">
                <h5 className="text-[11px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldAlert size={13} /> Safety & Field Notes
                </h5>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activeModalGame.safetyNotes}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => setActiveModalGame(null)}
                className="w-full rounded-2xl h-11 font-black text-sm bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900"
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
