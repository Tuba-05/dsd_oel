/**
 * @file PresetSelector.tsx
 * @description Testbench vector preset selector and 256-bit hexadecimal input editor.
 *
 * Purpose:
 * - Allows one-click loading of standard test cases from `tb_MM.v` (Small Prime, Squaring, 256-bit Crypto).
 * - Provides editable 256-bit hex text inputs for Operand A, Operand B, and Modulus M.
 * - Automatically resets the hardware simulation state whenever inputs are modified.
 */

import React from "react";
import { Database } from "lucide-react";
import { TEST_PRESETS } from "../constants/presets";

interface PresetSelectorProps {
  selectedPresetIndex: number;
  onSelectPreset: (idx: number) => void;
  inputA: string;
  inputB: string;
  inputM: string;
  onInputChange: (field: "a" | "b" | "m", value: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetIndex,
  onSelectPreset,
  inputA,
  inputB,
  inputM,
  onInputChange,
}) => {
  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          Select Testbench Vectors
        </span>
        <div className="flex gap-1.5">
          {TEST_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPreset(idx)}
              title={p.desc}
              className={`text-xs px-2.5 py-1 rounded transition ${
                selectedPresetIndex === idx
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {p.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 256-Bit Hexadecimal Operand Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
        <div>
          <label className="text-slate-400 text-[11px] block mb-1">
            Operand A (256-bit Hex):
          </label>
          <input
            type="text"
            value={inputA}
            onChange={(e) => onInputChange("a", e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="text-slate-400 text-[11px] block mb-1">
            Operand B (256-bit Hex):
          </label>
          <input
            type="text"
            value={inputB}
            onChange={(e) => onInputChange("b", e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="text-slate-400 text-[11px] block mb-1">
            Modulus M (Must be Odd &amp; &lt; 2^254):
          </label>
          <input
            type="text"
            value={inputM}
            onChange={(e) => onInputChange("m", e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-amber-300 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
};
