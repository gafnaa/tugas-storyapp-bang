var ge=c=>{throw TypeError(c)};var le=(c,e,t)=>e.has(c)||ge("Cannot "+t);var s=(c,e,t)=>(le(c,e,"read from private field"),t?t.call(c):e.get(c)),p=(c,e,t)=>e.has(c)?ge("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(c):e.set(c,t),g=(c,e,t,o)=>(le(c,e,"write to private field"),o?o.call(c,t):e.set(c,t),t),d=(c,e,t)=>(le(c,e,"access private method"),t);var me=(c,e,t,o)=>({set _(r){g(c,e,r,t)},get _(){return s(c,e,o)}});(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&o(n)}).observe(document,{childList:!0,subtree:!0});function t(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(r){if(r.ep)return;r.ep=!0;const i=t(r);fetch(r.href,i)}})();const C={BASE_URL:"https://story-api.dicoding.dev/v1",VAPID_PUBLIC_KEY:"BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"};function Y(){return sessionStorage.getItem("token")}async function z(c){const e=await c.json();if(!c.ok||e.error)throw new Error(e.message||`HTTP error! status: ${c.status}`);return e}class x{static async login({email:e,password:t}){const o=await fetch(`${C.BASE_URL}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:e,password:t})});return z(o)}static async register({name:e,email:t,password:o}){const r=await fetch(`${C.BASE_URL}/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:e,email:t,password:o})});return z(r)}static async getAllStories(e=1,t=10){const o=Y();if(!o)throw new Error("No auth token found. Please login.");const r=await fetch(`${C.BASE_URL}/stories?page=${e}&size=${t}&location=0`,{method:"GET",headers:{Authorization:`Bearer ${o}`}});return(await z(r)).listStory}static async getAllStoriesWithLocation(){const e=Y();if(!e)throw new Error("No auth token found. Please login.");const t=await fetch(`${C.BASE_URL}/stories?location=1`,{method:"GET",headers:{Authorization:`Bearer ${e}`}});return(await z(t)).listStory}static async addNewStory({description:e,photo:t,lat:o,lon:r}){const i=Y();if(!i)throw new Error("No auth token found. Please login.");if(!navigator.onLine)throw new Error("OFFLINE_MODE");const n=new FormData;n.append("description",e),n.append("lat",o),n.append("lon",r),t instanceof Blob&&!(t instanceof File)?n.append("photo",t,"camera-capture.jpg"):n.append("photo",t);const a=await fetch(`${C.BASE_URL}/stories`,{method:"POST",headers:{Authorization:`Bearer ${i}`},body:n});return z(a)}static async getStoryDetail(e){const t=Y();if(!t)throw new Error("No auth token found. Please login.");const o=await fetch(`${C.BASE_URL}/stories/${e}`,{method:"GET",headers:{Authorization:`Bearer ${t}`}});return(await z(o)).story}static async subscribePushNotification({endpoint:e,keys:t,p256dh:o,auth:r}){const i=Y();if(!i)throw new Error("No auth token found. Please login.");const n=await fetch(`${C.BASE_URL}/notifications/subscribe`,{method:"POST",headers:{Authorization:`Bearer ${i}`,"Content-Type":"application/json"},body:JSON.stringify({endpoint:e,keys:t,p256dh:o,auth:r})});return z(n)}static async unsubscribePushNotification(e){const t=Y();if(!t)throw new Error("No auth token found. Please login.");const o=await fetch(`${C.BASE_URL}/notifications/subscribe`,{method:"DELETE",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({endpoint:e})});return z(o)}}var q,X,G,K,O;class de{constructor({view:e,model:t}){p(this,q);p(this,X);p(this,G,1);p(this,K,10);p(this,O,!0);g(this,q,e),g(this,X,t)}async init(){try{g(this,G,1);const e=await s(this,X).getAllStories(s(this,G),s(this,K));g(this,O,e.length===s(this,K)),s(this,q).showItems(e),s(this,q).updateLoadMoreButton(s(this,O))}catch(e){s(this,q).showError(e.message)}}async loadMore(){if(s(this,O))try{me(this,G)._++;const e=await s(this,X).getAllStories(s(this,G),s(this,K));g(this,O,e.length===s(this,K)),s(this,q).appendItems(e),s(this,q).updateLoadMoreButton(s(this,O))}catch(e){console.error("Error loading more stories:",e),s(this,q).showError("Gagal memuat cerita tambahan")}}}q=new WeakMap,X=new WeakMap,G=new WeakMap,K=new WeakMap,O=new WeakMap;function ne(c,e="en-US",t={}){return new Date(c).toLocaleDateString(e,{year:"numeric",month:"long",day:"numeric",...t})}const ye="push_subscription_endpoint";class ie{static async urlBase64ToUint8Array(e){const t="=".repeat((4-e.length%4)%4),o=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),r=window.atob(o),i=new Uint8Array(r.length);for(let n=0;n<r.length;++n)i[n]=r.charCodeAt(n);return i}static async requestPermission(){if(!("Notification"in window))throw new Error("Browser tidak mendukung notifikasi");const e=await Notification.requestPermission();if(e!=="granted")throw new Error("Izin notifikasi ditolak");return e}static async registerServiceWorker(){if(!("serviceWorker"in navigator))throw new Error("Service Worker tidak didukung");try{const e=await navigator.serviceWorker.register("/sw.js",{scope:"/"});return await navigator.serviceWorker.ready,e}catch(e){throw new Error(`Gagal mendaftarkan service worker: ${e.message}`)}}static async subscribe(){try{if(!("serviceWorker"in navigator))throw new Error("Service Worker tidak didukung di browser ini");if(!("PushManager"in window))throw new Error("Push Notification tidak didukung di browser ini");await this.requestPermission();const e=await this.registerServiceWorker();if(await navigator.serviceWorker.ready,!e.pushManager)throw new Error("Push Manager tidak tersedia");let t=await e.pushManager.getSubscription();if(!t){const r=C.VAPID_PUBLIC_KEY;try{const i=await this.urlBase64ToUint8Array(r);t=await e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:i})}catch(i){throw console.error("Push subscription error:",i),i.name==="NotAllowedError"?new Error("Izin push notification ditolak. Silakan aktifkan di pengaturan browser."):i.name==="InvalidStateError"?new Error("State tidak valid untuk push subscription"):i.message&&i.message.includes("registration")?new Error("Gagal mendaftar push service. Pastikan service worker aktif."):new Error(`Gagal mendaftar push notification: ${i.message||i}`)}}const o={endpoint:t.endpoint,keys:{p256dh:this.arrayBufferToBase64(t.getKey("p256dh")),auth:this.arrayBufferToBase64(t.getKey("auth"))}};try{await x.subscribePushNotification({endpoint:o.endpoint,keys:o.keys.p256dh,p256dh:o.keys.p256dh,auth:o.keys.auth})}catch(r){try{await t.unsubscribe()}catch(i){console.error("Error unsubscribing after API failure:",i)}throw new Error(`Gagal mengirim subscription ke server: ${r.message}`)}return localStorage.setItem(ye,o.endpoint),t}catch(e){throw console.error("Error subscribing to push notification:",e),e}}static async unsubscribe(){try{const t=await(await navigator.serviceWorker.ready).pushManager.getSubscription();if(!t)throw new Error("Tidak ada subscription yang aktif");const o=t.endpoint;return await x.unsubscribePushNotification(o),await t.unsubscribe(),localStorage.removeItem(ye),!0}catch(e){throw console.error("Error unsubscribing from push notification:",e),e}}static async isSubscribed(){try{return"serviceWorker"in navigator?!!await(await navigator.serviceWorker.ready).pushManager.getSubscription():!1}catch{return!1}}static async getSubscription(){try{return"serviceWorker"in navigator?await(await navigator.serviceWorker.ready).pushManager.getSubscription():null}catch{return null}}static arrayBufferToBase64(e){const t=new Uint8Array(e);let o="";for(let r=0;r<t.byteLength;r++)o+=String.fromCharCode(t[r]);return window.btoa(o)}}const qe="StoryAppDB",Te=2,b="stories",D="syncQueue";class Pe{constructor(){this.db=null}async init(){return new Promise((e,t)=>{const o=indexedDB.open(qe,Te);o.onerror=()=>{t(new Error("Failed to open IndexedDB"))},o.onsuccess=()=>{this.db=o.result,e(this.db)},o.onupgradeneeded=r=>{const i=r.target.result;if(r.oldVersion,!i.objectStoreNames.contains(b)){const n=i.createObjectStore(b,{keyPath:"id"});n.createIndex("name","name",{unique:!1}),n.createIndex("createdAt","createdAt",{unique:!1}),n.createIndex("description","description",{unique:!1})}if(!i.objectStoreNames.contains(D)){const n=i.createObjectStore(D,{keyPath:"id",autoIncrement:!0});n.createIndex("action","action",{unique:!1}),n.createIndex("timestamp","timestamp",{unique:!1})}}})}async ensureDB(){return this.db||await this.init(),this.db}async saveStory(e){return await this.ensureDB(),!e||!e.id?Promise.reject(new Error("Story must have an ID")):new Promise((t,o)=>{const i=this.db.transaction([b],"readwrite").objectStore(b),n=i.get(e.id);n.onsuccess=()=>{const a=n.result;console.log(a?`Story ${e.id} already exists, updating...`:`Saving new story ${e.id} to IndexedDB`);const l=i.put(e);l.onsuccess=()=>{t(e)},l.onerror=()=>{o(new Error("Failed to save story to IndexedDB"))}},n.onerror=()=>{const a=i.put(e);a.onsuccess=()=>{t(e)},a.onerror=()=>{o(new Error("Failed to save story to IndexedDB"))}}})}async getAllStories(){return await this.ensureDB(),new Promise((e,t)=>{const i=this.db.transaction([b],"readonly").objectStore(b).getAll();i.onsuccess=()=>{const n=i.result||[],a=[],l=new Set;for(const h of n)h&&h.id&&!l.has(h.id)&&(l.add(h.id),a.push(h));console.log(`Retrieved ${n.length} stories, ${a.length} unique after deduplication`),e(a)},i.onerror=()=>{t(new Error("Failed to get stories from IndexedDB"))}})}async getStoryById(e){return await this.ensureDB(),new Promise((t,o)=>{const n=this.db.transaction([b],"readonly").objectStore(b).get(e);n.onsuccess=()=>{t(n.result||null)},n.onerror=()=>{o(new Error("Failed to get story from IndexedDB"))}})}async deleteStory(e){return await this.ensureDB(),new Promise((t,o)=>{const n=this.db.transaction([b],"readwrite").objectStore(b).delete(e);n.onsuccess=()=>{t(!0)},n.onerror=()=>{o(new Error("Failed to delete story from IndexedDB"))}})}async isStorySaved(e){return!!await this.getStoryById(e)}async addToSyncQueue(e,t){return await this.ensureDB(),new Promise((o,r)=>{const n=this.db.transaction([D],"readwrite").objectStore(D),a={action:e,data:t,timestamp:Date.now(),synced:!1},l=n.add(a);l.onsuccess=()=>{o(a)},l.onerror=()=>{r(new Error("Failed to add to sync queue"))}})}async getSyncQueue(){return await this.ensureDB(),new Promise((e,t)=>{const n=this.db.transaction([D],"readonly").objectStore(D).index("timestamp").getAll();n.onsuccess=()=>{const l=(n.result||[]).filter(h=>!h.synced);e(l)},n.onerror=()=>{t(new Error("Failed to get sync queue"))}})}async markSynced(e){return await this.ensureDB(),new Promise((t,o)=>{const i=this.db.transaction([D],"readwrite").objectStore(D),n=i.get(e);n.onsuccess=()=>{const a=n.result;if(a){a.synced=!0;const l=i.put(a);l.onsuccess=()=>t(!0),l.onerror=()=>o(new Error("Failed to mark as synced"))}else t(!1)},n.onerror=()=>{o(new Error("Failed to get sync item"))}})}async clearSyncedItems(){return await this.ensureDB(),new Promise((e,t)=>{const n=this.db.transaction([D],"readwrite").objectStore(D).index("timestamp").openCursor();n.onsuccess=a=>{const l=a.target.result;l?(l.value.synced&&l.delete(),l.continue()):e(!0)},n.onerror=()=>{t(new Error("Failed to clear synced items"))}})}searchStories(e,t){if(!t)return e;const o=t.toLowerCase();return e.filter(r=>{var i,n;return((i=r.name)==null?void 0:i.toLowerCase().includes(o))||((n=r.description)==null?void 0:n.toLowerCase().includes(o))})}sortStories(e,t="createdAt",o="desc"){const r=[...e];return r.sort((i,n)=>{let a=i[t],l=n[t];return t==="createdAt"&&(a=new Date(a).getTime(),l=new Date(l).getTime()),typeof a=="string"&&(a=a.toLowerCase(),l=l.toLowerCase()),o==="asc"?a>l?1:a<l?-1:0:a<l?1:a>l?-1:0}),r}async cleanupDuplicates(){return await this.ensureDB(),new Promise((e,t)=>{const r=this.db.transaction([b],"readwrite").objectStore(b),i=r.getAll();i.onsuccess=()=>{const n=i.result||[],a=new Map;for(const h of n)h&&h.id&&(a.has(h.id)||a.set(h.id,[]),a.get(h.id).push(h));const l=[];for(const[h,y]of a.entries())if(y.length>1){l.push({id:h,count:y.length});const $=y[0];r.put($)}if(l.length===0){console.log("No duplicates found, IndexedDB is clean"),e({removed:0,kept:a.size});return}console.log(`Found ${l.length} duplicate story IDs:`,l),console.log("Keeping first occurrence of each, IndexedDB will auto-deduplicate"),e({removed:l.reduce((h,y)=>h+y.count-1,0),kept:a.size})},i.onerror=()=>{t(new Error("Failed to get stories for cleanup"))}})}filterStories(e,t={}){let o=[...e];if(t.startDate){const r=new Date(t.startDate).getTime();o=o.filter(i=>new Date(i.createdAt).getTime()>=r)}if(t.endDate){const r=new Date(t.endDate).getTime();o=o.filter(i=>new Date(i.createdAt).getTime()<=r)}if(t.name){const r=t.name.toLowerCase();o=o.filter(i=>{var n;return(n=i.name)==null?void 0:n.toLowerCase().includes(r)})}return o}}const m=new Pe;class Ae{async render(){return`
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
    `}async afterRender(){document.readyState!=="complete"&&await new Promise(t=>{document.readyState==="complete"?t():window.addEventListener("load",t,{once:!0})});try{await m.init(),console.log("IndexedDB initialized successfully");try{const t=await m.cleanupDuplicates();t.removed>0&&console.log(`Cleaned up ${t.removed} duplicate stories`)}catch(t){console.error("Error during cleanup:",t)}}catch(t){console.error("Failed to initialize IndexedDB:",t)}const e=new de({view:this,model:x});this.currentView="all",this.currentStories=[],this._indexedDBControlsSetup=!1,this.presenter=e,await e.init(),this.setupLoadMoreButton(),await this.setupPushNotificationToggle(),await new Promise(t=>setTimeout(t,150)),await this.setupIndexedDBControls(),this.checkAndHighlightStory()}async setupIndexedDBControls(){if(this._indexedDBControlsSetup){console.log("IndexedDB controls already set up, skipping...");return}await new Promise(r=>{document.readyState==="complete"?r():window.addEventListener("load",r,{once:!0})}),await new Promise(r=>setTimeout(r,50));let e=0;const t=5,o=async()=>{var a;e++;const r=document.querySelector("#toggle-view-btn"),i=document.querySelector("#toggle-view-text"),n=document.querySelector("#filter-controls");if(console.log(`Setting up IndexedDB controls... (attempt ${e}/${t})`,{toggleViewBtn:!!r,toggleViewText:!!i,filterControls:!!n,readyState:document.readyState}),!r||!i){if(e<t)return console.log(`Elements not found, retrying in ${e*100}ms...`),await new Promise(l=>setTimeout(l,e*100)),o();console.error("Toggle view button/text not found after all attempts!"),console.error("Available elements:",{toggleViewBtn:document.querySelector("#toggle-view-btn"),toggleViewText:document.querySelector("#toggle-view-text"),homeContent:document.querySelector("#home-content"),homeContentHTML:(a=document.querySelector("#home-content"))==null?void 0:a.innerHTML.substring(0,200)});return}this.setupButtonHandlers(r,i,n),this._indexedDBControlsSetup=!0,console.log("IndexedDB controls setup complete")};await o()}setupButtonHandlers(e,t,o){e.style.display="inline-block",e.style.visibility="visible",e.style.opacity="1",e.style.width="auto",e.style.height="auto",e.removeAttribute("hidden");const r=e.cloneNode(!0);e.parentNode.replaceChild(r,e),r.addEventListener("click",async y=>{y.preventDefault(),y.stopPropagation(),console.log("Toggle view clicked, current view:",this.currentView);const $=async()=>{if(this.currentView==="all")this.currentView="saved",t.textContent="Lihat Semua",o&&(o.style.display="block"),await this.showSavedStories();else{this.currentView="all",t.textContent="Lihat Tersimpan",o&&(o.style.display="none");const B=new de({view:this,model:x});this.presenter=B,await B.init(),this.setupLoadMoreButton()}};if(document.startViewTransition){const B=document.startViewTransition(()=>$());try{await B.finished}catch(f){console.error("View transition failed:",f),await $()}}else await $()});const n=document.querySelector("#search-input");n&&n.addEventListener("input",y=>{this.applyFilters()});const a=document.querySelector("#sort-select");a&&a.addEventListener("change",()=>{this.applyFilters()});const l=document.querySelector("#filter-date");l&&l.addEventListener("change",()=>{this.applyFilters()});const h=document.querySelector("#clear-filters-btn");h&&h.addEventListener("click",()=>{n&&(n.value=""),a&&(a.value="createdAt-desc"),l&&(l.value=""),this.applyFilters()})}async showSavedStories(){try{this.updateLoadMoreButton(!1);const e=await m.getAllStories(),t=[],o=new Set;for(const i of e)i&&i.id&&!o.has(i.id)&&(o.add(i.id),t.push(i));console.log(`showSavedStories: loaded ${e.length} stories, ${t.length} unique after deduplication`);const r=document.querySelector("#story-list-container-home");r&&(r.innerHTML=""),this.currentStories=t,await this.showItems(t)}catch(e){console.error("Error loading saved stories:",e),this.showError("Gagal memuat cerita tersimpan")}}async applyFilters(){if(this.currentView==="saved")try{let e=[...this.currentStories];const t=new Set;e=e.filter(n=>n&&n.id&&!t.has(n.id)?(t.add(n.id),!0):!1);const o=document.querySelector("#search-input");o&&o.value&&(e=m.searchStories(e,o.value));const r=document.querySelector("#filter-date");r&&r.value&&(e=m.filterStories(e,{startDate:r.value}));const i=document.querySelector("#sort-select");if(i){const[n,a]=i.value.split("-");e=m.sortStories(e,n,a)}console.log(`applyFilters: showing ${e.length} filtered stories`),await this.showItems(e)}catch(e){console.error("Error applying filters:",e)}}async setupPushNotificationToggle(){const e=document.querySelector("#push-notification-toggle"),t=document.querySelector("#push-toggle-text");if(e){if(!("Notification"in window)||!("serviceWorker"in navigator)){e.style.display="none";return}e.style.display="inline-block",await this.updateToggleButtonState(),e.addEventListener("click",async()=>{try{if(await ie.isSubscribed())await ie.unsubscribe(),await this.updateToggleButtonState(),alert("Notifikasi push telah dinonaktifkan");else{const r=t.textContent;e.disabled=!0,t.textContent="Memproses...";try{await ie.subscribe(),await this.updateToggleButtonState(),alert("Notifikasi push telah diaktifkan")}catch(i){throw i}finally{e.disabled=!1,await this.updateToggleButtonState()}}}catch(o){console.error("Error toggling push notification:",o);let r="Gagal mengaktifkan notifikasi";o.message&&(o.message.includes("ditolak")?r="Izin notifikasi ditolak. Silakan aktifkan di pengaturan browser.":o.message.includes("tidak didukung")?r="Browser tidak mendukung push notification":o.message.includes("VAPID")?r="Konfigurasi push notification tidak valid":r=o.message),alert(r),await this.updateToggleButtonState()}})}}async updateToggleButtonState(){const e=document.querySelector("#push-notification-toggle"),t=document.querySelector("#push-toggle-text");if(!(!e||!t))try{await ie.isSubscribed()?(t.textContent="Nonaktifkan Notifikasi",e.classList.add("active")):(t.textContent="Aktifkan Notifikasi",e.classList.remove("active"))}catch(o){console.error("Error checking subscription state:",o)}}checkAndHighlightStory(){const e=sessionStorage.getItem("highlightStoryId");e&&(sessionStorage.removeItem("highlightStoryId"),setTimeout(()=>{document.querySelectorAll(".story-item").forEach(o=>{o.dataset.storyId===e&&(o.classList.add("highlighted"),o.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>{o.classList.remove("highlighted")},3e3))})},500))}async showItems(e){const t=document.querySelector("#story-list-container-home");if(!t){console.error("Container not found");return}if(!e||e.length===0){t.innerHTML="<p>Tidak ada cerita ditemukan.</p>";return}const o=[],r=new Set;for(const i of e)i&&i.id&&!r.has(i.id)&&(r.add(i.id),o.push(i));console.log(`showItems: received ${e.length} items, displaying ${o.length} unique items`),t.innerHTML="",this.currentStories=o;try{await m.ensureDB()}catch(i){console.error("IndexedDB not available:",i)}for(const i of o){const n=document.createElement("div");n.className="story-item",n.dataset.storyId=i.id;let a=!1;try{a=await m.isStorySaved(i.id)}catch(f){console.error("Error checking if story is saved:",f),a=!1}const l=a?"Hapus dari Tersimpan":"Simpan ke Tersimpan",h=a?"saved":"",y=a?"❤️":"🤍",$=a?"#ef4444":"#4F46E5";n.innerHTML=`
        <div style="position: relative;">
          <img src="${i.photoUrl}" alt="Foto cerita oleh ${i.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;">
          <button class="save-story-btn ${h}" data-story-id="${i.id}" 
            style="position: absolute; top: 10px; right: 10px; padding: 8px 12px; background: ${$}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            ${y} ${l}
          </button>
        </div>
        <h2>${i.name}</h2>
        <p class="story-description">${i.description}</p>
        <small class="story-date">Dibuat: ${ne(i.createdAt)}</small>
        <div style="margin-top: 0.75rem;">
          <a href="#/story/${i.id}" style="display: inline-block; padding: 8px 16px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; transition: background-color 0.2s;">
            Lihat Detail →
          </a>
        </div>
      `,t.appendChild(n),n.style.cursor="pointer",n.addEventListener("click",f=>{f.target.closest(".save-story-btn")||f.target.closest("a")||(window.location.hash=`#/story/${i.id}`)});const B=n.querySelector(".save-story-btn");B&&B.addEventListener("click",async f=>{f.stopPropagation(),f.preventDefault(),await this.toggleSaveStory(i)})}this.checkAndHighlightStory()}async appendItems(e){const t=document.querySelector("#story-list-container-home");if(!t){console.error("Container not found");return}if(!e||e.length===0)return;const o=new Set(this.currentStories.map(i=>i.id)),r=e.filter(i=>i&&i.id&&!o.has(i.id));if(r.length!==0){console.log(`appendItems: received ${e.length} items, appending ${r.length} unique items`);try{await m.ensureDB()}catch(i){console.error("IndexedDB not available:",i)}for(const i of r){const n=document.createElement("div");n.className="story-item",n.dataset.storyId=i.id;let a=!1;try{a=await m.isStorySaved(i.id)}catch(f){console.error("Error checking if story is saved:",f),a=!1}const l=a?"Hapus dari Tersimpan":"Simpan ke Tersimpan",h=a?"saved":"",y=a?"❤️":"🤍",$=a?"#ef4444":"#4F46E5";n.innerHTML=`
        <div style="position: relative;">
          <img src="${i.photoUrl}" alt="Foto cerita oleh ${i.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;">
          <button class="save-story-btn ${h}" data-story-id="${i.id}" 
            style="position: absolute; top: 10px; right: 10px; padding: 8px 12px; background: ${$}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            ${y} ${l}
          </button>
        </div>
        <h2>${i.name}</h2>
        <p class="story-description">${i.description}</p>
        <small class="story-date">Dibuat: ${ne(i.createdAt)}</small>
        <div style="margin-top: 0.75rem;">
          <a href="#/story/${i.id}" style="display: inline-block; padding: 8px 16px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; transition: background-color 0.2s;">
            Lihat Detail →
          </a>
        </div>
      `,t.appendChild(n),n.style.cursor="pointer",n.addEventListener("click",f=>{f.target.closest(".save-story-btn")||f.target.closest("a")||(window.location.hash=`#/story/${i.id}`)});const B=n.querySelector(".save-story-btn");B&&B.addEventListener("click",async f=>{f.stopPropagation(),f.preventDefault(),await this.toggleSaveStory(i)})}this.currentStories=[...this.currentStories,...r]}}setupLoadMoreButton(){const e=document.querySelector("#load-more-btn");e&&e.addEventListener("click",async()=>{if(this.currentView==="all"&&this.presenter){e.disabled=!0,e.textContent="Memuat...";try{await this.presenter.loadMore()}finally{e.disabled=!1,e.textContent="Muat Lebih Banyak"}}})}updateLoadMoreButton(e){const t=document.querySelector("#load-more-btn");t&&(this.currentView==="all"&&e?t.style.display="inline-block":t.style.display="none")}async toggleSaveStory(e){if(this._savingInProgress){console.log("Save operation already in progress, skipping...");return}this._savingInProgress=!0;try{await m.isStorySaved(e.id)?(await m.deleteStory(e.id),console.log(`Deleted story ${e.id} from IndexedDB`),alert("Cerita dihapus dari tersimpan")):(await m.saveStory(e),console.log(`Saved story ${e.id} to IndexedDB`),alert("Cerita disimpan ke tersimpan")),this.currentView==="saved"?await this.showSavedStories():await new de({view:this,model:x}).init()}catch(t){console.error("Error toggling save story:",t),alert("Gagal menyimpan/menghapus cerita: "+t.message)}finally{this._savingInProgress=!1}}showError(e){const t=document.querySelector("#story-list-container-home");t.innerHTML=`<p style="color: red;">Error: ${e}<br>Silakan <a href="#/login">login</a> terlebih dahulu.</p>`}}class $e{async render(){return`
      <section class="container">
        <h1>About Page</h1>
      </section>
    `}async afterRender(){}}class Ce{async render(){return`
      <section class="container auth-page-container">
        <h1>Login Page</h1>
        <form id="login-form">
          <div id="error-message" style="color: red; margin-bottom: 10px; display: none;"></div>
          <div>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit" id="login-button">Login</button>
        </form>
      </section>
    `}async afterRender(){const e=document.querySelector("#login-form"),t=document.querySelector("#login-button"),o=document.querySelector("#error-message");e.addEventListener("submit",async r=>{r.preventDefault(),t.disabled=!0,t.textContent="Logging in...",o.style.display="none";try{const i=r.target.email.value,n=r.target.password.value,a=await x.login({email:i,password:n});sessionStorage.setItem("token",a.loginResult.token),location.hash="#/map"}catch(i){o.textContent=i.message,o.style.display="block"}finally{t.disabled=!1,t.textContent="Login"}})}}class Me{async render(){return`
      <section class="container auth-page-container">
        <h1>Register Page</h1>
        <form id="register-form">
          <div id="error-message" style="color: red; margin-bottom: 10px; display: none;"></div>
          <div>
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div>
            <label for="password">Password (min. 8 karakter)</label>
            <input type="password" id="password" name="password" minlength="8" required>
          </div>
          <button type="submit" id="register-button">Register</button>
        </form>
      </section>
    `}async afterRender(){const e=document.querySelector("#register-form"),t=document.querySelector("#register-button"),o=document.querySelector("#error-message");e.addEventListener("submit",async r=>{r.preventDefault(),t.disabled=!0,t.textContent="Registering...",o.style.display="none";try{const i=r.target.name.value,n=r.target.email.value,a=r.target.password.value;await x.register({name:i,email:n,password:a}),alert("Registrasi berhasil! Silakan login."),location.hash="#/login"}catch(i){o.textContent=i.message,o.style.display="block"}finally{t.disabled=!1,t.textContent="Register"}})}}var M,se,Z;class Fe{constructor({view:e,model:t}){p(this,M);p(this,se);p(this,Z,[]);g(this,M,e),g(this,se,t)}async init(e=null){try{s(this,M).initializeMap(-2.5489,118.0149,5),g(this,Z,await s(this,se).getAllStoriesWithLocation()),s(this,M).showStoriesList(s(this,Z)),s(this,Z).forEach(t=>{s(this,M).addMarkerToMap(t)}),e&&setTimeout(()=>{s(this,M).focusOnStory(e)},500)}catch(t){s(this,M).showError(t.message)}}}M=new WeakMap,se=new WeakMap,Z=new WeakMap;var T,Q,E,we,ue,ce;class Ne{constructor(){p(this,E);p(this,T,null);p(this,Q,{})}async render(){return`
      <section class="container">
        <h1>Peta Cerita</h1>
        <div id="map-layout" class="map-layout">
          <div id="story-list-container" class="story-list-container">
            <p>Loading stories...</p>
          </div>
          <div id="map"></div>
        </div>
      </section>
    `}async afterRender(){const e=window.location.hash;let t=null;if(e.includes("?")){const r=e.split("?")[1];t=new URLSearchParams(r).get("story")}await new Fe({view:this,model:x}).init(t),d(this,E,we).call(this)}showError(e){const t=document.querySelector("#story-list-container");t.innerHTML=`<p style="color: red;">Error: ${e}<br>Silakan <a href="#/login">login</a> terlebih dahulu.</p>`;const o=document.querySelector("#map");o&&(o.style.display="none")}showStoriesList(e){const t=document.querySelector("#story-list-container");if(t.innerHTML="",e.length===0){t.innerHTML="<p>Tidak ada cerita dengan lokasi ditemukan.</p>";return}e.forEach(o=>{const r=document.createElement("div");r.className="story-item",r.setAttribute("data-id",o.id),r.setAttribute("data-lat",o.lat),r.setAttribute("data-lon",o.lon),r.setAttribute("tabindex","0"),r.setAttribute("role","button"),r.innerHTML=`
        <img src="${o.photoUrl}" alt="Foto cerita oleh ${o.name}">
        <h2>${o.name}</h2>
        <p class="story-description">${o.description}</p>
        <small class="story-date">Dibuat: ${ne(o.createdAt)}</small>
      `,t.appendChild(r)})}initializeMap(e=-2.5489,t=118.0149,o=5){const r=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}),i=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{attribution:"Tiles &copy; Esri"}),n={Street:r,Satellite:i};g(this,T,L.map("map",{center:[e,t],zoom:o,layers:[r]})),L.control.layers(n).addTo(s(this,T))}focusOnStory(e){if(!s(this,T)||!e)return;const t=s(this,Q)[e];if(t){const o=t.getLatLng().lat,r=t.getLatLng().lng;s(this,T).setView([o,r],15),t.openPopup(),d(this,E,ce).call(this,e)}else console.warn(`Story with ID ${e} not found on map. It may not have location data.`)}addMarkerToMap(e){if(!s(this,T))return;const t=L.marker([e.lat,e.lon],{keyboard:!0,alt:`Lokasi cerita oleh ${e.name}`}).addTo(s(this,T)),o=`
      <div>
        <h4>${e.name}</h4>
        <img src="${e.photoUrl}" alt="Foto cerita oleh ${e.name}" style="width:100%; max-height: 150px; object-fit: cover;">
        <p style="font-size: 0.9rem; margin-top: 5px;">${e.description}</p>
        <small>${ne(e.createdAt)}</small>
      </div>
    `;t.bindPopup(o),s(this,Q)[e.id]=t,t.on("click",()=>{d(this,E,ce).call(this,e.id)})}}T=new WeakMap,Q=new WeakMap,E=new WeakSet,we=function(){const e=document.querySelector("#story-list-container");e.addEventListener("click",t=>{const o=t.target.closest(".story-item");o&&d(this,E,ue).call(this,o)}),e.addEventListener("keydown",t=>{if(t.key==="Enter"||t.key===" "){const o=t.target.closest(".story-item");if(!o)return;t.preventDefault(),d(this,E,ue).call(this,o)}})},ue=function(e){const t=e.dataset.id,o=e.dataset.lat,r=e.dataset.lon;t&&s(this,Q)[t]&&(s(this,T).setView([o,r],15),s(this,Q)[t].openPopup(),d(this,E,ce).call(this,t))},ce=function(e){document.querySelectorAll(".story-item").forEach(o=>{o.classList.remove("active")});const t=document.querySelector(`.story-item[data-id="${e}"]`);t&&(t.classList.add("active"),t.scrollIntoView({behavior:"smooth",block:"nearest"}))};class Re{constructor(){this.isOnline=navigator.onLine,this.syncInProgress=!1,this.setupEventListeners()}setupEventListeners(){window.addEventListener("online",()=>{this.isOnline=!0,console.log("Connection restored, syncing data..."),this.syncPendingData()}),window.addEventListener("offline",()=>{this.isOnline=!1,console.log("Connection lost, working offline...")}),this.isOnline&&setTimeout(()=>{this.syncPendingData()},2e3)}isDeviceOnline(){return navigator.onLine}async queueStoryForSync(e){try{return await m.addToSyncQueue("create",e),console.log("Story queued for sync:",e),!0}catch(t){throw console.error("Failed to queue story for sync:",t),t}}async syncPendingData(){if(this.syncInProgress){console.log("Sync already in progress");return}if(!this.isDeviceOnline()){console.log("Device is offline, cannot sync");return}try{this.syncInProgress=!0;const e=await m.getSyncQueue();if(e.length===0){console.log("No pending data to sync");return}console.log(`Syncing ${e.length} pending items...`);const t={success:0,failed:0};for(const o of e)try{if(o.action==="create"){const r=o.data;let i;if(r.photo&&typeof r.photo=="string"){const a=atob(r.photo),l=new Array(a.length);for(let y=0;y<a.length;y++)l[y]=a.charCodeAt(y);const h=new Uint8Array(l);i=new Blob([h],{type:"image/jpeg"})}else i=r.photo;const n={description:r.description,photo:i,lat:r.lat,lon:r.lon};await x.addNewStory(n),await m.markSynced(o.id),t.success++,console.log("Successfully synced story:",o.id)}}catch(r){console.error(`Failed to sync item ${o.id}:`,r),t.failed++}console.log(`Sync completed: ${t.success} succeeded, ${t.failed} failed`),await m.clearSyncedItems(),t.success>0&&this.showSyncNotification(`Berhasil menyinkronkan ${t.success} cerita`),t.failed>0&&this.showSyncNotification(`Gagal menyinkronkan ${t.failed} cerita`,"error")}catch(e){console.error("Error during sync:",e)}finally{this.syncInProgress=!1}}showSyncNotification(e,t="success"){const o=document.createElement("div"),r=t==="success"?"#4F46E5":t==="error"?"#ef4444":"#6b7280";o.style.cssText=`
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${r};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `,o.textContent=e;const i=document.createElement("style");i.textContent=`
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
    `,document.head.appendChild(i),document.body.appendChild(o),setTimeout(()=>{o.style.animation="slideIn 0.3s ease reverse",setTimeout(()=>{o.remove(),i.remove()},300)},3e3)}async manualSync(){return this.isDeviceOnline()?(this.showSyncNotification("Menyinkronkan data...","info"),await this.syncPendingData(),!0):(this.showSyncNotification("Tidak ada koneksi internet","error"),!1)}}const ze=new Re;var F,J,j,W,P,N,ee,_,v,S,k,V,R,u,be,he,ve,Se,ae,ke,xe,Le,Ee,w,H;class Oe{constructor(){p(this,u);p(this,F,null);p(this,J,null);p(this,j,null);p(this,W,null);p(this,P,null);p(this,N,null);p(this,ee,null);p(this,_,null);p(this,v,null);p(this,S,null);p(this,k,null);p(this,V,null);p(this,R,null);p(this,ae,()=>{s(this,j)&&(s(this,j).getTracks().forEach(e=>e.stop()),g(this,j,null))})}async render(){return`
      <section class="container">
        <h1>Tambah Cerita Baru</h1>
        
        <div id="form-message"></div>

        <div class="add-story-layout">
          <form id="add-story-form" novalidate>
            
            <div class="form-group" id="description-group">
              <label for="description">Deskripsi</label>
              <textarea id="description" name="description" rows="5" required></textarea>
              <div class="error-text">Deskripsi tidak boleh kosong.</div>
            </div>

            <div class="form-group" id="photo-group">
              <label for="photo">Upload Foto (Max 1MB)</label>
              <input type="file" id="photo" name="photo" accept="image/png, image/jpeg" required>
              <div class="error-text">Foto tidak boleh kosong.</div>
            </div>

            <div class="form-group">
              <label>Atau Ambil dari Kamera</label>
              <div class="camera-controls">
                <button type="button" id="camera-button">Buka Kamera</button>
              </div>
              
              <div id="camera-container">
                <video id="video-feed" autoplay playsinline aria-label="Pratinjau kamera"></video>
                <button type="button" id="snap-button" title="Ambil Foto"></button>
              </div>

              <div id="preview-container">
                <canvas id="canvas-preview" aria-label="Hasil foto kamera"></canvas>
                <button type="button" id="retake-button" title="Ambil Ulang">X</button>
              </div>
            </div>

            <button type="submit" id="submit-button" class="form-button">Upload Cerita</button>
          </form>

          <div class="map-picker-container">
            <p>Klik di peta untuk memilih lokasi:</p>
            <div id="add-story-map"></div>

            <div class="form-group" id="latitude-group">
              <label for="latitude">Latitude</label>
              <input type="text" id="latitude" name="latitude" required placeholder="Klik peta atau ketik manual">
              <div class="error-text">Latitude tidak boleh kosong.</div>
            </div>
            <div class="form-group" id="longitude-group">
              <label for="longitude">Longitude</label>
              <input type="text" id="longitude" name="longitude" required placeholder="Klik peta atau ketik manual">
              <div class="error-text">Longitude tidak boleh kosong.</div>
            </div>

          </div>
        </div>
      </section>
    `}async afterRender(){g(this,ee,document.querySelector("#add-story-form")),g(this,_,document.querySelector("#description")),g(this,v,document.querySelector("#photo")),g(this,S,document.querySelector("#latitude")),g(this,k,document.querySelector("#longitude")),g(this,V,document.querySelector("#submit-button")),g(this,R,document.querySelector("#form-message"));try{await m.init()}catch(e){console.error("Failed to initialize IndexedDB:",e)}d(this,u,be).call(this),d(this,u,ve).call(this),d(this,u,Se).call(this),d(this,u,xe).call(this),d(this,u,ke).call(this),window.addEventListener("hashchange",s(this,ae),{once:!0})}}F=new WeakMap,J=new WeakMap,j=new WeakMap,W=new WeakMap,P=new WeakMap,N=new WeakMap,ee=new WeakMap,_=new WeakMap,v=new WeakMap,S=new WeakMap,k=new WeakMap,V=new WeakMap,R=new WeakMap,u=new WeakSet,be=function(){g(this,F,L.map("add-story-map").setView([-2.5489,118.0149],5)),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(s(this,F)),s(this,F).on("click",e=>{const{lat:t,lng:o}=e.latlng;s(this,S).value=t.toFixed(6),s(this,k).value=o.toFixed(6),d(this,u,he).call(this,t,o),d(this,u,w).call(this,s(this,S),"Latitude tidak boleh kosong."),d(this,u,w).call(this,s(this,k),"Longitude tidak boleh kosong.")})},he=function(e,t,o=null){s(this,J)?s(this,J).setLatLng([e,t]):g(this,J,L.marker([e,t],{keyboard:!0,alt:"Lokasi cerita baru"}).addTo(s(this,F))),o?s(this,F).setView([e,t],o):s(this,F).panTo([e,t])},ve=function(){const e=()=>{const t=parseFloat(s(this,S).value),o=parseFloat(s(this,k).value);!isNaN(t)&&!isNaN(o)&&t>=-90&&t<=90&&o>=-180&&o<=180&&(d(this,u,he).call(this,t,o,13),d(this,u,w).call(this,s(this,S),"Latitude tidak boleh kosong."),d(this,u,w).call(this,s(this,k),"Longitude tidak boleh kosong."))};s(this,S).addEventListener("change",e),s(this,k).addEventListener("change",e)},Se=function(){g(this,W,document.querySelector("#video-feed")),g(this,P,document.querySelector("#canvas-preview"));const e=document.querySelector("#camera-button"),t=document.querySelector("#snap-button"),o=document.querySelector("#retake-button"),r=document.querySelector("#camera-container"),i=document.querySelector("#preview-container");e.addEventListener("click",async()=>{g(this,N,null),i.style.display="none",s(this,v).value=null;try{g(this,j,await navigator.mediaDevices.getUserMedia({video:!0,audio:!1})),s(this,W).srcObject=s(this,j),r.style.display="block",e.textContent="Tutup Kamera"}catch(n){console.error("Error accessing camera:",n),d(this,u,H).call(this,"error","Gagal mengakses kamera. Pastikan izin telah diberikan.")}}),t.addEventListener("click",()=>{s(this,P).width=s(this,W).videoWidth,s(this,P).height=s(this,W).videoHeight,s(this,P).getContext("2d").drawImage(s(this,W),0,0,s(this,P).width,s(this,P).height),s(this,P).toBlob(a=>{g(this,N,a),d(this,u,w).call(this,s(this,v),"Foto tidak boleh kosong.")},"image/jpeg"),i.style.display="block",r.style.display="none",s(this,ae).call(this),e.textContent="Buka Kamera"}),o.addEventListener("click",()=>{g(this,N,null),i.style.display="none",e.click(),d(this,u,w).call(this,s(this,v),"Foto tidak boleh kosong.")})},ae=new WeakMap,ke=function(){s(this,ee).addEventListener("submit",async e=>{var o;if(e.preventDefault(),!d(this,u,Le).call(this)){d(this,u,H).call(this,"error","Semua field wajib diisi. Mohon periksa kembali.");return}s(this,V).disabled=!0,s(this,V).textContent="Mengupload...",d(this,u,H).call(this);try{const r=s(this,_).value,i=s(this,S).value,n=s(this,k).value,a=s(this,N)||s(this,v).files[0];try{await x.addNewStory({description:r,photo:a,lat:i,lon:n}),d(this,u,H).call(this,"success","Cerita berhasil ditambahkan!")}catch(l){if(l.message==="OFFLINE_MODE"||!navigator.onLine){const h=await d(this,u,Ee).call(this,a),y=a instanceof File?a.name:"camera-capture.jpg";await ze.queueStoryForSync({description:r,photo:h,photoName:y,lat:i,lon:n}),d(this,u,H).call(this,"success","Cerita disimpan secara offline. Akan disinkronkan saat koneksi tersedia.")}else throw l}s(this,ee).reset(),(o=s(this,J))==null||o.remove(),g(this,N,null),document.querySelector("#preview-container").style.display="none",setTimeout(()=>{location.hash="#/map"},2e3)}catch(r){d(this,u,H).call(this,"error",r.message||"Gagal menambahkan cerita")}finally{s(this,V).disabled=!1,s(this,V).textContent="Upload Cerita"}})},xe=function(){s(this,_).addEventListener("input",()=>{d(this,u,w).call(this,s(this,_),"Deskripsi tidak boleh kosong.")}),s(this,v).addEventListener("change",()=>{d(this,u,w).call(this,s(this,v),"Foto tidak boleh kosong.")})},Le=function(){const e=d(this,u,w).call(this,s(this,_),"Deskripsi tidak boleh kosong."),t=d(this,u,w).call(this,s(this,v),"Foto tidak boleh kosong."),o=d(this,u,w).call(this,s(this,S),"Latitude tidak boleh kosong."),r=d(this,u,w).call(this,s(this,k),"Longitude tidak boleh kosong.");return e&&t&&o&&r},Ee=async function(e){return new Promise((t,o)=>{const r=new FileReader;r.onloadend=()=>{const i=r.result.split(",")[1];t(i)},r.onerror=o,r.readAsDataURL(e)})},w=function(e,t){let o=!1;e.type==="file"?o=e.files.length>0||s(this,N)!==null:o=e.value.trim()!=="";const r=document.querySelector(`#${e.id}-group`),i=r.querySelector(".error-text");return o?(r.classList.remove("invalid"),!0):(r.classList.add("invalid"),i.textContent=t,!1)},H=function(e="",t=""){s(this,R).className="",e&&t?(s(this,R).classList.add(e),s(this,R).textContent=t,s(this,R).style.display="block"):s(this,R).style.display="none"};class je{async render(){return`
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
    `}async afterRender(){const t=window.location.hash.match(/\/story\/([^\/]+)/);if(!t){this.showError("Story ID tidak ditemukan");return}const o=t[1];let r=null;try{await m.ensureDB(),r=await m.getStoryById(o)}catch{console.log("Story not found in IndexedDB, fetching from API")}if(!r)try{r=await x.getStoryDetail(o);try{await m.saveStory(r)}catch(i){console.error("Failed to save story to IndexedDB:",i)}}catch(i){console.error("Error fetching story:",i),this.showError(i.message||"Gagal memuat detail cerita");return}this.showStoryDetail(r)}showStoryDetail(e){const t=document.querySelector("#story-detail-container");t&&(t.innerHTML=`
      <div class="story-detail-card" style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="position: relative;">
          <img src="${e.photoUrl}" alt="Foto cerita oleh ${e.name}" 
            style="width: 100%; height: 400px; object-fit: cover; display: block;">
          <button id="save-story-detail-btn" class="save-story-btn" 
            style="position: absolute; top: 15px; right: 15px; padding: 10px 16px; background: #4F46E5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2); font-family: 'Inter', sans-serif;">
            🤍 Simpan ke Tersimpan
          </button>
        </div>
        
        <div style="padding: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <h1 style="margin: 0; font-size: 1.75rem; color: #1f2937;">${e.name}</h1>
            <small style="color: #6b7280; font-size: 0.875rem;">
              ${ne(e.createdAt)}
            </small>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <p style="font-size: 1rem; line-height: 1.6; color: #374151; margin: 0;">
              ${e.description}
            </p>
          </div>
          
          ${e.lat&&e.lon?`
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 0.5rem 0; color: #6b7280; font-size: 0.875rem;">Lokasi:</p>
              <p style="margin: 0; color: #374151; font-weight: 500;">
                Latitude: ${e.lat}<br>
                Longitude: ${e.lon}
              </p>
              <a href="#/map?story=${e.id}" id="map-link" style="display: inline-block; margin-top: 0.75rem; color: #4F46E5; text-decoration: none; font-weight: 600;">
                Lihat di Peta →
              </a>
            </div>
          `:""}
        </div>
      </div>
    `,this.setupSaveButton(e).catch(o=>{console.error("Error setting up save button:",o)}),this.setupMapLink())}setupMapLink(){const e=document.querySelector("#map-link");e&&e.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation();const o=e.getAttribute("href")||"#/map";window.location.hash=o})}async setupSaveButton(e){const t=document.querySelector("#save-story-detail-btn");if(t){try{const o=await m.isStorySaved(e.id);this.updateSaveButton(t,o)}catch(o){console.error("Error checking if story is saved:",o)}t.addEventListener("click",async o=>{o.preventDefault(),o.stopPropagation();try{await m.isStorySaved(e.id)?(await m.deleteStory(e.id),this.updateSaveButton(t,!1),alert("Cerita dihapus dari tersimpan")):(await m.saveStory(e),this.updateSaveButton(t,!0),alert("Cerita disimpan ke tersimpan"))}catch(r){console.error("Error toggling save story:",r),alert("Gagal menyimpan/menghapus cerita: "+r.message)}})}}updateSaveButton(e,t){t?(e.innerHTML="❤️ Hapus dari Tersimpan",e.style.background="#ef4444"):(e.innerHTML="🤍 Simpan ke Tersimpan",e.style.background="#4F46E5")}showError(e){const t=document.querySelector("#story-detail-container");t&&(t.innerHTML=`
      <div style="padding: 2rem; text-align: center;">
        <p style="color: #ef4444; font-size: 1.125rem; margin-bottom: 1rem;">${e}</p>
        <a href="#/" style="color: #4F46E5; text-decoration: none; font-weight: 600;">
          Kembali ke Beranda
        </a>
      </div>
    `)}}const re={"/":new Ae,"/map":new Ne,"/add":new Oe,"/about":new $e,"/login":new Ce,"/register":new Me,"/story/:id":new je};function We(c){const e=c.split("/");return{resource:e[1]||null,id:e[2]||null}}function _e(c){let e="";return c.resource&&(e=e.concat(`/${c.resource}`)),c.id&&(e=e.concat("/:id")),e||"/"}function Ve(){return(location.hash.replace("#","")||"/").split("?")[0]}function He(){const c=Ve(),e=We(c);return _e(e)}const fe=()=>!!sessionStorage.getItem("token"),Ue=()=>{sessionStorage.removeItem("token"),location.hash="#/login"};var te,oe,A,I,Ie,Be,De,pe;class Ge{constructor({navigationDrawer:e,drawerButton:t,content:o}){p(this,I);p(this,te,null);p(this,oe,null);p(this,A,null);g(this,te,o),g(this,oe,t),g(this,A,e),d(this,I,Ie).call(this),d(this,I,Be).call(this),d(this,I,De).call(this)}async renderPage(){d(this,I,pe).call(this);const e=He(),t=fe(),o=["/","/map","/add","/about","/story/:id"],r=["/login","/register"],i=o.includes(e)||e.startsWith("/story/"),n=r.includes(e);if(!t&&i){location.hash="#/login";return}if(t&&n){location.hash="#/";return}document.querySelector("header").style.display="block";let a;if(re[e]?a=re[e]:e.startsWith("/story/")?a=re["/story/:id"]:(a=t?re["/"]:re["/login"],location.hash=t?"#/":"#/login"),!document.startViewTransition){s(this,te).innerHTML=await a.render(),await a.afterRender();return}const l=document.startViewTransition(()=>(async()=>{s(this,te).innerHTML=await a.render(),await a.afterRender()})());try{await l.finished}catch(h){console.error("View transition failed:",h)}}}te=new WeakMap,oe=new WeakMap,A=new WeakMap,I=new WeakSet,Ie=function(){s(this,oe).addEventListener("click",()=>{s(this,A).classList.toggle("open")}),document.body.addEventListener("click",e=>{!s(this,A).contains(e.target)&&!s(this,oe).contains(e.target)&&s(this,A).classList.remove("open"),s(this,A).querySelectorAll("a").forEach(t=>{t.contains(e.target)&&s(this,A).classList.remove("open")})})},Be=function(){document.querySelector("#nav-logout-link").addEventListener("click",t=>{t.preventDefault(),Ue(),d(this,I,pe).call(this),s(this,A).classList.remove("open")})},De=function(){const e=document.querySelector(".skip-to-content"),t=document.querySelector("#main-content");e.addEventListener("click",o=>{o.preventDefault(),t.setAttribute("tabindex",-1),t.focus(),t.addEventListener("blur",()=>{t.removeAttribute("tabindex")},{once:!0})})},pe=function(){const e=fe(),t=document.querySelector("#nav-beranda"),o=document.querySelector("#nav-peta"),r=document.querySelector("#nav-tambah"),i=document.querySelector("#nav-logout"),n=document.querySelector("#nav-login"),a=document.querySelector("#nav-register"),l=document.querySelector("#nav-about");e?(t.style.display="list-item",o.style.display="list-item",r.style.display="list-item",i.style.display="list-item",n.style.display="none",a.style.display="none",l.style.display="none"):(n.style.display="list-item",a.style.display="list-item",t.style.display="none",o.style.display="none",r.style.display="none",i.style.display="none",l.style.display="none")};"serviceWorker"in navigator&&window.addEventListener("load",async()=>{try{await ie.registerServiceWorker(),console.log("Service Worker registered successfully")}catch(c){console.error("Service Worker registration failed:",c)}});let U=null;window.addEventListener("beforeinstallprompt",c=>{c.preventDefault(),U=c,console.log("PWA install prompt available");const e=document.createElement("button");e.textContent="Install App",e.style.cssText=`
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
  `,e.addEventListener("click",async()=>{if(!U)return;U.prompt();const{outcome:t}=await U.userChoice;console.log(`User response to install prompt: ${t}`),U=null,e.style.display="none"}),e.style.display="block",document.body.appendChild(e),window.addEventListener("appinstalled",()=>{console.log("PWA installed"),U=null,e.style.display="none"})});window.addEventListener("appinstalled",()=>{console.log("PWA installed successfully"),U=null});if("serviceWorker"in navigator){const c=e=>{if(e.data&&e.data.type==="SHOW_STORY_DETAIL"){const t=e.data.storyId;t&&(window.location.hash!=="#/"&&(window.location.hash="#/"),sessionStorage.setItem("highlightStoryId",t))}};navigator.serviceWorker.controller&&navigator.serviceWorker.controller.addEventListener("message",c),navigator.serviceWorker.addEventListener("controllerchange",()=>{navigator.serviceWorker.controller&&navigator.serviceWorker.controller.addEventListener("message",c)}),navigator.serviceWorker.addEventListener("message",c)}document.addEventListener("DOMContentLoaded",async()=>{const c=new Ge({content:document.querySelector("#main-content"),drawerButton:document.querySelector("#drawer-button"),navigationDrawer:document.querySelector("#navigation-drawer")});await c.renderPage(),window.addEventListener("hashchange",async()=>{await c.renderPage()})});
