/**
 * @file simulator.ts
 * @description TypeScript type definitions and interfaces for the Montgomery Modular Multiplier simulator.
 *
 * Purpose:
 * - Defines strict types for the Top-level FSM states (`modmul_top.v`) and Core micro-FSM states (`montprod.v`).
 * - Defines data structures for pre-loaded testbench vectors, input validation results, and overall simulator state.
 */

/** Active diagram view mode: 'top' for `modmul_top` wrapper, 'core' for `montprod` datapath */
export type ViewMode = "top" | "core";

/** Identifies which hardware register was most recently updated so the UI can flash/highlight it */
export type UpdatedRegister = "r2" | "am" | "bm" | "pm" | "result" | null;

/**
 * Top-level FSM states corresponding to `modmul_top.v`:
 * - S_IDLE:  Waiting for start pulse; validates inputs A, B, M
 * - S_R2:    512-cycle shift-and-subtract loop computing R^2 = 2^512 mod M
 * - S_LOAD:  Selects operands for the current Montgomery pass (0..3)
 * - S_CALC:  Runs the `montprod` core calculation
 * - S_WAIT:  Waits for `core_ready` signal from `montprod`
 * - S_STORE: Latches the core output into intermediate/final registers
 * - S_DONE:  Computation complete (`done = 1`) or halted on input error (`error = 1`)
 */
export type TopFsmState =
  | "S_IDLE"
  | "S_R2"
  | "S_LOAD"
  | "S_CALC"
  | "S_WAIT"
  | "S_STORE"
  | "S_DONE";

/**
 * Internal micro-FSM states corresponding to `montprod.v`:
 * - CTRL_IDLE:         Core idle, waiting for `calculate` pulse
 * - CTRL_INIT_S:       Clears 8x32-bit accumulator RAM (`s_mem`) to zero
 * - CTRL_LOOP_BQ:      Extracts multiplier bit `b` and computes quotient bit `q = S[0] ^ (A[0] & b)`
 * - CTRL_L_CALC_SM:    Conditionally adds Modulus M (`S + M`) via `s_adder_sm` when `q == 1`
 * - CTRL_L_CALC_SA:    Conditionally adds Multiplicand A (`S + A`) via `s_adder_sa` when `b == 1`
 * - CTRL_L_CALC_SDIV2: Right-shifts accumulator S by 1 bit (`S >> 1`) via `shr32`
 * - CTRL_EMIT_S:       Streams the 8 result words out of `s_mem`
 * - CTRL_DONE:         Asserts `ready` back to the top wrapper
 */
export type CoreFsmState =
  | "CTRL_IDLE"
  | "CTRL_INIT_S"
  | "CTRL_LOOP_BQ"
  | "CTRL_L_CALC_SM"
  | "CTRL_L_CALC_SA"
  | "CTRL_L_CALC_SDIV2"
  | "CTRL_EMIT_S"
  | "CTRL_DONE";

/** Structure of a pre-loaded testbench vector from `tb_MM.v` */
export interface TestPreset {
  name: string;
  desc: string;
  a: string;
  b: string;
  m: string;
  exp: string;
}

/** Result returned by cryptographic input bounds validation */
export interface ValidationResult {
  valid: boolean;
  msg?: string;
  bigA?: bigint;
  bigB?: bigint;
  bigM?: bigint;
}

/** Full state snapshot of the Montgomery Hardware Simulator */
export interface SimulatorState {
  selectedPresetIndex: number;
  inputA: string;
  inputB: string;
  inputM: string;
  viewMode: ViewMode;
  isPlaying: boolean;
  speed: number;
  state: TopFsmState;
  pass: number;
  r2Count: number;
  busy: boolean;
  done: boolean;
  error: boolean;
  errorMessage: string;
  regR2: string;
  regAm: string;
  regBm: string;
  regPm: string;
  resultOut: string;
  coreFsmState: CoreFsmState;
  coreBitIndex: number;
  coreWordIndex: number;
  bitB: number;
  bitQ: number;
  sMemWords: string[];
  activeSignal: string;
  stepTitle: string;
  stepExplanationEasy: string;
  lastUpdatedReg: UpdatedRegister;
}
