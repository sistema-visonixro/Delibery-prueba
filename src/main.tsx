import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Service Worker registration and update flow for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check for updates periodically
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New update available
                // Ask user to update
                const accept = confirm(
                  "Hay una nueva versión disponible. ¿Deseas actualizar ahora?",
                );
                if (accept) {
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                }
              }
            }
          });
        });

        // When the new service worker activates, reload to load new content
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          window.location.reload();
          refreshing = true;
        });
      })
      .catch((err) => {
        console.warn("SW registration failed:", err);
      });
  });
}
