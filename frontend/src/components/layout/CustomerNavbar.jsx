import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useNotifications } from "../../context/NotificationContext";
import Avatar from "../ui/Avatar";
import { ROLES } from "../../data/constants";
import logo from "../../assets/images/logo2.png";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/medicines", label: "Medicines" },
];

const customerSpecificLinks = [
  { to: "/customer", label: "Dashboard" },
  { to: "/customer/orders", label: "My Orders" },
  { to: "/customer/prescriptions", label: "Prescriptions" },
];

export default function CustomerNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { notifications, unreadCount, markAllRead, clearAll } =
    useNotifications();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Combine public links with customer links if logged in as customer
  const links = [
    ...navLinks,
    ...(user?.role === ROLES.CUSTOMER ? customerSpecificLinks : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
    setProfileDropdownOpen(false);
  };

  const handleToggleNotif = () => {
    if (!notifOpen) markAllRead();
    setNotifOpen(!notifOpen);
    setProfileDropdownOpen(false);
  };

  const handleToggleProfile = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    setNotifOpen(false);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      <nav className="sticky top-0 z-50 glass sm:my-3 sm:mx-6 sm:rounded-2xl transition-all duration-500 shadow-glass-light border border-white/40">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4 sm:gap-8">
            {/* Logo area */}
            <div className="flex items-center gap-8 lg:gap-12">
              <Link to="/" className="shrink-0 flex items-center">
                <img
                  src={logo}
                  alt="MediReach Logo"
                  className="h-12 sm:h-14 w-auto bg-white p-1.5 sm:p-2 rounded-[1rem] sm:rounded-2xl shadow-sm transition-transform hover:scale-105"
                />
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden lg:flex items-center gap-2">
                {links.map((link) => {
                  const isActive =
                    location.pathname === link.to ||
                    (link.to !== "/" &&
                      location.pathname.startsWith(link.to + "/") &&
                      link.to !== "/customer");
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-charcoal/70 hover:bg-white/50 hover:text-charcoal"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3 sm:gap-5 ml-auto">
              {/* Wishlist Icon */}
              <Link
                to="/customer/wishlist"
                className="relative rounded-lg p-2 text-charcoal/70 hover:bg-charcoal/10 transition-colors hidden sm:block"
                title="Wishlist"
              >
                💜
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-soft-red text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link
                to="/customer/cart"
                className="relative rounded-lg p-2 text-charcoal/70 hover:bg-charcoal/10 transition-colors"
                title="Cart"
              >
                🛒
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>

              {/* Notification Bell */}
              {user && (
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
                        {unreadCount > 9 ? "9+" : unreadCount}
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
                      <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl glass shadow-glass-dark z-20 overflow-hidden page-enter border border-white/50">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-charcoal/10">
                          <p className="text-sm font-semibold text-charcoal">
                            Notifications
                          </p>
                          {notifications.length > 0 && (
                            <button
                              type="button"
                              onClick={clearAll}
                              className="text-xs text-primary hover:underline"
                            >
                              Clear all
                            </button>
                          )}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-charcoal/50 text-center">
                              No notifications yet.
                            </p>
                          ) : (
                            <ul className="divide-y divide-charcoal/5">
                              {notifications.map((n) => (
                                <li
                                  key={n.id}
                                  className="px-4 py-3 hover:bg-charcoal/[0.02] transition-colors"
                                >
                                  <div className="flex items-start gap-2.5">
                                    <span className="text-base mt-0.5">
                                      {n.type === "cart"
                                        ? "🛒"
                                        : n.type === "order"
                                          ? "📋"
                                          : "ℹ️"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-charcoal">
                                        {n.message}
                                      </p>
                                      {n.details && n.details.price && (
                                        <p className="text-xs text-primary font-medium mt-0.5">
                                          Rs.{" "}
                                          {(
                                            n.details.price *
                                            (n.details.qty || 1)
                                          ).toLocaleString()}
                                        </p>
                                      )}
                                      <p className="text-xs text-charcoal/40 mt-0.5">
                                        {formatTime(n.time)}
                                      </p>
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
              )}

              {/* Profile or Login/Register */}
              <div className="hidden sm:block ml-1 sm:ml-4 border-l border-charcoal/10 pl-4 sm:pl-6">
                {user ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleToggleProfile}
                      className="flex items-center gap-3 rounded-xl py-1.5 px-3 hover:bg-white/50 transition-colors shadow-sm border border-transparent hover:border-white/40"
                    >
                      <Avatar name={user.name} size="sm" />
                      <div className="text-left hidden md:block">
                        <p className="text-sm font-semibold text-charcoal leading-tight">
                          {user.name}
                        </p>
                        <p className="text-[11px] font-medium text-primary mt-0.5 leading-tight uppercase tracking-wide">
                          {user.role}
                        </p>
                      </div>
                      <svg
                        className={`w-4 h-4 text-charcoal/50 transition-transform hidden md:block ${profileDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {profileDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setProfileDropdownOpen(false)}
                          aria-hidden
                        />
                        <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl glass shadow-glass-dark z-20 p-2 page-enter border border-white/50">
                          <Link
                            to="/customer/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-white/60 rounded-xl transition-colors"
                          >
                            My Profile
                          </Link>
                          <Link
                            to="/customer/track"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-white/60 rounded-xl transition-colors"
                          >
                            Track Order
                          </Link>
                          <hr className="my-2 border-charcoal/10" />
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm font-medium text-soft-red hover:bg-soft-red/10 rounded-xl transition-colors"
                          >
                            Sign out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/login"
                      className="px-4 py-2 text-sm font-medium text-charcoal/80 hover:text-primary hover:bg-white/50 rounded-xl transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-charcoal hover:bg-charcoal/5 transition-colors"
              >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span
                    className={`block h-[2px] w-full bg-current transition-transform ${mobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
                  ></span>
                  <span
                    className={`block h-[2px] w-full bg-current transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`}
                  ></span>
                  <span
                    className={`block h-[2px] w-full bg-current transition-transform ${mobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
                  ></span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-24 bg-cream/95 backdrop-blur-xl">
          <div className="h-full overflow-y-auto p-4 flex flex-col page-enter">
            <div className="space-y-1 mb-8">
              {links.map((link) => {
                const isActive =
                  location.pathname === link.to ||
                  (link.to !== "/" &&
                    location.pathname.startsWith(link.to + "/") &&
                    link.to !== "/customer");
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-charcoal/80 hover:bg-charcoal/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <Link
                to="/customer/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="block sm:hidden px-4 py-3 rounded-xl text-base font-medium text-charcoal/80 hover:bg-charcoal/5"
              >
                Wishlist
              </Link>
              <Link
                to="/customer/track"
                onClick={() => setMobileMenuOpen(false)}
                className="block sm:hidden px-4 py-3 rounded-xl text-base font-medium text-charcoal/80 hover:bg-charcoal/5"
              >
                Track Order
              </Link>
            </div>

            <div className="mt-auto pt-6 border-t border-charcoal/10">
              {user ? (
                <div>
                  <Link
                    to="/customer/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 mb-4"
                  >
                    <Avatar name={user.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-charcoal">
                        {user.name}
                      </p>
                      <p className="text-xs text-charcoal/50">{user.email}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center px-4 py-3 rounded-xl text-soft-red font-medium hover:bg-soft-red/10 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-3 rounded-xl border border-charcoal/20 text-charcoal font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-3 rounded-xl bg-primary text-white font-medium shadow-md shadow-primary/20"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
