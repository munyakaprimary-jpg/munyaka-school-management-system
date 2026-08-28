import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { initializeAppStorage } from "./services/StorageInitService";

// Run auto-sync version check and seed population on app startup
initializeAppStorage();

createRoot(document.getElementById("root")!).render(<App />);
