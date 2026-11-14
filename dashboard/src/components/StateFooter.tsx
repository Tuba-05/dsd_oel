/**
 * @file StateFooter.tsx
 * @description Bottom footer displaying the 14 FSM state pills (highlighting the active state
 * in yellow), the Play/Pause/Replay button, and a "Change Inputs" button/modal to enter
 * custom A, B, and M values.
 */

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { STATE_STRIP } from "../constants/timelineData";
import { NumberFormat, OperandConfig } from "../types/timeline";
import { validateToyInputs } from "../utils/generateTimeline";
import { formatValue } from "../utils/formatNumber";

interface StateFooterProps {
  activeStateIndex: number;
  isPlaying: boolean;
  isAtEnd: boolean;
  onPlayPause: () => void;
  operands: OperandConfig;
  numberFormat: NumberFormat;
  onChangeFormat: (fmt: NumberFormat) => void;
  isEditorOpen: boolean;
  setIsEditorOpen: (open: boolean) => void;
  onApplyOperands: (next: OperandConfig) => void;
}

const PRESETS: { label: string; config: OperandConfig }[] = [
  { label: "Default (45, 61, 63)", config: { a: 45, b: 61, m: 63 } },
  { label: "Small (5, 7, 11)", config: { a: 5, b: 7, m: 11 } },
  { label: "Medium (19, 25, 33)", config: { a: 19, b: 25, m: 33 } },
];

export const StateFooter: React.FC<StateFooterProps> = ({
  activeStateIndex,
  isPlaying,
  isAtEnd,
  onPlayPause,
  operands,
  numberFormat,
  onChangeFormat,
  isEditorOpen,
  setIsEditorOpen,
  onApplyOperands,
}) => {
  const [draftA, setDraftA] = useState<string>(String(operands.a));
  const [draftB, setDraftB] = useState<string>(String(operands.b));
  const [draftM, setDraftM] = useState<string>(String(operands.m));
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (isEditorOpen) {
      setDraftA(String(operands.a));
      setDraftB(String(operands.b));
      setDraftM(String(operands.m));
      setErrorMsg("");
    }
  }, [isEditorOpen, operands]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numA = Number(draftA);
    const numB = Number(draftB);
    const numM = Number(draftM);

    const validation = validateToyInputs(numA, numB, numM);
    if (!validation.valid) {
      setErrorMsg(validation.error || "Invalid input.");
      return;
    }

    onApplyOperands({ a: numA, b: numB, m: numM });
  };

  return (
    <>
      <footer className="w-full px-4 sm:px-8 pb-5 pt-2 flex flex-col items-center gap-3 z-10">
        {/* 14 State Pills (current highlighted in yellow) */}
        <div className="w-full flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
          {STATE_STRIP.map((st, idx) => {
            const isCurrent = activeStateIndex === idx;
            return (
              <div
                key={idx}
                className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono font-medium transition-all duration-300 ${
                  isCurrent
                    ? "bg-[#FACC15] text-slate-950 font-bold shadow-lg shadow-yellow-500/30 scale-105"
                    : "bg-[#1E293B] text-slate-400 border border-slate-700/50"
                }`}
              >
                {st}
              </div>
            );
          })}
        </div>

        {/* Play / Pause / Replay Control + Change Inputs Button */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={onPlayPause}
            className="flex items-center gap-2 px-8 py-2.5 rounded-full bg-slate-100 hover:bg-white text-slate-950 font-bold text-sm shadow-xl hover:scale-105 transition active:scale-95 cursor-pointer"
          >
            {isAtEnd ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Replay Animation</span>
              </>
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Play Animation</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1E293B] hover:bg-slate-700 text-slate-200 border border-slate-600/70 font-medium text-xs transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Inputs: A={formatValue(operands.a, numberFormat)}, B=
              {formatValue(operands.b, numberFormat)}, M=
              {formatValue(operands.m, numberFormat)}
            </span>
          </button>

          {/* Number Format Toggle: DEC | HEX | BIN */}
          <div
            className="flex items-center bg-[#1E293B] border border-slate-600/70 rounded-full p-1 text-[11px] font-mono"
            role="group"
            aria-label="Number display format"
          >
            {(["dec", "hex", "bin"] as NumberFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => onChangeFormat(fmt)}
                className={`px-2.5 py-1 rounded-full uppercase transition cursor-pointer ${
                  numberFormat === fmt
                    ? "bg-cyan-500 text-slate-950 font-bold shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            (or press Spacebar)
          </span>
        </div>
      </footer>

      {/* Custom Input Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1E293B] border border-slate-700 p-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                Choose Custom Inputs (A, B, M)
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mb-4">
              <span className="text-[11px] text-slate-400 block mb-1.5">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onApplyOperands(p.config)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div>
                  <label className="text-blue-300 block mb-1">A (&lt; M)</label>
                  <input
                    type="number"
                    min={0}
                    max={62}
                    value={draftA}
                    onChange={(e) => setDraftA(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-amber-300 block mb-1">B (&lt; M)</label>
                  <input
                    type="number"
                    min={0}
                    max={62}
                    value={draftB}
                    onChange={(e) => setDraftB(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-emerald-300 block mb-1">
                    M (Odd ≤ 63)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={63}
                    value={draftM}
                    onChange={(e) => setDraftM(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Hardware rules: <strong>M</strong> must be odd and ≤ 63;{" "}
                <strong>A</strong> and <strong>B</strong> must be smaller than M.
              </p>

              {errorMsg && (
                <div className="text-xs text-rose-300 bg-rose-950/50 border border-rose-700/60 rounded-lg px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
                >
                  Apply &amp; Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
