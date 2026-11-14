/**
 * @file EpilogueOverlay.tsx
 * @description Full-stage epilogue overlay shown on the final beat (Beat 16),
 * bridging the 8-bit toy model to the real 256-bit cryptographic hardware scale.
 */

import React from "react";

interface EpilogueOverlayProps {
  visible?: boolean;
}

export const EpilogueOverlay: React.FC<EpilogueOverlayProps> = ({
  visible,
}) => {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 bg-[#0F172A]/95 backdrop-blur-md z-40 rounded-3xl p-8 flex flex-col justify-between border-2 border-cyan-500/40 shadow-2xl animate-fadeIn">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold block mb-1">
          Real Hardware Scale (CS-431 Digital System Design)
        </span>
        <h2 className="text-2xl font-bold text-white mb-2">
          From 8-Bit Toy Model to 256-Bit Cryptographic Core
        </h2>
        <p className="text-sm text-slate-300">
          The real hardware follows the exact same state order and word-serial
          datapath, scaled to protect elliptic curve cryptography:
        </p>
      </div>

      {/* Scale comparison cards */}
      <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto w-full font-mono text-center">
        <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">
            Word Segmentation
          </span>
          <span className="text-xl font-bold text-cyan-300 block">
            8 words × 32 bits
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Full 256-bit operands
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">
            Ticks Per Round
          </span>
          <span className="text-xl font-bold text-amber-300 block">
            29 ticks / round
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            256 rounds total (7,448 ticks)
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block mb-1">
            Full 4-Pass Execution
          </span>
          <span className="text-xl font-bold text-emerald-300 block">
            30,305 total ticks
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Includes 512 ticks for R² mod M
          </span>
        </div>
      </div>

      {/* 4 Core Passes Icon Chain */}
      <div className="max-w-3xl mx-auto w-full bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <span className="text-xs font-mono text-slate-400 block text-center mb-3">
          Wrapper 4-Pass Pipeline: Cancels the ÷256 Radix Division
        </span>
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300 text-center flex-1 mx-1">
            <span className="block font-bold">Pass 0</span>
            <span>A · R mod M</span>
          </div>
          <span className="text-slate-500">→</span>
          <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-center flex-1 mx-1">
            <span className="block font-bold">Pass 1</span>
            <span>B · R mod M</span>
          </div>
          <span className="text-slate-500">→</span>
          <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 text-center flex-1 mx-1">
            <span className="block font-bold">Pass 2</span>
            <span>A · B · R mod M</span>
          </div>
          <span className="text-slate-500">→</span>
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-center flex-1 mx-1">
            <span className="block font-bold">Pass 3</span>
            <span>(A · B) mod M</span>
          </div>
        </div>
      </div>
    </div>
  );
};

