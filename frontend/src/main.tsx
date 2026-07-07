import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

try {
  createRoot(document.getElementById("root")!).render(
    <App />
  );
} catch (error) {
  console.error("Failed to render app:", error);
  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Error Loading App</h1><p>Please check the browser console for details.</p></div>';
}
