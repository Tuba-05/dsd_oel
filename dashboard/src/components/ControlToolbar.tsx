/**
 * @file ControlToolbar.tsx
 * @description Simulation clock control toolbar, speed presets, and FSM status indicator bar.
 *
 * Purpose:
 * - Provides interactive controls to Auto-Run/Pause the simulation, Step a single clock edge,
 *   Reset all hardware registers, and adjust the simulation delay (with Fast / Normal / Slow presets).
 * - Displays real-time hardware status badges: Top FSM State (`S_IDLE`..`S_DONE`),
 *   active Montgomery Round (`Round 1/4`..`4/4`), and output status flags (`BUSY`, `DONE`, `ERR`).
 */

import React from "react";
import { Play, Pause, SkipForward, RotateCcw, Gauge } from "lucide-react";
import { TopFsmState } from "../types/simulator";

interface ControlToolbarProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  stepForward: () => void;
  handleReset: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
  state: TopFsmState;
  pass: number;
  busy: boolean;
  done: boolean;
  error: boolean;
}

const PASS_LABELS = [
  "Round 1/4: Convert A",
  "Round 2/4: Convert B",
  "Round 3/4: Multiply A'×B'",
  "Round 4/4: Final Answer",
];

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  isPlaying,
  setIsPlaying,
  stepForward,
  handleReset,
  speed,
  setSpeed,
  state,
  pass,
  busy,
  done,
  error,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Playback & Clock Speed Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={done || error}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded font-semibold transition ${
            isPlaying
              ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20"
              : "bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 shadow-lg shadow-emerald-600/20"
          }`}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {isPlaying ? "Pause Simulation" : "Auto-Run"}
        </button>

        <button
          onClick={stepForward}
          disabled={isPlaying || done || error}
          className="flex items-center gap-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 disabled:opacity-40 text-cyan-200 px-3 py-1.5 rounded font-medium border border-cyan-700/50 transition"
        >
          <SkipForward className="w-3.5 h-3.5 text-cyan-400" />
          Next Step (1 Clock)
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded font-medium border border-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>

        {/* Step Delay Slider & Quick Speed Presets */}
        <div className="flex items-center gap-2 ml-2 border-l border-slate-700 pl-3 text-slate-400">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <span>Step Delay:</span>
          <input
            type="range"
            min="400"
            max="3500"
            step="100"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-24 accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-cyan-400 w-14">
            {(speed / 1000).toFixed(1)}s
          </span>

          {/* Quick Speed Preset Pills */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setSpeed(700)}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                speed <= 900
                  ? "bg-cyan-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Fast
            </button>
            <button
              onClick={() => setSpeed(1800)}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                speed > 900 && speed <= 2200
                  ? "bg-cyan-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Normal (1.8s)
            </button>
            <button
              onClick={() => setSpeed(2800)}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                speed > 2200
                  ? "bg-cyan-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Slow (2.8s)
            </button>
          </div>
        </div>
      </div>

      {/* Right: Current FSM State, Round Counter & Output Flag Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          <span className="text-slate-400">Hardware State:</span>
          <span className="font-mono font-bold text-cyan-300">{state}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          <span className="text-slate-400">Current Round:</span>
          <span className="font-mono font-bold text-amber-300">
            {PASS_LABELS[pass]}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          <span className="text-slate-400">Signals:</span>
          <span
            className={`font-mono text-xs px-1.5 py-0.5 rounded ${
              busy
                ? "bg-amber-500/20 text-amber-300 font-bold"
                : "text-slate-600"
            }`}
          >
            BUSY={busy ? "1" : "0"}
          </span>
          <span
            className={`font-mono text-xs px-1.5 py-0.5 rounded ${
              done
                ? "bg-emerald-500/20 text-emerald-300 font-bold"
                : "text-slate-600"
            }`}
          >
            DONE={done ? "1" : "0"}
          </span>
          <span
            className={`font-mono text-xs px-1.5 py-0.5 rounded ${
              error
                ? "bg-rose-500/20 text-rose-300 font-bold"
                : "text-slate-600"
            }`}
          >
            ERR={error ? "1" : "0"}
          </span>
        </div>
      </div>
    </div>
  );
};
