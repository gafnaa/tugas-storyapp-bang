import ApiService from "../../data/api";
import { showFormattedDate } from "../../utils";
import MapPagePresenter from "./map-page-presenter";

export default class MapPage {
  #map = null;
  #markers = {};

  async render() {
    return `
      <section class="container">
        <h1>Peta Cerita</h1>
        <div id="map-layout" class="map-layout">
          <div id="story-list-container" class="story-list-container">
            <p>Loading stories...</p>
          </div>
          <div id="map"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    
    
    const hash = window.location.hash;
    let storyId = null;
    
    if (hash.includes('?')) {
      const queryString = hash.split('?')[1];
      const urlParams = new URLSearchParams(queryString);
      storyId = urlParams.get('story');
    }
    
    const presenter = new MapPagePresenter({
      view: this,
      model: ApiService,
    });
    
    await presenter.init(storyId);
    this.#setupListClickAndKeyListener();
  }

  showError(message) {
    const container = document.querySelector("#story-list-container");
    container.innerHTML = `<p style="color: red;">Error: ${message}<br>Silakan <a href="#/login">login</a> terlebih dahulu.</p>`;
    const mapContainer = document.querySelector("#map");
    if (mapContainer) mapContainer.style.display = "none";
  }

  showStoriesList(stories) {
    const container = document.querySelector("#story-list-container");
    container.innerHTML = "";

    if (stories.length === 0) {
      container.innerHTML = "<p>Tidak ada cerita dengan lokasi ditemukan.</p>";
      return;
    }

    stories.forEach((story) => {
      const storyItem = document.createElement("div");
      storyItem.className = "story-item";
      storyItem.setAttribute("data-id", story.id);
      storyItem.setAttribute("data-lat", story.lat);
      storyItem.setAttribute("data-lon", story.lon);
      storyItem.setAttribute("tabindex", "0");
      storyItem.setAttribute("role", "button");

      storyItem.innerHTML = `
        <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}">
        <h2>${story.name}</h2>
        <p class="story-description">${story.description}</p>
        <small class="story-date">Dibuat: ${showFormattedDate(
          story.createdAt
        )}</small>
      `;
      container.appendChild(storyItem);
    });
  }

  initializeMap(lat = -2.5489, lon = 118.0149, zoom = 5) {
    const osmTile = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    const satelliteTile = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
      }
    );

    const baseMaps = {
      Street: osmTile,
      Satellite: satelliteTile,
    };

    this.#map = L.map("map", {
      center: [lat, lon],
      zoom: zoom,
      layers: [osmTile],
    });

    L.control.layers(baseMaps).addTo(this.#map);
  }

  focusOnStory(storyId) {
    if (!this.#map || !storyId) return;
    
    const marker = this.#markers[storyId];
    if (marker) {
      const lat = marker.getLatLng().lat;
      const lon = marker.getLatLng().lng;
      
      
      this.#map.setView([lat, lon], 15);
      
      
      marker.openPopup();
      
      
      this.#highlightListItem(storyId);
    } else {
      console.warn(`Story with ID ${storyId} not found on map. It may not have location data.`);
    }
  }
  
  addMarkerToMap(story) {
    if (!this.#map) return;

    const marker = L.marker([story.lat, story.lon], {
      keyboard: true,
      alt: `Lokasi cerita oleh ${story.name}`,
    }).addTo(this.#map);

    const popupContent = `
      <div>
        <h4>${story.name}</h4>
        <img src="${story.photoUrl}" alt="Foto cerita oleh ${
      story.name
    }" style="width:100%; max-height: 150px; object-fit: cover;">
        <p style="font-size: 0.9rem; margin-top: 5px;">${story.description}</p>
        <small>${showFormattedDate(story.createdAt)}</small>
      </div>
    `;
    marker.bindPopup(popupContent);

    this.#markers[story.id] = marker;

    marker.on("click", () => {
      this.#highlightListItem(story.id);
    });
  }

  #setupListClickAndKeyListener() {
    const listContainer = document.querySelector("#story-list-container");

    listContainer.addEventListener("click", (event) => {
      const storyItem = event.target.closest(".story-item");
      if (!storyItem) return;
      this.#handleStoryItemInteraction(storyItem);
    });

    listContainer.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        const storyItem = event.target.closest(".story-item");
        if (!storyItem) return;
        event.preventDefault();
        this.#handleStoryItemInteraction(storyItem);
      }
    });
  }

  #handleStoryItemInteraction(storyItem) {
    const id = storyItem.dataset.id;
    const lat = storyItem.dataset.lat;
    const lon = storyItem.dataset.lon;

    if (id && this.#markers[id]) {
      this.#map.setView([lat, lon], 15);
      this.#markers[id].openPopup();
      this.#highlightListItem(id);
    }
  }

  #highlightListItem(id) {
    document.querySelectorAll(".story-item").forEach((item) => {
      item.classList.remove("active");
    });

    const activeItem = document.querySelector(`.story-item[data-id="${id}"]`);
    if (activeItem) {
      activeItem.classList.add("active");
      activeItem.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }
}
