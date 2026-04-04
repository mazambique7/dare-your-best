import { useEffect, useRef, useCallback, useState } from "react";

const WS_BASE = (import.meta.env.VITE_API_URL || "https://dareloop.ru")
  .replace(/^http/, "ws");

export interface WSEvent {
  type: "vote" | "comment" | "dare_status";
  room: string;
  data: any;
}

type EventHandler = (event: WSEvent) => void;

export function useWebSocket(dareId: number | null, onEvent: EventHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!dareId) return;

    const ws = new WebSocket(`${WS_BASE}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Join the dare room
      ws.send(JSON.stringify({ action: "join", room: `dare:${dareId}` }));
    };

    ws.onmessage = (e) => {
      try {
        const event: WSEvent = JSON.parse(e.data);
        onEvent(event);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 3 seconds
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [dareId, onEvent]);

  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { connected };
}
