/**
 * @file useTimelinePlayer.ts
 * @description Custom React hook managing the timeline animation playback, Spacebar shortcut,
 * and automatic beat advancement.
 *
 * Purpose:
 * - Tracks `isPlaying` and `timelineIndex` across `TIMELINE_BEATS`.
 * - Listens for Spacebar key presses to toggle Play/Pause (or Replay when at the end).
 * - Advances `timelineIndex` automatically according to each beat's `duration`.
 */

import { useState, useEffect, useCallback } from "react";
import { TIMELINE_BEATS } from "../constants/timelineData";

export function useTimelinePlayer() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timelineIndex, setTimelineIndex] = useState<number>(0);

  const currentBeat = TIMELINE_BEATS[timelineIndex];
  const isAtEnd = timelineIndex === TIMELINE_BEATS.length - 1;

  const handlePlayPause = useCallback(() => {
    if (timelineIndex === TIMELINE_BEATS.length - 1) {
      setTimelineIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [timelineIndex]);

  // Keyboard spacebar listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handlePlayPause();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlayPause]);

  // Timer loop for continuous presentation
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      setTimelineIndex((prev) => {
        if (prev < TIMELINE_BEATS.length - 1) {
          return prev + 1;
        }
        setIsPlaying(false);
        return prev;
      });
    }, currentBeat.duration);

    return () => window.clearTimeout(timer);
  }, [isPlaying, timelineIndex, currentBeat.duration]);

  return {
    isPlaying,
    timelineIndex,
    currentBeat,
    isAtEnd,
    handlePlayPause,
  };
}

