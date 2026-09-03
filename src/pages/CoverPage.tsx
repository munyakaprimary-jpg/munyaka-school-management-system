import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, GraduationCap, Wifi, Shield } from 'lucide-react';

// ── Inline SVG School Crest / Emblem ────────────────────────────────────────
// Deep blue #1A237E  ·  Forest green #1E6B37  ·  Gold accent #D4AF37
const SchoolCrest: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 120 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Munyaka Primary & Junior School Crest"
  >
    {/* Outer decorative ring */}
    <circle cx="60" cy="60" r="58" fill="#1A237E" />
    <circle cx="60" cy="60" r="52" fill="#1620A0" />
    <circle cx="60" cy="60" r="46" fill="#1A237E" />

    {/* Gold border ring */}
    <circle cx="60" cy="60" r="44" stroke="#D4AF37" strokeWidth="2.5" fill="none" />
    <circle cx="60" cy="60" r="41" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.5" />

    {/* Shield shape */}
    <path
      d="M60 20 L86 34 L86 62 C86 76 74 88 60 96 C46 88 34 76 34 62 L34 34 Z"
      fill="#1E6B37"
      stroke="#D4AF37"
      strokeWidth="1.5"
    />

    {/* Inner shield highlight */}
    <path
      d="M60 26 L82 38 L82 62 C82 74 72 84 60 91 C48 84 38 74 38 62 L38 38 Z"
      fill="#228B3F"
    />

    {/* Book on shield */}
    <rect x="46" y="46" width="28" height="22" rx="3" fill="white" opacity="0.95" />
    <rect x="48" y="48" width="24" height="18" rx="2" fill="#1A237E" />
    {/* Book spine */}
    <line x1="60" y1="48" x2="60" y2="66" stroke="#D4AF37" strokeWidth="1.5" />
    {/* Book lines */}
    <line x1="50" y1="53" x2="58" y2="53" stroke="white" strokeWidth="1" strokeLinecap="round" />
    <line x1="50" y1="57" x2="58" y2="57" stroke="white" strokeWidth="1" strokeLinecap="round" />
    <line x1="50" y1="61" x2="58" y2="61" stroke="white" strokeWidth="1" strokeLinecap="round" />
    <line x1="62" y1="53" x2="70" y2="53" stroke="white" strokeWidth="1" strokeLinecap="round" />
    <line x1="62" y1="57" x2="70" y2="57" stroke="white" strokeWidth="1" strokeLinecap="round" />
    <line x1="62" y1="61" x2="70" y2="61" stroke="white" strokeWidth="1" strokeLinecap="round" />

    {/* Torch on left side of shield */}
    <rect x="42" y="52" width="4" height="14" rx="2" fill="#D4AF37" />
    <ellipse cx="44" cy="50" rx="5" ry="6" fill="#D4AF37" />
    <ellipse cx="44" cy="49" rx="3" ry="4" fill="#FFB300" />
    <ellipse cx="44" cy="48.5" rx="1.5" ry="2.5" fill="white" opacity="0.8" />

    {/* Torch on right side */}
    <rect x="74" y="52" width="4" height="14" rx="2" fill="#D4AF37" />
    <ellipse cx="76" cy="50" rx="5" ry="6" fill="#D4AF37" />
    <ellipse cx="76" cy="49" rx="3" ry="4" fill="#FFB300" />
    <ellipse cx="76" cy="48.5" rx="1.5" ry="2.5" fill="white" opacity="0.8" />

    {/* Star at top */}
    <polygon
      points="60,16 62,21 67,21 63,24 65,29 60,26 55,29 57,24 53,21 58,21"
      fill="#D4AF37"
    />

    {/* Decorative scroll ribbon at bottom */}
    <path
      d="M20 106 Q60 100 100 106 L100 120 Q60 114 20 120 Z"
      fill="#1A237E"
      stroke="#D4AF37"
      strokeWidth="1.5"
    />
    <path
      d="M20 106 Q60 100 100 106"
      stroke="#D4AF37"
      strokeWidth="2"
      fill="none"
    />
    {/* Ribbon tail ends */}
    <path d="M20 106 L10 106 L14 113 L20 116 Z" fill="#1620A0" stroke="#D4AF37" strokeWidth="1" />
    <path d="M100 106 L110 106 L106 113 L100 116 Z" fill="#1620A0" stroke="#D4AF37" strokeWidth="1" />

    {/* Motto text on ribbon */}
    <text
      x="60"
      y="117"
      textAnchor="middle"
      fill="#D4AF37"
      fontSize="6.5"
      fontFamily="Georgia, serif"
      fontStyle="italic"
      fontWeight="bold"
    >
      KNOWLEDGE IS POWER
    </text>
  </svg>
);

// ── Feature Pill ─────────────────────────────────────────────────────────────
interface FeaturePillProps {
  icon: React.ReactNode;
  label: string;
  color: string;
}

const FeaturePill: React.FC<FeaturePillProps> = ({ icon, label, color }) => (
  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${color}`}>
    {icon}
    <span>{label}</span>
  </div>
);

// ── Main Cover Page Component ───────────────────────────────────────────────
interface CoverPageProps {
  onEnter: () => void;
}

const CoverPage: React.FC<CoverPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A237E] via-[#0D1257] to-[#0A0E3A] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* ── Decorative background blobs ─────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#1E6B37] opacity-10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-[#1A237E] opacity-20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full bg-[#1E6B37] opacity-10 blur-3xl" />
        <div className="absolute top-10 right-1/4 w-48 h-48 rounded-full bg-[#D4AF37] opacity-5 blur-2xl" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ── Main Card ───────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl shadow-black/30 overflow-hidden">
          {/* Top accent stripe */}
          <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37]" />

          <div className="px-6 py-8 md:px-10 md:py-12 flex flex-col items-center text-center space-y-8">

            {/* ── School Crest ── */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {/* Glow ring behind crest */}
                <div className="absolute inset-0 rounded-full bg-[#D4AF37] blur-xl opacity-20 scale-90" />
                <SchoolCrest className="w-36 h-40 md:w-44 md:h-52 relative z-10 drop-shadow-2xl" />
              </div>

              {/* School Name */}
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                  Munyaka Primary
                </h1>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-[#D4AF37] leading-tight">
                  & Junior School
                </h2>
              </div>

              {/* Year Established badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-xs font-black tracking-[0.25em] text-white/80 uppercase">
                  Est. 1980
                </span>
              </div>
            </div>

            {/* ── Motto Ribbon ── */}
            <div className="w-full max-w-xs">
              <div className="relative bg-[#1E6B37] rounded-xl px-6 py-3 border-2 border-[#D4AF37] shadow-lg shadow-[#1E6B37]/30">
                {/* Ribbon notch effect */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#D4AF37] rotate-45" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#D4AF37] rotate-45" />
                <p className="text-sm md:text-base font-black italic tracking-wide text-white relative z-10">
                  "Knowledge is Power"
                </p>
              </div>
            </div>

            {/* ── Portal Badge ── */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">
                Official Portal
              </p>
              <p className="text-sm font-black text-white">
                School Management &amp; Learning Portal
              </p>
            </div>

            {/* ── Feature Pills ── */}
            <div className="flex flex-wrap justify-center gap-2">
              <FeaturePill
                icon={<BookOpen size={11} />}
                label="Academics"
                color="bg-[#1E6B37]/30 text-emerald-200 border border-[#1E6B37]/40"
              />
              <FeaturePill
                icon={<GraduationCap size={11} />}
                label="Students"
                color="bg-[#1A237E]/50 text-indigo-200 border border-[#1A237E]/60"
              />
              <FeaturePill
                icon={<Shield size={11} />}
                label="Fees"
                color="bg-[#D4AF37]/20 text-amber-200 border border-[#D4AF37]/30"
              />
              <FeaturePill
                icon={<Wifi size={11} />}
                label="LAN Offline"
                color="bg-white/10 text-white/80 border border-white/20"
              />
            </div>

            {/* ── Primary CTA ── */}
            <div className="w-full space-y-3 pt-2">
              <Button
                onClick={onEnter}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] hover:from-[#C9A432] hover:via-[#E6C200] hover:to-[#C9A432] text-[#1A237E] font-black text-base shadow-2xl shadow-[#D4AF37]/30 transition-all duration-300 active:scale-95 group"
              >
                <span>Proceed to Portal Sign In</span>
                <ArrowRight
                  size={20}
                  className="ml-2 transition-transform group-hover:translate-x-1"
                />
              </Button>
              <p className="text-[10px] text-white/40 font-medium text-center">
                Staff, Teachers &amp; Administrators
              </p>
            </div>
          </div>

          {/* Bottom accent stripe */}
          <div className="h-1.5 bg-gradient-to-r from-[#1E6B37] via-[#228B3F] to-[#1E6B37]" />
        </div>

        {/* Footer tagline */}
        <p className="text-center text-[10px] text-white/30 font-medium mt-4 tracking-wide">
          P.O. Box 5239-30100, Eldoret, Kenya &nbsp;·&nbsp; Tel: +254 738 873 359
        </p>
      </div>
    </div>
  );
};

export default CoverPage;
