import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, GraduationCap, Wifi, Wallet } from 'lucide-react';

// ── Inline SVG School Crest / Emblem ────────────────────────────────────────
const SchoolCrest: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 120 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Munyaka Primary & Junior School Crest"
  >
    {/* Outer ring — deep blue */}
    <circle cx="60" cy="60" r="58" fill="#1A237E" />
    <circle cx="60" cy="60" r="52" fill="#FFFFFF" />

    {/* Gold accent ring */}
    <circle cx="60" cy="60" r="50" stroke="#D4AF37" strokeWidth="2" fill="none" />
    <circle cx="60" cy="60" r="46" stroke="#D4AF37" strokeWidth="0.6" fill="none" opacity="0.4" />

    {/* Shield — forest green */}
    <path
      d="M60 22 L84 35 L84 62 C84 75 73 86 60 94 C47 86 36 75 36 62 L36 35 Z"
      fill="#1E6B37"
      stroke="#D4AF37"
      strokeWidth="1.5"
    />

    {/* Inner shield highlight */}
    <path
      d="M60 27 L80 38 L80 62 C80 73 71 82 60 89 C49 82 40 73 40 62 L40 38 Z"
      fill="#228B3F"
      opacity="0.5"
    />

    {/* Star at the top */}
    <polygon
      points="60,15 62.5,21 69,21 63.8,25 66,31 60,27 54,31 56.2,25 51,21 57.5,21"
      fill="#D4AF37"
    />

    {/* Open book on shield */}
    <rect x="46" y="48" width="28" height="20" rx="2" fill="#FFFFFF" />
    <line x1="60" y1="48" x2="60" y2="68" stroke="#1A237E" strokeWidth="1.5" />
    <line x1="50" y1="53" x2="58" y2="53" stroke="#1E6B37" strokeWidth="1" strokeLinecap="round" />
    <line x1="50" y1="57" x2="58" y2="57" stroke="#1E6B37" strokeWidth="1" strokeLinecap="round" />
    <line x1="50" y1="61" x2="58" y2="61" stroke="#1E6B37" strokeWidth="1" strokeLinecap="round" />
    <line x1="62" y1="53" x2="70" y2="53" stroke="#1E6B37" strokeWidth="1" strokeLinecap="round" />
    <line x1="62" y1="57" x2="70" y2="57" stroke="#1E6B37" strokeWidth="1" strokeLinecap="round" />
    <line x1="62" y1="61" x2="70" y2="61" stroke="#1E6B37" strokeWidth="1" strokeLinecap="round" />

    {/* Torch — left */}
    <rect x="40" y="56" width="4" height="14" rx="1.5" fill="#D4AF37" />
    <ellipse cx="42" cy="54" rx="5" ry="6" fill="#D4AF37" />
    <ellipse cx="42" cy="53" rx="3" ry="4" fill="#FFB300" />
    <ellipse cx="42" cy="52.5" rx="1.5" ry="2.5" fill="#FFFFFF" opacity="0.9" />

    {/* Torch — right */}
    <rect x="76" y="56" width="4" height="14" rx="1.5" fill="#D4AF37" />
    <ellipse cx="78" cy="54" rx="5" ry="6" fill="#D4AF37" />
    <ellipse cx="78" cy="53" rx="3" ry="4" fill="#FFB300" />
    <ellipse cx="78" cy="52.5" rx="1.5" ry="2.5" fill="#FFFFFF" opacity="0.9" />

    {/* Bottom scroll ribbon */}
    <path
      d="M22 102 Q60 96 98 102 L98 116 Q60 110 22 116 Z"
      fill="#1A237E"
      stroke="#D4AF37"
      strokeWidth="1.5"
    />
    {/* Ribbon tail ends */}
    <path d="M22 102 L12 102 L16 110 L22 113 Z" fill="#1620A0" stroke="#D4AF37" strokeWidth="1" />
    <path d="M98 102 L108 102 L104 110 L98 113 Z" fill="#1620A0" stroke="#D4AF37" strokeWidth="1" />

    {/* Motto on ribbon */}
    <text
      x="60"
      y="113"
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

// ── Feature Tag ────────────────────────────────────────────────────────────────
interface FeatureTagProps {
  icon: React.ReactNode;
  label: string;
}

const FeatureTag: React.FC<FeatureTagProps> = ({ icon, label }) => (
  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-bold text-white/90 shadow-sm hover:bg-white/25 hover:border-white/30 transition-all">
    <span className="text-amber-300">{icon}</span>
    <span>{label}</span>
  </div>
);

// ── Main Cover Page Component ───────────────────────────────────────────────
interface CoverPageProps {
  onEnter: () => void;
}

const CoverPage: React.FC<CoverPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">

      {/* ── Rich brand gradient background ─────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-emerald-950" />

      {/* ── Ambient mesh glow blobs ────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary blue glow — top left */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-3xl" />
        {/* Secondary indigo glow — center right */}
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-500/15 blur-3xl" />
        {/* Emerald accent — bottom */}
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-3xl" />
        {/* Amber glow — top right corner */}
        <div className="absolute -top-20 right-1/4 w-[300px] h-[300px] rounded-full bg-amber-500/10 blur-3xl" />
        {/* Deep center bloom */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* ── Subtle mesh grid overlay ───────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Main Glassmorphism Card ──────────────────────────────────── */}
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">

          {/* ── Vibrant top gradient border ───────────────────────────── */}
          <div className="relative h-1.5">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />
            {/* Gloss highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
          </div>

          <div className="px-6 py-10 md:px-10 md:py-12 flex flex-col items-center text-center space-y-7">

            {/* ── School Crest ────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-5">
              {/* Glow behind crest */}
              <div className="absolute w-48 h-48 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

              <div className="relative">
                <SchoolCrest className="w-40 h-44 md:w-52 md:h-56 drop-shadow-2xl" />
              </div>

              {/* ── School Name ──────────────────────────────────────── */}
              <div className="space-y-1">
                <h1 className="text-2xl md:text-[1.75rem] font-black tracking-tight text-white leading-tight">
                  Munyaka Primary
                </h1>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-emerald-400 leading-tight">
                  & Junior School
                </h2>
              </div>

              {/* ── EST. 1980 Badge ──────────────────────────────────── */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[11px] font-black tracking-[0.2em] text-white/70 uppercase">
                  Est. 1980
                </span>
              </div>
            </div>

            {/* ── Motto Pill Badge ─────────────────────────────────────── */}
            <div className="relative inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg shadow-emerald-500/10">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/5 to-blue-500/5" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-sm font-bold italic tracking-wide text-white relative z-10">
                "Knowledge is Power"
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>

            {/* ── Portal Badge ────────────────────────────────────────── */}
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
                Official Portal
              </p>
              <p className="text-sm md:text-base font-bold text-white/80">
                School Management &amp; Learning Portal
              </p>
            </div>

            {/* ── Feature Tags ────────────────────────────────────────── */}
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <FeatureTag icon={<BookOpen size={12} />} label="Academics" />
              <FeatureTag icon={<GraduationCap size={12} />} label="Students" />
              <FeatureTag icon={<Wallet size={12} />} label="Fees" />
              <FeatureTag icon={<Wifi size={12} />} label="LAN Offline" />
            </div>

            {/* ── Primary CTA Button ──────────────────────────────────── */}
            <div className="w-full space-y-3 pt-2">
              <Button
                onClick={onEnter}
                className="w-full h-13 md:h-14 rounded-2xl shadow-2xl shadow-blue-600/40 hover:shadow-2xl hover:shadow-emerald-500/40 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <span>Proceed to Portal Sign In</span>
                <ArrowRight
                  size={18}
                  className="ml-2 transition-transform group-hover:translate-x-1"
                />
              </Button>
              <p className="text-[10px] text-white/40 font-medium text-center tracking-wide">
                For Staff, Teachers &amp; Administrators
              </p>
            </div>
          </div>

          {/* ── Bottom gradient accent ─────────────────────────────────── */}
          <div className="relative h-1">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-emerald-500 to-blue-600 opacity-70" />
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <p className="text-center text-[10px] text-white/30 font-medium mt-6 tracking-wide">
          P.O. Box 5239-30100, Eldoret, Kenya &nbsp;·&nbsp; Tel: +254 738 873 359
        </p>
      </div>
    </div>
  );
};

export default CoverPage;