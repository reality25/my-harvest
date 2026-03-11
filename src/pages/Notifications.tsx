import AppLayout from "@/components/AppLayout";
import { Heart, MessageCircle, UserPlus, ShoppingBag, AlertTriangle, Check, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, getCurrentUser } from "@/lib/dataService";
import EmptyState from "@/components/ui/EmptyState";

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  marketplace: ShoppingBag,
  alert: AlertTriangle,
};

const colorMap = {
  like: "text-destructive bg-destructive/10",
  comment: "text-primary bg-primary/10",
  follow: "text-accent-foreground bg-accent/20",
  marketplace: "text-primary bg-primary/10",
  alert: "text-destructive bg-destructive/10",
};

const Notifications = () => {
  const user = getCurrentUser();
  const [notifications, setNotifications] = useState(() => getNotifications(user?.id));

  const refresh = () => setNotifications(getNotifications(user?.id));

  const handleMarkAllRead = () => {
    if (user) markAllNotificationsRead(user.id);
    refresh();
  };

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    refresh();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-sm font-medium text-primary"
            >
              <Check className="h-4 w-4" /> Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up! Notifications will appear here when someone interacts with your content."
          />
        ) : (
          <>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
              </p>
            )}

            <div className="space-y-2">
              {notifications.map((notif, i) => {
                const Icon = iconMap[notif.type];
                return (
                  <motion.button
                    key={notif.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleMarkRead(notif.id)}
                    className={`flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition-colors ${
                      notif.read ? "bg-transparent hover:bg-muted/50" : "bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    {notif.avatar ? (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {notif.avatar}
                      </div>
                    ) : (
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorMap[notif.type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{notif.title}</span>{" "}
                        {notif.message}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(notif.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
