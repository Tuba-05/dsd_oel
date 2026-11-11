/**
 * @file App.tsx
 * @description Main container component for the 256-bit Montgomery Modular Multiplier Visualizer.
 *
 * Purpose:
 * - Connects the central simulation hook (`useMontgomerySimulator`) to all modular UI components.
 * - Coordinates layout between the Header, ControlToolbar, BusActivityTicker (5-Stage Progress & Live Explanation),
 *   PresetSelector, Top/Core Architecture Views, and LiveRegistersPanel.
 */

import { useMontgomerySimulator } from "./hooks/useMontgomerySimulator";
import { Header } from "./components/Header";
import { ControlToolbar } from "./components/ControlToolbar";
import { BusActivityTicker } from "./components/BusActivityTicker";
import { PresetSelector } from "./components/PresetSelector";
import { TopArchitectureView } from "./components/TopArchitectureView";
import { CoreDatapathView } from "./components/CoreDatapathView";
import { LiveRegistersPanel } from "./components/LiveRegistersPanel";

export default function App() {
  // Initialize hardware FSM simulation state and control handlers
  const sim = useMontgomerySimulator();

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
      {/* 1. TOP HEADER BAR: Title & View Mode Switcher (Top vs. Core) */}
      <Header viewMode={sim.viewMode} setViewMode={sim.setViewMode} />

      {/* 2. CONTROL TOOLBAR: Auto-Run, Single Clock Step, Reset, Delay Presets & FSM Status Badges */}
      <ControlToolbar
        isPlaying={sim.isPlaying}
        setIsPlaying={sim.setIsPlaying}
        stepForward={sim.stepForward}
        handleReset={sim.handleReset}
        speed={sim.speed}
        setSpeed={sim.setSpeed}
        state={sim.state}
        pass={sim.pass}
        busy={sim.busy}
        done={sim.done}
        error={sim.error}
      />

      {/* 3. 5-STAGE PROGRESS TRACKER & PLAIN-ENGLISH LIVE EXPLANATION BANNER */}
      <BusActivityTicker
        state={sim.state}
        pass={sim.pass}
        stepTitle={sim.stepTitle}
        stepExplanationEasy={sim.stepExplanationEasy}
        activeSignal={sim.activeSignal}
        error={sim.error}
        errorMessage={sim.errorMessage}
      />

      {/* 4. MAIN WORKSPACE: 8-Column Interactive Architecture Diagram + 4-Column Register Inspector */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT / CENTER PANEL (8 Cols): Testbench Inputs & Architecture Diagram */}
        <div className="lg:col-span-8 p-4 overflow-y-auto flex flex-col gap-4 border-r border-slate-800 bg-slate-950/60">
          {/* Testbench Preset Selector & 256-bit Hex Input Fields (A, B, M) */}
          <PresetSelector
            selectedPresetIndex={sim.selectedPresetIndex}
            onSelectPreset={sim.handleSelectPreset}
            inputA={sim.inputA}
            inputB={sim.inputB}
            inputM={sim.inputM}
            onInputChange={sim.handleInputChange}
          />

          {/* Switch between Top-Level Wrapper (modmul_top.v) and Core Datapath (montprod.v) */}
          {sim.viewMode === "top" ? (
            <TopArchitectureView
              state={sim.state}
              r2Count={sim.r2Count}
              pass={sim.pass}
              resultOut={sim.resultOut}
              setViewMode={sim.setViewMode}
            />
          ) : (
            <CoreDatapathView
              coreFsmState={sim.coreFsmState}
              bitB={sim.bitB}
              bitQ={sim.bitQ}
              sMemWords={sim.sMemWords}
              setViewMode={sim.setViewMode}
            />
          )}
        </div>

        {/* RIGHT PANEL (4 Cols): Live 256-Bit Hardware Registers */}
        <LiveRegistersPanel
          inputA={sim.inputA}
          inputB={sim.inputB}
          inputM={sim.inputM}
          regR2={sim.regR2}
          regAm={sim.regAm}
          regBm={sim.regBm}
          regPm={sim.regPm}
          resultOut={sim.resultOut}
          lastUpdatedReg={sim.lastUpdatedReg}
        />
      </div>
    </div>
  );
}
