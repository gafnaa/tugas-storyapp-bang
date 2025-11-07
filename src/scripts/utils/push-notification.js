import CONFIG from "../config";
import ApiService from "../data/api";

const STORAGE_KEY = "push_subscription_endpoint";

class PushNotificationService {
  static async urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  static async requestPermission() {
    if (!("Notification" in window)) {
      throw new Error("Browser tidak mendukung notifikasi");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Izin notifikasi ditolak");
    }

    return permission;
  }

  static async registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker tidak didukung");
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      throw new Error(`Gagal mendaftarkan service worker: ${error.message}`);
    }
  }

  static async subscribe() {
    try {
      await this.requestPermission();

      const simulatedEndpoint = "simulated-endpoint-" + Date.now();

      await ApiService.subscribePushNotification({
        endpoint: simulatedEndpoint,
        keys: "simulated-keys",
      });

      localStorage.setItem(STORAGE_KEY, simulatedEndpoint);

      return Promise.resolve({
        endpoint: simulatedEndpoint,
        getKey: () => {},
      });
    } catch (error) {
      console.error("Error subscribing to push notification:", error);
      throw error;
    }
  }

  static async unsubscribe() {
    try {
      const endpoint = localStorage.getItem(STORAGE_KEY);
      if (!endpoint) {
        throw new Error("Tidak ada subscription yang aktif");
      }

      await ApiService.unsubscribePushNotification(endpoint);
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notification:", error);
      throw error;
    }
  }

  static async isSubscribed() {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return false;
    }
  }

  static async getSubscription() {
    try {
      const endpoint = localStorage.getItem(STORAGE_KEY);
      if (endpoint) {
        return Promise.resolve({
          endpoint: endpoint,
          getKey: () => {},
        });
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export default PushNotificationService;
