import CONFIG from "/scripts/config.js";

function getAuthToken() {
  return sessionStorage.getItem("token");
}

async function handleResponse(response) {
  const json = await response.json();
  if (!response.ok || json.error) {
    throw new Error(json.message || `HTTP error! status: ${response.status}`);
  }
  return json;
}

class ApiService {
  static async login({ email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  }

  static async register({ name, email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(response);
  }

  static async getAllStories(page = 1, size = 10) {
    const token = getAuthToken();
    if (!token) throw new Error("No auth token found. Please login.");
    const response = await fetch(
      `${CONFIG.BASE_URL}/stories?page=${page}&size=${size}&location=0`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const jsonResponse = await handleResponse(response);
    return jsonResponse.listStory;
  }

  static async getAllStoriesWithLocation() {
    const token = getAuthToken();
    if (!token) throw new Error("No auth token found. Please login.");
    const response = await fetch(`${CONFIG.BASE_URL}/stories?location=1`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const jsonResponse = await handleResponse(response);
    return jsonResponse.listStory;
  }

  static async addNewStory({ description, photo, lat, lon }) {
    const token = getAuthToken();
    if (!token) throw new Error("No auth token found. Please login.");
    if (!navigator.onLine) throw new Error("OFFLINE_MODE");
    const formData = new FormData();
    formData.append("description", description);
    formData.append("lat", lat);
    formData.append("lon", lon);
    if (photo instanceof Blob && !(photo instanceof File)) {
      formData.append("photo", photo, "camera-capture.jpg");
    } else {
      formData.append("photo", photo);
    }
    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return handleResponse(response);
  }

  static async getStoryDetail(id) {
    const token = getAuthToken();
    if (!token) throw new Error("No auth token found. Please login.");
    const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const jsonResponse = await handleResponse(response);
    return jsonResponse.story;
  }

  static async subscribePushNotification({ endpoint, keys }) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No auth token found. Please login.");
    }

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint,
        keys,
      }),
    });

    return handleResponse(response);
  }

  static async unsubscribePushNotification(endpoint) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No auth token found. Please login.");
    }

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint }),
    });

    return handleResponse(response);
  }
}

export default ApiService;
