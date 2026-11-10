import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  AlertTriangle,
  CreditCard,
  RefreshCcw,
  Shield,
  X,
} from "lucide-react";
import {
  notificationService,
  type NotificationItem,
  type NotificationType,
} from "@/services/notificationService";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "ORDER_NEW":
      return <ShoppingBag className="h-4 w-4 text-blue-500 shrink-0" />;
    case "STOCK_LOW":
      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    case "PAYMENT_PENDING":
      return <CreditCard className="h-4 w-4 text-purple-500 shrink-0" />;
    case "REFUND_REQUEST":
      return <RefreshCcw className="h-4 w-4 text-rose-500 shrink-0" />;
    case "SYSTEM_SECURITY":
      return <Shield className="h-4 w-4 text-emerald-500 shrink-0" />;
    default:
      return <Bell className="h-4 w-4 text-primary shrink-0" />;
  }
};

const formatTimeAgo = (dateStr: string): string => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
};

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const items = await notificationService.getNotifications();
      setNotifications(items);
      const unread = items.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Gagal memuat notifikasi:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll setiap 15 detik
    return () => clearInterval(interval);
  }, []);

  // Tutup dropdown saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
    await fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    await fetchNotifications();
  };

  const displayedNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
        title="Pusat Notifikasi"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold text-foreground">Pusat Notifikasi</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1 px-1.5 py-0.5"
                >
                  <CheckCheck className="h-3 w-3" />
                  Tandai Semua
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
                aria-label="Tutup notifikasi"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-card text-[11px]">
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(false)}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                !filterUnreadOnly
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(true)}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                filterUnreadOnly
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto opacity-30" />
                <p className="text-xs font-medium text-foreground">Tidak ada notifikasi</p>
                <p className="text-[11px] text-muted-foreground">
                  Semua aktivitas operasional berjalan lancar.
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={(e) => handleMarkAsRead(notif.id, e)}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 items-start ${
                    !notif.is_read
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/40 opacity-75"
                  }`}
                >
                  <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80 font-mono">
                      {formatTimeAgo(notif.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
