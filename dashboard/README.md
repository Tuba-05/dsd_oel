# Montgomery Modular Multiplier — Animated Hardware Timeline Visualizer

An interactive React + Vite + TypeScript + Tailwind CSS presentation visualizer for the **Montgomery Modular Multiplier** (`modmul_top.v` & `montprod.v`), walking step-by-step through an 8-bit toy example (`A = 45, B = 61, M = 63`) before scaling to the 256-bit cryptographic hardware metrics.

🌐 **Live Demo:** [https://dsd-oel.vercel.app/](https://dsd-oel.vercel.app/)

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
    ├── App.tsx                         # Main presentation layout composing all modules
    ├── index.css                       # Tailwind CSS directives & fadeIn/scale animations
    ├── types/
    │   └── timeline.ts                 # TypeScript interfaces for TimelineBeat & RoundSummary
    ├── constants/
    │   └── timelineData.ts             # B_BITS, ROUNDS_DATA, STATE_STRIP, and 17 TIMELINE_BEATS
    ├── hooks/
    │   └── useTimelinePlayer.ts        # Playback timer, Spacebar shortcut & beat progression hook
    └── components/
        ├── TopBar.tsx                  # Round counter, single-sentence caption & tick counter
        ├── MemoryShelf.tsx             # External memory shelf (A=45, B=61 bit dots, M=63 clock ring)
        ├── ChipView.tsx                # Central montprod chip (Bucket S, carry, dropped bit, +M/+A/÷2)
        ├── OutputPanel.tsx             # Ready light, b & q dots, and Result Tray
        ├── EpilogueOverlay.tsx         # Real 256-bit hardware scale & 4-pass pipeline overlay
        └── StateFooter.tsx             # 14 FSM state pills & Play/Pause/Replay button
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
