/**
 * @file LiveRegistersPanel.tsx
 * @description Right-hand sidebar displaying live 256-bit hardware register contents
 * with animated glow/flash indicators when a register is updated.
 *
 * Purpose:
 * - Displays truncated (with full hex tooltip on hover) values of:
 *   - Input registers: `Reg A_r`, `Reg B_r`, `Reg M_r`
 *   - Conversion Key register: `Reg x (R^2 mod M)`
 *   - Montgomery domain intermediate registers: `A'`, `B'`, `P'`
 *   - Final output register: `result_out [255:0]`
 * - Flashes and displays an "UPDATED!" badge on whichever register was just written.
 */

import React from "react";
import { Cpu, Sparkles } from "lucide-react";
import { UpdatedRegister } from "../types/simulator";
import { truncateHex } from "../utils/math";

interface LiveRegistersPanelProps {
  inputA: string;
  inputB: string;
  inputM: string;
  regR2: string;
  regAm: string;
  regBm: string;
  regPm: string;
  resultOut: string;
  lastUpdatedReg: UpdatedRegister;
}

export const LiveRegistersPanel: React.FC<LiveRegistersPanelProps> = ({
  inputA,
  inputB,
  inputM,
  regR2,
  regAm,
  regBm,
  regPm,
  resultOut,
  lastUpdatedReg,
}) => {
  return (
    <div className="lg:col-span-4 p-4 overflow-y-auto flex flex-col gap-4 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Live Hardware Registers
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">
          Hover any value for full 256-bit Hex
        </span>
      </div>

      {/* 256-Bit Hardware Register Cards */}
      <div className="space-y-2.5 text-xs font-mono">
        {/* Register A */}
        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
          <div className="flex justify-between text-slate-400 text-[11px] mb-1">
            <span>Reg A_r [255:0]:</span>
            <span className="text-cyan-400 font-sans">1st Input Number (A)</span>
          </div>
          <div className="text-slate-200 truncate" title={inputA}>
            {truncateHex(inputA, 8, 8)}
          </div>
        </div>

        {/* Register B */}
        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
          <div className="flex justify-between text-slate-400 text-[11px] mb-1">
            <span>Reg B_r [255:0]:</span>
            <span className="text-cyan-400 font-sans">2nd Input Number (B)</span>
          </div>
          <div className="text-slate-200 truncate" title={inputB}>
            {truncateHex(inputB, 8, 8)}
          </div>
        </div>

        {/* Register M */}
        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
          <div className="flex justify-between text-slate-400 text-[11px] mb-1">
            <span>Reg M_r [255:0]:</span>
            <span className="text-amber-400 font-sans">Odd Modulus (M)</span>
          </div>
          <div className="text-slate-200 truncate" title={inputM}>
            {truncateHex(inputM, 8, 8)}
          </div>
        </div>

        {/* Register R^2 */}
        <div
          className={`p-2.5 rounded-lg border transition-all duration-500 ${
            lastUpdatedReg === "r2"
              ? "bg-amber-950/40 border-amber-400 ring-1 ring-amber-400 animate-register-flash"
              : "bg-slate-900 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>Reg x (R² mod M):</span>
            {lastUpdatedReg === "r2" ? (
              <span className="text-[10px] font-sans font-bold bg-amber-400 text-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-bounce">
                <Sparkles className="w-2.5 h-2.5" /> NEW KEY SAVED!
              </span>
            ) : (
              <span className="text-amber-300 font-sans">
                Conversion Key (Step 2)
              </span>
            )}
          </div>
          <div className="text-amber-200 truncate" title={regR2}>
            {truncateHex(regR2, 8, 8)}
          </div>
        </div>

        {/* Montgomery Domain Intermediate Registers (Rounds 1, 2, 3) */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="text-[11px] text-purple-400 font-sans font-bold uppercase tracking-wider">
            Montgomery Domain Registers (Rounds 1–3)
          </div>

          {/* Pass 0: A' */}
          <div
            className={`p-2 rounded-lg border transition-all duration-500 ${
              lastUpdatedReg === "am"
                ? "bg-purple-950/50 border-purple-400 ring-1 ring-purple-400 animate-register-flash"
                : "bg-slate-950/60 border-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
              <span>Round 1 — A' (A in Mont. Form):</span>
              {lastUpdatedReg === "am" && (
                <span className="text-[9px] font-sans font-bold bg-purple-400 text-black px-1.5 py-0.5 rounded-full animate-bounce">
                  UPDATED!
                </span>
              )}
            </div>
            <div className="text-purple-300 text-[11px] truncate" title={regAm}>
              {truncateHex(regAm, 8, 8)}
            </div>
          </div>

          {/* Pass 1: B' */}
          <div
            className={`p-2 rounded-lg border transition-all duration-500 ${
              lastUpdatedReg === "bm"
                ? "bg-purple-950/50 border-purple-400 ring-1 ring-purple-400 animate-register-flash"
                : "bg-slate-950/60 border-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
              <span>Round 2 — B' (B in Mont. Form):</span>
              {lastUpdatedReg === "bm" && (
                <span className="text-[9px] font-sans font-bold bg-purple-400 text-black px-1.5 py-0.5 rounded-full animate-bounce">
                  UPDATED!
                </span>
              )}
            </div>
            <div className="text-purple-300 text-[11px] truncate" title={regBm}>
              {truncateHex(regBm, 8, 8)}
            </div>
          </div>

          {/* Pass 2: P' */}
          <div
            className={`p-2 rounded-lg border transition-all duration-500 ${
              lastUpdatedReg === "pm"
                ? "bg-purple-950/50 border-purple-400 ring-1 ring-purple-400 animate-register-flash"
                : "bg-slate-950/60 border-slate-800/80"
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
              <span>Round 3 — P' (Product A' × B'):</span>
              {lastUpdatedReg === "pm" && (
                <span className="text-[9px] font-sans font-bold bg-purple-400 text-black px-1.5 py-0.5 rounded-full animate-bounce">
                  UPDATED!
                </span>
              )}
            </div>
            <div className="text-purple-300 text-[11px] truncate" title={regPm}>
              {truncateHex(regPm, 8, 8)}
            </div>
          </div>
        </div>

        {/* Final Output Register (`result_out`) */}
        <div
          className={`p-3 rounded-xl border transition-all duration-500 ${
            lastUpdatedReg === "result"
              ? "bg-emerald-950/50 border-emerald-400 ring-2 ring-emerald-400 animate-register-flash"
              : "bg-emerald-950/25 border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 text-[11px] font-sans font-bold mb-1">
            <span>Round 4 — Final Answer (result_out):</span>
            {lastUpdatedReg === "result" ? (
              <span className="text-[10px] bg-emerald-400 text-black px-2 py-0.5 rounded-full animate-bounce">
                ✓ COMPLETE!
              </span>
            ) : (
              <span>(A × B) mod M</span>
            )}
          </div>
          <div
            className="text-emerald-300 font-bold text-sm truncate"
            title={resultOut}
          >
            {truncateHex(resultOut, 10, 10)}
          </div>
        </div>
      </div>
    </div>
  );
};
