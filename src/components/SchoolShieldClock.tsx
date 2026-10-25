import React, { useState, useEffect } from 'react';

export const SchoolShieldClock: React.FC<{ className?: string }> = ({ className = "w-48 h-48" }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  // Calculate rotation angles for clock hands
  const secondDeg = (seconds / 60) * 360;
  const minuteDeg = (minutes / 60) * 360 + (seconds / 60) * 6;
  const hourDeg = (hours / 12) * 360 + (minutes / 60) * 30;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Outer Container keeping exact aspect ratio */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Full Vector School Crest / Emblem with embedded analog clock */}
        <svg
          viewBox="0 0 120 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain filter drop-shadow-xl"
          aria-label="Munyaka Primary & Junior School Crest with Live Clock"
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

          {/* Inner shield body (Clock Face Background) */}
          <path
            d="M60 27 L80 38 L80 62 C80 73 71 82 60 89 C49 82 40 73 40 62 L40 38 Z"
            fill="#15532A"
            stroke="#D4AF37"
            strokeWidth="0.8"
            opacity="0.95"
          />

          {/* Subtle Clock Dial Ticks inside inner shield */}
          <g opacity="0.6">
            <line x1="60" y1="31" x2="60" y2="33" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="72" y1="38" x2="71" y2="39.5" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="75" y1="52" x2="73" y2="52" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="70" y1="68" x2="68.5" y2="67" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="60" y1="78" x2="60" y2="76" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="50" y1="68" x2="51.5" y2="67" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="45" y1="52" x2="47" y2="52" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="48" y1="38" x2="49.5" y2="39.5" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          {/* Star at the top */}
          <polygon
            points="60,15 62.5,21 69,21 63.8,25 66,31 60,27 54,31 56.2,25 51,21 57.5,21"
            fill="#D4AF37"
          />

          {/* Clock Hands & Center Pin anchored around (60, 58) inside the inner shield */}
          {/* Hour Hand */}
          <line
            x1="60"
            y1="58"
            x2="60"
            y2="45"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${hourDeg} 60 58)`}
            className="drop-shadow-sm"
          />

          {/* Minute Hand */}
          <line
            x1="60"
            y1="58"
            x2="60"
            y2="38"
            stroke="#FCD34D"
            strokeWidth="1.8"
            strokeLinecap="round"
            transform={`rotate(${minuteDeg} 60 58)`}
            className="drop-shadow-sm"
          />

          {/* Second Hand */}
          <line
            x1="60"
            y1="58"
            x2="60"
            y2="35"
            stroke="#EF4444"
            strokeWidth="1"
            strokeLinecap="round"
            transform={`rotate(${secondDeg} 60 58)`}
          />

          {/* Center Pivot Pin (Golden Pin) */}
          <circle cx="60" cy="58" r="2.2" fill="#F59E0B" stroke="#B45309" strokeWidth="0.5" />

          {/* Torch — left */}
          <rect x="41" y="70" width="3.5" height="11" rx="1.5" fill="#D4AF37" opacity="0.9" />
          <ellipse cx="42.7" cy="68" rx="3.5" ry="4.5" fill="#FFB300" opacity="0.9" />

          {/* Torch — right */}
          <rect x="75.5" y="70" width="3.5" height="11" rx="1.5" fill="#D4AF37" opacity="0.9" />
          <ellipse cx="77.3" cy="68" rx="3.5" ry="4.5" fill="#FFB300" opacity="0.9" />

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
      </div>

      {/* School Name Label below */}
      <div className="mt-2 text-center">
        <h3 className="text-lg font-bold text-white tracking-wide">Munyaka Primary</h3>
        <p className="text-sm font-semibold text-emerald-400">& Junior School</p>
      </div>
    </div>
  );
};
