/**
 * @file main.tsx
 * @description Application entry point for the Montgomery Modular Multiplier RTL Visualizer.
 * Mounts the root React component (<App />) into the DOM (#root) with React StrictMode enabled
 * and loads global Tailwind CSS styles.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
