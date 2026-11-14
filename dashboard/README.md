# Montgomery Modular Multiplier — Animated Hardware Timeline Visualizer

An interactive, responsive React + Vite + TypeScript + Tailwind CSS presentation visualizer for the **Montgomery Modular Multiplier** (`modmul_top.v` & `montprod.v`), walking step-by-step through an 8-bit toy model (`A = 45, B = 61, M = 63` or custom inputs) before scaling to the 256-bit cryptographic hardware metrics.

🌐 **Live Demo:** [https://dsd-oel.vercel.app/](https://dsd-oel.vercel.app/)

---

## Key Features

- **Custom `(A, B, M)` Inputs & Quick Presets**: Click **`Inputs: A=45, B=61, M=63`** in the footer to enter any valid operands (`M` odd and `1 ≤ M ≤ 63`, `0 ≤ A, B < M`) or pick a preset, and the timeline + diagram recompute dynamically.
- **Responsive Across All Devices**: Adapts cleanly from mobile phones and tablets to laptops and desktop monitors.
- **Interactive Timeline & Spacebar Control**: Play, Pause, or Replay the 17-beat animation via the button or **Spacebar**, and dismiss the final 256-bit summary overlay anytime using its **`×`** close button.

---

## Project Structure (Modularized)

The standalone [`../montgomery_modular_multiplier_visualizer.tsx`](../montgomery_modular_multiplier_visualizer.tsx) is preserved untouched in the parent folder, and its code is cleanly modularized inside `dashboard/`:

```text
dashboard/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── VIVA_GUIDE.md                       # Separate Viva & Presentation Q&A Cheat-Sheet
└── src/
    ├── main.tsx                        # React DOM entry point
    ├── App.tsx                         # Main responsive layout composing all modules
    ├── index.css                       # Tailwind CSS directives & fadeIn/scale animations
    ├── types/
    │   └── timeline.ts                 # TypeScript interfaces for OperandConfig, TimelineBeat & RoundSummary
    ├── constants/
    │   └── timelineData.ts             # 14-state FSM strip labels (STATE_STRIP)
    ├── utils/
    │   └── generateTimeline.ts         # Dynamic 8-round Montgomery math, validation & 17-beat generator
    ├── hooks/
    │   └── useTimelinePlayer.ts        # Custom inputs, playback timer, Spacebar & overlay state hook
    └── components/
        ├── TopBar.tsx                  # Responsive round counter, single-sentence caption & tick counter
        ├── MemoryShelf.tsx             # External memory shelf (A words w0/w1, B bit dots, M clock ring)
        ├── ChipView.tsx                # Central montprod chip (Bucket S, carry, dropped bit, +M/+A/÷2)
        ├── OutputPanel.tsx             # Ready light, b & q dots, and Result Tray
        ├── EpilogueOverlay.tsx         # Closable real 256-bit hardware scale & 4-pass pipeline overlay
        └── StateFooter.tsx             # 14 FSM state pills, Play/Pause/Replay & Custom Inputs modal
```

---

## Getting Started

```bash
cd dashboard
npm install
npm run dev
```

Open `http://localhost:5173` in your browser, and press **Play Animation** or **Spacebar** to run the presentation.

### Build for Production
```bash
npm run build
```
