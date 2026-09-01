import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import "./index.css";
import App from "./App.jsx";

// Register Service Worker for offline support & performance
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Unregister any stale SWs from a previous origin/port before re-registering
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => {
        if (reg.scope !== `${window.location.origin}/`) {
          reg.unregister();
        }
      });
    });

    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
        // Check for updates every hour
        setInterval(() => registration.update(), 60 * 60 * 1000);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
    </ClerkProvider>
  </StrictMode>,
);
