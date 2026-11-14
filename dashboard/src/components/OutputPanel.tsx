/**
 * @file OutputPanel.tsx
 * @description Responsive right/bottom panel displaying the chip's ready light,
 * `b` and `q` decision indicator dots, and the Result Tray.
 */

import React from "react";

interface OutputPanelProps {
  readyLight: boolean;
  bVal: number | null;
  qVal: number | null;
  resultOut?: number;
  showClockWrap?: boolean;
  wrapEquation?: string;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  readyLight,
  bVal,
  qVal,
  resultOut,
  showClockWrap,
  wrapEquation,
}) => {
  return (
    <div className="col-span-1 lg:col-span-3 lg:h-[490px] p-4 flex flex-col sm:flex-row lg:flex-col justify-around lg:justify-between items-center gap-6 relative">
      {/* Top: Ready Light & b, q indicators */}
      <div className="flex flex-col items-center gap-3">
        {/* Ready light */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] text-slate-400 mb-1">ready light</span>
          <div
            className={`w-9 h-9 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
              readyLight
                ? "bg-[#10B981] border-emerald-300 shadow-lg shadow-emerald-500/40"
                : "bg-slate-900 border-slate-700"
            }`}
          />
        </div>

        {/* b and q dots */}
        <div className="flex items-center gap-6 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 font-mono">b</span>
            <div
              className={`w-6 h-6 rounded-full border transition-all duration-300 flex items-center justify-center text-xs font-mono font-bold ${
                bVal === 1
                  ? "bg-[#F59E0B] border-white text-white shadow-md shadow-amber-500/40"
                  : "bg-slate-900 border-amber-900/60 text-slate-600"
              }`}
            >
              {bVal !== null ? bVal : "-"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 font-mono">
              q
            </span>
            <div
              className={`w-6 h-6 rounded-full border transition-all duration-300 flex items-center justify-center text-xs font-mono font-bold ${
                qVal === 1
                  ? "bg-[#10B981] border-white text-white shadow-md shadow-emerald-500/40"
                  : "bg-slate-900 border-emerald-900/60 text-slate-600"
              }`}
            >
              {qVal !== null ? qVal : "-"}
            </div>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          b and q dots
        </span>
      </div>

      {/* RESULT TRAY */}
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Optional M Clock Ring at Wrapper step */}
          {showClockWrap && (
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeDasharray="3 4"
                className="animate-spin"
              />
            </svg>
          )}

          {/* Dashed outer result circle */}
          <div className="w-28 h-28 rounded-full border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-center p-2 transition-all">
            {resultOut !== undefined ? (
              <div className="flex flex-col items-center animate-scale">
                <span className="text-xs text-slate-400">result</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {resultOut}
                </span>
                {showClockWrap && wrapEquation && (
                  <span className="text-[9px] text-emerald-300 mt-0.5">
                    {wrapEquation}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-mono">result</span>
            )}
          </div>
        </div>
        <span className="text-[11px] text-slate-400 mt-2 font-mono">
          Result tray
        </span>
      </div>

      {/* Spacer on desktop */}
      <div className="hidden lg:block h-2" />
    </div>
  );
};
