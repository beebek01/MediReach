import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import { ROLES } from "../../data/constants";
import logo from "../../assets/images/logo2.png";

const pharmacistNav = [
  { to: "/pharmacist", label: "Dashboard", icon: "📊" },
  { to: "/pharmacist/inventory", label: "Inventory", icon: "📦" },
  {
    to: "/pharmacist/verify",
    label: "Verify Prescriptions",
    icon: "✅",
    badge: "rx",
  },
  { to: "/pharmacist/orders", label: "Manage Orders", icon: "📋" },
  { to: "/pharmacist/profile", label: "Profile", icon: "👤" },
];

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: "📊" },
  { to: "/admin/analytics", label: "Analytics", icon: "📈" },
  { to: "/admin/users", label: "User Management", icon: "👥" },
  { to: "/admin/medicines", label: "Medicine Management", icon: "💊" },
  { to: "/admin/orders", label: "All Orders", icon: "📋" },
  { to: "/admin/profile", label: "Profile", icon: "👤" },
];

function getNav(role) {
  if (role === ROLES.ADMIN) return adminNav;
  if (role === ROLES.PHARMACIST) return pharmacistNav;
  return [];
}

export default function Sidebar({ badgeCounts = {} }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user || user.role === ROLES.CUSTOMER) return null;

  const nav = getNav(user?.role);
  const base =
    user?.role === ROLES.PHARMACIST
      ? "/pharmacist"
      : user?.role === ROLES.ADMIN
        ? "/admin"
        : "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 rounded-lg bg-charcoal text-cream p-2 shadow-lg"
        aria-label="Open menu"
      >
        ☰
      </button>
      <div
        className={`fixed inset-y-0 left-0 z-[60] w-64 bg-charcoal border-r border-white/5 shadow-2xl text-cream flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-charcoal">
          <Link to={base} className="flex items-center shrink-0">
            <img
              src={logo}
              alt="MediReach Logo"
              className="h-16 sm:h-20 w-auto bg-white p-2 rounded-2xl shadow-sm"
            />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-white/10"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 bg-charcoal">
          {nav.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== base && location.pathname.startsWith(item.to + "/"));
            const count =
              item.badge === "cart"
                ? badgeCounts.cart
                : item.badge === "rx"
                  ? badgeCounts.rx
                  : item.badge === "wishlist"
                    ? badgeCounts.wishlist
                    : null;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-cream shadow-md shadow-primary/20 translate-x-1"
                    : "text-cream hover:bg-white/5 hover:translate-x-1"
                }`}
              >
                <span>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {count != null && count > 0 && (
                  <span className="rounded-full bg-soft-red px-2 py-0.5 text-xs text-white">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 bg-charcoal">
          <Link
            to={`${base}/profile`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-cream truncate">
                {user.name}
              </p>
              <p className="text-xs text-cream/60 truncate">{user.email}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg px-3 py-2 text-sm text-cream/80 hover:bg-soft-red/20 hover:text-soft-red transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
      {open && (
        <div
          className="fixed inset-0 bg-charcoal/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
