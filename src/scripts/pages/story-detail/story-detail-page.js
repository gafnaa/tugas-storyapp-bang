import ApiService from "../../data/api";
import { showFormattedDate } from "../../utils";
import indexedDBService from "../../utils/indexeddb-service";

export default class StoryDetailPage {
  async render() {
    return `
      <section class="container" id="story-detail-content" style="view-transition-name: story-detail-content;">
        <div style="margin-bottom: 1rem;">
          <a href="#/" style="display: inline-flex; align-items: center; gap: 0.5rem; color: #4F46E5; text-decoration: none; font-weight: 600; margin-bottom: 1rem;">
            ← Kembali ke Beranda
          </a>
        </div>
        
        <div id="story-detail-container">
          <p>Loading story details...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Get story ID from URL
    const url = window.location.hash;
    const storyIdMatch = url.match(/\/story\/([^\/]+)/);
    
    if (!storyIdMatch) {
      this.showError("Story ID tidak ditemukan");
      return;
    }

    const storyId = storyIdMatch[1];
    
    // Try to get from IndexedDB first (for offline support)
    let story = null;
    try {
      await indexedDBService.ensureDB();
      story = await indexedDBService.getStoryById(storyId);
    } catch (error) {
      console.log("Story not found in IndexedDB, fetching from API");
    }

    // If not in IndexedDB, fetch from API
    if (!story) {
      try {
        story = await ApiService.getStoryDetail(storyId);
        // Save to IndexedDB for offline access
        try {
          await indexedDBService.saveStory(story);
        } catch (saveError) {
          console.error("Failed to save story to IndexedDB:", saveError);
        }
      } catch (error) {
        console.error("Error fetching story:", error);
        this.showError(error.message || "Gagal memuat detail cerita");
        return;
      }
    }

    this.showStoryDetail(story);
  }

  showStoryDetail(story) {
    const container = document.querySelector("#story-detail-container");
    if (!container) return;

    container.innerHTML = `
      <div class="story-detail-card" style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="position: relative;">
          <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" 
            style="width: 100%; height: 400px; object-fit: cover; display: block;">
          <button id="save-story-detail-btn" class="save-story-btn" 
            style="position: absolute; top: 15px; right: 15px; padding: 10px 16px; background: #4F46E5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2); font-family: 'Inter', sans-serif;">
            🤍 Simpan ke Tersimpan
          </button>
        </div>
        
        <div style="padding: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <h1 style="margin: 0; font-size: 1.75rem; color: #1f2937;">${story.name}</h1>
            <small style="color: #6b7280; font-size: 0.875rem;">
              ${showFormattedDate(story.createdAt)}
            </small>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <p style="font-size: 1rem; line-height: 1.6; color: #374151; margin: 0;">
              ${story.description}
            </p>
          </div>
          
          ${story.lat && story.lon ? `
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 0.5rem 0; color: #6b7280; font-size: 0.875rem;">Lokasi:</p>
              <p style="margin: 0; color: #374151; font-weight: 500;">
                Latitude: ${story.lat}<br>
                Longitude: ${story.lon}
              </p>
              <a href="#/map?story=${story.id}" id="map-link" style="display: inline-block; margin-top: 0.75rem; color: #4F46E5; text-decoration: none; font-weight: 600;">
                Lihat di Peta →
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Setup save button (async)
    this.setupSaveButton(story).catch(err => {
      console.error("Error setting up save button:", err);
    });
    
    // Setup map link handler
    this.setupMapLink();
  }
  
  setupMapLink() {
    const mapLink = document.querySelector('#map-link');
    if (mapLink) {
      mapLink.addEventListener('click', (e) => {
        // Let the browser handle navigation naturally
        // Don't prevent default - let hash routing work
        console.log('Navigating to map:', mapLink.getAttribute('href'));
      });
    }
  }

  async setupSaveButton(story) {
    const saveBtn = document.querySelector("#save-story-detail-btn");
    if (!saveBtn) return;

    try {
      const isSaved = await indexedDBService.isStorySaved(story.id);
      this.updateSaveButton(saveBtn, isSaved);
    } catch (error) {
      console.error("Error checking if story is saved:", error);
    }

    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        const isSaved = await indexedDBService.isStorySaved(story.id);

        if (isSaved) {
          await indexedDBService.deleteStory(story.id);
          this.updateSaveButton(saveBtn, false);
          alert("Cerita dihapus dari tersimpan");
        } else {
          await indexedDBService.saveStory(story);
          this.updateSaveButton(saveBtn, true);
          alert("Cerita disimpan ke tersimpan");
        }
      } catch (error) {
        console.error("Error toggling save story:", error);
        alert("Gagal menyimpan/menghapus cerita: " + error.message);
      }
    });
  }

  updateSaveButton(button, isSaved) {
    if (isSaved) {
      button.innerHTML = "❤️ Hapus dari Tersimpan";
      button.style.background = "#ef4444";
    } else {
      button.innerHTML = "🤍 Simpan ke Tersimpan";
      button.style.background = "#4F46E5";
    }
  }

  showError(message) {
    const container = document.querySelector("#story-detail-container");
    if (!container) return;

    container.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <p style="color: #ef4444; font-size: 1.125rem; margin-bottom: 1rem;">${message}</p>
        <a href="#/" style="color: #4F46E5; text-decoration: none; font-weight: 600;">
          Kembali ke Beranda
        </a>
      </div>
    `;
  }
}

