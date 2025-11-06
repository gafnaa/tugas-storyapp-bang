

const DB_NAME = 'StoryAppDB';
const DB_VERSION = 2; 
const STORE_NAME = 'stories';
const SYNC_STORE_NAME = 'syncQueue';

class IndexedDBService {
  constructor() {
    this.db = null;
  }

  
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

  
  async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  
  async saveStory(story) {
    await this.ensureDB();

    
    if (!story || !story.id) {
      return Promise.reject(new Error('Story must have an ID'));
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      
      const checkRequest = store.get(story.id);
      
      checkRequest.onsuccess = () => {
        const existingStory = checkRequest.result;
        
        if (existingStory) {
          
          console.log(`Story ${story.id} already exists, updating...`);
        } else {
          console.log(`Saving new story ${story.id} to IndexedDB`);
        }
        
        
        const putRequest = store.put(story);
        
        putRequest.onsuccess = () => {
          resolve(story);
        };
        
        putRequest.onerror = () => {
          reject(new Error('Failed to save story to IndexedDB'));
        };
      };
      
      checkRequest.onerror = () => {
        
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

  
  async getAllStories() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const stories = request.result || [];
        
        
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

  
  async isStorySaved(id) {
    const story = await this.getStoryById(id);
    return !!story;
  }

  
  async addToSyncQueue(action, data) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SYNC_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const syncItem = {
        action, 
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

  
  async getSyncQueue() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([SYNC_STORE_NAME], 'readonly');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        
        const pending = items.filter((item) => !item.synced);
        resolve(pending);
      };

      request.onerror = () => {
        reject(new Error('Failed to get sync queue'));
      };
    });
  }

  
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

  
  searchStories(stories, searchTerm) {
    if (!searchTerm) return stories;

    const term = searchTerm.toLowerCase();
    return stories.filter(
      (story) =>
        story.name?.toLowerCase().includes(term) ||
        story.description?.toLowerCase().includes(term)
    );
  }

  
  sortStories(stories, sortBy = 'createdAt', order = 'desc') {
    const sorted = [...stories];

    sorted.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      
      if (sortBy === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      
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

  
  async cleanupDuplicates() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const stories = getAllRequest.result || [];
        
        
        const storiesById = new Map();
        
        for (const story of stories) {
          if (story && story.id) {
            if (!storiesById.has(story.id)) {
              storiesById.set(story.id, []);
            }
            storiesById.get(story.id).push(story);
          }
        }

        
        const duplicates = [];
        for (const [id, storyList] of storiesById.entries()) {
          if (storyList.length > 1) {
            duplicates.push({ id, count: storyList.length });
            
            
            const firstStory = storyList[0];
            
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

  
  filterStories(stories, filters = {}) {
    let filtered = [...stories];

    
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

    
    if (filters.name) {
      const nameTerm = filters.name.toLowerCase();
      filtered = filtered.filter((story) =>
        story.name?.toLowerCase().includes(nameTerm)
      );
    }

    return filtered;
  }
}


const indexedDBService = new IndexedDBService();

export default indexedDBService;

