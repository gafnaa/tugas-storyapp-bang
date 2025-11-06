import "../styles/styles.css";

import App from "./pages/app";
import PushNotificationService from "./utils/push-notification";
import syncService from "./utils/sync-service";


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


let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  
  e.preventDefault();
  
  deferredPrompt = e;
  console.log("PWA install prompt available");
  
  
  
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
    
    
    deferredPrompt.prompt();
    
    
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    
    deferredPrompt = null;
    
    
    installButton.style.display = "none";
  });
  
  
  installButton.style.display = "block";
  document.body.appendChild(installButton);
  
  
  window.addEventListener("appinstalled", () => {
    console.log("PWA installed");
    deferredPrompt = null;
    installButton.style.display = "none";
  });
});


window.addEventListener("appinstalled", () => {
  console.log("PWA installed successfully");
  deferredPrompt = null;
});


if ("serviceWorker" in navigator) {
  
  const handleServiceWorkerMessage = (event) => {
    if (event.data && event.data.type === "SHOW_STORY_DETAIL") {
      const storyId = event.data.storyId;
      if (storyId) {
        
        if (window.location.hash !== "#/") {
          window.location.hash = "#/";
        }
        sessionStorage.setItem("highlightStoryId", storyId);
      }
    }
  };
  
  
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.addEventListener("message", handleServiceWorkerMessage);
  }
  
  
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.addEventListener("message", handleServiceWorkerMessage);
    }
  });
  
  
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
