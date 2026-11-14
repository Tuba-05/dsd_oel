/**
 * @file TopBar.tsx
 * @description Top presentation bar displaying the current Round Counter, single-sentence
 * Caption banner, and hardware Tick Counter.
 */

import React from "react";

interface TopBarProps {
  roundText: string;
  caption: string;
  tickText: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  roundText,
  caption,
  tickText,
}) => {
  return (
    <header className="w-full px-8 pt-5 pb-3 flex items-center justify-between z-10">
      {/* Left: Round Count */}
      <div className="w-48">
        <span className="text-xl font-bold tracking-tight text-white font-sans">
          {roundText}
        </span>
      </div>

      {/* Center: Single Large Sentence Caption */}
      <div className="flex-1 max-w-3xl text-center">
        <div className="bg-[#1E293B]/80 backdrop-blur border border-slate-700/60 rounded-xl px-6 py-2.5 shadow-lg">
          <p className="text-base sm:text-lg font-medium text-slate-100 tracking-wide transition-all duration-300">
            {caption}
          </p>
        </div>
      </div>

      {/* Right: Tick Indicator */}
      <div className="w-48 text-right font-mono text-sm text-slate-400">
        <span>{tickText}</span>
      </div>
    </header>
  );
};

