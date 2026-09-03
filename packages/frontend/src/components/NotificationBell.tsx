import { useState, useRef, useEffect } from "react";
import type { Notification } from "../hooks/useNotifications";

const typeIcons: Record<string, string> = {
  TASK_CREATED: "📋",
  TASK_COMPLETED: "✅",
  TASK_DUE_SOON: "⏰",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface Props {
  notifications: Notification[];
  unread: number;
  connected: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export default function NotificationBell({
  notifications,
  unread,
  connected,
  onMarkRead,
  onMarkAllRead,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        {!connected && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full" title="Desconectado" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-900">
              Notificaciones
              {unread > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">({unread} nuevas)</span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Marcar todo leído
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Sin notificaciones
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && onMarkRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${
                    n.read
                      ? "bg-white hover:bg-gray-50"
                      : "bg-blue-50/50 hover:bg-blue-50"
                  }`}
                >
                  <span className="text-base mt-0.5">{typeIcons[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${n.read ? "text-gray-700" : "text-gray-900"}`}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
