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

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      throw new Error(`Gagal mendaftarkan service worker: ${error.message}`);
    }
  }

  static async subscribe() {
    try {
      // Check if push manager is supported
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker tidak didukung di browser ini");
      }

      if (!("PushManager" in window)) {
        throw new Error("Push Notification tidak didukung di browser ini");
      }

      // Request permission
      await this.requestPermission();

      // Register service worker
      const registration = await this.registerServiceWorker();

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Check if push manager is available
      if (!registration.pushManager) {
        throw new Error("Push Manager tidak tersedia");
      }

      // Get existing subscription
      let subscription = await registration.pushManager.getSubscription();

      // If no subscription, create new one
      if (!subscription) {
        const vapidPublicKey = CONFIG.VAPID_PUBLIC_KEY;
        
        if (!vapidPublicKey) {
          throw new Error("VAPID public key tidak ditemukan");
        }

        try {
          const convertedVapidKey = await this.urlBase64ToUint8Array(vapidPublicKey);

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });
        } catch (pushError) {
          console.error("Push subscription error:", pushError);
          
          // Provide more specific error messages
          if (pushError.name === "NotAllowedError") {
            throw new Error("Izin push notification ditolak. Silakan aktifkan di pengaturan browser.");
          } else if (pushError.name === "InvalidStateError") {
            throw new Error("State tidak valid untuk push subscription");
          } else if (pushError.message && pushError.message.includes("registration")) {
            throw new Error("Gagal mendaftar push service. Pastikan service worker aktif.");
          } else {
            throw new Error(`Gagal mendaftar push notification: ${pushError.message || pushError}`);
          }
        }
      }

      // Extract subscription data
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey("p256dh")),
          auth: this.arrayBufferToBase64(subscription.getKey("auth")),
        },
      };

      // Send subscription to server
      try {
        await ApiService.subscribePushNotification({
          endpoint: subscriptionData.endpoint,
          keys: subscriptionData.keys.p256dh,
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth,
        });
      } catch (apiError) {
        // If API fails, unsubscribe from push manager
        try {
          await subscription.unsubscribe();
        } catch (unsubError) {
          console.error("Error unsubscribing after API failure:", unsubError);
        }
        throw new Error(`Gagal mengirim subscription ke server: ${apiError.message}`);
      }

      // Store endpoint in localStorage
      localStorage.setItem(STORAGE_KEY, subscriptionData.endpoint);

      return subscription;
    } catch (error) {
      console.error("Error subscribing to push notification:", error);
      throw error;
    }
  }

  static async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        throw new Error("Tidak ada subscription yang aktif");
      }

      const endpoint = subscription.endpoint;

      // Unsubscribe from server
      await ApiService.unsubscribePushNotification(endpoint);

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove from localStorage
      localStorage.removeItem(STORAGE_KEY);

      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notification:", error);
      throw error;
    }
  }

  static async isSubscribed() {
    try {
      if (!("serviceWorker" in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      return false;
    }
  }

  static async getSubscription() {
    try {
      if (!("serviceWorker" in navigator)) {
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
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

