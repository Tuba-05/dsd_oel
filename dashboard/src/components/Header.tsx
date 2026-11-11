/**
 * @file Header.tsx
 * @description Top navigation header bar for the Montgomery Modular Multiplier Visualizer.
 *
 * Purpose:
 * - Displays project title, hardware bit-width badge, and RTL module names (`modmul_top` & `montprod`).
 * - Provides view mode toggle buttons to switch between the Top Wrapper view and the Core Micro-Architecture view.
 */

import React from "react";
import { Cpu, Layers } from "lucide-react";
import { ViewMode } from "../types/simulator";

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-5 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
          <Cpu className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Montgomery Modular Multiplier
            <span className="text-xs bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono px-2 py-0.5 rounded-full">
              256-bit RTL Hardware Simulator
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            DSD Open-Ended Lab | Top Wrapper:{" "}
            <code className="text-slate-300">modmul_top</code> &amp; Core:{" "}
            <code className="text-slate-300">montprod</code>
          </p>
        </div>
      </div>

      {/* View Toggle: Switch between Top Wrapper and Core Datapath */}
      <div className="flex items-center gap-2">
        <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex text-xs">
          <button
            onClick={() => setViewMode("top")}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition ${
              viewMode === "top"
                ? "bg-cyan-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Top Architecture
          </button>
          <button
            onClick={() => setViewMode("core")}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition ${
              viewMode === "core"
                ? "bg-purple-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            montprod Core (Micro)
          </button>
        </div>
      </div>
    </header>
  );
};
