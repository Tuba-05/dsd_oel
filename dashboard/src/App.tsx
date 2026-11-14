/**
 * @file App.tsx
 * @description Root presentation component for the Montgomery Modular Multiplier Visualizer.
 *
 * Purpose:
 * - Connects `useTimelinePlayer` to the responsive stage components:
 *   TopBar -> Main Stage (MemoryShelf, ChipView, OutputPanel, EpilogueOverlay) -> StateFooter.
 */

import { useTimelinePlayer } from "./hooks/useTimelinePlayer";
import { TopBar } from "./components/TopBar";
import { MemoryShelf } from "./components/MemoryShelf";
import { ChipView } from "./components/ChipView";
import { OutputPanel } from "./components/OutputPanel";
import { EpilogueOverlay } from "./components/EpilogueOverlay";
import { StateFooter } from "./components/StateFooter";

export default function App() {
  const {
    operands,
    aWords,
    bBits,
    isPlaying,
    currentBeat,
    isAtEnd,
    isEditorOpen,
    setIsEditorOpen,
    epilogueDismissed,
    setEpilogueDismissed,
    handlePlayPause,
    applyOperands,
  } = useTimelinePlayer();

  return (
    <div className="w-full min-h-screen lg:h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col justify-between select-none overflow-x-hidden lg:overflow-hidden relative">
      {/* TOP BAR: ROUND COUNTER | CAPTION | TICK COUNTER */}
      <TopBar
        roundText={currentBeat.roundText}
        caption={currentBeat.caption}
        tickText={currentBeat.tickText}
      />

      {/* MAIN STAGE (Responsive: 1 column on mobile/tablet, 12-col split on desktop) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-2 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center relative">
        {/* 1. MEMORY SHELF (LEFT: 3 COLS) */}
        <MemoryShelf
          aVal={operands.a}
          aWords={aWords}
          bVal={operands.b}
          bBits={bBits}
          mVal={operands.m}
          bPointer={currentBeat.bPointer}
          slipActive={currentBeat.slipActive}
        />

        {/* 2. THE CHIP (CENTER: 6 COLS) */}
        <ChipView
          sVal={currentBeat.sVal}
          sWords={currentBeat.sWords}
          carryActive={currentBeat.carryActive}
          droppedBit={currentBeat.droppedBit}
          activeMachine={currentBeat.activeMachine}
        />

        {/* 3. RIGHT SIDE: READY LIGHT, b & q DOTS, RESULT TRAY */}
        <OutputPanel
          readyLight={currentBeat.readyLight}
          bVal={currentBeat.bVal}
          qVal={currentBeat.qVal}
          resultOut={currentBeat.resultOut}
          showClockWrap={currentBeat.showClockWrap}
          wrapEquation={currentBeat.wrapEquation}
        />

        {/* 4. EPILOGUE FULL-SCREEN OVERLAY (BEAT 16) */}
        <EpilogueOverlay
          visible={Boolean(currentBeat.showEpilogueOverlay && !epilogueDismissed)}
          onClose={() => setEpilogueDismissed(true)}
        />
      </main>

      {/* BOTTOM STRIP: 14 MACHINE STATES, PLAY/PAUSE/REPLAY & CUSTOM INPUTS */}
      <StateFooter
        activeStateIndex={currentBeat.activeStateIndex}
        isPlaying={isPlaying}
        isAtEnd={isAtEnd}
        onPlayPause={handlePlayPause}
        operands={operands}
        isEditorOpen={isEditorOpen}
        setIsEditorOpen={setIsEditorOpen}
        onApplyOperands={applyOperands}
      />
    </div>
  );
}
