/**
 * @file MemoryShelf.tsx
 * @description Left 3-column panel representing external memory outside the chip:
 * - Operand A = 45 (split into word 0 = 0010, word 1 = 1101)
 * - Operand B = 61 (8 LSB-first bit dots with animated pointer)
 * - Modulus M = 63 (63-mark rotating clock ring)
 * - Animated "slip (tick t)" badge when the chip fetches from the shelf
 */

import React from "react";
import { B_BITS } from "../constants/timelineData";

interface MemoryShelfProps {
  bPointer: number;
  slipActive: boolean;
}

export const MemoryShelf: React.FC<MemoryShelfProps> = ({
  bPointer,
  slipActive,
}) => {
  return (
    <div className="col-span-3 h-[490px] rounded-2xl border border-slate-700/60 bg-[#1E293B]/40 p-4 flex flex-col justify-between items-center relative">
      <span className="text-xs font-medium text-slate-400">
        Memory shelf (outside the chip)
      </span>

      {/* ITEM A: Blue Circle with 2 words */}
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-[#3B82F6] shadow-lg shadow-blue-500/20 flex flex-col items-center justify-center text-white font-bold relative z-10">
          <span className="text-sm">A</span>
          <span className="text-xl">45</span>
        </div>
        {/* Word circles */}
        <div className="flex items-center gap-3 -mt-3 z-20">
          <div className="w-12 h-12 rounded-full bg-[#2563EB] border border-blue-300/40 flex flex-col items-center justify-center text-[10px] font-mono shadow">
            <span className="text-[9px] text-blue-200">w0</span>
            <span className="font-bold">0010</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#2563EB] border border-blue-300/40 flex flex-col items-center justify-center text-[10px] font-mono shadow">
            <span className="text-[9px] text-blue-200">w1</span>
            <span className="font-bold">1101</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 mt-1 font-mono">
          word 0 (big) | word 1 (small)
        </span>
      </div>

      {/* ITEM B: Orange Circle with 8 bit dots */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-[#F59E0B] shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center text-white font-bold">
          <span className="text-xs">B</span>
          <span className="text-lg">61</span>
        </div>
        {/* 8 Bits below B (smallest bit first: 1, 0, 1, 1, 1, 1, 0, 0) */}
        <div className="flex items-center gap-1.5 mt-2">
          {B_BITS.map((bit, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full border transition-all duration-300 ${
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

      {/* ITEM M: Green Circle with 63-mark Clock Ring */}
      <div className="flex flex-col items-center relative">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* SVG 63-Tick Clock Ring */}
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
            <span className="text-base">63</span>
          </div>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono">
          clock ring (63 marks)
        </span>
      </div>

      {/* Animated slip flying between shelf & chip */}
      {slipActive && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 flex items-center gap-1 bg-slate-800/90 border border-dashed border-slate-400 text-slate-300 text-[10px] font-mono px-2 py-1 rounded-full animate-bounce">
          <span>slip (tick t)</span>
        </div>
      )}
    </div>
  );
};

