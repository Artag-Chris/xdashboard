"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Singleton de Socket.IO compartido por toda la app.
 * Conecta lazy al primer uso y vive mientras dure la pestaña.
 *
 * Solo `/v1/messages` usa Socket.IO (status real-time del envío).
 * El resto de servicios (scraping, email, scheduler, agent) van por SSE — ver `src/lib/sse/`.
 */
export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("getSocket() solo se usa en cliente, no en SSR");
  }
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_API_URL no está seteada (requerida para Socket.IO)");
    }
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
