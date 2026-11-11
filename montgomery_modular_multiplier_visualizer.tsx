import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Database,
  FastForward,
  BookOpen,
  Info,
  Maximize2
} from "lucide-react";

// --- PRE-LOADED TEST CASES (From tb_MM.v) ---
const TEST_PRESETS = [
  {
    name: "Small Prime Test (A=2, B=3)",
    desc: "A=2, B=3, M=small odd prime. Perfect for quick step-by-step viva demo.",
    a: "2",
    b: "3",
    m: "172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd87",
    exp: "6"
  },
  {
    name: "Identity & Square (A=B)",
    desc: "A=B, tests Montgomery domain squaring operation.",
    a: "172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd86",
    b: "172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd86",
    m: "172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd87",
    exp: "1"
  },
  {
    name: "256-bit Cryptographic Vector",
    desc: "Full-width 256-bit operands simulating ECC/RSA key exchange operations.",
    a: "1102ef5725fbab1ba70b967adf354788d4dd79d3b5834f4cecb736d877f1caf0",
    b: "141e12f0597538cbc54be01c0ef8e010faaced226972f683de11ee00366dadc0",
    m: "17493833c0a9c8beb070e38434d57084ddfa7fa4ffe9ec11c63d5f77bb3a6a07",
    exp: "a9bce65f4f9850d4bb090301c21ff4a33b308c014501becedc0a6e05f740bd5"
  }
];

// Helper to truncate long 256-bit hex strings
function truncateHex(hexStr, start = 6, end = 6) {
  if (!hexStr) return "0x0";
  const clean = hexStr.replace(/^0x/, "");
  if (clean.length <= start + end + 2) return `0x${clean}`;
  return `0x${clean.slice(0, start)}...${clean.slice(-end)}`;
}

export default function App() {
  // Input state
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [inputA, setInputA] = useState(TEST_PRESETS[0].a);
  const [inputB, setInputB] = useState(TEST_PRESETS[0].b);
  const [inputM, setInputM] = useState(TEST_PRESETS[0].m);

  // View state: 'top' (modmul_top wrapper) or 'core' (montprod datapath)
  const [viewMode, setViewMode] = useState("top");
  const [showVivaDrawer, setShowVivaDrawer] = useState(false);

  // Simulation execution state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500); // ms per step

  // FSM Simulation model state
  const [state, setState] = useState("S_IDLE");
  const [pass, setPass] = useState(0); // 0, 1, 2, 3
  const [r2Count, setR2Count] = useState(0); // up to 512
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Registers
  const [regR2, setRegR2] = useState("0x00000000... (R^2 mod M)");
  const [regAm, setRegAm] = useState("Waiting...");
  const [regBm, setRegBm] = useState("Waiting...");
  const [regPm, setRegPm] = useState("Waiting...");
  const [resultOut, setResultOut] = useState("0x0");

  // Core internal states (montprod)
  const [coreFsmState, setCoreFsmState] = useState("CTRL_IDLE");
  const [coreBitIndex, setCoreBitIndex] = useState(0);
  const [coreWordIndex, setCoreWordIndex] = useState(7);
  const [bitB, setBitB] = useState(0);
  const [bitQ, setBitQ] = useState(0);
  const [sMemWords, setSMemWords] = useState(new Array(8).fill("00000000"));
  const [activeSignal, setActiveSignal] = useState("");

  // Validation function
  const validateInputs = () => {
    try {
      const cleanA = inputA.replace(/^0x/, "") || "0";
      const cleanB = inputB.replace(/^0x/, "") || "0";
      const cleanM = inputM.replace(/^0x/, "") || "0";

      const bigA = BigInt("0x" + cleanA);
      const bigB = BigInt("0x" + cleanB);
      const bigM = BigInt("0x" + cleanM);

      // Check 1: M must be odd
      if (bigM % BigInt(2) === BigInt(0)) {
        return { valid: false, msg: "Violation: M must be an ODD modulus (m_in[0] == 1)." };
      }
      // Check 2: M < 2^254 (Top 2 bits must be zero)
      const max254 = (BigInt(1) << BigInt(254)) - BigInt(1);
      if (bigM > max254) {
        return { valid: false, msg: "Violation: M >= 2^254. Top 2 bits must be 00 (montprod limit)." };
      }
      // Check 3: A < M and B < M
      if (bigA >= bigM || bigB >= bigM) {
        return { valid: false, msg: "Violation: Operands A and B must be strictly less than Modulus M." };
      }

      return { valid: true, bigA, bigB, bigM };
    } catch {
      return { valid: false, msg: "Invalid hexadecimal character entered." };
    }
  };

  // Reset simulator
  const handleReset = () => {
    setIsPlaying(false);
    setState("S_IDLE");
    setPass(0);
    setR2Count(0);
    setBusy(false);
    setDone(false);
    setError(false);
    setErrorMessage("");
    setRegR2("0x00000000...");
    setRegAm("Waiting...");
    setRegBm("Waiting...");
    setRegPm("Waiting...");
    setResultOut("0x0");
    setCoreFsmState("CTRL_IDLE");
    setCoreBitIndex(0);
    setCoreWordIndex(7);
    setBitB(0);
    setBitQ(0);
    setSMemWords(new Array(8).fill("00000000"));
    setActiveSignal("");
  };

  // Perform single simulation step forward
  const stepForward = () => {
    const val = validateInputs();
    if (!val.valid) {
      setError(true);
      setErrorMessage(val.msg);
      setDone(true);
      setBusy(false);
      setState("S_DONE");
      return;
    }

    switch (state) {
      case "S_IDLE":
        setError(false);
        setErrorMessage("");
        setDone(false);
        setBusy(true);
        setState("S_R2");
        setR2Count(0);
        setActiveSignal("start -> Initializing 512-cycle R^2 Generator");
        break;

      case "S_R2":
        // Fast-forward R2 progression for intuitive visualization
        if (r2Count < 500) {
          const nextCount = r2Count + 128;
          setR2Count(nextCount);
          setActiveSignal(`x <= (2x >= M) ? (2x - M) : 2x [Iteration ${nextCount}/512]`);
        } else {
          setR2Count(512);
          const cleanM = inputM.replace(/^0x/, "");
          const bigM = BigInt("0x" + cleanM);
          const r2 = (BigInt(1) << BigInt(512)) % bigM;
          setRegR2("0x" + r2.toString(16));
          setState("S_LOAD");
          setPass(0);
          setActiveSignal("R^2 mod M calculation complete! Moving to S_LOAD (Pass 0).");
        }
        break;

      case "S_LOAD":
        setState("S_CALC");
        setCoreFsmState("CTRL_INIT_S");
        if (pass === 0) {
          setActiveSignal(`Pass 0: Feeding A and R^2 to montprod core`);
        } else if (pass === 1) {
          setActiveSignal(`Pass 1: Feeding B and R^2 to montprod core`);
        } else if (pass === 2) {
          setActiveSignal(`Pass 2: Multiplying Montgomery elements A' * B'`);
        } else if (pass === 3) {
          setActiveSignal(`Pass 3: Transforming P' back to Normal Domain with 1`);
        }
        break;

      case "S_CALC":
        // Micro transitions inside montprod core
        if (coreFsmState === "CTRL_INIT_S") {
          setCoreFsmState("CTRL_LOOP_BQ");
          setSMemWords(["00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000", "00000000"]);
          setCoreBitIndex(0);
          setActiveSignal("Core: Initialized Accumulator memory s_mem to zero");
        } else if (coreFsmState === "CTRL_LOOP_BQ") {
          const bVal = Math.random() > 0.5 ? 1 : 0;
          const qVal = (0 ^ (1 & bVal)) === 1 ? 1 : 0;
          setBitB(bVal);
          setBitQ(qVal);
          setCoreFsmState("CTRL_L_CALC_SM");
          setActiveSignal(`Core BQ: Extracted Bit B[${coreBitIndex}]=${bVal}, calculated q=${qVal}`);
        } else if (coreFsmState === "CTRL_L_CALC_SM") {
          setCoreFsmState("CTRL_L_CALC_SA");
          setActiveSignal(`Core: Running adder32 (S + M) through s_mem [Carry Propagated]`);
        } else if (coreFsmState === "CTRL_L_CALC_SA") {
          setCoreFsmState("CTRL_L_CALC_SDIV2");
          setActiveSignal(`Core: Running adder32 (S + A) word-by-word`);
        } else if (coreFsmState === "CTRL_L_CALC_SDIV2") {
          setCoreFsmState("CTRL_EMIT_S");
          // Random aesthetic hex data update in s_mem word
          const updated = [...sMemWords];
          updated[7] = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
          setSMemWords(updated);
          setActiveSignal(`Core: Shifter shr32 right-shifted S by 1 bit (divide by 2)`);
        } else if (coreFsmState === "CTRL_EMIT_S") {
          setCoreFsmState("CTRL_DONE");
          setState("S_WAIT");
          setActiveSignal(`Core: 256 bits complete! Emitting result words to top wrapper.`);
        }
        break;

      case "S_WAIT":
        setState("S_STORE");
        setActiveSignal("Top FSM: core_ready signaled high. Latching core result.");
        break;

      case "S_STORE": {
        const cleanA = inputA.replace(/^0x/, "");
        const cleanB = inputB.replace(/^0x/, "");
        const cleanM = inputM.replace(/^0x/, "");
        const bA = BigInt("0x" + cleanA);
        const bB = BigInt("0x" + cleanB);
        const bM = BigInt("0x" + cleanM);
        const R = BigInt(1) << BigInt(256);

        if (pass === 0) {
          const amVal = (bA * R) % bM;
          setRegAm("0x" + amVal.toString(16));
          setPass(1);
          setState("S_LOAD");
          setActiveSignal("Stored A' = A*R mod M. Starting Pass 1 (B*R2)...");
        } else if (pass === 1) {
          const bmVal = (bB * R) % bM;
          setRegBm("0x" + bmVal.toString(16));
          setPass(2);
          setState("S_LOAD");
          setActiveSignal("Stored B' = B*R mod M. Starting Pass 2 (A' * B')...");
        } else if (pass === 2) {
          const pmVal = (bA * bB * R) % bM;
          setRegPm("0x" + pmVal.toString(16));
          setPass(3);
          setState("S_LOAD");
          setActiveSignal("Stored P' = A*B*R mod M. Starting Pass 3 (P' * 1)...");
        } else if (pass === 3) {
          const finalAns = (bA * bB) % bM;
          setResultOut("0x" + finalAns.toString(16));
          setState("S_DONE");
          setBusy(false);
          setDone(true);
          setIsPlaying(false);
          setActiveSignal("All 4 Passes Complete! Final (A * B) mod M ready in result_out.");
        }
        break;
      }

      case "S_DONE":
        setIsPlaying(false);
        setActiveSignal("Calculation finished. Pulse start or press Reset for new run.");
        break;

      default:
        break;
    }
  };

  // Auto-play timer
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setTimeout(() => {
        stepForward();
      }, speed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, state, pass, r2Count, coreFsmState, speed]);

  const handleSelectPreset = (idx) => {
    setSelectedPresetIndex(idx);
    setInputA(TEST_PRESETS[idx].a);
    setInputB(TEST_PRESETS[idx].b);
    setInputM(TEST_PRESETS[idx].m);
    handleReset();
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
      {/* HEADER BAR */}
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
              DSD Open-Ended Lab | Top Wrapper: <code className="text-slate-300">modmul_top</code> &amp; Core: <code className="text-slate-300">montprod</code>
            </p>
          </div>
        </div>

        {/* Action buttons & View toggles */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
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

          {/* Teacher Guide Button */}
          <button
            onClick={() => setShowVivaDrawer(!showVivaDrawer)}
            className="flex items-center gap-1.5 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">Viva Cheat-Sheet</span>
          </button>
        </div>
      </header>

      {/* SUB-HEADER: CONTROL TOOLBAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={done || error}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded font-semibold transition ${
              isPlaying
                ? "bg-amber-500 text-black hover:bg-amber-400"
                : "bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? "Pause" : "Auto-Run"}
          </button>

          <button
            onClick={stepForward}
            disabled={isPlaying || done || error}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-3 py-1.5 rounded font-medium border border-slate-700 transition"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Step Clock Edge
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded font-medium border border-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Registers
          </button>

          {/* Speed slider */}
          <div className="flex items-center gap-2 ml-3 border-l border-slate-700 pl-3 text-slate-400">
            <span>Clock Period:</span>
            <input
              type="range"
              min="100"
              max="1500"
              step="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24 accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-cyan-400 w-12">{speed}ms</span>
          </div>
        </div>

        {/* Current State Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-400">Top State:</span>
            <span className="font-mono font-bold text-cyan-300">{state}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-400">Pass:</span>
            <span className="font-mono font-bold text-amber-300">
              {pass}/3 (
              {pass === 0 ? "A*R2" : pass === 1 ? "B*R2" : pass === 2 ? "A'*B'" : "P'*1"})
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-400">Flags:</span>
            <span className={`font-mono text-xs ${busy ? "text-amber-400" : "text-slate-600"}`}>
              BUSY={busy ? "1" : "0"}
            </span>
            <span className={`font-mono text-xs ${done ? "text-emerald-400" : "text-slate-600"}`}>
              DONE={done ? "1" : "0"}
            </span>
            <span className={`font-mono text-xs ${error ? "text-rose-400" : "text-slate-600"}`}>
              ERR={error ? "1" : "0"}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIVE HARDWARE BUS TICKER */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-5 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 truncate">
          <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-spin" />
          <span className="text-slate-400 font-medium">Datapath Bus Activity:</span>
          <span className="font-mono text-cyan-300 truncate">
            {activeSignal || "System in S_IDLE. Pulse start clock or click 'Step Clock Edge'."}
          </span>
        </div>
        {error && (
          <div className="flex items-center gap-1 text-rose-400 font-medium bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/60">
            <AlertTriangle className="w-3 h-3" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT / CENTER: INTERACTIVE BLOCK DIAGRAM (8 COLS) */}
        <div className="lg:col-span-8 p-4 overflow-y-auto flex flex-col gap-4 border-r border-slate-800 bg-slate-950/60">
          {/* Top Preset Selector & Input Fields */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Select Testbench Vectors
              </span>
              <div className="flex gap-1.5">
                {TEST_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(idx)}
                    className={`text-xs px-2.5 py-1 rounded transition ${
                      selectedPresetIndex === idx
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {p.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Operand A (256-bit Hex):</label>
                <input
                  type="text"
                  value={inputA}
                  onChange={(e) => {
                    setInputA(e.target.value);
                    handleReset();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Operand B (256-bit Hex):</label>
                <input
                  type="text"
                  value={inputB}
                  onChange={(e) => {
                    setInputB(e.target.value);
                    handleReset();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Modulus M (Must be Odd &amp; &lt; 2^254):</label>
                <input
                  type="text"
                  value={inputM}
                  onChange={(e) => {
                    setInputM(e.target.value);
                    handleReset();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* VIEW 1: TOP ARCHITECTURE VIEW (modmul_top) */}
          {/* ======================================================== */}
          {viewMode === "top" && (
            <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Wrapper RTL Block Diagram (modmul_top.v)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Radix R = 2^256 | Target: Artix-7 xc7a100t
                </span>
              </div>

              {/* Grid of hardware modules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. INPUT VALIDATOR BLOCK */}
                <div
                  className={`p-3.5 rounded-lg border transition-all duration-300 ${
                    state === "S_IDLE"
                      ? "border-cyan-400/80 bg-cyan-950/20 shadow-lg shadow-cyan-500/10"
                      : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200">1. Input Validator</span>
                    <span className="text-[10px] font-mono text-cyan-400">Verilog Lines 86-93</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Validates cryptographic bounds on incoming inputs:
                  </p>
                  <ul className="text-[10px] space-y-1 font-mono text-slate-300">
                    <li className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span> M[0] == 1 (Odd modulus)
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span> M[255:254] == 00 (&lt; 2^254)
                    </li>
                    <li className="flex items-center gap-1">
                      <span className="text-emerald-400">✓</span> A &lt; M and B &lt; M
                    </li>
                  </ul>
                </div>

                {/* 2. 512-CYCLE R^2 DOUBLER UNIT */}
                <div
                  className={`p-3.5 rounded-lg border transition-all duration-300 ${
                    state === "S_R2"
                      ? "border-amber-400 bg-amber-950/20 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400"
                      : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200">2. R^2 mod M Doubler</span>
                    <span className="text-[10px] font-mono text-amber-400">State: S_R2</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Computes 2^512 mod M in hardware without division:
                  </p>
                  <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-amber-300 border border-slate-800 mb-2">
                    x &lt;= (2x &gt;= M) ? (2x - M) : 2x;
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Iterations:</span>
                    <span className="font-mono text-amber-300 font-bold">{r2Count} / 512</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-300"
                      style={{ width: `${(r2Count / 512) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 3. 4-PASS SCHEDULER */}
                <div
                  className={`p-3.5 rounded-lg border transition-all duration-300 ${
                    state === "S_LOAD" || state === "S_STORE"
                      ? "border-emerald-400 bg-emerald-950/20 shadow-lg shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200">3. Pass Coordinator</span>
                    <span className="text-[10px] font-mono text-emerald-400">Pass {pass} / 3</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Feeds operands sequentially into Montgomery Core:
                  </p>
                  <div className="text-[10px] font-mono space-y-1">
                    <div className={`p-1 rounded ${pass === 0 ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-500"}`}>
                      Pass 0: A' = MontProd(A, R^2)
                    </div>
                    <div className={`p-1 rounded ${pass === 1 ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-500"}`}>
                      Pass 1: B' = MontProd(B, R^2)
                    </div>
                    <div className={`p-1 rounded ${pass === 2 ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-500"}`}>
                      Pass 2: P' = MontProd(A', B')
                    </div>
                    <div className={`p-1 rounded ${pass === 3 ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-500"}`}>
                      Pass 3: P = MontProd(P', 1)
                    </div>
                  </div>
                </div>
              </div>

              {/* BIG CENTRAL BLOCK: MONTGOMERY CORE INSTANTIATION */}
              <div
                onClick={() => setViewMode("core")}
                className={`p-4 rounded-xl border cursor-pointer group transition-all duration-300 ${
                  state === "S_CALC" || state === "S_WAIT"
                    ? "border-purple-500 bg-purple-950/30 shadow-xl shadow-purple-500/10 ring-1 ring-purple-400"
                    : "border-slate-800 bg-slate-950/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        Montgomery Core: <code className="text-purple-300">montprod u_core</code>
                        <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-700/50">
                          Click to Drill-Down
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Computes MontProd(x,y) = x · y · R^-1 mod M over 256 bits (8 words × 32 bits)
                      </p>
                    </div>
                  </div>
                  <Maximize2 className="w-4 h-4 text-purple-400 group-hover:text-purple-200 transition" />
                </div>

                {/* Submodule miniature cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded text-center">
                    <span className="text-[10px] font-mono text-slate-400 block">Accumulator Memory</span>
                    <span className="font-bold font-mono text-purple-300">blockmem1r1w</span>
                    <span className="text-[10px] text-slate-500 block mt-1">8 words × 32b S-vector</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded text-center">
                    <span className="text-[10px] font-mono text-slate-400 block">Adder 1 (S + A)</span>
                    <span className="font-bold font-mono text-cyan-300">s_adder_sa (adder32)</span>
                    <span className="text-[10px] text-slate-500 block mt-1">active when b[i]==1</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded text-center">
                    <span className="text-[10px] font-mono text-slate-400 block">Adder 2 (S + M)</span>
                    <span className="font-bold font-mono text-emerald-300">s_adder_sm (adder32)</span>
                    <span className="text-[10px] text-slate-500 block mt-1">active when q==1</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded text-center">
                    <span className="text-[10px] font-mono text-slate-400 block">Right Shifter</span>
                    <span className="font-bold font-mono text-amber-300">shifter (shr32)</span>
                    <span className="text-[10px] text-slate-500 block mt-1">S &gt;&gt; 1 bit divide-by-2</span>
                  </div>
                </div>
              </div>

              {/* FINAL REDUCTION & OUTPUT REGISTER */}
              <div
                className={`p-3 rounded-lg border transition ${
                  state === "S_DONE"
                    ? "border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10"
                    : "border-slate-800 bg-slate-950/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">
                    Final Conditional Reduction &amp; result_out [255:0]
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Verilog Line 78</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                  <span className="text-slate-400">
                    res_red = (res_vec &gt;= M) ? (res_vec - M) : res_vec;
                  </span>
                  <div className="bg-slate-900 px-3 py-1 rounded border border-slate-800 text-emerald-300 font-bold truncate max-w-sm">
                    {resultOut}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: CORE DATAPATH DRILL-DOWN VIEW (montprod.v) */}
          {/* ======================================================== */}
          {viewMode === "core" && (
            <div className="rounded-xl border border-purple-900/60 bg-slate-900/50 p-5 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-400 animate-spin" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    montprod Core Internal Micro-Architecture &amp; Datapath
                  </h3>
                </div>
                <button
                  onClick={() => setViewMode("top")}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                >
                  Back to Wrapper
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* MICRO FSM STATUS BAR */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Current Core State:</span>
                  <span className="font-mono font-bold text-purple-300 text-sm">{coreFsmState}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Multiplier Bit (b_i):</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">b = {bitB}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Reduction Quotient (q):</span>
                  <span className="font-mono font-bold text-emerald-300 text-sm">q = {bitQ}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Quotient Formula:</span>
                  <span className="font-mono text-slate-300 text-[11px]">q = S[0] ^ (A[0] &amp; b)</span>
                </div>
              </div>

              {/* CORE DATAPATH BLOCKS (BRAM, ADDER_SA, ADDER_SM, SHR32) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                {/* 1. S_MEM BRAM */}
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 font-bold block mb-1">
                      INSTANCE: s_mem
                    </span>
                    <h5 className="font-bold text-slate-200 mb-1">blockmem1r1w</h5>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Synchronous dual-port RAM storing 256-bit accumulator S as eight 32-bit words.
                    </p>
                  </div>
                  <div className="space-y-1 font-mono text-[10px] bg-slate-900 p-2 rounded border border-slate-800">
                    <div className="flex justify-between text-slate-400">
                      <span>W0 (MSW):</span> <span className="text-cyan-300">{sMemWords[0]}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>W4:</span> <span className="text-cyan-300">{sMemWords[4]}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>W7 (LSW):</span> <span className="text-emerald-300">{sMemWords[7]}</span>
                    </div>
                  </div>
                </div>

                {/* 2. ADDER_SA (S + A) */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    coreFsmState === "CTRL_L_CALC_SA"
                      ? "border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400"
                      : "border-slate-800 bg-slate-950/80"
                  }`}
                >
                  <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">
                    INSTANCE: s_adder_sa
                  </span>
                  <h5 className="font-bold text-slate-200 mb-1">adder32.v (S + A)</h5>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Adds word of operand A when current multiplier bit <code className="text-cyan-300">b == 1</code>.
                  </p>
                  <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
                    <div>sum = S_word + A_word + C_in</div>
                    <div className="text-cyan-400 mt-1">Carry_in: add_carry_sa</div>
                  </div>
                </div>

                {/* 3. ADDER_SM (S + M) */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    coreFsmState === "CTRL_L_CALC_SM"
                      ? "border-emerald-400 bg-emerald-950/30 ring-1 ring-emerald-400"
                      : "border-slate-800 bg-slate-950/80"
                  }`}
                >
                  <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">
                    INSTANCE: s_adder_sm
                  </span>
                  <h5 className="font-bold text-slate-200 mb-1">adder32.v (S + M)</h5>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Conditionally adds Modulus M when <code className="text-emerald-300">q == 1</code> to guarantee divisibility by 2.
                  </p>
                  <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
                    <div>sum = S_word + M_word + C_in</div>
                    <div className="text-emerald-400 mt-1">Carry_in: add_carry_sm</div>
                  </div>
                </div>

                {/* 4. SHIFTER (shr32) */}
                <div
                  className={`p-3 rounded-lg border transition-all ${
                    coreFsmState === "CTRL_L_CALC_SDIV2"
                      ? "border-amber-400 bg-amber-950/30 ring-1 ring-amber-400"
                      : "border-slate-800 bg-slate-950/80"
                  }`}
                >
                  <span className="text-[10px] font-mono text-amber-400 font-bold block mb-1">
                    INSTANCE: shifter
                  </span>
                  <h5 className="font-bold text-slate-200 mb-1">shr32.v (S &gt;&gt; 1)</h5>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Right shifts 32-bit word, propagating the high bit downward from MSW to LSW.
                  </p>
                  <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
                    <div>adiv2 = {"{carry_in, a[31:1]}"}</div>
                    <div className="text-amber-400 mt-1">carry_out = a[0]</div>
                  </div>
                </div>
              </div>

              {/* MATHEMATICAL INSIGHT CALLOUT */}
              <div className="bg-slate-950 border border-purple-500/20 p-3.5 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h6 className="font-bold text-purple-300 mb-0.5">
                    How Montgomery Division by 2 works in Hardware:
                  </h6>
                  <p className="text-slate-400">
                    In every iteration, the equation computed is{" "}
                    <code className="text-cyan-300 font-mono">S = (S + b·A + q·M) / 2</code>. By setting{" "}
                    <code className="text-emerald-300 font-mono">q = S[0] ^ (A[0] &amp; b)</code>, the least significant bit of the sum is mathematically guaranteed to be <code className="text-amber-300 font-mono">0</code>. Therefore, the division by 2 is an exact bitwise right shift with zero remainder!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: REGISTER INSPECTION & PASS MONITOR (4 COLS) */}
        <div className="lg:col-span-4 p-4 overflow-y-auto flex flex-col gap-4 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Live Hardware Registers
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">256-Bit Precision</span>
          </div>

          {/* REGISTER CARDS */}
          <div className="space-y-2.5 text-xs font-mono">
            {/* Register A */}
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                <span>Reg A_r [255:0]:</span>
                <span className="text-cyan-400">Input A</span>
              </div>
              <div className="text-slate-200 truncate">{truncateHex(inputA, 8, 8)}</div>
            </div>

            {/* Register B */}
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                <span>Reg B_r [255:0]:</span>
                <span className="text-cyan-400">Input B</span>
              </div>
              <div className="text-slate-200 truncate">{truncateHex(inputB, 8, 8)}</div>
            </div>

            {/* Register M */}
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                <span>Reg M_r [255:0]:</span>
                <span className="text-amber-400">Modulus M</span>
              </div>
              <div className="text-slate-200 truncate">{truncateHex(inputM, 8, 8)}</div>
            </div>

            {/* Register R^2 */}
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                <span>Reg x (R^2 mod M):</span>
                <span className="text-amber-300">2^512 mod M</span>
              </div>
              <div className="text-amber-200 truncate">{truncateHex(regR2, 8, 8)}</div>
            </div>

            {/* Montgomery Domain Intermediates */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-2">
              <div className="text-[11px] text-purple-400 font-bold uppercase tracking-wider">
                Montgomery Domain Registers
              </div>
              <div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>A' = A·R mod M (Pass 0):</span>
                </div>
                <div className="text-purple-300 text-[11px] truncate">{truncateHex(regAm, 8, 8)}</div>
              </div>
              <div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>B' = B·R mod M (Pass 1):</span>
                </div>
                <div className="text-purple-300 text-[11px] truncate">{truncateHex(regBm, 8, 8)}</div>
              </div>
              <div>
                <div className="flex justify-between text-slate-400 text-[10px]">
                  <span>P' = A·B·R mod M (Pass 2):</span>
                </div>
                <div className="text-purple-300 text-[11px] truncate">{truncateHex(regPm, 8, 8)}</div>
              </div>
            </div>

            {/* Final result_out */}
            <div className="bg-emerald-950/30 p-3 rounded-lg border border-emerald-500/40">
              <div className="flex justify-between text-emerald-400 text-[11px] font-bold mb-1">
                <span>result_out [255:0]:</span>
                <span>(A · B) mod M</span>
              </div>
              <div className="text-emerald-300 font-bold text-sm truncate">{truncateHex(resultOut, 10, 10)}</div>
            </div>
          </div>

          {/* VIVA QUICK TALK CALLOUT */}
          <div className="mt-auto bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5 mb-1.5">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Viva Presentation Summary
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Tell the teacher: "Instead of expensive 256-bit hardware division, we compute in Montgomery domain where division is replaced by bit-shifts (<code className="text-cyan-300">shr32</code>) and additions (<code className="text-cyan-300">adder32</code>). 4 passes transform the numbers into Montgomery domain, multiply, and bring them back."
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TEACHER VIVA GUIDE DRAWER (SLIDE-OVER SIDEBAR) */}
      {/* ======================================================== */}
      {showVivaDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">Viva &amp; Presentation Cheat-Sheet</h3>
              </div>
              <button
                onClick={() => setShowVivaDrawer(false)}
                className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Question 1 */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <h4 className="font-bold text-amber-300 mb-1">
                  1. Why use Montgomery Multiplication instead of standard A * B % M?
                </h4>
                <p className="text-slate-300 mb-1.5">
                  <strong>Answer:</strong> Standard modulo division requires 256-bit division circuits which require huge FPGA area and slow down clock frequency. Montgomery multiplication converts division into <strong>bit-level right shifts and additions</strong>.
                </p>
                <p className="text-slate-400 text-[11px] italic">
                  <strong>Urdu:</strong> 256-bit division hardware bohot barha aur slow hota hai. Montgomery division ko right shifts (divide by 2) aur adds mein badal deta hai.
                </p>
              </div>

              {/* Question 2 */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <h4 className="font-bold text-cyan-300 mb-1">
                  2. Why does modmul_top execute 4 passes?
                </h4>
                <ul className="text-slate-300 space-y-1 list-disc pl-4 text-[11px]">
                  <li>
                    <strong>Pass 0:</strong> Converts A to Montgomery domain: <code className="text-cyan-300">A' = A·R mod M</code>.
                  </li>
                  <li>
                    <strong>Pass 1:</strong> Converts B to Montgomery domain: <code className="text-cyan-300">B' = B·R mod M</code>.
                  </li>
                  <li>
                    <strong>Pass 2:</strong> Multiplies both in Montgomery domain: <code className="text-cyan-300">P' = A·B·R mod M</code>.
                  </li>
                  <li>
                    <strong>Pass 3:</strong> Multiplies with 1 to cancel R: <code className="text-cyan-300">P = A·B mod M</code> (Final normal domain result).
                  </li>
                </ul>
              </div>

              {/* Question 3 */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <h4 className="font-bold text-emerald-300 mb-1">
                  3. How is R^2 mod M computed without division?
                </h4>
                <p className="text-slate-300 text-[11px]">
                  Inside <code className="text-amber-300">S_R2</code> state, register <code className="text-cyan-300">x</code> starts at 1 and runs for <strong>512 iterations</strong>. In each cycle, it doubles and conditionally subtracts M:
                </p>
                <div className="bg-slate-900 p-2 rounded font-mono text-[10px] text-amber-300 my-1">
                  x &lt;= (2x &gt;= M) ? (2x - M) : 2x;
                </div>
                <p className="text-slate-400 text-[11px] italic">
                  512 clock cycles mein 2^512 mod M hardware par bina kisi external precomputation ke ban jata hai.
                </p>
              </div>

              {/* Question 4 */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <h4 className="font-bold text-purple-300 mb-1">
                  4. What do the submodules do inside montprod.v?
                </h4>
                <ul className="text-slate-300 space-y-1.5 list-disc pl-4 text-[11px]">
                  <li>
                    <strong>blockmem1r1w:</strong> 8 words of 32 bits storing intermediate sum vector S.
                  </li>
                  <li>
                    <strong>s_adder_sa:</strong> 32-bit adder for S + A (propagates carry across 8 words).
                  </li>
                  <li>
                    <strong>s_adder_sm:</strong> 32-bit adder for S + M (guarantees divisibility by 2).
                  </li>
                  <li>
                    <strong>shr32:</strong> 32-bit right-shifter that divides S by 2.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}