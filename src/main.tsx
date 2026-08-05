import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { syncEngine } from './services/sync-engine';

// Initialize sync engine on app startup
if (typeof window !== 'undefined') {
  syncEngine.initialize().catch(console.error);
}

createRoot(document.getElementById("root")!).render(<App />);