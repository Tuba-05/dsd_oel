/**
 * @file ChipView.tsx
 * @description Center 6-column panel representing the Montgomery Multiplier Chip (`montprod`).
 *
 * Purpose:
 * - Left half inside chip: Accumulator Bucket `S` with its 2 words (`w0`, `w1`),
 *   yellow carry indicator, and rose dropped-bit indicator.
 * - Right half inside chip: The three arithmetic machines (`+M machine`, `+A machine`, `÷2 machine`)
 *   that highlight and scale up when active.
 */

import React from "react";
import { ActiveMachine } from "../types/timeline";

interface ChipViewProps {
  sVal: number;
  sWords: [string, string];
  carryActive: boolean;
  droppedBit: number | null;
  activeMachine: ActiveMachine;
}

export const ChipView: React.FC<ChipViewProps> = ({
  sVal,
  sWords,
  carryActive,
  droppedBit,
  activeMachine,
}) => {
  return (
    <div className="col-span-6 h-[490px] rounded-3xl border-2 border-purple-500/60 bg-[#1E293B]/20 p-5 flex flex-col justify-between relative shadow-2xl shadow-purple-950/20">
      <div className="text-center">
        <span className="text-sm font-bold tracking-wider text-purple-400 uppercase font-mono">
          Chip
        </span>
      </div>

      <div className="grid grid-cols-12 gap-3 items-center flex-1 my-2">
        {/* THE BUCKET S (Left half inside chip) */}
        <div className="col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Dashed outer bucket ring */}
            <div className="absolute inset-0 border-2 border-dashed border-purple-400/50 rounded-full animate-[spin_30s_linear_infinite]" />

            {/* Central S Circle */}
            <div className="w-24 h-24 rounded-full bg-[#8B5CF6] shadow-xl shadow-purple-500/30 flex flex-col items-center justify-center text-white font-bold z-10 transition-all duration-300">
              <span className="text-xs text-purple-200">S</span>
              <span className="text-2xl font-mono">{sVal}</span>
            </div>

            {/* S Word Circles (word 0 big left, word 1 small right) */}
            <div className="absolute -bottom-2 flex items-center gap-3 z-20">
              <div className="w-11 h-11 rounded-full bg-[#7C3AED] border border-purple-300/40 flex flex-col items-center justify-center text-[10px] font-mono text-white shadow">
                <span className="text-[8px] text-purple-200">w0</span>
                <span className="font-bold">{sWords[0]}</span>
              </div>
              <div className="w-11 h-11 rounded-full bg-[#7C3AED] border border-purple-300/40 flex flex-col items-center justify-center text-[10px] font-mono text-white shadow">
                <span className="text-[8px] text-purple-200">w1</span>
                <span className="font-bold">{sWords[1]}</span>
              </div>
            </div>
          </div>

          <span className="text-[11px] text-purple-300 font-mono mt-3">
            bucket (2 words)
          </span>

          {/* Carry circle (Yellow #FACC15) */}
          {carryActive && (
            <div className="absolute -top-3 right-2 flex flex-col items-center animate-bounce z-30">
              <span className="text-[9px] text-yellow-300 font-mono">carry</span>
              <div className="w-6 h-6 rounded-full bg-[#FACC15] text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg shadow-yellow-400/40">
                1
              </div>
            </div>
          )}

          {/* Dropped Bit circle (Rose #FB7185) */}
          {droppedBit !== null && (
            <div className="absolute -bottom-6 right-2 flex flex-col items-center animate-pulse z-30">
              <div className="w-6 h-6 rounded-full bg-[#FB7185] text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-rose-400/40">
                {droppedBit}
              </div>
              <span className="text-[9px] text-rose-300 font-mono">
                dropped bit
              </span>
            </div>
          )}
        </div>

        {/* THREE MACHINES (+M, +A, ÷2) (Right half inside chip) */}
        <div className="col-span-7 flex flex-col gap-3 justify-center pl-2">
          {/* +M machine */}
          <div
            className={`p-3.5 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${
              activeMachine === "M"
                ? "border-[#10B981] bg-[#10B981]/20 shadow-lg shadow-emerald-500/20 scale-105"
                : "border-[#10B981]/50 bg-slate-900/40"
            }`}
          >
            <span className="font-mono text-sm font-bold text-emerald-300">
              +M machine
            </span>
          </div>

          {/* +A machine */}
          <div
            className={`p-3.5 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${
              activeMachine === "A"
                ? "border-[#3B82F6] bg-[#3B82F6]/20 shadow-lg shadow-blue-500/20 scale-105"
                : "border-[#3B82F6]/50 bg-slate-900/40"
            }`}
          >
            <span className="font-mono text-sm font-bold text-blue-300">
              +A machine
            </span>
          </div>

          {/* ÷2 machine */}
          <div
            className={`p-3.5 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${
              activeMachine === "DIV2"
                ? "border-[#8B5CF6] bg-[#8B5CF6]/20 shadow-lg shadow-purple-500/20 scale-105"
                : "border-[#8B5CF6]/50 bg-slate-900/40"
            }`}
          >
            <span className="font-mono text-sm font-bold text-purple-300">
              ÷2 machine
            </span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <span className="text-[11px] text-slate-400 font-mono">
          results go back into S
        </span>
      </div>
    </div>
  );
};

