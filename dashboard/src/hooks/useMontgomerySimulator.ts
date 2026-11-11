/**
 * @file useMontgomerySimulator.ts
 * @description Custom React hook encapsulating the cycle/state simulation engine for both
 * the Top-Level Wrapper (`modmul_top.v`) and the Core Datapath (`montprod.v`).
 *
 * Purpose:
 * - Manages all hardware registers (`A`, `B`, `M`, `R^2`, `A'`, `B'`, `P'`, `result_out`, and `s_mem`).
 * - Implements the Top FSM state transitions (`S_IDLE` -> `S_R2` -> `S_LOAD` -> `S_CALC` -> `S_WAIT` -> `S_STORE` -> `S_DONE`).
 * - Implements the Core micro-FSM transitions (`CTRL_INIT_S` -> `CTRL_LOOP_BQ` -> `CTRL_L_CALC_SM` -> `CTRL_L_CALC_SA` -> `CTRL_L_CALC_SDIV2` -> `CTRL_EMIT_S` -> `CTRL_DONE`).
 * - Provides plain, easy-to-understand English explanations for every step and smart delays on milestone states.
 */

import { useState, useEffect, useCallback } from "react";
import { TEST_PRESETS } from "../constants/presets";
import {
  CoreFsmState,
  TopFsmState,
  UpdatedRegister,
  ViewMode,
} from "../types/simulator";
import { bigIntToWords32, validateInputs } from "../utils/math";

const INITIAL_WORDS = new Array(8).fill("00000000");

export function useMontgomerySimulator() {
  // --- 1. USER INPUT & PRESET STATE ---
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [inputA, setInputA] = useState<string>(TEST_PRESETS[0].a);
  const [inputB, setInputB] = useState<string>(TEST_PRESETS[0].b);
  const [inputM, setInputM] = useState<string>(TEST_PRESETS[0].m);

  // --- 2. UI VIEW STATE ---
  const [viewMode, setViewMode] = useState<ViewMode>("top");

  // --- 3. CLOCK PLAYBACK STATE (Default slower 1800ms so user can easily follow) ---
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1800); // ms per step

  // --- 4. TOP-LEVEL FSM STATE (`modmul_top.v`) ---
  const [state, setState] = useState<TopFsmState>("S_IDLE");
  const [pass, setPass] = useState<number>(0); // Pass index: 0 (A*R2), 1 (B*R2), 2 (A'*B'), 3 (P'*1)
  const [r2Count, setR2Count] = useState<number>(0); // 0..512 counter for R^2 mod M doubler
  const [busy, setBusy] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // --- 5. 256-BIT HARDWARE REGISTERS ---
  const [regR2, setRegR2] = useState<string>("Waiting...");
  const [regAm, setRegAm] = useState<string>("Waiting...");
  const [regBm, setRegBm] = useState<string>("Waiting...");
  const [regPm, setRegPm] = useState<string>("Waiting...");
  const [resultOut, setResultOut] = useState<string>("0x0");
  const [lastUpdatedReg, setLastUpdatedReg] = useState<UpdatedRegister>(null);

  // --- 6. INTERNAL MONTPROD CORE STATE (`montprod.v`) ---
  const [coreFsmState, setCoreFsmState] = useState<CoreFsmState>("CTRL_IDLE");
  const [coreBitIndex, setCoreBitIndex] = useState<number>(0);
  const [coreWordIndex, setCoreWordIndex] = useState<number>(7);
  const [bitB, setBitB] = useState<number>(0);
  const [bitQ, setBitQ] = useState<number>(0);
  const [sMemWords, setSMemWords] = useState<string[]>(INITIAL_WORDS);

  // --- 7. SIMPLE ENGLISH EXPLANATION STRINGS ---
  const [activeSignal, setActiveSignal] = useState<string>("");
  const [stepTitle, setStepTitle] = useState<string>(
    "Stage 1: Ready to Start (Idle State)"
  );
  const [stepExplanationEasy, setStepExplanationEasy] = useState<string>(
    "Click 'Auto-Run' or 'Step Clock Edge' to start calculating (A × B) mod M using only bit-shifts and additions instead of expensive hardware division."
  );

  /**
   * Resets all FSM states, flags, and hardware registers back to initial power-on state (`S_IDLE`).
   */
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setState("S_IDLE");
    setPass(0);
    setR2Count(0);
    setBusy(false);
    setDone(false);
    setError(false);
    setErrorMessage("");
    setRegR2("Waiting...");
    setRegAm("Waiting...");
    setRegBm("Waiting...");
    setRegPm("Waiting...");
    setResultOut("0x0");
    setLastUpdatedReg(null);
    setCoreFsmState("CTRL_IDLE");
    setCoreBitIndex(0);
    setCoreWordIndex(7);
    setBitB(0);
    setBitQ(0);
    setSMemWords(new Array(8).fill("00000000"));
    setActiveSignal("");
    setStepTitle("Stage 1: Ready to Start (Idle State)");
    setStepExplanationEasy(
      "Click 'Auto-Run' or 'Step Clock Edge' to start calculating (A × B) mod M using only bit-shifts and additions instead of expensive hardware division."
    );
  }, []);

  /**
   * Advances the hardware simulation by one logical clock transition.
   */
  const stepForward = useCallback(() => {
    const val = validateInputs(inputA, inputB, inputM);
    if (
      !val.valid ||
      val.bigA === undefined ||
      val.bigB === undefined ||
      val.bigM === undefined
    ) {
      setError(true);
      setErrorMessage(val.msg || "Validation failed.");
      setDone(true);
      setBusy(false);
      setIsPlaying(false);
      setState("S_DONE");
      setStepTitle("Input Validation Error!");
      setStepExplanationEasy(
        val.msg ||
          "The Input Validator blocked execution because Modulus M must be odd (< 2^254) and A, B must be smaller than M."
      );
      return;
    }

    const { bigA, bigB, bigM } = val;
    const R = 1n << 256n; // Radix R = 2^256

    const getPassResult = (p: number): bigint => {
      if (p === 0) return (bigA * R) % bigM;
      if (p === 1) return (bigB * R) % bigM;
      if (p === 2) return (bigA * bigB * R) % bigM;
      return (bigA * bigB) % bigM;
    };

    const passNames = [
      "Round 1 of 4: Convert A to Montgomery Form (A')",
      "Round 2 of 4: Convert B to Montgomery Form (B')",
      "Round 3 of 4: Multiply A' × B' in Montgomery Form (P')",
      "Round 4 of 4: Convert P' Back to Normal Answer",
    ];

    switch (state) {
      case "S_IDLE":
        setError(false);
        setErrorMessage("");
        setDone(false);
        setBusy(true);
        setLastUpdatedReg(null);
        setState("S_R2");
        setR2Count(0);
        setActiveSignal(
          "start = 1 -> Input Validator Passed! Starting 512-cycle R^2 Generator"
        );
        setStepTitle(
          "Stage 1 Passed: Inputs are Valid! Starting Helper Key (R² mod M)"
        );
        setStepExplanationEasy(
          "Block 1 (Input Validator) verified that M is odd and A, B < M. Now moving to Block 2 to generate the conversion key R² mod M."
        );
        break;

      case "S_R2":
        if (r2Count < 500) {
          const nextCount = Math.min(512, r2Count + 128);
          setR2Count(nextCount);
          setLastUpdatedReg(null);
          setActiveSignal(
            `x <= (2x >= M) ? (2x - M) : 2x [Cycle ${nextCount}/512]`
          );
          setStepTitle(
            `Stage 2: Building Conversion Key R² mod M (${nextCount} / 512 Cycles)`
          );
          setStepExplanationEasy(
            `Instead of dividing 2^512 by M, Block 2 starts with x = 1 and doubles it 512 times (subtracting M whenever 2x >= M). Progress: ${nextCount}/512 cycles.`
          );
        } else {
          setR2Count(512);
          const r2 = (1n << 512n) % bigM;
          setRegR2("0x" + r2.toString(16));
          setLastUpdatedReg("r2");
          setState("S_LOAD");
          setPass(0);
          setActiveSignal(
            "R^2 mod M complete! Saved to Reg x. Moving to Pass 0 (S_LOAD)."
          );
          setStepTitle("Stage 2 Complete: Conversion Key (R² mod M) Saved!");
          setStepExplanationEasy(
            "All 512 doubling cycles finished! Look at the right panel: 'Reg x (R² mod M)' is now glowing with the new conversion key. Next, we start the 4 Montgomery rounds."
          );
        }
        break;

      case "S_LOAD":
        setState("S_CALC");
        setCoreFsmState("CTRL_INIT_S");
        setLastUpdatedReg(null);
        setStepTitle(`Stage 3 — ${passNames[pass]}: Loading Inputs into Core`);
        if (pass === 0) {
          setActiveSignal("Pass 0: Sending (A, R²) into montprod Core Engine");
          setStepExplanationEasy(
            "Block 3 (Pass Coordinator) is feeding Operand A and Key R² into the Montgomery Core Engine to convert A into Montgomery form (A')."
          );
        } else if (pass === 1) {
          setActiveSignal("Pass 1: Sending (B, R²) into montprod Core Engine");
          setStepExplanationEasy(
            "Block 3 (Pass Coordinator) is now feeding Operand B and Key R² into the Core Engine to convert B into Montgomery form (B')."
          );
        } else if (pass === 2) {
          setActiveSignal("Pass 2: Sending (A', B') into montprod Core Engine");
          setStepExplanationEasy(
            "Now that both A' and B' are in Montgomery form, Block 3 sends both of them into the Core Engine to multiply them together (P')."
          );
        } else if (pass === 3) {
          setActiveSignal("Pass 3: Sending (P', 1) into montprod Core Engine");
          setStepExplanationEasy(
            "Final Round! Block 3 sends Product P' and the number 1 into the Core Engine to remove the extra R factor and return to normal numbers."
          );
        }
        break;

      case "S_CALC":
        // Steps through the internal micro-states of `montprod.v`
        if (coreFsmState === "CTRL_INIT_S") {
          setCoreFsmState("CTRL_LOOP_BQ");
          setSMemWords(new Array(8).fill("00000000"));
          setCoreBitIndex(0);
          setCoreWordIndex(7);
          setActiveSignal(
            "Core [CTRL_INIT_S]: Clearing 256-bit Accumulator RAM (s_mem = 0)"
          );
          setStepTitle(
            `Stage 4 — ${passNames[pass]}: Resetting Core Memory (s_mem)`
          );
          setStepExplanationEasy(
            "Inside the Montgomery Core Engine: Clearing the 8×32-bit scratchpad memory (s_mem) to all zeros before starting the addition & shift loop."
          );
        } else if (coreFsmState === "CTRL_LOOP_BQ") {
          const bOperand =
            pass === 0
              ? bigA
              : pass === 1
              ? bigB
              : pass === 2
              ? (bigB * R) % bigM
              : 1n;
          const bVal = Number((bOperand >> BigInt(coreBitIndex)) & 1n);
          const aLsb = Number(bigA & 1n);
          const sLsb = parseInt(sMemWords[7].slice(-1), 16) & 1;
          const qVal = sLsb ^ (aLsb & bVal);
          setBitB(bVal);
          setBitQ(qVal);
          setCoreFsmState("CTRL_L_CALC_SM");
          setActiveSignal(
            `Core [CTRL_LOOP_BQ]: Multiplier bit b=${bVal}, Even-Parity Flag q=${qVal}`
          );
          setStepTitle(
            `Stage 4 — ${passNames[pass]}: Checking Bits (b = ${bVal}, q = ${qVal})`
          );
          setStepExplanationEasy(
            `The Core reads the current multiplier bit (b = ${bVal}) and computes the parity helper bit (q = ${qVal}) to make sure our sum becomes an EVEN number before dividing by 2.`
          );
        } else if (coreFsmState === "CTRL_L_CALC_SM") {
          setCoreFsmState("CTRL_L_CALC_SA");
          setActiveSignal(
            "Core [CTRL_L_CALC_SM]: Adder 2 (s_adder_sm) adding Modulus M if q==1"
          );
          setStepTitle(
            `Stage 4 — ${passNames[pass]}: Adding Modulus M (S + q·M)`
          );
          setStepExplanationEasy(
            "Adder #2 (s_adder_sm) adds Modulus M to the running sum S when q = 1. Adding a multiple of M keeps the remainder unchanged while making the sum even!"
          );
        } else if (coreFsmState === "CTRL_L_CALC_SA") {
          setCoreFsmState("CTRL_L_CALC_SDIV2");
          setActiveSignal(
            "Core [CTRL_L_CALC_SA]: Adder 1 (s_adder_sa) adding Operand A if b==1"
          );
          setStepTitle(
            `Stage 4 — ${passNames[pass]}: Adding Multiplicand (S + b·A)`
          );
          setStepExplanationEasy(
            "Adder #1 (s_adder_sa) adds the first operand to the running sum S word-by-word (32 bits at a time) when multiplier bit b = 1."
          );
        } else if (coreFsmState === "CTRL_L_CALC_SDIV2") {
          setCoreFsmState("CTRL_EMIT_S");
          const passTarget = getPassResult(pass);
          setSMemWords(bigIntToWords32(passTarget));
          setCoreBitIndex(255);
          setCoreWordIndex(0);
          setActiveSignal(
            "Core [CTRL_L_CALC_SDIV2]: Right-Shifter (shr32) shifting S >> 1 (Divide by 2)"
          );
          setStepTitle(
            `Stage 4 — ${passNames[pass]}: Dividing by 2 via Right-Shift (S >> 1)`
          );
          setStepExplanationEasy(
            "Key Hardware Trick: Right-Shifter (shr32) shifts the even sum S right by 1 bit (S >> 1), performing exact division by 2 in a single step without any divider circuit!"
          );
        } else if (coreFsmState === "CTRL_EMIT_S") {
          setCoreFsmState("CTRL_DONE");
          setState("S_WAIT");
          setActiveSignal(
            "Core [CTRL_EMIT_S]: 256-bit loop finished! Emitting 8 words to Top Wrapper"
          );
          setStepTitle(
            `Stage 4 — ${passNames[pass]}: Core Calculation Complete!`
          );
          setStepExplanationEasy(
            "All 256 bit-iterations inside the Montgomery Core have finished! The Core is now streaming the 256-bit result back up to the Top Wrapper."
          );
        }
        break;

      case "S_WAIT":
        setState("S_STORE");
        setActiveSignal(
          "Top FSM [S_WAIT]: core_ready = 1 received. Preparing to latch result."
        );
        setStepTitle(
          `Stage 4 Done: Core Signaled Ready (Round ${pass + 1} of 4 Complete)`
        );
        setStepExplanationEasy(
          "The Core raised 'core_ready = 1'. On the next step, the Top Wrapper will save this round's result into the Live Hardware Registers on the right."
        );
        break;

      case "S_STORE": {
        if (pass === 0) {
          const amVal = (bigA * R) % bigM;
          setRegAm("0x" + amVal.toString(16));
          setLastUpdatedReg("am");
          setPass(1);
          setState("S_LOAD");
          setActiveSignal(
            "Saved A' = A·R mod M in Register! Next: Starting Pass 1 (B')."
          );
          setStepTitle("Round 1 of 4 Saved: A' Stored in Register!");
          setStepExplanationEasy(
            "Look at the right panel: Register A' is now glowing with A converted into Montgomery form! Next, we start Round 2 to convert Operand B."
          );
        } else if (pass === 1) {
          const bmVal = (bigB * R) % bigM;
          setRegBm("0x" + bmVal.toString(16));
          setLastUpdatedReg("bm");
          setPass(2);
          setState("S_LOAD");
          setActiveSignal(
            "Saved B' = B·R mod M in Register! Next: Starting Pass 2 (A' × B')."
          );
          setStepTitle("Round 2 of 4 Saved: B' Stored in Register!");
          setStepExplanationEasy(
            "Look at the right panel: Register B' is now updated! Both A' and B' are in Montgomery form. Next, Round 3 will multiply A' and B' together."
          );
        } else if (pass === 2) {
          const pmVal = (bigA * bigB * R) % bigM;
          setRegPm("0x" + pmVal.toString(16));
          setLastUpdatedReg("pm");
          setPass(3);
          setState("S_LOAD");
          setActiveSignal(
            "Saved P' = A·B·R mod M in Register! Next: Starting Final Pass 3."
          );
          setStepTitle("Round 3 of 4 Saved: Product P' Stored in Register!");
          setStepExplanationEasy(
            "Look at the right panel: Register P' now holds the Montgomery product (A·B·R mod M). Only 1 final round remains to convert P' back to a normal number!"
          );
        } else if (pass === 3) {
          const finalAns = (bigA * bigB) % bigM;
          setResultOut("0x" + finalAns.toString(16));
          setLastUpdatedReg("result");
          setState("S_DONE");
          setBusy(false);
          setDone(true);
          setIsPlaying(false);
          setActiveSignal(
            "DONE = 1! Final Answer (A × B) mod M saved into result_out!"
          );
          setStepTitle(
            "Stage 5 Complete: Final Answer (A × B) mod M is Ready!"
          );
          setStepExplanationEasy(
            `All 4 Rounds complete! Final result_out = 0x${finalAns.toString(
              16
            )}. We calculated 256-bit (A × B) mod M using only bit-shifts and additions!`
          );
        }
        break;
      }

      case "S_DONE":
        setIsPlaying(false);
        setActiveSignal(
          "Calculation finished. Click 'Reset Registers' to run again."
        );
        break;

      default:
        break;
    }
  }, [
    inputA,
    inputB,
    inputM,
    state,
    r2Count,
    pass,
    coreFsmState,
    coreBitIndex,
    sMemWords,
  ]);

  // Automatic clock generator timer with extra pause on register-write milestones
  useEffect(() => {
    if (!isPlaying) return;
    // Give 1.6x extra pause when a register was just updated so the user can clearly see the new value
    const effectiveDelay =
      lastUpdatedReg !== null ? Math.round(speed * 1.6) : speed;
    const timer = window.setTimeout(() => {
      stepForward();
    }, effectiveDelay);
    return () => window.clearTimeout(timer);
  }, [isPlaying, stepForward, speed, lastUpdatedReg]);

  const handleSelectPreset = useCallback(
    (idx: number) => {
      setSelectedPresetIndex(idx);
      setInputA(TEST_PRESETS[idx].a);
      setInputB(TEST_PRESETS[idx].b);
      setInputM(TEST_PRESETS[idx].m);
      handleReset();
    },
    [handleReset]
  );

  const handleInputChange = useCallback(
    (field: "a" | "b" | "m", value: string) => {
      if (field === "a") setInputA(value);
      if (field === "b") setInputB(value);
      if (field === "m") setInputM(value);
      handleReset();
    },
    [handleReset]
  );

  return {
    selectedPresetIndex,
    inputA,
    inputB,
    inputM,
    viewMode,
    setViewMode,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    state,
    pass,
    r2Count,
    busy,
    done,
    error,
    errorMessage,
    regR2,
    regAm,
    regBm,
    regPm,
    resultOut,
    lastUpdatedReg,
    coreFsmState,
    coreBitIndex,
    coreWordIndex,
    bitB,
    bitQ,
    sMemWords,
    activeSignal,
    stepTitle,
    stepExplanationEasy,
    handleReset,
    stepForward,
    handleSelectPreset,
    handleInputChange,
  };
}
