# DSD Open-Ended Lab (`dsd_oel`) — 256-Bit Montgomery Modular Multiplier

Interactive RTL Hardware Visualizer & Simulator for the **256-bit Montgomery Modular Multiplier** (`modmul_top.v` & `montprod.v`).

🌐 **Live Demo:** [https://dsd-oel.vercel.app/](https://dsd-oel.vercel.app/)

---

## Repository Contents

- **[`dashboard/`](./dashboard)** — Modular React + Vite + TypeScript + Tailwind CSS hardware simulator dashboard.
  - **[`dashboard/README.md`](./dashboard/README.md)** — Setup & architecture documentation.
  - **[`dashboard/VIVA_GUIDE.md`](./dashboard/VIVA_GUIDE.md)** — Complete Viva & Presentation Q&A Cheat-Sheet.
- **[`Montgomery_Mul_DSD_OEL/`](./Montgomery_Mul_DSD_OEL)** — Vivado Verilog RTL design & testbench project files.
- **[`montgomery_modular_multiplier_visualizer.tsx`](./montgomery_modular_multiplier_visualizer.tsx)** — Original standalone TSX component reference.

---

## Quick Start (Run Locally)

```bash
cd dashboard
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser to view the simulator locally.
