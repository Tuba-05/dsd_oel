/**
 * @file presets.ts
 * @description Pre-loaded 256-bit cryptographic testbench vectors extracted from `tb_MM.v`.
 *
 * Purpose:
 * - Provides ready-to-use hexadecimal inputs (A, B, M) and expected outputs for quick viva demos.
 * - Covers small integer verification, Montgomery squaring (A = B = M - 1), and full 256-bit ECC/RSA vectors.
 */

import { TestPreset } from "../types/simulator";

export const TEST_PRESETS: TestPreset[] = [
  {
    name: "Small Prime Test (A=2, B=3)",
    desc: "A=2, B=3, M=small odd prime. Perfect for quick step-by-step viva demo.",
    a: "2",
    b: "3",
    m: "172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd87",
    exp: "6",
  },
  {
    name: "Identity & Square (A=B)",
    desc: "A=B, tests Montgomery domain squaring operation.",
    a: "172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd86",
    b: "172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd86",
    m: "172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd87",
    exp: "1",
  },
  {
    name: "256-bit Cryptographic Vector",
    desc: "Full-width 256-bit operands simulating ECC/RSA key exchange operations.",
    a: "1102ef5725fbab1ba70b967adf354788d4dd79d3b5834f4cecb736d877f1caf0",
    b: "141e12f0597538cbc54be01c0ef8e010faaced226972f683de11ee00366dadc0",
    m: "17493833c0a9c8beb070e38434d57084ddfa7fa4ffe9ec11c63d5f77bb3a6a07",
    exp: "a9bce65f4f9850d4bb090301c21ff4a33b308c014501becedc0a6e05f740bd5",
  },
];
