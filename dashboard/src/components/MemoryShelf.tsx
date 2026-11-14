/**
 * @file MemoryShelf.tsx
 * @description Responsive external memory shelf panel (left on desktop, top row on mobile/tablet):
 * - Operand A (split into 4-bit words w0, w1)
 * - Operand B (8 LSB-first bit dots with animated pointer)
 * - Modulus M (M-mark rotating clock ring)
 * - Animated "slip (tick t)" badge when the chip fetches from the shelf
 */

import React from "react";

interface MemoryShelfProps {
  aVal: number;
  aWords: [string, string];
  bVal: number;
  bBits: number[];
  mVal: number;
  bPointer: number;
  slipActive: boolean;
}

export const MemoryShelf: React.FC<MemoryShelfProps> = ({
  aVal,
  aWords,
  bVal,
  bBits,
  mVal,
  bPointer,
  slipActive,
}) => {
  return (
    <div className="col-span-1 lg:col-span-3 lg:h-[490px] rounded-2xl border border-slate-700/60 bg-[#1E293B]/40 p-3 sm:p-4 flex flex-col justify-between items-center gap-4 lg:gap-0 relative">
      <span className="text-[11px] sm:text-xs font-medium text-slate-400 text-center">
        Memory shelf (outside the chip)
      </span>

      <div className="w-full grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-col items-center justify-around lg:justify-between gap-4 lg:flex-1 lg:py-2">
        {/* ITEM A: Blue Circle with 2 words */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#3B82F6] shadow-lg shadow-blue-500/20 flex flex-col items-center justify-center text-white font-bold relative z-10">
            <span className="text-xs sm:text-sm">A</span>
            <span className="text-lg sm:text-xl">{aVal}</span>
          </div>
          {/* Word circles */}
          <div className="flex items-center gap-2.5 sm:gap-3 -mt-3 z-20">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2563EB] border border-blue-300/40 flex flex-col items-center justify-center text-[10px] font-mono shadow">
              <span className="text-[9px] text-blue-200">w0</span>
              <span className="font-bold">{aWords[0]}</span>
            </div>
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2563EB] border border-blue-300/40 flex flex-col items-center justify-center text-[10px] font-mono shadow">
              <span className="text-[9px] text-blue-200">w1</span>
              <span className="font-bold">{aWords[1]}</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-mono text-center">
            word 0 (big) | word 1 (small)
          </span>
        </div>

        {/* ITEM B: Orange Circle with 8 bit dots */}
        <div className="flex flex-col items-center">
          <div className="w-18 h-18 w-20 h-20 rounded-full bg-[#F59E0B] shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center text-white font-bold">
            <span className="text-xs">B</span>
            <span className="text-lg">{bVal}</span>
          </div>
          {/* 8 Bits below B (smallest bit first) */}
          <div className="flex items-center gap-1 sm:gap-1.5 mt-2">
            {bBits.map((bit, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border transition-all duration-300 ${
                  bPointer === idx
                    ? "bg-amber-400 border-white scale-125 shadow-lg shadow-amber-400/50 animate-pulse"
                    : "border-amber-500/60 " +
                      (bit === 1 ? "bg-amber-600/40" : "bg-transparent")
                }`}
                title={`Bit ${idx}: ${bit}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">
            bits, smallest first
          </span>
        </div>

        {/* ITEM M: Green Circle with M-mark Clock Ring */}
        <div className="flex flex-col items-center relative">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Clock Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeDasharray="2 3"
                className="opacity-70 animate-[spin_60s_linear_infinite]"
              />
            </svg>
            <div className="w-16 h-16 rounded-full bg-[#10B981] shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center text-white font-bold z-10">
              <span className="text-xs">M</span>
              <span className="text-base">{mVal}</span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">
            clock ring ({mVal} marks)
          </span>
        </div>
      </div>

      {/* Animated slip flying between shelf & chip */}
      {slipActive && (
        <div className="lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-1/2 z-30 flex items-center gap-1 bg-slate-800/90 border border-dashed border-slate-400 text-slate-300 text-[10px] font-mono px-2.5 py-1 rounded-full animate-bounce">
          <span>slip (tick t)</span>
        </div>
      )}
    </div>
  );
};
