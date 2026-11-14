# DSD Open-Ended Lab (`dsd_oel`) — 256-Bit Montgomery Modular Multiplier

Interactive Hardware Visualizer & Verilog RTL Design for the **256-bit Montgomery Modular Multiplier** (`modmul_top.v` & `montprod.v`).

🌐 **Live Demo:** [https://dsd-oel.vercel.app/](https://dsd-oel.vercel.app/)

---

## Repository Contents

- **[`dashboard/`](./dashboard)** — Contains the interactive web UI that visually demonstrates how the Montgomery algorithm works step-by-step (with custom `A, B, M` inputs, animated hardware blocks, and a viva guide in [`dashboard/VIVA_GUIDE.md`](./dashboard/VIVA_GUIDE.md)).
- **[`Montgomery_Mul_DSD_OEL/`](./Montgomery_Mul_DSD_OEL)** — Vivado Verilog RTL source files and testbench (`modmul_top.v`, `montprod.v`, `tb_MM.v`).

---

## Quick Start (Run Locally)

```bash
cd dashboard
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser to view the visual simulation locally.
