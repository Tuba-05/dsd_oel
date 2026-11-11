/**
 * @file BusActivityTicker.tsx
 * @description Visual 5-Stage Progress Tracker and Plain-English Live Step Explanation Banner.
 *
 * Purpose:
 * - Shows a clear 5-step progress bar (`1. Validate Inputs` -> `2. Build R² Key` -> `3. Load Pass` -> `4. Core Add & Shift` -> `5. Save Output`)
 *   so the user always knows where the hardware is in the overall process.
 * - Displays a prominent, easy-to-read explanation card describing what is happening right now in simple English,
 *   alongside the low-level RTL signal trace.
 */

import React from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { TopFsmState } from "../types/simulator";

interface BusActivityTickerProps {
  state: TopFsmState;
  pass: number;
  stepTitle: string;
  stepExplanationEasy: string;
  activeSignal: string;
  error: boolean;
  errorMessage: string;
}

const STAGES = [
  { id: 1, label: "1. Check Inputs", sub: "S_IDLE" },
  { id: 2, label: "2. Build R² Key", sub: "S_R2 (512x)" },
  { id: 3, label: "3. Select Round", sub: "S_LOAD" },
  { id: 4, label: "4. Core Add & Shift", sub: "S_CALC" },
  { id: 5, label: "5. Save Result", sub: "S_STORE / DONE" },
];

function getActiveStageNumber(state: TopFsmState): number {
  switch (state) {
    case "S_IDLE":
      return 1;
    case "S_R2":
      return 2;
    case "S_LOAD":
      return 3;
    case "S_CALC":
    case "S_WAIT":
      return 4;
    case "S_STORE":
    case "S_DONE":
      return 5;
    default:
      return 1;
  }
}

export const BusActivityTicker: React.FC<BusActivityTickerProps> = ({
  state,
  pass,
  stepTitle,
  stepExplanationEasy,
  activeSignal,
  error,
  errorMessage,
}) => {
  const currentStage = getActiveStageNumber(state);

  return (
    <div className="bg-slate-950 border-b border-slate-800 px-5 py-3 flex flex-col gap-2.5">
      {/* 1. VISUAL 5-STAGE PROGRESS STEPPER */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STAGES.map((stage, idx) => {
          const isCompleted =
            state === "S_DONE" && !error
              ? true
              : currentStage > stage.id;
          const isCurrent = currentStage === stage.id;

          return (
            <div
              key={stage.id}
              className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs transition-all duration-500 ${
                isCurrent
                  ? "bg-cyan-950/60 border-cyan-400 text-white shadow-md shadow-cyan-500/10 scale-[1.01]"
                  : isCompleted
                  ? "bg-emerald-950/30 border-emerald-700/50 text-emerald-300"
                  : "bg-slate-900/50 border-slate-800/80 text-slate-500"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isCurrent ? "bg-cyan-400 animate-ping" : "bg-slate-700"
                    }`}
                  />
                )}
                <div className="truncate">
                  <div className="font-bold text-[11px] truncate">
                    {stage.label}
                  </div>
                  <div className="text-[10px] font-mono opacity-75">
                    {stage.id >= 3 && stage.id <= 4
                      ? `${stage.sub} (Round ${pass + 1}/4)`
                      : stage.sub}
                  </div>
                </div>
              </div>
              {idx < STAGES.length - 1 && (
                <ArrowRight
                  className={`w-3.5 h-3.5 shrink-0 hidden sm:block ${
                    isCurrent
                      ? "text-cyan-400 animate-pulse"
                      : isCompleted
                      ? "text-emerald-500"
                      : "text-slate-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 2. LIVE PLAIN-ENGLISH STEP EXPLANATION BANNER */}
      <div
        className={`rounded-xl border p-3 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          error
            ? "bg-rose-950/40 border-rose-500/60"
            : state === "S_DONE"
            ? "bg-emerald-950/30 border-emerald-500/50"
            : "bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-500/40"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              error
                ? "bg-rose-500/20 text-rose-400"
                : state === "S_DONE"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-cyan-500/20 text-cyan-300"
            }`}
          >
            {error ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                What is happening right now
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                {stepTitle}
              </h4>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {error ? errorMessage : stepExplanationEasy}
            </p>
          </div>
        </div>

        {/* Low-level RTL Signal Trace Badge */}
        <div className="bg-slate-950/90 border border-slate-800 px-3 py-2 rounded-lg shrink-0 max-w-md">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
            <Activity className="w-3 h-3 text-cyan-400 animate-spin" />
            <span>RTL Hardware Signal Trace:</span>
          </div>
          <div className="font-mono text-[11px] text-cyan-300 truncate">
            {activeSignal || "IDLE: Waiting for start clock trigger..."}
          </div>
        </div>
      </div>
    </div>
  );
};
