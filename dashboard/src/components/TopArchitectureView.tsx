/**
 * @file TopArchitectureView.tsx
 * @description Interactive RTL block diagram for the top-level hardware wrapper (`modmul_top.v`)
 * with animated data-flow connectors, active block highlighting, and simple English explanations.
 *
 * Purpose:
 * - Visualizes the 5 major hardware stages of `modmul_top.v`:
 *   1. Input Validator (`S_IDLE`)
 *   2. 512-Cycle R^2 mod M Conversion Key Generator (`S_R2`)
 *   3. 4-Round Pass Coordinator (`S_LOAD` / `S_STORE`)
 *   4. Central `montprod u_core` Engine (`S_CALC` / `S_WAIT`) — clickable to drill down into Core view
 *   5. Final Conditional Reduction & `result_out [255:0]` (`S_DONE`)
 * - Animates data flow arrows and highlights the currently active hardware block.
 */

import React from "react";
import { Cpu, Maximize2, ArrowDown, ArrowRight, Zap } from "lucide-react";
import { TopFsmState, ViewMode } from "../types/simulator";

interface TopArchitectureViewProps {
  state: TopFsmState;
  r2Count: number;
  pass: number;
  resultOut: string;
  setViewMode: (mode: ViewMode) => void;
}

export const TopArchitectureView: React.FC<TopArchitectureViewProps> = ({
  state,
  r2Count,
  pass,
  resultOut,
  setViewMode,
}) => {
  const isBlock1Active = state === "S_IDLE";
  const isBlock2Active = state === "S_R2";
  const isBlock3Active = state === "S_LOAD" || state === "S_STORE";
  const isCoreActive = state === "S_CALC" || state === "S_WAIT";
  const isFinalActive = state === "S_DONE";

  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col gap-4">
      {/* Diagram Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Top-Level Hardware Architecture (modmul_top.v)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Radix R = 2^256 | Target FPGA: Artix-7 xc7a100t
        </span>
      </div>

      {/* Top Row: 1. Input Validator -> 2. R^2 Key Generator -> 3. 4-Round Scheduler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {/* 1. INPUT VALIDATOR BLOCK */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-500 ${
            isBlock1Active
              ? "border-cyan-400 bg-cyan-950/30 shadow-xl shadow-cyan-500/15 ring-1 ring-cyan-400 scale-[1.02]"
              : "border-slate-800 bg-slate-950/60 opacity-75"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-100">
              1. Input Validator
            </span>
            {isBlock1Active ? (
              <span className="text-[10px] font-bold bg-cyan-500 text-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Zap className="w-2.5 h-2.5" /> ACTIVE
              </span>
            ) : (
              <span className="text-[10px] font-mono text-cyan-400">
                Step 1
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 mb-2">
            Checks that inputs follow hardware rules before starting:
          </p>
          <ul className="text-[10px] space-y-1 font-mono text-slate-300">
            <li className="flex items-center gap-1">
              <span className="text-emerald-400">✓</span> M is an ODD number
              (M[0] == 1)
            </li>
            <li className="flex items-center gap-1">
              <span className="text-emerald-400">✓</span> Top 2 bits of M are 00
              (&lt; 2^254)
            </li>
            <li className="flex items-center gap-1">
              <span className="text-emerald-400">✓</span> Inputs A and B are
              smaller than M
            </li>
          </ul>
        </div>

        {/* 2. 512-CYCLE R^2 DOUBLER UNIT */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-500 ${
            isBlock2Active
              ? "border-amber-400 bg-amber-950/30 shadow-xl shadow-amber-500/15 ring-1 ring-amber-400 scale-[1.02]"
              : "border-slate-800 bg-slate-950/60 opacity-75"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-100">
              2. Helper Key Generator (R²)
            </span>
            {isBlock2Active ? (
              <span className="text-[10px] font-bold bg-amber-400 text-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Zap className="w-2.5 h-2.5" /> ACTIVE
              </span>
            ) : (
              <span className="text-[10px] font-mono text-amber-400">
                Step 2 (S_R2)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 mb-2">
            Creates conversion key <strong>2^512 mod M</strong> by doubling 512
            times (no division!):
          </p>
          <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-amber-300 border border-slate-800 mb-2">
            x &lt;= (2x &gt;= M) ? (2x - M) : 2x;
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>Doubling Progress:</span>
            <span className="font-mono text-amber-300 font-bold">
              {r2Count} / 512 Cycles
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-500"
              style={{ width: `${(r2Count / 512) * 100}%` }}
            />
          </div>
        </div>

        {/* 3. 4-PASS SCHEDULER */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-500 ${
            isBlock3Active
              ? "border-emerald-400 bg-emerald-950/30 shadow-xl shadow-emerald-500/15 ring-1 ring-emerald-400 scale-[1.02]"
              : "border-slate-800 bg-slate-950/60 opacity-75"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-100">
              3. 4-Round Pass Coordinator
            </span>
            {isBlock3Active ? (
              <span className="text-[10px] font-bold bg-emerald-400 text-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Zap className="w-2.5 h-2.5" /> ROUND {pass + 1}/4
              </span>
            ) : (
              <span className="text-[10px] font-mono text-emerald-400">
                Round {pass + 1} of 4
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 mb-2">
            Runs the Core Engine 4 times in sequence:
          </p>
          <div className="text-[10px] font-mono space-y-1">
            <div
              className={`px-2 py-1 rounded flex items-center justify-between ${
                pass === 0
                  ? "bg-emerald-500/25 text-emerald-200 font-bold border border-emerald-500/40"
                  : "text-slate-500"
              }`}
            >
              <span>Round 1: Convert A → A'</span>
              <span>(A, R²)</span>
            </div>
            <div
              className={`px-2 py-1 rounded flex items-center justify-between ${
                pass === 1
                  ? "bg-emerald-500/25 text-emerald-200 font-bold border border-emerald-500/40"
                  : "text-slate-500"
              }`}
            >
              <span>Round 2: Convert B → B'</span>
              <span>(B, R²)</span>
            </div>
            <div
              className={`px-2 py-1 rounded flex items-center justify-between ${
                pass === 2
                  ? "bg-emerald-500/25 text-emerald-200 font-bold border border-emerald-500/40"
                  : "text-slate-500"
              }`}
            >
              <span>Round 3: Multiply A'×B' → P'</span>
              <span>(A', B')</span>
            </div>
            <div
              className={`px-2 py-1 rounded flex items-center justify-between ${
                pass === 3
                  ? "bg-emerald-500/25 text-emerald-200 font-bold border border-emerald-500/40"
                  : "text-slate-500"
              }`}
            >
              <span>Round 4: Convert Back → Ans</span>
              <span>(P', 1)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ANIMATED DATA FLOW CONNECTOR (FROM COORDINATOR INTO CORE ENGINE) */}
      <div className="flex items-center justify-center gap-3 py-0.5">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono border transition-all duration-300 ${
            isBlock3Active || isCoreActive
              ? "bg-purple-950/60 border-purple-500/60 text-purple-200 shadow-md shadow-purple-500/20"
              : "bg-slate-900/60 border-slate-800 text-slate-500"
          }`}
        >
          <ArrowDown
            className={`w-3.5 h-3.5 ${
              isBlock3Active || isCoreActive
                ? "text-purple-400 animate-flow-pulse"
                : "text-slate-600"
            }`}
          />
          <span>
            Feeding Round {pass + 1} Inputs:{" "}
            <strong>
              {pass === 0
                ? "(A, R²)"
                : pass === 1
                ? "(B, R²)"
                : pass === 2
                ? "(A', B')"
                : "(P', 1)"}
            </strong>{" "}
            into Core Engine
          </span>
          <ArrowDown
            className={`w-3.5 h-3.5 ${
              isBlock3Active || isCoreActive
                ? "text-purple-400 animate-flow-pulse"
                : "text-slate-600"
            }`}
          />
        </div>
      </div>

      {/* 4. CENTRAL BLOCK: MONTGOMERY CORE INSTANTIATION (`montprod u_core`) */}
      <div
        onClick={() => setViewMode("core")}
        className={`p-4 rounded-xl border cursor-pointer group transition-all duration-500 ${
          isCoreActive
            ? "border-purple-400 bg-purple-950/35 shadow-2xl shadow-purple-500/20 ring-2 ring-purple-400 scale-[1.01]"
            : "border-slate-800 bg-slate-950/80 hover:border-purple-500/50 opacity-85"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                isCoreActive
                  ? "bg-purple-500/30 text-purple-200"
                  : "bg-slate-900 text-purple-400"
              }`}
            >
              <Cpu
                className={`w-5 h-5 ${
                  isCoreActive ? "animate-spin" : "group-hover:scale-110"
                } transition`}
              />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-100 flex flex-wrap items-center gap-2">
                4. Montgomery Core Engine:{" "}
                <code className="text-purple-300">montprod u_core</code>
                {isCoreActive && (
                  <span className="text-[10px] font-bold bg-purple-400 text-black px-2 py-0.5 rounded-full animate-pulse">
                    COMPUTING NOW
                  </span>
                )}
                <span className="text-[10px] bg-purple-900/50 text-purple-200 px-2 py-0.5 rounded border border-purple-700/50 group-hover:bg-purple-600 group-hover:text-white transition">
                  Click to Inspect Inside Core →
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Replaces slow division with fast{" "}
                <strong className="text-cyan-300">32-bit Additions</strong> and{" "}
                <strong className="text-amber-300">
                  1-bit Right Shifts (÷ 2)
                </strong>
              </p>
            </div>
          </div>
          <Maximize2 className="w-4 h-4 text-purple-400 group-hover:text-purple-200 transition" />
        </div>

        {/* Submodule miniature cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
            <span className="text-[10px] font-mono text-slate-400 block">
              Scratchpad Memory
            </span>
            <span className="font-bold font-mono text-purple-300">
              blockmem1r1w
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Stores running sum S (8×32b)
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
            <span className="text-[10px] font-mono text-slate-400 block">
              Adder #1 (S + A)
            </span>
            <span className="font-bold font-mono text-cyan-300">
              s_adder_sa
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Adds input when bit b == 1
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
            <span className="text-[10px] font-mono text-slate-400 block">
              Adder #2 (S + M)
            </span>
            <span className="font-bold font-mono text-emerald-300">
              s_adder_sm
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Adds M to make sum EVEN
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
            <span className="text-[10px] font-mono text-slate-400 block">
              Divide-by-2 Shifter
            </span>
            <span className="font-bold font-mono text-amber-300">
              shifter (shr32)
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Shifts S &gt;&gt; 1 (Exact ÷ 2)
            </span>
          </div>
        </div>
      </div>

      {/* ANIMATED DATA FLOW CONNECTOR (FROM CORE TO FINAL OUTPUT) */}
      <div className="flex items-center justify-center gap-3 py-0.5">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono border transition-all duration-300 ${
            state === "S_STORE" || isFinalActive
              ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-500/20"
              : "bg-slate-900/60 border-slate-800 text-slate-500"
          }`}
        >
          <ArrowDown
            className={`w-3.5 h-3.5 ${
              state === "S_STORE" || isFinalActive
                ? "text-emerald-400 animate-flow-pulse"
                : "text-slate-600"
            }`}
          />
          <span>
            After 4 Rounds → Final Reduction &amp; Latch to{" "}
            <strong>result_out</strong>
          </span>
          <ArrowRight
            className={`w-3.5 h-3.5 ${
              state === "S_STORE" || isFinalActive
                ? "text-emerald-400 animate-pulse"
                : "text-slate-600"
            }`}
          />
        </div>
      </div>

      {/* 5. FINAL REDUCTION & OUTPUT REGISTER */}
      <div
        className={`p-3.5 rounded-xl border transition-all duration-500 ${
          isFinalActive
            ? "border-emerald-400 bg-emerald-950/30 shadow-xl shadow-emerald-500/15 ring-1 ring-emerald-400 scale-[1.01]"
            : "border-slate-800 bg-slate-950/60 opacity-80"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-100">
            5. Final Output Check &amp; Answer Register (result_out [255:0])
          </span>
          {isFinalActive ? (
            <span className="text-[10px] font-bold bg-emerald-400 text-black px-2 py-0.5 rounded-full animate-pulse">
              ✓ ANSWER READY
            </span>
          ) : (
            <span className="text-[10px] font-mono text-emerald-400">
              Step 5 (S_DONE)
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-slate-300">
            If the result is still &ge; M, subtract M once:{" "}
            <code className="text-slate-400 font-mono">
              (res &gt;= M) ? (res - M) : res
            </code>
          </span>
          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-300 font-mono font-bold truncate max-w-sm">
            Final Answer = {resultOut}
          </div>
        </div>
      </div>
    </div>
  );
};
