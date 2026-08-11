export const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:3000"
      : "https://ge-chat-app-websockets-backend.trainees.hosting.cyf.academy";
