/**
 * @file StateFooter.tsx
 * @description Bottom footer displaying the 14 FSM state pills (highlighting the active state
 * in yellow) and the single Play/Pause/Replay button with Spacebar shortcut hint.
 */

import React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { STATE_STRIP } from "../constants/timelineData";

interface StateFooterProps {
  activeStateIndex: number;
  isPlaying: boolean;
  isAtEnd: boolean;
  onPlayPause: () => void;
}

export const StateFooter: React.FC<StateFooterProps> = ({
  activeStateIndex,
  isPlaying,
  isAtEnd,
  onPlayPause,
}) => {
  return (
    <footer className="w-full px-8 pb-5 pt-2 flex flex-col items-center gap-3 z-10">
      {/* 14 State Pills (current highlighted in yellow) */}
      <div className="w-full flex items-center justify-center gap-1.5 flex-wrap">
        {STATE_STRIP.map((st, idx) => {
          const isCurrent = activeStateIndex === idx;
          return (
            <div
              key={idx}
              className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all duration-300 ${
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

      {/* Play / Pause / Replay Control */}
      <div className="flex items-center gap-3">
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
        <span className="text-[11px] text-slate-500 font-mono">
          (or press Spacebar)
        </span>
      </div>
    </footer>
  );
};

