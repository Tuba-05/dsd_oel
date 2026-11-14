/**
 * @file TopBar.tsx
 * @description Responsive top presentation bar displaying the current Round Counter,
 * single-sentence Caption banner, and hardware Tick Counter.
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
    <header className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 sm:gap-4 z-10">
      {/* Left: Round Count */}
      <div className="order-1 md:w-40 lg:w-48 shrink-0">
        <span className="text-base sm:text-xl font-bold tracking-tight text-white font-sans">
          {roundText}
        </span>
      </div>

      {/* Center: Single Large Sentence Caption */}
      <div className="order-3 md:order-2 w-full md:flex-1 max-w-3xl text-center">
        <div className="bg-[#1E293B]/80 backdrop-blur border border-slate-700/60 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 shadow-lg">
          <p className="text-sm sm:text-base lg:text-lg font-medium text-slate-100 tracking-wide transition-all duration-300">
            {caption}
          </p>
        </div>
      </div>

      {/* Right: Tick Indicator */}
      <div className="order-2 md:order-3 md:w-40 lg:w-48 text-right font-mono text-xs sm:text-sm text-slate-400 shrink-0">
        <span>{tickText}</span>
      </div>
    </header>
  );
};
