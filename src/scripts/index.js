import "../styles/styles.css";

import App from "./pages/app";
import PushNotificationService from "./utils/push-notification";
import syncService from "./utils/sync-service";

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await PushNotificationService.registerServiceWorker();
      console.log("Service Worker registered successfully");
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  });
}

// Handle PWA install prompt
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  console.log("PWA install prompt available");
  
  // Optional: Show custom install button/UI
  // You can create a custom install button here if needed
  const installButton = document.createElement("button");
  installButton.textContent = "Install App";
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background-color: #4F46E5;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: none;
  `;
  
  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    // Clear the deferredPrompt
    deferredPrompt = null;
    
    // Hide the install button
    installButton.style.display = "none";
  });
  
  // Show the install button
  installButton.style.display = "block";
  document.body.appendChild(installButton);
  
  // Hide the button after installation
  window.addEventListener("appinstalled", () => {
    console.log("PWA installed");
    deferredPrompt = null;
    installButton.style.display = "none";
  });
});

// Track when app is installed
window.addEventListener("appinstalled", () => {
  console.log("PWA installed successfully");
  deferredPrompt = null;
});

// Handle messages from service worker (for notification clicks)
if ("serviceWorker" in navigator) {
  // Listen for messages from service worker
  const handleServiceWorkerMessage = (event) => {
    if (event.data && event.data.type === "SHOW_STORY_DETAIL") {
      const storyId = event.data.storyId;
      if (storyId) {
        // Navigate to home page and store story ID for highlighting
        if (window.location.hash !== "#/") {
          window.location.hash = "#/";
        }
        sessionStorage.setItem("highlightStoryId", storyId);
      }
    }
  };
  
  // Listen via controller if available (most common way)
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.addEventListener("message", handleServiceWorkerMessage);
  }
  
  // Also set up listener for when controller becomes available
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.addEventListener("message", handleServiceWorkerMessage);
    }
  });
  
  // Fallback: listen on serviceWorker container itself
  navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
}

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });
  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });
});
