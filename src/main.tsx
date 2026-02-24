import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("[v0] main.tsx loaded, mounting app...");

const rootEl = document.getElementById("root");
console.log("[v0] root element:", rootEl);

if (rootEl) {
  createRoot(rootEl).render(<App />);
  console.log("[v0] App rendered successfully");
} else {
  console.error("[v0] Could not find root element!");
}
