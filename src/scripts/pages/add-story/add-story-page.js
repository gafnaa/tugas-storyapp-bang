import ApiService from "../../data/api";
import syncService from "../../utils/sync-service";
import indexedDBService from "../../utils/indexeddb-service";

export default class AddStoryPage {
  #map = null;
  #marker = null;
  #stream = null;
  #videoEl = null;
  #canvasEl = null;
  #capturedImageBlob = null;
  #formEl = null;
  #descInput = null;
  #photoInput = null;
  #latInput = null;
  #lonInput = null;
  #submitButton = null;
  #formMessage = null;

  async render() {
    return `
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
    `;
  }

  async afterRender() {
    this.#formEl = document.querySelector("#add-story-form");
    this.#descInput = document.querySelector("#description");
    this.#photoInput = document.querySelector("#photo");
    this.#latInput = document.querySelector("#latitude");
    this.#lonInput = document.querySelector("#longitude");
    this.#submitButton = document.querySelector("#submit-button");
    this.#formMessage = document.querySelector("#form-message");

    // Initialize IndexedDB
    try {
      await indexedDBService.init();
    } catch (error) {
      console.error("Failed to initialize IndexedDB:", error);
    }

    this.#initMap();
    this.#initCoordinateInputs();
    this.#initCamera();
    this.#initValidationListeners();
    this.#initFormSubmission();

    window.addEventListener("hashchange", this.#stopCameraStream, {
      once: true,
    });
  }

  #initMap() {
    this.#map = L.map("add-story-map").setView([-2.5489, 118.0149], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      this.#latInput.value = lat.toFixed(6);
      this.#lonInput.value = lng.toFixed(6);

      this.#updateMapMarker(lat, lng);

      this.#validateField(this.#latInput, "Latitude tidak boleh kosong.");
      this.#validateField(this.#lonInput, "Longitude tidak boleh kosong.");
    });
  }

  #updateMapMarker(lat, lon, zoom = null) {
    if (!this.#marker) {
      this.#marker = L.marker([lat, lon], {
        keyboard: true,
        alt: "Lokasi cerita baru",
      }).addTo(this.#map);
    } else {
      this.#marker.setLatLng([lat, lon]);
    }

    if (zoom) {
      this.#map.setView([lat, lon], zoom);
    } else {
      this.#map.panTo([lat, lon]);
    }
  }

  #initCoordinateInputs() {
    const updateMarkerFromInputs = () => {
      const lat = parseFloat(this.#latInput.value);
      const lon = parseFloat(this.#lonInput.value);

      if (
        !isNaN(lat) &&
        !isNaN(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      ) {
        this.#updateMapMarker(lat, lon, 13);
        this.#validateField(this.#latInput, "Latitude tidak boleh kosong.");
        this.#validateField(this.#lonInput, "Longitude tidak boleh kosong.");
      }
    };

    this.#latInput.addEventListener("change", updateMarkerFromInputs);
    this.#lonInput.addEventListener("change", updateMarkerFromInputs);
  }

  #initCamera() {
    this.#videoEl = document.querySelector("#video-feed");
    this.#canvasEl = document.querySelector("#canvas-preview");
    const cameraButton = document.querySelector("#camera-button");
    const snapButton = document.querySelector("#snap-button");
    const retakeButton = document.querySelector("#retake-button");

    const cameraContainer = document.querySelector("#camera-container");
    const previewContainer = document.querySelector("#preview-container");

    cameraButton.addEventListener("click", async () => {
      this.#capturedImageBlob = null;
      previewContainer.style.display = "none";
      this.#photoInput.value = null;

      try {
        this.#stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        this.#videoEl.srcObject = this.#stream;
        cameraContainer.style.display = "block";
        cameraButton.textContent = "Tutup Kamera";
      } catch (err) {
        console.error("Error accessing camera:", err);
        this.#showMessage(
          "error",
          "Gagal mengakses kamera. Pastikan izin telah diberikan."
        );
      }
    });

    snapButton.addEventListener("click", () => {
      this.#canvasEl.width = this.#videoEl.videoWidth;
      this.#canvasEl.height = this.#videoEl.videoHeight;
      const context = this.#canvasEl.getContext("2d");
      context.drawImage(
        this.#videoEl,
        0,
        0,
        this.#canvasEl.width,
        this.#canvasEl.height
      );

      this.#canvasEl.toBlob((blob) => {
        this.#capturedImageBlob = blob;
        this.#validateField(this.#photoInput, "Foto tidak boleh kosong.");
      }, "image/jpeg");

      previewContainer.style.display = "block";
      cameraContainer.style.display = "none";
      this.#stopCameraStream();
      cameraButton.textContent = "Buka Kamera";
    });

    retakeButton.addEventListener("click", () => {
      this.#capturedImageBlob = null;
      previewContainer.style.display = "none";
      cameraButton.click();
      this.#validateField(this.#photoInput, "Foto tidak boleh kosong.");
    });
  }

  #stopCameraStream = () => {
    if (this.#stream) {
      this.#stream.getTracks().forEach((track) => track.stop());
      this.#stream = null;
    }
  };

  #initFormSubmission() {
    this.#formEl.addEventListener("submit", async (event) => {
      event.preventDefault();

      const isValid = this.#validateForm();
      if (!isValid) {
        this.#showMessage(
          "error",
          "Semua field wajib diisi. Mohon periksa kembali."
        );
        return;
      }

      this.#submitButton.disabled = true;
      this.#submitButton.textContent = "Mengupload...";
      this.#showMessage();

      try {
        const description = this.#descInput.value;
        const lat = this.#latInput.value;
        const lon = this.#lonInput.value;
        const photo = this.#capturedImageBlob || this.#photoInput.files[0];

        try {
          await ApiService.addNewStory({ description, photo, lat, lon });
          this.#showMessage("success", "Cerita berhasil ditambahkan!");
        } catch (error) {
          // Handle offline mode
          if (error.message === "OFFLINE_MODE" || !navigator.onLine) {
            // Convert photo to base64 for storage
            const photoBase64 = await this.#blobToBase64(photo);
            const photoName =
              photo instanceof File ? photo.name : "camera-capture.jpg";

            // Queue for sync
            await syncService.queueStoryForSync({
              description,
              photo: photoBase64,
              photoName: photoName,
              lat,
              lon,
            });

            this.#showMessage(
              "success",
              "Cerita disimpan secara offline. Akan disinkronkan saat koneksi tersedia."
            );
          } else {
            throw error;
          }
        }

        this.#formEl.reset();
        this.#marker?.remove();
        this.#capturedImageBlob = null;
        document.querySelector("#preview-container").style.display = "none";

        setTimeout(() => {
          location.hash = "#/map";
        }, 2000);
      } catch (error) {
        this.#showMessage(
          "error",
          error.message || "Gagal menambahkan cerita"
        );
      } finally {
        this.#submitButton.disabled = false;
        this.#submitButton.textContent = "Upload Cerita";
      }
    });
  }

  #initValidationListeners() {
    this.#descInput.addEventListener("input", () => {
      this.#validateField(this.#descInput, "Deskripsi tidak boleh kosong.");
    });
    this.#photoInput.addEventListener("change", () => {
      this.#validateField(this.#photoInput, "Foto tidak boleh kosong.");
    });
  }

  #validateForm() {
    const isDescValid = this.#validateField(
      this.#descInput,
      "Deskripsi tidak boleh kosong."
    );
    const isPhotoValid = this.#validateField(
      this.#photoInput,
      "Foto tidak boleh kosong."
    );
    const isLatValid = this.#validateField(
      this.#latInput,
      "Latitude tidak boleh kosong."
    );
    const isLonValid = this.#validateField(
      this.#lonInput,
      "Longitude tidak boleh kosong."
    );
    return isDescValid && isPhotoValid && isLatValid && isLonValid;
  }

  /**
   * Convert Blob to Base64 string
   */
  async #blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1]; // Remove data:image/...;base64, prefix
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  #validateField(inputElement, errorMessage) {
    let isValid = false;

    if (inputElement.type === "file") {
      isValid =
        inputElement.files.length > 0 || this.#capturedImageBlob !== null;
    } else {
      isValid = inputElement.value.trim() !== "";
    }

    const formGroup = document.querySelector(`#${inputElement.id}-group`);
    const errorText = formGroup.querySelector(".error-text");

    if (!isValid) {
      formGroup.classList.add("invalid");
      errorText.textContent = errorMessage;
      return false;
    }

    formGroup.classList.remove("invalid");
    return true;
  }

  #showMessage(type = "", message = "") {
    this.#formMessage.className = "";
    if (type && message) {
      this.#formMessage.classList.add(type);
      this.#formMessage.textContent = message;
      this.#formMessage.style.display = "block";
    } else {
      this.#formMessage.style.display = "none";
    }
  }
}
