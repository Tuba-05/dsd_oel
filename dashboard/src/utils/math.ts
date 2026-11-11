/**
 * @file math.ts
 * @description Utility functions for 256-bit hexadecimal formatting, hardware input validation,
 * and 32-bit word decomposition.
 *
 * Purpose:
 * - Mirrors the hardware input validation checks in `modmul_top.v` (lines 86-93).
 * - Formats long 256-bit hex strings for compact register display.
 * - Splits 256-bit BigInt values into eight 32-bit words to model `blockmem1r1w` (`s_mem`).
 */

import { ValidationResult } from "../types/simulator";

/**
 * Truncates a long 256-bit hexadecimal string to show only the leading and trailing hex digits.
 * Example: "0x172708a3...57dd87"
 */
export function truncateHex(hexStr: string, start = 6, end = 6): string {
  if (!hexStr) return "0x0";
  if (hexStr.startsWith("Waiting") || hexStr.includes("...")) return hexStr;
  const clean = hexStr.replace(/^0x/, "");
  if (clean.length <= start + end + 2) return `0x${clean}`;
  return `0x${clean.slice(0, start)}...${clean.slice(-end)}`;
}

/**
 * Validates operands A, B, and Modulus M against the RTL hardware constraints in `modmul_top.v`:
 * 1. M must be odd (`m_in[0] == 1`) so that gcd(R, M) = 1.
 * 2. M < 2^254 (`m_in[255:254] == 2'b00`) to prevent intermediate overflow in `montprod`.
 * 3. A < M and B < M (inputs must be reduced modulo M).
 */
export function validateInputs(
  inputA: string,
  inputB: string,
  inputM: string
): ValidationResult {
  try {
    const cleanA = inputA.trim().replace(/^0x/i, "") || "0";
    const cleanB = inputB.trim().replace(/^0x/i, "") || "0";
    const cleanM = inputM.trim().replace(/^0x/i, "") || "0";

    const bigA = BigInt("0x" + cleanA);
    const bigB = BigInt("0x" + cleanB);
    const bigM = BigInt("0x" + cleanM);

    // Check 1: M must be odd
    if (bigM % 2n === 0n) {
      return {
        valid: false,
        msg: "Violation: M must be an ODD modulus (m_in[0] == 1).",
      };
    }

    // Check 2: M < 2^254 (Top 2 bits must be zero)
    const max254 = (1n << 254n) - 1n;
    if (bigM > max254) {
      return {
        valid: false,
        msg: "Violation: M >= 2^254. Top 2 bits must be 00 (montprod limit).",
      };
    }

    // Check 3: A < M and B < M
    if (bigA >= bigM || bigB >= bigM) {
      return {
        valid: false,
        msg: "Violation: Operands A and B must be strictly less than Modulus M.",
      };
    }

    return { valid: true, bigA, bigB, bigM };
  } catch {
    return { valid: false, msg: "Invalid hexadecimal character entered." };
  }
}

/**
 * Converts a 256-bit BigInt value into an array of eight 32-bit hexadecimal words
 * ordered from Most Significant Word (W0) to Least Significant Word (W7), matching `s_mem`.
 */
export function bigIntToWords32(val: bigint): string[] {
  const hex256 = val.toString(16).padStart(64, "0").slice(-64);
  const words: string[] = [];
  for (let i = 0; i < 8; i++) {
    words.push(hex256.slice(i * 8, (i + 1) * 8));
  }
  return words;
}
