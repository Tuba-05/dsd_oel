# DSD Open-Ended Lab (`dsd_oel`) — 256-Bit Montgomery Modular Multiplier

Interactive Hardware Visualizer & Verilog RTL Design for the **256-bit Montgomery Modular Multiplier** (`modmul_top.v` & `montprod.v`).

🌐 **Live Demo:** [https://dsd-oel.vercel.app/](https://dsd-oel.vercel.app/)

---

## Project Overview

This project implements and visually demonstrates a **256-bit Montgomery Modular Multiplier** for Digital System Design (DSD) Open-Ended Lab.

- **The Problem:** Computing $(A \times B) \bmod M$ directly in hardware requires a 256-bit division circuit, which is slow and consumes a large amount of FPGA area.
- **The Solution (Montgomery Algorithm):** Instead of dividing by $M$, the hardware converts numbers into the **Montgomery Domain**, where modular reduction only needs **32-bit additions** (`adder32`) and **1-bit right shifts** (`shr32`, exact division by 2).
- **Hardware Architecture:**
  1. **Core Engine (`montprod.v`):** Processes 256-bit operands word-by-word (8 words × 32 bits) using a dual-port accumulator RAM (`blockmem1r1w.v`), two 32-bit adders (`+M` to make the sum even, `+A` when bit $b_i = 1$), and a 32-bit right-shifter (`÷ 2`).
  2. **Top Wrapper (`modmul_top.v`):** Validates inputs ($M$ odd, $M < 2^{254}$, $A, B < M$), computes $R^2 \bmod M$ in 512 shift-and-subtract cycles, and runs `montprod` across 4 sequential passes to produce the final normal-domain result $(A \times B) \bmod M$.
- **Interactive Visualizer (`dashboard/`):** Includes an animated, step-by-step web UI with custom `(A, B, M)` inputs that makes the algorithm easy to follow visually.

---

## Repository Contents

- **[`dashboard/`](./dashboard)** — Contains the interactive web UI that visually demonstrates how the Montgomery algorithm works step-by-step (with custom `A, B, M` inputs and animated hardware blocks).
- **[`Montgomery_Mul_DSD_OEL/`](./Montgomery_Mul_DSD_OEL)** — Vivado Verilog RTL source files and testbench (`modmul_top.v`, `montprod.v`, `tb_MM.v`).

---

## Quick Start (Run Locally)

```bash
cd dashboard
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser to view the visual simulation locally.
