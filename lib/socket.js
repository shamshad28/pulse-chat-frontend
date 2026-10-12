import { io } from "socket.io-client";

export const getSocketUrl = () => {
  const customUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "localhost";
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";

    // 1. If running on desktop localhost
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return customUrl ? customUrl.replace(/\/+$/, "") : "http://localhost:5000";
    }

    // 2. If accessing via local network IP (e.g. phone on same Wi-Fi)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return `${protocol}//${hostname}:5000`;
    }

    // 3. If running on remote production (e.g. *.vercel.app)
    if (customUrl && !customUrl.includes("localhost") && !customUrl.includes("127.0.0.1")) {
      return customUrl.replace(/\/+$/, "");
    }

    // Default to current origin
    return window.location.origin;
  }

  if (customUrl && !customUrl.includes("localhost") && !customUrl.includes("127.0.0.1")) {
    return customUrl.replace(/\/+$/, "");
  }
  return "http://localhost:5000";
};

const socket = io(getSocketUrl(), {
  autoConnect: false,
  withCredentials: true,
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export const connectSocket = (user) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("chat_token");
    socket.auth = {
      token,
      userId: user?._id || user?.id,
    };
  }

  if (!socket.connected) {
    socket.connect();
  }

  if (user) {
    socket.emit("setup", user);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;