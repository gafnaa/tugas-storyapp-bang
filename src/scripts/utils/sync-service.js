

import ApiService from "../data/api";
import indexedDBService from "./indexeddb-service";

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.setupEventListeners();
  }

  
  setupEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      console.log("Connection restored, syncing data...");
      this.syncPendingData();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("Connection lost, working offline...");
    });

    
    if (this.isOnline) {
      
      setTimeout(() => {
        this.syncPendingData();
      }, 2000);
    }
  }

  
  isDeviceOnline() {
    return navigator.onLine;
  }

  
  async queueStoryForSync(storyData) {
    try {
      await indexedDBService.addToSyncQueue("create", storyData);
      console.log("Story queued for sync:", storyData);
      return true;
    } catch (error) {
      console.error("Failed to queue story for sync:", error);
      throw error;
    }
  }

  
  async syncPendingData() {
    if (this.syncInProgress) {
      console.log("Sync already in progress");
      return;
    }

    if (!this.isDeviceOnline()) {
      console.log("Device is offline, cannot sync");
      return;
    }

    try {
      this.syncInProgress = true;
      const syncQueue = await indexedDBService.getSyncQueue();

      if (syncQueue.length === 0) {
        console.log("No pending data to sync");
        return;
      }

      console.log(`Syncing ${syncQueue.length} pending items...`);

      const results = {
        success: 0,
        failed: 0,
      };

      for (const item of syncQueue) {
        try {
          if (item.action === "create") {
            const storyData = item.data;
            
            
            let photoBlob;
            if (storyData.photo && typeof storyData.photo === "string") {
              
              const byteCharacters = atob(storyData.photo);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              photoBlob = new Blob([byteArray], { type: "image/jpeg" });
            } else {
              photoBlob = storyData.photo;
            }

            
            const apiData = {
              description: storyData.description,
              photo: photoBlob,
              lat: storyData.lat,
              lon: storyData.lon,
            };

            await ApiService.addNewStory(apiData);
            await indexedDBService.markSynced(item.id);
            results.success++;
            console.log("Successfully synced story:", item.id);
          }
          
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          results.failed++;
          
        }
      }

      console.log(
        `Sync completed: ${results.success} succeeded, ${results.failed} failed`
      );

      
      await indexedDBService.clearSyncedItems();

      
      if (results.success > 0) {
        this.showSyncNotification(
          `Berhasil menyinkronkan ${results.success} cerita`
        );
      }

      if (results.failed > 0) {
        this.showSyncNotification(
          `Gagal menyinkronkan ${results.failed} cerita`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error during sync:", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  
  showSyncNotification(message, type = "success") {
    
    const notification = document.createElement("div");
    const bgColor =
      type === "success"
        ? "#4F46E5"
        : type === "error"
        ? "#ef4444"
        : "#6b7280";
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${bgColor};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    
    setTimeout(() => {
      notification.style.animation = "slideIn 0.3s ease reverse";
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }, 3000);
  }

  
  async manualSync() {
    if (!this.isDeviceOnline()) {
      this.showSyncNotification("Tidak ada koneksi internet", "error");
      return false;
    }

    this.showSyncNotification("Menyinkronkan data...", "info");
    await this.syncPendingData();
    return true;
  }
}


const syncService = new SyncService();

export default syncService;

