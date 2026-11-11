/**
 * @file CoreDatapathView.tsx
 * @description Detailed micro-architecture view for the internal `montprod.v` core module
 * with clear English explanations and active block animations.
 *
 * Purpose:
 * - Visualizes the internal state machine (`CTRL_INIT_S`..`CTRL_DONE`), current multiplier bit `b`,
 *   and parity helper bit `q = S[0] ^ (A[0] & b)`.
 * - Displays the 4 internal hardware submodules of `montprod.v`:
 *   1. `s_mem` (`blockmem1r1w.v`) — 8x32-bit scratchpad RAM storing running sum S
 *   2. `s_adder_sa` (`adder32.v`) — 32-bit adder for `S + A`
 *   3. `s_adder_sm` (`adder32.v`) — 32-bit adder for `S + M` (makes sum even)
 *   4. `shifter` (`shr32.v`)      — 32-bit right-shifter performing exact division by 2
 */

import React from "react";
import { Cpu, ArrowRight, Info, Zap } from "lucide-react";
import { CoreFsmState, ViewMode } from "../types/simulator";

interface CoreDatapathViewProps {
  coreFsmState: CoreFsmState;
  bitB: number;
  bitQ: number;
  sMemWords: string[];
  setViewMode: (mode: ViewMode) => void;
}

export const CoreDatapathView: React.FC<CoreDatapathViewProps> = ({
  coreFsmState,
  bitB,
  bitQ,
  sMemWords,
  setViewMode,
}) => {
  const isMemActive =
    coreFsmState === "CTRL_INIT_S" || coreFsmState === "CTRL_EMIT_S";
  const isAdderSaActive = coreFsmState === "CTRL_L_CALC_SA";
  const isAdderSmActive = coreFsmState === "CTRL_L_CALC_SM";
  const isShifterActive = coreFsmState === "CTRL_L_CALC_SDIV2";

  return (
    <div className="rounded-xl border border-purple-900/60 bg-slate-900/50 p-5 flex flex-col gap-5">
      {/* Core View Header & Back Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400 animate-spin" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Inside the Montgomery Core Engine (montprod.v)
          </h3>
        </div>
        <button
          onClick={() => setViewMode("top")}
          className="text-xs bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 px-3 py-1 rounded-lg flex items-center gap-1.5 font-medium transition"
        >
          Back to Top Architecture
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Micro-FSM Status Bar */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px]">
            Core Micro-Step:
          </span>
          <span className="font-mono font-bold text-purple-300 text-sm">
            {coreFsmState}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">
            Current Multiplier Bit (b):
          </span>
          <span className="font-mono font-bold text-cyan-300 text-sm">
            b = {bitB}{" "}
            <span className="text-[10px] text-slate-400 font-normal">
              ({bitB === 1 ? "Add A" : "Skip A"})
            </span>
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">
            Even-Parity Helper Bit (q):
          </span>
          <span className="font-mono font-bold text-emerald-300 text-sm">
            q = {bitQ}{" "}
            <span className="text-[10px] text-slate-400 font-normal">
              ({bitQ === 1 ? "Add M" : "Already Even"})
            </span>
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">
            How q is chosen:
          </span>
          <span className="font-mono text-slate-300 text-[11px]">
            q = S[0] ^ (A[0] &amp; b)
          </span>
        </div>
      </div>

      {/* Core Datapath Submodules (BRAM, ADDER_SM, ADDER_SA, SHR32) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        {/* 1. S_MEM BRAM (`blockmem1r1w.v`) */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-500 flex flex-col justify-between ${
            isMemActive
              ? "border-purple-400 bg-purple-950/35 ring-1 ring-purple-400 scale-[1.02] shadow-lg shadow-purple-500/15"
              : "border-slate-800 bg-slate-950/80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-purple-400 font-bold">
                1. MEMORY (s_mem)
              </span>
              {isMemActive && (
                <span className="text-[9px] bg-purple-400 text-black font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                  <Zap className="w-2.5 h-2.5" /> ACTIVE
                </span>
              )}
            </div>
            <h5 className="font-bold text-slate-100 mb-1">
              Scratchpad RAM (8×32b)
            </h5>
            <p className="text-[11px] text-slate-300 mb-3">
              Holds the 256-bit running sum <strong>S</strong> broken into eight
              32-bit words.
            </p>
          </div>
          <div className="space-y-1 font-mono text-[10px] bg-slate-900 p-2 rounded border border-slate-800">
            <div className="flex justify-between text-slate-400">
              <span>Word 0 (Top):</span>{" "}
              <span className="text-cyan-300">{sMemWords[0]}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Word 4 (Mid):</span>{" "}
              <span className="text-cyan-300">{sMemWords[4]}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Word 7 (Low):</span>{" "}
              <span className="text-emerald-300">{sMemWords[7]}</span>
            </div>
          </div>
        </div>

        {/* 2. ADDER_SM (`adder32.v` for S + M) */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-500 flex flex-col justify-between ${
            isAdderSmActive
              ? "border-emerald-400 bg-emerald-950/35 ring-1 ring-emerald-400 scale-[1.02] shadow-lg shadow-emerald-500/15"
              : "border-slate-800 bg-slate-950/80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                2. ADDER #2 (s_adder_sm)
              </span>
              {isAdderSmActive && (
                <span className="text-[9px] bg-emerald-400 text-black font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                  <Zap className="w-2.5 h-2.5" /> ACTIVE
                </span>
              )}
            </div>
            <h5 className="font-bold text-slate-100 mb-1">
              Add Modulus (S + M)
            </h5>
            <p className="text-[11px] text-slate-300 mb-2">
              Adds Modulus M when <code className="text-emerald-300">q == 1</code>{" "}
              so the running sum is guaranteed to be an <strong>EVEN</strong>{" "}
              number.
            </p>
          </div>
          <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
            <div>sum = S_word + M_word + Carry</div>
            <div className="text-emerald-400 mt-1">Makes LSB of S = 0</div>
          </div>
        </div>

        {/* 3. ADDER_SA (`adder32.v` for S + A) */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-500 flex flex-col justify-between ${
            isAdderSaActive
              ? "border-cyan-400 bg-cyan-950/35 ring-1 ring-cyan-400 scale-[1.02] shadow-lg shadow-cyan-500/15"
              : "border-slate-800 bg-slate-950/80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-cyan-400 font-bold">
                3. ADDER #1 (s_adder_sa)
              </span>
              {isAdderSaActive && (
                <span className="text-[9px] bg-cyan-400 text-black font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                  <Zap className="w-2.5 h-2.5" /> ACTIVE
                </span>
              )}
            </div>
            <h5 className="font-bold text-slate-100 mb-1">
              Add Input (S + A)
            </h5>
            <p className="text-[11px] text-slate-300 mb-2">
              Adds Operand A into the running sum S when the current multiplier
              bit <code className="text-cyan-300">b == 1</code>.
            </p>
          </div>
          <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
            <div>sum = S_word + A_word + Carry</div>
            <div className="text-cyan-400 mt-1">32-bit Word-by-Word Add</div>
          </div>
        </div>

        {/* 4. SHIFTER (`shr32.v` for S >> 1) */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-500 flex flex-col justify-between ${
            isShifterActive
              ? "border-amber-400 bg-amber-950/35 ring-1 ring-amber-400 scale-[1.02] shadow-lg shadow-amber-500/15"
              : "border-slate-800 bg-slate-950/80"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-amber-400 font-bold">
                4. SHIFTER (shr32)
              </span>
              {isShifterActive && (
                <span className="text-[9px] bg-amber-400 text-black font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                  <Zap className="w-2.5 h-2.5" /> ACTIVE
                </span>
              )}
            </div>
            <h5 className="font-bold text-slate-100 mb-1">
              Divide by 2 (S &gt;&gt; 1)
            </h5>
            <p className="text-[11px] text-slate-300 mb-2">
              Shifts the even sum right by 1 bit, dividing by 2 cleanly with
              zero remainder!
            </p>
          </div>
          <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
            <div>S_next = S &gt;&gt; 1</div>
            <div className="text-amber-400 mt-1">Instant hardware ÷ 2</div>
          </div>
        </div>
      </div>

      {/* Plain-English Mathematical Insight Callout Box */}
      <div className="bg-slate-950 border border-purple-500/30 p-3.5 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <h6 className="font-bold text-purple-300 mb-0.5">
            In Simple Words: Why does adding M let us divide by 2 without a
            remainder?
          </h6>
          <p className="text-slate-300 leading-relaxed">
            In each step, we want to compute{" "}
            <code className="text-cyan-300 font-mono">
              S = (S + b·A + q·M) / 2
            </code>
            . Because Modulus <strong>M is always an ODD number</strong>, if{" "}
            <code className="text-cyan-300 font-mono">S + b·A</code> happens to
            be odd, we simply set <code className="text-emerald-300">q = 1</code>{" "}
            and add <strong>M</strong> (Odd + Odd = Even!). Once the number is
            even, its last bit is <code className="text-amber-300">0</code>, so
            shifting right by 1 bit (<code className="text-amber-300">S &gt;&gt; 1</code>)
            divides by 2 with zero remainder!
          </p>
        </div>
      </div>
    </div>
  );
};
