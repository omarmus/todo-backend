import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  userId: string;
  type: "TASK_CREATED" | "TASK_COMPLETED" | "TASK_DUE_SOON";
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

const WS_URL = import.meta.env.VITE_WS_URL as string;

export function useNotifications() {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Load existing notifications via REST
  const loadNotifications = useCallback(async () => {
    if (!user || !token) return;
    try {
      const res = await fetch(`${WS_URL.replace(/^ws/, "http")}/notifications/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnread(data.filter((n: Notification) => !n.read).length);
      }
    } catch {
      // notification service might not be running
    }
  }, [user, token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // WebSocket connection
  useEffect(() => {
    if (!user || !token) return;

    const socket = io(WS_URL, {
      query: { userId: user.id },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", { userId: user.id });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnread((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token]);

  const markAsRead = useCallback(async (id: string) => {
    if (!token) return;
    try {
      await fetch(`${WS_URL.replace(/^ws/, "http")}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // notification service might not be running
    }
  }, [token]);

  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    await Promise.all(unreadIds.map((id) => markAsRead(id)));
  }, [token, notifications, markAsRead]);

  return {
    notifications,
    unread,
    connected,
    markAsRead,
    markAllAsRead,
  };
}
