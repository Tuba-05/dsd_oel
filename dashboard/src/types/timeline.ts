/**
 * @file timeline.ts
 * @description TypeScript interfaces for the timeline-driven Montgomery Multiplier visualizer.
 *
 * Purpose:
 * - Defines the structure of each animation beat (`TimelineBeat`), active machine highlights,
 *   and the round-by-round summary data (`RoundSummary`).
 */

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
  note: string;
}

