/**
 * @file formatNumber.ts
 * @description Helper functions to format 8-bit values and 4-bit words in Decimal,
 * Hexadecimal, or Binary depending on the user's selected display format.
 */

import { NumberFormat } from "../types/timeline";

/** Formats an 8-bit integer in DEC, HEX (0x..), or 8-bit BIN */
export function formatValue(val: number, format: NumberFormat): string {
  switch (format) {
    case "hex":
      return "0x" + val.toString(16).toUpperCase().padStart(2, "0");
    case "bin":
      return val.toString(2).padStart(8, "0");
    case "dec":
    default:
      return String(val);
  }
}

/** Formats a 4-bit binary word string (e.g. "0010") into DEC, HEX, or BIN */
export function formatWord4Bit(binWord: string, format: NumberFormat): string {
  const num = parseInt(binWord, 2);
  switch (format) {
    case "hex":
      return "0x" + num.toString(16).toUpperCase();
    case "dec":
      return String(num);
    case "bin":
    default:
      return binWord;
  }
}
