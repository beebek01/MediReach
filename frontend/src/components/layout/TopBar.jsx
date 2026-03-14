import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

export default function TopBar({
  title,
  searchPlaceholder = "Search...",
  onSearch,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const handleToggleNotif = () => {
    if (!notifOpen) markAllRead();
    setNotifOpen(!notifOpen);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const profilePath =
    user?.role === "admin"
      ? "/admin/profile"
      : user?.role === "pharmacist"
        ? "/pharmacist/profile"
        : "/customer/profile";

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch?.(search);
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-white/40 glass sm:my-2 sm:mx-4 sm:rounded-2xl px-4 py-3 lg:px-6 transition-all duration-300">
      <h1 className="font-fraunces text-xl font-semibold text-charcoal truncate">
        {title}
      </h1>
      <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl">
        {onSearch && (
          <form
            onSubmit={handleSearch}
            className="hidden sm:block flex-1 max-w-xs"
          >
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-charcoal/20 bg-white px-3 py-2 text-sm placeholder:text-charcoal/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none"
            />
          </form>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={handleToggleNotif}
            className="relative rounded-lg p-2 text-charcoal/70 hover:bg-charcoal/10 transition-colors"
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-soft-red text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotifOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-charcoal/10 bg-white shadow-card z-20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-charcoal/10">
                  <p className="text-sm font-semibold text-charcoal">Notifications</p>
                  {notifications.length > 0 && (
                    <button type="button" onClick={clearAll} className="text-xs text-primary hover:underline">Clear all</button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-charcoal/50 text-center">No notifications yet.</p>
                  ) : (
                    <ul className="divide-y divide-charcoal/5">
                      {notifications.map((n) => (
                        <li key={n.id} className="px-4 py-3 hover:bg-charcoal/[0.02] transition-colors">
                          <div className="flex items-start gap-2.5">
                            <span className="text-base mt-0.5">{n.type === 'cart' ? '🛒' : n.type === 'order' ? '📋' : 'ℹ️'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-charcoal">{n.message}</p>
                              {n.details && n.details.price && (
                                <p className="text-xs text-primary font-medium mt-0.5">Rs. {(n.details.price * (n.details.qty || 1)).toLocaleString()}</p>
                              )}
                              <p className="text-xs text-charcoal/40 mt-0.5">{formatTime(n.time)}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate(profilePath)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-charcoal/10 transition-colors cursor-pointer"
        >
          <Avatar name={user?.name} size="sm" />
          <span className="hidden sm:block text-sm font-medium text-charcoal truncate max-w-[120px]">
            {user?.name}
          </span>
        </button>
      </div>
    </header>
  );
}
