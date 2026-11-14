import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

/**
 * EXACT TIMELINE TABLE DATA FROM BRIEF (Section 5 & 6)
 * A = 45 (Word 0 = 2 "0010", Word 1 = 13 "1101")
 * B = 61 (Bits LSB->MSB: 1, 0, 1, 1, 1, 1, 0, 0)
 * M = 63 (Word 0 = 3 "0011", Word 1 = 15 "1111")
 */
const B_BITS = [1, 0, 1, 1, 1, 1, 0, 0];

const ROUNDS_DATA = [
  { round: 1, b: 1, q: 1, sBefore: 0,  sM: 63,  sA: 108, sDiv2: 54, w0: "0011", w1: "0110", note: "Both passes write. Carry in +A pass." },
  { round: 2, b: 0, q: 0, sBefore: 54, sM: 54,  sA: 54,  sDiv2: 27, w0: "0001", w1: "1011", note: "Nothing written. Only halving." },
  { round: 3, b: 1, q: 0, sBefore: 27, sM: 27,  sA: 72,  sDiv2: 36, w0: "0010", w1: "0100", note: "Only +A writes. Carry in +A pass." },
  { round: 4, b: 1, q: 1, sBefore: 36, sM: 99,  sA: 144, sDiv2: 72, w0: "0100", w1: "1000", note: "Both passes write." },
  { round: 5, b: 1, q: 1, sBefore: 72, sM: 135, sA: 180, sDiv2: 90, w0: "0101", w1: "1010", note: "Both passes write." },
  { round: 6, b: 1, q: 1, sBefore: 90, sM: 153, sA: 198, sDiv2: 99, w0: "0110", w1: "0011", note: "Both passes write." },
  { round: 7, b: 0, q: 1, sBefore: 99, sM: 162, sA: 162, sDiv2: 81, w0: "0101", w1: "0001", note: "+A pass writes nothing." },
  { round: 8, b: 0, q: 1, sBefore: 81, sM: 144, sA: 144, sDiv2: 72, w0: "0100", w1: "1000", note: "Final S = 72." }
];

const STATE_STRIP = [
  "IDLE", "INIT_S", "LOOP_INIT", "ITER", "BQ", "SM", "wait", "SA", "wait", "SDIV2", "wait", "wait", "EMIT_S", "DONE"
];

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(0);

  // Keyboard spacebar listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Animation timeline beats
  const beats = [
    // Beat 0: IDLE
    {
      state: "IDLE",
      roundText: "Ready",
      caption: "Goal: A × B on a clock of 63 hours.",
      tickText: "tick 0",
      activeStateIndex: 0,
      readyLight: true,
      roundNum: 0,
      bPointer: -1,
      bVal: null,
      qVal: null,
      sVal: 0,
      sWords: ["0000", "0000"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 3800
    },
    // Beat 1: INIT_S
    {
      state: "INIT_S",
      roundText: "Setup",
      caption: "First, empty the bucket, one box at a time.",
      tickText: "tick 1-2",
      activeStateIndex: 1,
      readyLight: false,
      roundNum: 0,
      bPointer: -1,
      bVal: null,
      qVal: null,
      sVal: 0,
      sWords: ["0000", "0000"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 3400
    },
    // Beat 2: LOOP_INIT
    {
      state: "LOOP_INIT",
      roundText: "Round 1 of 8",
      caption: "We repeat 8 times, once for every bit of B.",
      tickText: "tick 3",
      activeStateIndex: 2,
      readyLight: false,
      roundNum: 1,
      bPointer: 0,
      bVal: null,
      qVal: null,
      sVal: 0,
      sWords: ["0000", "0000"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 3000
    },
    // Beat 3: LOOP_ITER (Round 1)
    {
      state: "ITER",
      roundText: "Round 1 of 8",
      caption: "Ask the shelf for what we need.",
      tickText: "tick 4",
      activeStateIndex: 3,
      readyLight: false,
      roundNum: 1,
      bPointer: 0,
      bVal: null,
      qVal: null,
      sVal: 0,
      sWords: ["0000", "0000"],
      carryActive: false,
      droppedBit: null,
      slipActive: true,
      activeMachine: null,
      duration: 3200
    },
    // Beat 4: LOOP_BQ (Round 1)
    {
      state: "BQ",
      roundText: "Round 1 of 8",
      caption: "b: do we add A?  q: would the sum be odd?",
      tickText: "tick 5",
      activeStateIndex: 4,
      readyLight: false,
      roundNum: 1,
      bPointer: 0,
      bVal: 1,
      qVal: 1,
      sVal: 0,
      sWords: ["0000", "0000"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 4000
    },
    // Beat 5: CALC_SM (Round 1)
    {
      state: "SM",
      roundText: "Round 1 of 8",
      caption: "M makes S even. Small word first, the carry moves up.",
      tickText: "tick 6-7",
      activeStateIndex: 5,
      readyLight: false,
      roundNum: 1,
      bPointer: 0,
      bVal: 1,
      qVal: 1,
      sVal: 63,
      sWords: ["0011", "1111"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: "M",
      duration: 4500
    },
    // Beat 6: STALLPIPE_SM
    {
      state: "wait",
      roundText: "Round 1 of 8",
      caption: "Wait: the last box is still being placed.",
      tickText: "tick 8",
      activeStateIndex: 6,
      readyLight: false,
      roundNum: 1,
      bPointer: 0,
      bVal: 1,
      qVal: 1,
      sVal: 63,
      sWords: ["0011", "1111"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 2200
    },
    // Beat 7: CALC_SA (Round 1)
    {
      state: "SA",
      roundText: "Round 1 of 8",
      caption: "If b is 1, add A. Small word first, carry moves up.",
      tickText: "tick 9-10",
      activeStateIndex: 7,
      readyLight: false,
      roundNum: 1,
      bPointer: 0,
      bVal: 1,
      qVal: 1,
      sVal: 108,
      sWords: ["0110", "1100"],
      carryActive: true,
      droppedBit: null,
      slipActive: false,
      activeMachine: "A",
      duration: 4500
    },
    // Beat 8: STALLPIPE_SA
    {
      state: "wait",
      roundText: "Round 1 of 8",
      caption: "Wait again, then start from the big word.",
      tickText: "tick 11",
      activeStateIndex: 8,
      readyLight: false,
      roundNum: 1,
      bPointer: 0,
      bVal: 1,
      qVal: 1,
      sVal: 108,
      sWords: ["0110", "1100"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 2200
    },
    // Beat 9: CALC_SDIV2 (Round 1)
    {
      state: "SDIV2",
      roundText: "Round 1 of 8",
      caption: "Halve S. The dropped bit slides into the next box.",
      tickText: "tick 12-13",
      activeStateIndex: 9,
      readyLight: false,
      roundNum: 1,
      bPointer: 0,
      bVal: 1,
      qVal: 1,
      sVal: 54,
      sWords: ["0011", "0110"],
      carryActive: false,
      droppedBit: 0,
      slipActive: false,
      activeMachine: "DIV2",
      duration: 4500
    },
    // Beat 10: STALLPIPE_D2
    {
      state: "wait",
      roundText: "Round 1 of 8",
      caption: "Next bit of B. Loop arrow points to the next bit.",
      tickText: "tick 14",
      activeStateIndex: 10,
      readyLight: false,
      roundNum: 1,
      bPointer: 1,
      bVal: 1,
      qVal: 1,
      sVal: 54,
      sWords: ["0011", "0110"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 2500
    },
    // Beat 11: ROUND 2 (b=0, q=0)
    {
      state: "SDIV2",
      roundText: "Round 2 of 8",
      caption: "Nothing to add this time (b=0, q=0). Only halving changes S.",
      tickText: "round 2",
      activeStateIndex: 9,
      readyLight: false,
      roundNum: 2,
      bPointer: 1,
      bVal: 0,
      qVal: 0,
      sVal: 27,
      sWords: ["0001", "1011"],
      carryActive: false,
      droppedBit: 1,
      slipActive: false,
      activeMachine: "DIV2",
      duration: 4500
    },
    // Beat 12: ROUND 3 (b=1, q=0)
    {
      state: "SA",
      roundText: "Round 3 of 8",
      caption: "Only A is added (b=1, q=0). Carry hops from word 1 to word 0.",
      tickText: "round 3",
      activeStateIndex: 7,
      readyLight: false,
      roundNum: 3,
      bPointer: 2,
      bVal: 1,
      qVal: 0,
      sVal: 36,
      sWords: ["0010", "0100"],
      carryActive: true,
      droppedBit: 0,
      slipActive: false,
      activeMachine: "A",
      duration: 4500
    },
    // Beat 13: FAST FORWARD (Rounds 4-8)
    {
      state: "ITER",
      roundText: "Round 4-8",
      caption: "The same thing, five more times. S accumulates and halves each round.",
      tickText: "rounds 4-8",
      activeStateIndex: 3,
      readyLight: false,
      roundNum: 8,
      bPointer: 7,
      bVal: 0,
      qVal: 1,
      sVal: 72,
      sWords: ["0100", "1000"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 5000
    },
    // Beat 14: EMIT_S
    {
      state: "EMIT_S",
      roundText: "Result Ready",
      caption: "Send the answer out. The words of S slide out into the result tray.",
      tickText: "tick 95",
      activeStateIndex: 12,
      readyLight: false,
      roundNum: 8,
      bPointer: 7,
      bVal: 0,
      qVal: 1,
      sVal: 72,
      sWords: ["0100", "1000"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      resultOut: 72,
      showClockWrap: false,
      duration: 4000
    },
    // Beat 15: DONE & WRAPPER REDUCTION
    {
      state: "DONE",
      roundText: "Wrapper Modulo",
      caption: "On a clock of 63 hours, 72 is the same as 9 (72 - 63 = 9).",
      tickText: "tick 96",
      activeStateIndex: 13,
      readyLight: true,
      roundNum: 8,
      bPointer: -1,
      bVal: null,
      qVal: null,
      sVal: 72,
      sWords: ["0100", "1000"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      resultOut: 9,
      showClockWrap: true,
      duration: 6500
    },
    // Beat 16: EPILOGUE (REAL 256-BIT CHIP METRICS)
    {
      state: "DONE",
      roundText: "Real 256-Bit Hardware",
      caption: "The real chip does the same thing, 256 times. The wrapper runs it 4 times to cancel ÷ 256.",
      tickText: "30,305 ticks",
      activeStateIndex: 13,
      readyLight: true,
      roundNum: 256,
      bPointer: -1,
      bVal: null,
      qVal: null,
      sVal: 72,
      sWords: ["0100", "1000"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      resultOut: 9,
      showClockWrap: true,
      showEpilogueOverlay: true,
      duration: 10000
    }
  ];

  const currentBeat = beats[timelineIndex];

  // Timer loop for continuous presentation
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setTimeout(() => {
        setTimelineIndex((prev) => {
          if (prev < beats.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, currentBeat.duration);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, timelineIndex, currentBeat.duration, beats.length]);

  const handlePlayPause = () => {
    if (timelineIndex === beats.length - 1) {
      setTimelineIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const isAtEnd = timelineIndex === beats.length - 1;

  return (
    <div className="w-full h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col justify-between select-none overflow-hidden relative">
      {/* ======================================================== */}
      {/* TOP BAR: ROUND COUNTER | CAPTION | TICK COUNTER           */}
      {/* ======================================================== */}
      <header className="w-full px-8 pt-5 pb-3 flex items-center justify-between z-10">
        {/* Left: Round Count */}
        <div className="w-48">
          <span className="text-xl font-bold tracking-tight text-white font-sans">
            {currentBeat.roundText}
          </span>
        </div>

        {/* Center: Exactly One Large Sentence Caption (Rule 6) */}
        <div className="flex-1 max-w-3xl text-center">
          <div className="bg-[#1E293B]/80 backdrop-blur border border-slate-700/60 rounded-xl px-6 py-2.5 shadow-lg">
            <p className="text-base sm:text-lg font-medium text-slate-100 tracking-wide transition-all duration-300">
              {currentBeat.caption}
            </p>
          </div>
        </div>

        {/* Right: Tick Indicator */}
        <div className="w-48 text-right font-mono text-sm text-slate-400">
          <span>{currentBeat.tickText}</span>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN STAGE (ONE FIXED LAYOUT AS PER FIGURE 1 IN BRIEF)   */}
      {/* ======================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-2 grid grid-cols-12 gap-4 items-center relative">
        
        {/* -------------------------------------------------------- */}
        {/* 1. MEMORY SHELF (LEFT: 3 COLS)                            */}
        {/* -------------------------------------------------------- */}
        <div className="col-span-3 h-[490px] rounded-2xl border border-slate-700/60 bg-[#1E293B]/40 p-4 flex flex-col justify-between items-center relative">
          <span className="text-xs font-medium text-slate-400">
            Memory shelf (outside the chip)
          </span>

          {/* ITEM A: Blue Circle with 2 words */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-[#3B82F6] shadow-lg shadow-blue-500/20 flex flex-col items-center justify-center text-white font-bold relative z-10">
              <span className="text-sm">A</span>
              <span className="text-xl">45</span>
            </div>
            {/* Word circles */}
            <div className="flex items-center gap-3 -mt-3 z-20">
              <div className="w-12 h-12 rounded-full bg-[#2563EB] border border-blue-300/40 flex flex-col items-center justify-center text-[10px] font-mono shadow">
                <span className="text-[9px] text-blue-200">w0</span>
                <span className="font-bold">0010</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#2563EB] border border-blue-300/40 flex flex-col items-center justify-center text-[10px] font-mono shadow">
                <span className="text-[9px] text-blue-200">w1</span>
                <span className="font-bold">1101</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">
              word 0 (big) | word 1 (small)
            </span>
          </div>

          {/* ITEM B: Orange Circle with 8 bit dots */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#F59E0B] shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center text-white font-bold">
              <span className="text-xs">B</span>
              <span className="text-lg">61</span>
            </div>
            {/* 8 Bits below B (smallest bit first: 1, 0, 1, 1, 1, 1, 0, 0) */}
            <div className="flex items-center gap-1.5 mt-2">
              {B_BITS.map((bit, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                    currentBeat.bPointer === idx
                      ? "bg-amber-400 border-white scale-125 shadow-lg shadow-amber-400/50 animate-pulse"
                      : "border-amber-500/60 " + (bit === 1 ? "bg-amber-600/40" : "bg-transparent")
                  }`}
                  title={`Bit ${idx}: ${bit}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">
              bits, smallest first
            </span>
          </div>

          {/* ITEM M: Green Circle with 63-mark Clock Ring */}
          <div className="flex flex-col items-center relative">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* SVG 63-Tick Clock Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeDasharray="2 3"
                  className="opacity-70 animate-[spin_60s_linear_infinite]"
                />
              </svg>
              <div className="w-16 h-16 rounded-full bg-[#10B981] shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center text-white font-bold z-10">
                <span className="text-xs">M</span>
                <span className="text-base">63</span>
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              clock ring (63 marks)
            </span>
          </div>

          {/* Animated slip flying between shelf & chip */}
          {currentBeat.slipActive && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 flex items-center gap-1 bg-slate-800/90 border border-dashed border-slate-400 text-slate-300 text-[10px] font-mono px-2 py-1 rounded-full animate-bounce">
              <span>slip (tick t)</span>
            </div>
          )}
        </div>

        {/* -------------------------------------------------------- */}
        {/* 2. THE CHIP (CENTER: 6 COLS)                              */}
        {/* -------------------------------------------------------- */}
        <div className="col-span-6 h-[490px] rounded-3xl border-2 border-purple-500/60 bg-[#1E293B]/20 p-5 flex flex-col justify-between relative shadow-2xl shadow-purple-950/20">
          <div className="text-center">
            <span className="text-sm font-bold tracking-wider text-purple-400 uppercase font-mono">
              Chip
            </span>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center flex-1 my-2">
            {/* THE BUCKET S (Left half inside chip) */}
            <div className="col-span-5 flex flex-col items-center justify-center relative">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Dashed outer bucket ring */}
                <div className="absolute inset-0 border-2 border-dashed border-purple-400/50 rounded-full animate-[spin_30s_linear_infinite]" />
                
                {/* Central S Circle */}
                <div className="w-24 h-24 rounded-full bg-[#8B5CF6] shadow-xl shadow-purple-500/30 flex flex-col items-center justify-center text-white font-bold z-10 transition-all duration-300">
                  <span className="text-xs text-purple-200">S</span>
                  <span className="text-2xl font-mono">{currentBeat.sVal}</span>
                </div>

                {/* S Word Circles (word 0 big left, word 1 small right) */}
                <div className="absolute -bottom-2 flex items-center gap-3 z-20">
                  <div className="w-11 h-11 rounded-full bg-[#7C3AED] border border-purple-300/40 flex flex-col items-center justify-center text-[10px] font-mono text-white shadow">
                    <span className="text-[8px] text-purple-200">w0</span>
                    <span className="font-bold">{currentBeat.sWords[0]}</span>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-[#7C3AED] border border-purple-300/40 flex flex-col items-center justify-center text-[10px] font-mono text-white shadow">
                    <span className="text-[8px] text-purple-200">w1</span>
                    <span className="font-bold">{currentBeat.sWords[1]}</span>
                  </div>
                </div>
              </div>

              <span className="text-[11px] text-purple-300 font-mono mt-3">
                bucket (2 words)
              </span>

              {/* Carry circle (Yellow #FACC15) */}
              {currentBeat.carryActive && (
                <div className="absolute -top-3 right-2 flex flex-col items-center animate-bounce z-30">
                  <span className="text-[9px] text-yellow-300 font-mono">carry</span>
                  <div className="w-6 h-6 rounded-full bg-[#FACC15] text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg shadow-yellow-400/40">
                    1
                  </div>
                </div>
              )}

              {/* Dropped Bit circle (Rose #FB7185) */}
              {currentBeat.droppedBit !== null && (
                <div className="absolute -bottom-6 right-2 flex flex-col items-center animate-pulse z-30">
                  <div className="w-6 h-6 rounded-full bg-[#FB7185] text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-rose-400/40">
                    {currentBeat.droppedBit}
                  </div>
                  <span className="text-[9px] text-rose-300 font-mono">dropped bit</span>
                </div>
              )}
            </div>

            {/* THREE MACHINES (+M, +A, ÷2) (Right half inside chip) */}
            <div className="col-span-7 flex flex-col gap-3 justify-center pl-2">
              {/* +M machine */}
              <div
                className={`p-3.5 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${
                  currentBeat.activeMachine === "M"
                    ? "border-[#10B981] bg-[#10B981]/20 shadow-lg shadow-emerald-500/20 scale-105"
                    : "border-[#10B981]/50 bg-slate-900/40"
                }`}
              >
                <span className="font-mono text-sm font-bold text-emerald-300">
                  +M machine
                </span>
              </div>

              {/* +A machine */}
              <div
                className={`p-3.5 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${
                  currentBeat.activeMachine === "A"
                    ? "border-[#3B82F6] bg-[#3B82F6]/20 shadow-lg shadow-blue-500/20 scale-105"
                    : "border-[#3B82F6]/50 bg-slate-900/40"
                }`}
              >
                <span className="font-mono text-sm font-bold text-blue-300">
                  +A machine
                </span>
              </div>

              {/* ÷2 machine */}
              <div
                className={`p-3.5 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${
                  currentBeat.activeMachine === "DIV2"
                    ? "border-[#8B5CF6] bg-[#8B5CF6]/20 shadow-lg shadow-purple-500/20 scale-105"
                    : "border-[#8B5CF6]/50 bg-slate-900/40"
                }`}
              >
                <span className="font-mono text-sm font-bold text-purple-300">
                  ÷2 machine
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <span className="text-[11px] text-slate-400 font-mono">
              results go back into S
            </span>
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/* 3. RIGHT SIDE: READY LIGHT, b & q DOTS, RESULT TRAY      */}
        {/* -------------------------------------------------------- */}
        <div className="col-span-3 h-[490px] p-4 flex flex-col justify-between items-center relative">
          {/* Top: Ready Light & b, q indicators */}
          <div className="w-full flex flex-col items-center gap-3">
            {/* Ready light */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-slate-400 mb-1">ready light</span>
              <div
                className={`w-9 h-9 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  currentBeat.readyLight
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
                    currentBeat.bVal === 1
                      ? "bg-[#F59E0B] border-white text-white shadow-md shadow-amber-500/40"
                      : "bg-slate-900 border-amber-900/60 text-slate-600"
                  }`}
                >
                  {currentBeat.bVal !== null ? currentBeat.bVal : "-"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 font-mono">q</span>
                <div
                  className={`w-6 h-6 rounded-full border transition-all duration-300 flex items-center justify-center text-xs font-mono font-bold ${
                    currentBeat.qVal === 1
                      ? "bg-[#10B981] border-white text-white shadow-md shadow-emerald-500/40"
                      : "bg-slate-900 border-emerald-900/60 text-slate-600"
                  }`}
                >
                  {currentBeat.qVal !== null ? currentBeat.qVal : "-"}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">b and q dots</span>
          </div>

          {/* RESULT TRAY */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Optional M Clock Ring at Wrapper step */}
              {currentBeat.showClockWrap && (
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
                {currentBeat.resultOut !== undefined ? (
                  <div className="flex flex-col items-center animate-scale">
                    <span className="text-xs text-slate-400">result</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {currentBeat.resultOut}
                    </span>
                    {currentBeat.showClockWrap && (
                      <span className="text-[9px] text-emerald-300 mt-0.5">
                        72 − 63 = 9
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

          {/* Spacer */}
          <div className="h-2" />
        </div>

        {/* -------------------------------------------------------- */}
        {/* EPILOGUE FULL-SCREEN OVERLAY (LAST 30 SECONDS - BEAT 16)  */}
        {/* -------------------------------------------------------- */}
        {currentBeat.showEpilogueOverlay && (
          <div className="absolute inset-0 bg-[#0F172A]/95 backdrop-blur-md z-40 rounded-3xl p-8 flex flex-col justify-between border-2 border-cyan-500/40 shadow-2xl animate-fadeIn">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                Real Hardware Scale (CS-431 Digital System Design)
              </span>
              <h2 className="text-2xl font-bold text-white mb-2">
                From 8-Bit Toy Model to 256-Bit Cryptographic Core
              </h2>
              <p className="text-sm text-slate-300">
                The real hardware follows the exact same state order and word-serial datapath, scaled to protect elliptic curve cryptography:
              </p>
            </div>

            {/* Scale comparison cards */}
            <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto w-full font-mono text-center">
              <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Word Segmentation</span>
                <span className="text-xl font-bold text-cyan-300 block">8 words × 32 bits</span>
                <span className="text-[11px] text-slate-400 mt-1 block">Full 256-bit operands</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Ticks Per Round</span>
                <span className="text-xl font-bold text-amber-300 block">29 ticks / round</span>
                <span className="text-[11px] text-slate-400 mt-1 block">256 rounds total (7,448 ticks)</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Full 4-Pass Execution</span>
                <span className="text-xl font-bold text-emerald-300 block">30,305 total ticks</span>
                <span className="text-[11px] text-slate-400 mt-1 block">Includes 512 ticks for R² mod M</span>
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
        )}
      </main>

      {/* ======================================================== */}
      {/* BOTTOM STRIP: 14 MACHINE STATES & SINGLE PLAY/PAUSE BTN */}
      {/* ======================================================== */}
      <footer className="w-full px-8 pb-5 pt-2 flex flex-col items-center gap-3 z-10">
        {/* 14 State Pills (Rule 6: names only, current yellow) */}
        <div className="w-full flex items-center justify-center gap-1.5 flex-wrap">
          {STATE_STRIP.map((st, idx) => {
            const isCurrent = currentBeat.activeStateIndex === idx;
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

        {/* CONTROLS (Rule 4: ONLY Play/Pause or Replay, spacebar supported) */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
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
    </div>
  );
}