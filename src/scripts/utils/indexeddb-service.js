/**
 * IndexedDB Service for Stories Management
 * Handles CRUD operations for stories in IndexedDB
 */

const DB_NAME = 'StoryAppDB';
const DB_VERSION = 2; // Increment version to trigger cleanup
const STORE_NAME = 'stories';
const SYNC_STORE_NAME = 'syncQueue';

class IndexedDBService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        // Create stories store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const storyStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
          });
          storyStore.createIndex('name', 'name', { unique: false });
          storyStore.createIndex('createdAt', 'createdAt', { unique: false });
          storyStore.createIndex('description', 'description', {
            unique: false,
          });
        }
        
        // If upgrading from version 1, cleanup duplicates will be handled by cleanupDuplicates()

        // Create sync queue store for offline data
        if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
          const syncStore = db.createObjectStore(SYNC_STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          syncStore.createIndex('action', 'action', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure DB is initialized
   */
  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  /**
   * CREATE: Save a story to IndexedDB (prevents duplicates)
   */
  async saveStory(story) {
    await this.ensureDB();

    // Validate story has an ID
    if (!story || !story.id) {
      return Promise.reject(new Error('Story must have an ID'));
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // First check if story already exists
      const checkRequest = store.get(story.id);
      
      checkRequest.onsuccess = () => {
        const existingStory = checkRequest.result;
        
        if (existingStory) {
          // Story already exists, just update it
          console.log(`Story ${story.id} already exists, updating...`);
        } else {
          console.log(`Saving new story ${story.id} to IndexedDB`);
        }
        
        // Use put() which will replace if exists or add if new (based on keyPath: 'id')
        const putRequest = store.put(story);
        
        putRequest.onsuccess = () => {
          resolve(story);
        };
        
        putRequest.onerror = () => {
          reject(new Error('Failed to save story to IndexedDB'));
        };
      };
      
      checkRequest.onerror = () => {
        // If check fails, still try to save
        const putRequest = store.put(story);
        
        putRequest.onsuccess = () => {
          resolve(story);
        };
        
        putRequest.onerror = () => {
          reject(new Error('Failed to save story to IndexedDB'));
        };
      };
    });
  }

  /**
   * READ: Get all stories from IndexedDB (with deduplication)
   */
  async getAllStories() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const stories = request.result || [];
        
        // Remove duplicates based on ID
        const uniqueStories = [];
        const seenIds = new Set();
        
        for (const story of stories) {
          if (story && story.id && !seenIds.has(story.id)) {
            seenIds.add(story.id);
            uniqueStories.push(story);
          }
        }
        
        console.log(`Retrieved ${stories.length} stories, ${uniqueStories.length} unique after deduplication`);
        resolve(uniqueStories);
      };

      request.onerror = () => {
        reject(new Error('Failed to get stories from IndexedDB'));
      };
    });
  }

  /**
   * READ: Get a single story by ID
   */
  async getStoryById(id) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get story from IndexedDB'));
      };
    });
  }

  /**
   * DELETE: Remove a story from IndexedDB
   */
  async deleteStory(id) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error('Failed to delete story from IndexedDB'));
      };
    });
  }

  /**
   * Check if story exists in IndexedDB
   */
  async isStorySaved(id) {
    const story = await this.getStoryById(id);
    return !!story;
  }

  /**
   * SYNC: Add story to sync queue (for offline creation)
   */
  async addToSyncQueue(action, data) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SYNC_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const syncItem = {
        action, // 'create', 'update', 'delete'
        data,
        timestamp: Date.now(),
        synced: false,
      };
      const request = store.add(syncItem);

      request.onsuccess = () => {
        resolve(syncItem);
      };

      request.onerror = () => {
        reject(new Error('Failed to add to sync queue'));
      };
    });
  }

  /**
   * SYNC: Get all pending sync items
   */
  async getSyncQueue() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SYNC_STORE_NAME], 'readonly');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        // Filter only unsynced items
        const pending = items.filter((item) => !item.synced);
        resolve(pending);
      };

      request.onerror = () => {
        reject(new Error('Failed to get sync queue'));
      };
    });
  }

  /**
   * SYNC: Mark sync item as synced
   */
  async markSynced(id) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SYNC_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.synced = true;
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve(true);
          updateRequest.onerror = () => reject(new Error('Failed to mark as synced'));
        } else {
          resolve(false);
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get sync item'));
      };
    });
  }

  /**
   * SYNC: Remove synced items from queue
   */
  async clearSyncedItems() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SYNC_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.synced) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve(true);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to clear synced items'));
      };
    });
  }

  /**
   * Filter stories by search term (works with array)
   */
  searchStories(stories, searchTerm) {
    if (!searchTerm) return stories;

    const term = searchTerm.toLowerCase();
    return stories.filter(
      (story) =>
        story.name?.toLowerCase().includes(term) ||
        story.description?.toLowerCase().includes(term)
    );
  }

  /**
   * Sort stories (works with array)
   */
  sortStories(stories, sortBy = 'createdAt', order = 'desc') {
    const sorted = [...stories];

    sorted.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle date sorting
      if (sortBy === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // Handle string sorting
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (order === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return sorted;
  }

  /**
   * Clean up duplicate stories from IndexedDB
   * Since IndexedDB uses keyPath: 'id', duplicates shouldn't exist,
   * but this function handles edge cases and ensures data integrity
   */
  async cleanupDuplicates() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const stories = getAllRequest.result || [];
        
        // Group stories by ID to find duplicates
        const storiesById = new Map();
        
        for (const story of stories) {
          if (story && story.id) {
            if (!storiesById.has(story.id)) {
              storiesById.set(story.id, []);
            }
            storiesById.get(story.id).push(story);
          }
        }

        // Find IDs with multiple entries (shouldn't happen with keyPath, but handle it)
        const duplicates = [];
        for (const [id, storyList] of storiesById.entries()) {
          if (storyList.length > 1) {
            duplicates.push({ id, count: storyList.length });
            // Keep the first one, mark others for deletion
            // Since IndexedDB uses keyPath, we'll just re-save the first one
            const firstStory = storyList[0];
            // Re-save to ensure only one exists
            store.put(firstStory);
          }
        }

        if (duplicates.length === 0) {
          console.log('No duplicates found, IndexedDB is clean');
          resolve({ removed: 0, kept: storiesById.size });
          return;
        }

        console.log(`Found ${duplicates.length} duplicate story IDs:`, duplicates);
        console.log(`Keeping first occurrence of each, IndexedDB will auto-deduplicate`);
        
        resolve({ removed: duplicates.reduce((sum, d) => sum + d.count - 1, 0), kept: storiesById.size });
      };

      getAllRequest.onerror = () => {
        reject(new Error('Failed to get stories for cleanup'));
      };
    });
  }

  /**
   * Filter stories by date range or other criteria (works with array)
   */
  filterStories(stories, filters = {}) {
    let filtered = [...stories];

    // Filter by date range
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      filtered = filtered.filter((story) => {
        const storyDate = new Date(story.createdAt).getTime();
        return storyDate >= start;
      });
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      filtered = filtered.filter((story) => {
        const storyDate = new Date(story.createdAt).getTime();
        return storyDate <= end;
      });
    }

    // Filter by name (if needed)
    if (filters.name) {
      const nameTerm = filters.name.toLowerCase();
      filtered = filtered.filter((story) =>
        story.name?.toLowerCase().includes(nameTerm)
      );
    }

    return filtered;
  }
}

// Export singleton instance
const indexedDBService = new IndexedDBService();

export default indexedDBService;

