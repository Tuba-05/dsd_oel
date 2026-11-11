# Montgomery Modular Multiplier — 256-Bit RTL Hardware Simulator Dashboard

An interactive React + Vite + TypeScript + Tailwind CSS dashboard for visualizing and simulating the **256-bit Montgomery Modular Multiplier** (`modmul_top` wrapper & `montprod` core) for Digital System Design (DSD) Open-Ended Lab.

---

## Key Features

- **5-Stage Visual Progress Tracker**: Tracks execution across `1. Check Inputs` → `2. Build R² Key` → `3. Select Round` → `4. Core Add & Shift` → `5. Save Result`.
- **Plain-English Live Step Explanations**: Explains every clock transition in simple, clear English alongside the low-level RTL hardware signal trace.
- **Interactive Animations**:
  - Animated data-flow connectors between hardware modules.
  - Dynamic active-block highlighting (`ACTIVE` / `COMPUTING NOW` badges) and inactive block dimming.
  - Glowing register-write flash animations (`NEW KEY SAVED!` / `UPDATED!` / `COMPLETE!`) in the right-hand register panel.
- **Adjustable Pacing & Smart Milestone Delays**:
  - One-click speed presets (`Fast`, `Normal 1.8s`, `Slow 2.8s`) and a continuous `0.4s – 3.5s` delay slider.
  - Automatic `1.6x` milestone pause whenever a new 256-bit register value is latched so viewers can inspect the update.

---

## Project Structure (Modularized)

The original monolithic file (`../montgomery_modular_multiplier_visualizer.tsx`) is preserved untouched in the parent folder, and its code is cleanly refactored into modular components, hooks, utilities, and types inside `dashboard/`:

```text
dashboard/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── src/
    ├── main.tsx                        # React DOM entry point
    ├── App.tsx                         # Main application integrating all modules
    ├── index.css                       # Tailwind CSS directives & custom keyframe animations
    ├── types/
    │   └── simulator.ts                # TypeScript types for FSM states, presets, and register highlights
    ├── constants/
    │   └── presets.ts                  # Pre-loaded cryptographic testbench vectors (from tb_MM.v)
    ├── utils/
    │   └── math.ts                     # 256-bit BigInt validation, word splitting, and hex formatting
    ├── hooks/
    │   └── useMontgomerySimulator.ts   # Custom hook managing Top FSM, Core micro-FSM, explanations & delays
    └── components/
        ├── Header.tsx                  # Header bar with view mode switcher (Top vs. Core)
        ├── ControlToolbar.tsx          # Auto-Run, Next Step, Reset, Delay presets & status flags
        ├── BusActivityTicker.tsx       # 5-Stage Progress Stepper & Plain-English live explanation banner
        ├── PresetSelector.tsx          # Testbench vector selector and 256-bit A, B, M hex inputs
        ├── TopArchitectureView.tsx     # View 1: Wrapper RTL block diagram (modmul_top.v)
        ├── CoreDatapathView.tsx        # View 2: Core micro-architecture datapath (montprod.v)
        └── LiveRegistersPanel.tsx      # 256-bit hardware register inspector with update flash animations
```

---

## Getting Started

### 1. Navigate to the dashboard directory
```bash
cd dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```
Then open `http://localhost:5173` in your browser.

### 4. Build for production
```bash
npm run build
```
