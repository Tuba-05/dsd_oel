/**
 * @file timelineData.ts
 * @description Static FSM state strip labels for the bottom footer of the visualizer.
 */

/** 14 FSM state pills displayed in the bottom strip */
export const STATE_STRIP: string[] = [
  "IDLE", "INIT_S", "LOOP_INIT", "ITER", "BQ", "SM", "wait", "SA", "wait", "SDIV2", "wait", "wait", "EMIT_S", "DONE",
];
