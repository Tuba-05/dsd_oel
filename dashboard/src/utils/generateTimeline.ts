/**
 * @file generateTimeline.ts
 * @description Dynamically computes the 8-round Montgomery multiplication trace and
 * generates the 17-beat presentation timeline for any valid (A, B, M) inputs.
 *
 * Constraints (mirroring the 256-bit hardware rules scaled down to 8-bit / 2×4-bit words):
 * - M must be odd (M % 2 === 1)
 * - 1 <= M <= 63 (M < 2^6, leaving 2 headroom bits in 8-bit words)
 * - 0 <= A < M and 0 <= B < M
 */

import { RoundSummary, TimelineBeat } from "../types/timeline";

export interface InputValidation {
  valid: boolean;
  error?: string;
}

/** Splits an 8-bit integer into two 4-bit binary word strings [w0 (MSW), w1 (LSW)] */
export function toWords4Bit(val: number): [string, string] {
  const w0 = ((val >> 4) & 0xf).toString(2).padStart(4, "0");
  const w1 = (val & 0xf).toString(2).padStart(4, "0");
  return [w0, w1];
}

/** Extracts the 8 LSB-first bits of B */
export function toBitsLSB(val: number): number[] {
  return Array.from({ length: 8 }, (_, i) => (val >> i) & 1);
}

/** Validates A, B, and M against the Montgomery hardware constraints */
export function validateToyInputs(a: number, b: number, m: number): InputValidation {
  if (!Number.isInteger(a) || !Number.isInteger(b) || !Number.isInteger(m)) {
    return { valid: false, error: "A, B, and M must be whole numbers." };
  }
  if (m < 1 || m > 63) {
    return { valid: false, error: "Modulus M must be between 1 and 63 (< 2^6)." };
  }
  if (m % 2 === 0) {
    return { valid: false, error: "Modulus M must be an ODD number (M[0] == 1)." };
  }
  if (a < 0 || a >= m) {
    return { valid: false, error: `Operand A must be between 0 and ${m - 1} (A < M).` };
  }
  if (b < 0 || b >= m) {
    return { valid: false, error: `Operand B must be between 0 and ${m - 1} (B < M).` };
  }
  return { valid: true };
}

/** Computes the exact 8-round Montgomery multiplication trace for (A, B, M) */
export function computeMontgomeryRounds(a: number, b: number, m: number): RoundSummary[] {
  const rounds: RoundSummary[] = [];
  let s = 0;

  for (let i = 0; i < 8; i++) {
    const bBit = (b >> i) & 1;
    const qBit = (s & 1) ^ ((a & 1) & bBit);

    const sBefore = s;
    const carryInM = qBit === 1 && (sBefore & 0xf) + (m & 0xf) >= 16;
    const sM = qBit === 1 ? sBefore + m : sBefore;

    const carryInA = bBit === 1 && (sM & 0xf) + (a & 0xf) >= 16;
    const sA = bBit === 1 ? sM + a : sM;

    const droppedBit = sA & 1;
    const sDiv2 = sA >> 1;
    const [w0, w1] = toWords4Bit(sDiv2);

    rounds.push({
      round: i + 1,
      b: bBit,
      q: qBit,
      sBefore,
      sM,
      sA,
      sDiv2,
      w0,
      w1,
      carryInA,
      carryInM,
      droppedBit,
    });

    s = sDiv2;
  }

  return rounds;
}

/** Generates the 17-beat choreographed animation timeline for any valid (A, B, M) */
export function generateTimelineBeats(a: number, b: number, m: number): TimelineBeat[] {
  const rounds = computeMontgomeryRounds(a, b, m);
  const r1 = rounds[0];
  const r2 = rounds[1];
  const r3 = rounds[2];
  const r8 = rounds[7];

  const finalS = r8.sDiv2;
  const needsWrap = finalS >= m;
  const reduced = needsWrap ? finalS - m : finalS;

  return [
    // Beat 0: IDLE
    {
      state: "IDLE",
      roundText: "Ready",
      caption: `Goal: A × B (${a} × ${b}) on a clock of ${m} hours.`,
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
      duration: 3800,
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
      duration: 3400,
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
      duration: 3000,
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
      duration: 3200,
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
      bVal: r1.b,
      qVal: r1.q,
      sVal: 0,
      sWords: ["0000", "0000"],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 4000,
    },
    // Beat 5: CALC_SM (Round 1)
    {
      state: "SM",
      roundText: "Round 1 of 8",
      caption:
        r1.q === 1
          ? "M makes S even. Small word first, the carry moves up."
          : "q is 0, so S is already even — skip adding M.",
      tickText: "tick 6-7",
      activeStateIndex: 5,
      readyLight: false,
      roundNum: 1,
      bPointer: 0,
      bVal: r1.b,
      qVal: r1.q,
      sVal: r1.sM,
      sWords: toWords4Bit(r1.sM),
      carryActive: r1.carryInM,
      droppedBit: null,
      slipActive: false,
      activeMachine: r1.q === 1 ? "M" : null,
      duration: 4500,
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
      bVal: r1.b,
      qVal: r1.q,
      sVal: r1.sM,
      sWords: toWords4Bit(r1.sM),
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 2200,
    },
    // Beat 7: CALC_SA (Round 1)
    {
      state: "SA",
      roundText: "Round 1 of 8",
      caption:
        r1.b === 1
          ? "If b is 1, add A. Small word first, carry moves up."
          : "b is 0, so skip adding A this round.",
      tickText: "tick 9-10",
      activeStateIndex: 7,
      readyLight: false,
      roundNum: 1,
      bPointer: 0,
      bVal: r1.b,
      qVal: r1.q,
      sVal: r1.sA,
      sWords: toWords4Bit(r1.sA),
      carryActive: r1.carryInA,
      droppedBit: null,
      slipActive: false,
      activeMachine: r1.b === 1 ? "A" : null,
      duration: 4500,
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
      bVal: r1.b,
      qVal: r1.q,
      sVal: r1.sA,
      sWords: toWords4Bit(r1.sA),
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 2200,
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
      bVal: r1.b,
      qVal: r1.q,
      sVal: r1.sDiv2,
      sWords: [r1.w0, r1.w1],
      carryActive: false,
      droppedBit: r1.droppedBit,
      slipActive: false,
      activeMachine: "DIV2",
      duration: 4500,
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
      bVal: r1.b,
      qVal: r1.q,
      sVal: r1.sDiv2,
      sWords: [r1.w0, r1.w1],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 2500,
    },
    // Beat 11: ROUND 2
    {
      state: "SDIV2",
      roundText: "Round 2 of 8",
      caption:
        r2.b === 0 && r2.q === 0
          ? "Nothing to add this time (b=0, q=0). Only halving changes S."
          : `Round 2 (b=${r2.b}, q=${r2.q}): S updates and halves to ${r2.sDiv2}.`,
      tickText: "round 2",
      activeStateIndex: 9,
      readyLight: false,
      roundNum: 2,
      bPointer: 1,
      bVal: r2.b,
      qVal: r2.q,
      sVal: r2.sDiv2,
      sWords: [r2.w0, r2.w1],
      carryActive: r2.carryInA || r2.carryInM,
      droppedBit: r2.droppedBit,
      slipActive: false,
      activeMachine: "DIV2",
      duration: 4500,
    },
    // Beat 12: ROUND 3
    {
      state: "SA",
      roundText: "Round 3 of 8",
      caption:
        r3.b === 1 && r3.q === 0
          ? "Only A is added (b=1, q=0). Carry hops from word 1 to word 0."
          : `Round 3 (b=${r3.b}, q=${r3.q}): S becomes ${r3.sDiv2} after halving.`,
      tickText: "round 3",
      activeStateIndex: 7,
      readyLight: false,
      roundNum: 3,
      bPointer: 2,
      bVal: r3.b,
      qVal: r3.q,
      sVal: r3.sDiv2,
      sWords: [r3.w0, r3.w1],
      carryActive: r3.carryInA,
      droppedBit: r3.droppedBit,
      slipActive: false,
      activeMachine: r3.b === 1 ? "A" : "DIV2",
      duration: 4500,
    },
    // Beat 13: FAST FORWARD (Rounds 4-8)
    {
      state: "ITER",
      roundText: "Round 4-8",
      caption: `The same thing, five more times. S accumulates and halves to ${finalS}.`,
      tickText: "rounds 4-8",
      activeStateIndex: 3,
      readyLight: false,
      roundNum: 8,
      bPointer: 7,
      bVal: r8.b,
      qVal: r8.q,
      sVal: finalS,
      sWords: [r8.w0, r8.w1],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      duration: 5000,
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
      bVal: r8.b,
      qVal: r8.q,
      sVal: finalS,
      sWords: [r8.w0, r8.w1],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      resultOut: finalS,
      showClockWrap: false,
      duration: 4000,
    },
    // Beat 15: DONE & WRAPPER REDUCTION
    {
      state: "DONE",
      roundText: "Wrapper Modulo",
      caption: needsWrap
        ? `On a clock of ${m} hours, ${finalS} is the same as ${reduced} (${finalS} - ${m} = ${reduced}).`
        : `On a clock of ${m} hours, ${finalS} is already less than ${m} (no wrap needed).`,
      tickText: "tick 96",
      activeStateIndex: 13,
      readyLight: true,
      roundNum: 8,
      bPointer: -1,
      bVal: null,
      qVal: null,
      sVal: finalS,
      sWords: [r8.w0, r8.w1],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      resultOut: reduced,
      showClockWrap: true,
      wrapEquation: needsWrap ? `${finalS} − ${m} = ${reduced}` : `${finalS} < ${m}`,
      duration: 6500,
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
      sVal: finalS,
      sWords: [r8.w0, r8.w1],
      carryActive: false,
      droppedBit: null,
      slipActive: false,
      activeMachine: null,
      resultOut: reduced,
      showClockWrap: true,
      wrapEquation: needsWrap ? `${finalS} − ${m} = ${reduced}` : `${finalS} < ${m}`,
      showEpilogueOverlay: true,
      duration: 10000,
    },
  ];
}

