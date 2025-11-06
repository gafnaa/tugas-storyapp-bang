import ApiService from "../../data/api";
import HomePagePresenter from "./home-page-presenter";
import { showFormattedDate } from "../../utils";
import PushNotificationService from "../../utils/push-notification";
import indexedDBService from "../../utils/indexeddb-service";

export default class HomePage {
  async render() {
    return `
      <section class="container" id="home-content" style="view-transition-name: home-content;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
          <h1 style="margin: 0; flex: 1;">Home Page (Semua Cerita)</h1>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0;">
            <button id="toggle-view-btn" class="toggle-view-btn" style="padding: 8px 16px; background: #4F46E5; color: white; border: none; border-radius: 4px; cursor: pointer; display: inline-block !important; visibility: visible !important; opacity: 1 !important; position: relative; z-index: 100; font-size: 14px; white-space: nowrap; min-width: 140px; font-family: 'Inter', sans-serif;">
              <span id="toggle-view-text">Lihat Tersimpan</span>
            </button>
            <div id="push-notification-toggle-container" style="display: inline-block;">
              <button id="push-notification-toggle" class="push-toggle-btn" style="display: none; font-family: 'Inter', sans-serif;">
                <span id="push-toggle-text">Aktifkan Notifikasi</span>
              </button>
            </div>
          </div>
        </div>
        
        <div id="filter-controls" style="margin-bottom: 1.5rem; padding: 1rem; background: #f5f5f5; border-radius: 8px; display: none;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 1rem; align-items: end; flex-wrap: wrap;">
            <div>
              <label for="search-input" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Cari:</label>
              <input type="text" id="search-input" placeholder="Cari cerita..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label for="sort-select" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Urutkan:</label>
              <select id="sort-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="createdAt-desc">Terbaru</option>
                <option value="createdAt-asc">Terlama</option>
                <option value="name-asc">Nama A-Z</option>
                <option value="name-desc">Nama Z-A</option>
              </select>
            </div>
            <div>
              <label for="filter-date" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Filter Tanggal:</label>
              <input type="date" id="filter-date" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <button id="clear-filters-btn" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">
                Reset Filter
              </button>
            </div>
          </div>
        </div>
        
        <div id="story-list-container-home">
          <p>Loading data...</p>
        </div>
        
        <div id="load-more-container" style="text-align: center; margin-top: 2rem;">
          <button id="load-more-btn" style="display: none; padding: 12px 24px; background: #4F46E5; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; font-family: 'Inter', sans-serif;">
            Muat Lebih Banyak
          </button>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Ensure DOM is ready
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', resolve, { once: true });
        }
      });
    }
    
    // Initialize IndexedDB first
    try {
      await indexedDBService.init();
      console.log('IndexedDB initialized successfully');
      
      // Clean up any existing duplicates on first load
      try {
        const cleanupResult = await indexedDBService.cleanupDuplicates();
        if (cleanupResult.removed > 0) {
          console.log(`Cleaned up ${cleanupResult.removed} duplicate stories`);
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      // Don't show alert, just log - IndexedDB might not be critical for basic functionality
    }

    const presenter = new HomePagePresenter({
      view: this,
      model: ApiService,
    });
    
    this.currentView = 'all'; // 'all' or 'saved'
    this.currentStories = [];
    this._indexedDBControlsSetup = false; // Reset setup flag
    this.presenter = presenter; // Store presenter reference
    
    await presenter.init();
    
    // Setup load more button
    this.setupLoadMoreButton();
    
    // Setup push notification toggle
    await this.setupPushNotificationToggle();
    
    // Setup IndexedDB controls (must be after presenter.init and DOM ready)
    // Wait a bit for stories to render first
    await new Promise(resolve => setTimeout(resolve, 150));
    await this.setupIndexedDBControls();
    
    // Check if we need to highlight a story from notification
    this.checkAndHighlightStory();
  }
  
  async setupIndexedDBControls() {
    // Check if already set up to avoid duplicate setup
    if (this._indexedDBControlsSetup) {
      console.log('IndexedDB controls already set up, skipping...');
      return;
    }
    
    // Wait for DOM to be fully ready
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
    
    // Additional small delay to ensure all elements are rendered
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Retry mechanism with multiple attempts
    let attempts = 0;
    const maxAttempts = 5;
    
    const trySetup = async () => {
      attempts++;
      
      // Toggle view button
      const toggleViewBtn = document.querySelector('#toggle-view-btn');
      const toggleViewText = document.querySelector('#toggle-view-text');
      const filterControls = document.querySelector('#filter-controls');
      
      console.log(`Setting up IndexedDB controls... (attempt ${attempts}/${maxAttempts})`, {
        toggleViewBtn: !!toggleViewBtn,
        toggleViewText: !!toggleViewText,
        filterControls: !!filterControls,
        readyState: document.readyState
      });
      
      if (!toggleViewBtn || !toggleViewText) {
        if (attempts < maxAttempts) {
          console.log(`Elements not found, retrying in ${attempts * 100}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 100));
          return trySetup();
        } else {
          console.error('Toggle view button/text not found after all attempts!');
          console.error('Available elements:', {
            toggleViewBtn: document.querySelector('#toggle-view-btn'),
            toggleViewText: document.querySelector('#toggle-view-text'),
            homeContent: document.querySelector('#home-content'),
            homeContentHTML: document.querySelector('#home-content')?.innerHTML.substring(0, 200)
          });
          return;
        }
      }
      
      this.setupButtonHandlers(toggleViewBtn, toggleViewText, filterControls);
      this._indexedDBControlsSetup = true;
      console.log('IndexedDB controls setup complete');
    };
    
    await trySetup();
  }
  
  setupButtonHandlers(toggleViewBtn, toggleViewText, filterControls) {
    // Make sure button is visible with multiple methods
    toggleViewBtn.style.display = 'inline-block';
    toggleViewBtn.style.visibility = 'visible';
    toggleViewBtn.style.opacity = '1';
    toggleViewBtn.style.width = 'auto';
    toggleViewBtn.style.height = 'auto';
    toggleViewBtn.removeAttribute('hidden');
    
    // Remove any existing listeners
    const newBtn = toggleViewBtn.cloneNode(true);
    toggleViewBtn.parentNode.replaceChild(newBtn, toggleViewBtn);
    const btn = newBtn;
    
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Toggle view clicked, current view:', this.currentView);
      
      // Use view transition if available
      const performTransition = async () => {
        if (this.currentView === 'all') {
          this.currentView = 'saved';
          toggleViewText.textContent = 'Lihat Semua';
          if (filterControls) {
            filterControls.style.display = 'block';
          }
          await this.showSavedStories();
        } else {
          this.currentView = 'all';
          toggleViewText.textContent = 'Lihat Tersimpan';
          if (filterControls) {
            filterControls.style.display = 'none';
          }
          // Reload all stories
          const presenter = new HomePagePresenter({
            view: this,
            model: ApiService,
          });
          this.presenter = presenter;
          await presenter.init();
          this.setupLoadMoreButton();
        }
      };
      
      if (document.startViewTransition) {
        const transition = document.startViewTransition(() => performTransition());
        try {
          await transition.finished;
        } catch (error) {
          console.error('View transition failed:', error);
          await performTransition();
        }
      } else {
        await performTransition();
      }
    });
    
    // Setup filter controls
    const searchInput = document.querySelector('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.applyFilters();
      });
    }
    
    // Sort select
    const sortSelect = document.querySelector('#sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.applyFilters();
      });
    }
    
    // Filter date
    const filterDate = document.querySelector('#filter-date');
    if (filterDate) {
      filterDate.addEventListener('change', () => {
        this.applyFilters();
      });
    }
    
    // Clear filters button
    const clearFiltersBtn = document.querySelector('#clear-filters-btn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'createdAt-desc';
        if (filterDate) filterDate.value = '';
        this.applyFilters();
      });
    }
  }
  
  async showSavedStories() {
    try {
      // Hide load more button when viewing saved stories
      this.updateLoadMoreButton(false);
      
      const savedStories = await indexedDBService.getAllStories();
      
      // Additional deduplication on client side (safety measure)
      const uniqueStories = [];
      const seenIds = new Set();
      
      for (const story of savedStories) {
        if (story && story.id && !seenIds.has(story.id)) {
          seenIds.add(story.id);
          uniqueStories.push(story);
        }
      }
      
      console.log(`showSavedStories: loaded ${savedStories.length} stories, ${uniqueStories.length} unique after deduplication`);
      
      // Clear container first to prevent double rendering
      const container = document.querySelector("#story-list-container-home");
      if (container) {
        container.innerHTML = "";
      }
      
      this.currentStories = uniqueStories;
      
      // Only call showItems once
      await this.showItems(uniqueStories);
      
      // Don't call applyFilters here - it will be called by showItems if needed
    } catch (error) {
      console.error('Error loading saved stories:', error);
      this.showError('Gagal memuat cerita tersimpan');
    }
  }
  
  async applyFilters() {
    if (this.currentView !== 'saved') return;
    
    try {
      // Start from the current unique stories, not from IndexedDB again
      let filtered = [...this.currentStories];
      
      // Deduplicate again before filtering
      const seenIds = new Set();
      filtered = filtered.filter(story => {
        if (story && story.id && !seenIds.has(story.id)) {
          seenIds.add(story.id);
          return true;
        }
        return false;
      });
      
      // Apply search
      const searchInput = document.querySelector('#search-input');
      if (searchInput && searchInput.value) {
        filtered = indexedDBService.searchStories(filtered, searchInput.value);
      }
      
      // Apply date filter
      const filterDate = document.querySelector('#filter-date');
      if (filterDate && filterDate.value) {
        filtered = indexedDBService.filterStories(filtered, {
          startDate: filterDate.value,
        });
      }
      
      // Apply sort
      const sortSelect = document.querySelector('#sort-select');
      if (sortSelect) {
        const [sortBy, order] = sortSelect.value.split('-');
        filtered = indexedDBService.sortStories(filtered, sortBy, order);
      }
      
      console.log(`applyFilters: showing ${filtered.length} filtered stories`);
      await this.showItems(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }
  
  async setupPushNotificationToggle() {
    const toggleButton = document.querySelector("#push-notification-toggle");
    const toggleText = document.querySelector("#push-toggle-text");
    
    if (!toggleButton) return;
    
    // Check if push notifications are supported
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toggleButton.style.display = "none";
      return;
    }
    
    toggleButton.style.display = "inline-block";
    
    // Update button state
    await this.updateToggleButtonState();
    
    // Add click handler
    toggleButton.addEventListener("click", async () => {
      try {
        const isSubscribed = await PushNotificationService.isSubscribed();
        
        if (isSubscribed) {
          // Unsubscribe
          await PushNotificationService.unsubscribe();
          await this.updateToggleButtonState();
          alert("Notifikasi push telah dinonaktifkan");
        } else {
          // Subscribe
          // Disable button during subscription
          const originalText = toggleText.textContent;
          toggleButton.disabled = true;
          toggleText.textContent = "Memproses...";
          
          try {
            await PushNotificationService.subscribe();
            await this.updateToggleButtonState();
            alert("Notifikasi push telah diaktifkan");
          } catch (subscribeError) {
            // Re-throw to be caught by outer catch
            throw subscribeError;
          } finally {
            toggleButton.disabled = false;
            // Update button state will restore text if needed
            await this.updateToggleButtonState();
          }
        }
      } catch (error) {
        console.error("Error toggling push notification:", error);
        
        // Provide user-friendly error messages
        let errorMessage = "Gagal mengaktifkan notifikasi";
        if (error.message) {
          if (error.message.includes("ditolak")) {
            errorMessage = "Izin notifikasi ditolak. Silakan aktifkan di pengaturan browser.";
          } else if (error.message.includes("tidak didukung")) {
            errorMessage = "Browser tidak mendukung push notification";
          } else if (error.message.includes("VAPID")) {
            errorMessage = "Konfigurasi push notification tidak valid";
          } else {
            errorMessage = error.message;
          }
        }
        
        alert(errorMessage);
        await this.updateToggleButtonState();
      }
    });
  }
  
  async updateToggleButtonState() {
    const toggleButton = document.querySelector("#push-notification-toggle");
    const toggleText = document.querySelector("#push-toggle-text");
    
    if (!toggleButton || !toggleText) return;
    
    try {
      const isSubscribed = await PushNotificationService.isSubscribed();
      
      if (isSubscribed) {
        toggleText.textContent = "Nonaktifkan Notifikasi";
        toggleButton.classList.add("active");
      } else {
        toggleText.textContent = "Aktifkan Notifikasi";
        toggleButton.classList.remove("active");
      }
    } catch (error) {
      console.error("Error checking subscription state:", error);
    }
  }
  
  checkAndHighlightStory() {
    const highlightStoryId = sessionStorage.getItem("highlightStoryId");
    if (highlightStoryId) {
      // Remove from sessionStorage
      sessionStorage.removeItem("highlightStoryId");
      
      // Wait a bit for stories to load, then highlight
      setTimeout(() => {
        const storyItems = document.querySelectorAll(".story-item");
        storyItems.forEach((item) => {
          const storyId = item.dataset.storyId;
          if (storyId === highlightStoryId) {
            item.classList.add("highlighted");
            item.scrollIntoView({ behavior: "smooth", block: "center" });
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
              item.classList.remove("highlighted");
            }, 3000);
          }
        });
      }, 500);
    }
  }

  async showItems(items) {
    const container = document.querySelector("#story-list-container-home");
    if (!container) {
      console.error('Container not found');
      return;
    }
    
    if (!items || items.length === 0) {
      container.innerHTML = "<p>Tidak ada cerita ditemukan.</p>";
      return;
    }

    // Deduplicate items before displaying (extra safety)
    const uniqueItems = [];
    const seenIds = new Set();
    for (const item of items) {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueItems.push(item);
      }
    }
    
    console.log(`showItems: received ${items.length} items, displaying ${uniqueItems.length} unique items`);

    container.innerHTML = "";
    this.currentStories = uniqueItems;

    // Ensure IndexedDB is initialized
    try {
      await indexedDBService.ensureDB();
    } catch (error) {
      console.error('IndexedDB not available:', error);
    }

    for (const story of uniqueItems) {
      const storyItem = document.createElement("div");
      storyItem.className = "story-item";
      storyItem.dataset.storyId = story.id;
      
      // Check if story is saved (with error handling)
      let isSaved = false;
      try {
        isSaved = await indexedDBService.isStorySaved(story.id);
      } catch (error) {
        console.error('Error checking if story is saved:', error);
        isSaved = false;
      }
      
      const saveButtonText = isSaved ? "Hapus dari Tersimpan" : "Simpan ke Tersimpan";
      const saveButtonClass = isSaved ? "saved" : "";
      const buttonIcon = isSaved ? '❤️' : '🤍';
      const buttonBg = isSaved ? '#ef4444' : '#4F46E5';
      
      storyItem.innerHTML = `
        <div style="position: relative;">
          <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;">
          <button class="save-story-btn ${saveButtonClass}" data-story-id="${story.id}" 
            style="position: absolute; top: 10px; right: 10px; padding: 8px 12px; background: ${buttonBg}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            ${buttonIcon} ${saveButtonText}
          </button>
        </div>
        <h2>${story.name}</h2>
        <p class="story-description">${story.description}</p>
        <small class="story-date">Dibuat: ${showFormattedDate(
          story.createdAt
        )}</small>
        <div style="margin-top: 0.75rem;">
          <a href="#/story/${story.id}" style="display: inline-block; padding: 8px 16px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; transition: background-color 0.2s;">
            Lihat Detail →
          </a>
        </div>
      `;
      container.appendChild(storyItem);
      
      // Add click handler for navigating to detail
      storyItem.style.cursor = 'pointer';
      storyItem.addEventListener('click', (e) => {
        // Don't navigate if clicking on save button or link
        if (e.target.closest('.save-story-btn') || e.target.closest('a')) {
          return;
        }
        window.location.hash = `#/story/${story.id}`;
      });
      
      // Add event listener for save/delete button
      const saveBtn = storyItem.querySelector('.save-story-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.preventDefault();
          await this.toggleSaveStory(story);
        });
      }
    }
    
    // Check if we need to highlight a story after rendering
    this.checkAndHighlightStory();
  }
  
  async appendItems(items) {
    const container = document.querySelector("#story-list-container-home");
    if (!container) {
      console.error('Container not found');
      return;
    }
    
    if (!items || items.length === 0) {
      return;
    }

    // Deduplicate items before displaying
    const existingIds = new Set(this.currentStories.map(s => s.id));
    const uniqueItems = items.filter(item => item && item.id && !existingIds.has(item.id));
    
    if (uniqueItems.length === 0) {
      return;
    }
    
    console.log(`appendItems: received ${items.length} items, appending ${uniqueItems.length} unique items`);

    // Ensure IndexedDB is initialized
    try {
      await indexedDBService.ensureDB();
    } catch (error) {
      console.error('IndexedDB not available:', error);
    }

    for (const story of uniqueItems) {
      const storyItem = document.createElement("div");
      storyItem.className = "story-item";
      storyItem.dataset.storyId = story.id;
      
      // Check if story is saved (with error handling)
      let isSaved = false;
      try {
        isSaved = await indexedDBService.isStorySaved(story.id);
      } catch (error) {
        console.error('Error checking if story is saved:', error);
        isSaved = false;
      }
      
      const saveButtonText = isSaved ? "Hapus dari Tersimpan" : "Simpan ke Tersimpan";
      const saveButtonClass = isSaved ? "saved" : "";
      const buttonIcon = isSaved ? '❤️' : '🤍';
      const buttonBg = isSaved ? '#ef4444' : '#4F46E5';
      
      storyItem.innerHTML = `
        <div style="position: relative;">
          <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;">
          <button class="save-story-btn ${saveButtonClass}" data-story-id="${story.id}" 
            style="position: absolute; top: 10px; right: 10px; padding: 8px 12px; background: ${buttonBg}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            ${buttonIcon} ${saveButtonText}
          </button>
        </div>
        <h2>${story.name}</h2>
        <p class="story-description">${story.description}</p>
        <small class="story-date">Dibuat: ${showFormattedDate(
          story.createdAt
        )}</small>
        <div style="margin-top: 0.75rem;">
          <a href="#/story/${story.id}" style="display: inline-block; padding: 8px 16px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; transition: background-color 0.2s;">
            Lihat Detail →
          </a>
        </div>
      `;
      container.appendChild(storyItem);
      
      // Add click handler for navigating to detail
      storyItem.style.cursor = 'pointer';
      storyItem.addEventListener('click', (e) => {
        // Don't navigate if clicking on save button or link
        if (e.target.closest('.save-story-btn') || e.target.closest('a')) {
          return;
        }
        window.location.hash = `#/story/${story.id}`;
      });
      
      // Add event listener for save/delete button
      const saveBtn = storyItem.querySelector('.save-story-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          e.preventDefault();
          await this.toggleSaveStory(story);
        });
      }
    }
    
    // Update current stories
    this.currentStories = [...this.currentStories, ...uniqueItems];
  }
  
  setupLoadMoreButton() {
    const loadMoreBtn = document.querySelector('#load-more-btn');
    if (!loadMoreBtn) return;
    
    loadMoreBtn.addEventListener('click', async () => {
      if (this.currentView === 'all' && this.presenter) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Memuat...';
        
        try {
          await this.presenter.loadMore();
        } finally {
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = 'Muat Lebih Banyak';
        }
      }
    });
  }
  
  updateLoadMoreButton(hasMore) {
    const loadMoreBtn = document.querySelector('#load-more-btn');
    if (!loadMoreBtn) return;
    
    if (this.currentView === 'all' && hasMore) {
      loadMoreBtn.style.display = 'inline-block';
    } else {
      loadMoreBtn.style.display = 'none';
    }
  }
  
  async toggleSaveStory(story) {
    // Prevent multiple simultaneous operations
    if (this._savingInProgress) {
      console.log('Save operation already in progress, skipping...');
      return;
    }
    
    this._savingInProgress = true;
    
    try {
      const isSaved = await indexedDBService.isStorySaved(story.id);
      
      if (isSaved) {
        // Delete from IndexedDB
        await indexedDBService.deleteStory(story.id);
        console.log(`Deleted story ${story.id} from IndexedDB`);
        alert('Cerita dihapus dari tersimpan');
      } else {
        // Save to IndexedDB (will update if exists, add if new)
        await indexedDBService.saveStory(story);
        console.log(`Saved story ${story.id} to IndexedDB`);
        alert('Cerita disimpan ke tersimpan');
      }
      
      // Refresh the view
      if (this.currentView === 'saved') {
        await this.showSavedStories();
      } else {
        // Update button state in current view
        const presenter = new HomePagePresenter({
          view: this,
          model: ApiService,
        });
        await presenter.init();
      }
    } catch (error) {
      console.error('Error toggling save story:', error);
      alert('Gagal menyimpan/menghapus cerita: ' + error.message);
    } finally {
      this._savingInProgress = false;
    }
  }

  showError(message) {
    const container = document.querySelector("#story-list-container-home");
    container.innerHTML = `<p style="color: red;">Error: ${message}<br>Silakan <a href="#/login">login</a> terlebih dahulu.</p>`;
  }
}
