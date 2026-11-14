/**
 * @file timeline.ts
 * @description TypeScript interfaces for the timeline-driven Montgomery Multiplier visualizer.
 *
 * Purpose:
 * - Defines the structure of user-configurable operands (`OperandConfig`),
 *   animation beats (`TimelineBeat`), active machine highlights, and round summaries.
 */

/** Display format for numbers across the visualizer */
export type NumberFormat = "dec" | "hex" | "bin";

/** User-configurable 8-bit toy model operands (0 <= A, B < M <= 63, M odd) */
export interface OperandConfig {
  a: number;
  b: number;
  m: number;
}

/** Which arithmetic unit inside the Chip is currently active */
export type ActiveMachine = "M" | "A" | "DIV2" | null;

/** Single animation beat in the presentation timeline */
export interface TimelineBeat {
  state: string;
  roundText: string;
  caption: string;
  tickText: string;
  activeStateIndex: number;
  readyLight: boolean;
  roundNum: number;
  bPointer: number;
  bVal: number | null;
  qVal: number | null;
  sVal: number;
  sWords: [string, string];
  carryActive: boolean;
  droppedBit: number | null;
  slipActive: boolean;
  activeMachine: ActiveMachine;
  resultOut?: number;
  showClockWrap?: boolean;
  wrapEquation?: string;
  showEpilogueOverlay?: boolean;
  duration: number;
}

/** Mathematical trace row for an 8-bit toy-model round */
export interface RoundSummary {
  round: number;
  b: number;
  q: number;
  sBefore: number;
  sM: number;
  sA: number;
  sDiv2: number;
  w0: string;
  w1: string;
  carryInA: boolean;
  carryInM: boolean;
  droppedBit: number;
}
