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
  // JANGAN panggil e.preventDefault();
  // Dengan menghapus/mengomentari e.preventDefault(),
  // browser akan otomatis menampilkan ikon install native (seperti di screenshot mentor Anda)
  // e.preventDefault();

  // Kita masih bisa menyimpan event-nya jika diperlukan
  deferredPrompt = e;
  console.log("PWA install prompt available");

  // SEMUA KODE UNTUK MEMBUAT TOMBOL CUSTOM DIHAPUS DARI SINI
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
    navigator.serviceWorker.controller.addEventListener(
      "message",
      handleServiceWorkerMessage
    );
  }

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.addEventListener(
        "message",
        handleServiceWorkerMessage
      );
    }
  });

  navigator.serviceWorker.addEventListener(
    "message",
    handleServiceWorkerMessage
  );
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
