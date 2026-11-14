/**
 * @file useTimelinePlayer.ts
 * @description Custom React hook managing user-selectable (A, B, M) operands,
 * dynamic timeline generation, Spacebar shortcut, and automatic beat advancement.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { NumberFormat, OperandConfig } from "../types/timeline";
import {
  generateTimelineBeats,
  toBitsLSB,
  toWords4Bit,
} from "../utils/generateTimeline";

const DEFAULT_OPERANDS: OperandConfig = { a: 45, b: 61, m: 63 };

export function useTimelinePlayer() {
  const [operands, setOperands] = useState<OperandConfig>(DEFAULT_OPERANDS);
  const [numberFormat, setNumberFormat] = useState<NumberFormat>("dec");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timelineIndex, setTimelineIndex] = useState<number>(0);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [epilogueDismissed, setEpilogueDismissed] = useState<boolean>(false);

  const beats = useMemo(
    () => generateTimelineBeats(operands.a, operands.b, operands.m),
    [operands.a, operands.b, operands.m]
  );

  const aWords = useMemo(() => toWords4Bit(operands.a), [operands.a]);
  const bBits = useMemo(() => toBitsLSB(operands.b), [operands.b]);

  const currentBeat = beats[timelineIndex] ?? beats[0];
  const isAtEnd = timelineIndex === beats.length - 1;

  const handlePlayPause = useCallback(() => {
    if (timelineIndex === beats.length - 1) {
      setTimelineIndex(0);
      setEpilogueDismissed(false);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [timelineIndex, beats.length]);

  const applyOperands = useCallback((next: OperandConfig) => {
    setIsPlaying(false);
    setTimelineIndex(0);
    setEpilogueDismissed(false);
    setOperands(next);
    setIsEditorOpen(false);
  }, []);

  // Keyboard spacebar listener (disabled while editing inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditorOpen) return;
      if (e.code === "Space") {
        e.preventDefault();
        handlePlayPause();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlayPause, isEditorOpen]);

  // Timer loop for continuous presentation
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      setTimelineIndex((prev) => {
        if (prev < beats.length - 1) {
          return prev + 1;
        }
        setIsPlaying(false);
        return prev;
      });
    }, currentBeat.duration);

    return () => window.clearTimeout(timer);
  }, [isPlaying, timelineIndex, currentBeat.duration, beats.length]);

  return {
    operands,
    numberFormat,
    setNumberFormat,
    aWords,
    bBits,
    isPlaying,
    timelineIndex,
    currentBeat,
    isAtEnd,
    isEditorOpen,
    setIsEditorOpen,
    epilogueDismissed,
    setEpilogueDismissed,
    handlePlayPause,
    applyOperands,
  };
}
