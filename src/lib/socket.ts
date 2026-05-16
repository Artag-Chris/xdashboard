"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

const BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
  : "";

export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("getSocket() solo se usa en cliente, no en SSR");
  }
  if (!socket) {
    const url = BASE || undefined;
    socket = io(url, {
      transports: ["websocket"],
      autoConnect: true,
    });
    socket.on("connect", () => console.log("[ws] connected", socket?.id));
    socket.on("disconnect", () => console.log("[ws] disconnected"));
    socket.on("connect_error", (e) => console.warn("[ws] connect_error", e.message));
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
