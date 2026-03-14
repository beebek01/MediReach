import { Outlet, useMatches } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import CustomerNavbar from "./CustomerNavbar";
import MediBot from "./MediBot";
import Footer from "./Footer";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";

export default function DashboardLayout() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const matches = useMatches();
  const current = matches.find((m) => m.handle?.title);
  const title = current?.handle?.title ?? "Dashboard";
  const searchPlaceholder = current?.handle?.searchPlaceholder;
  const pendingRx = 0;

  const isDashboardRole = user?.role === "admin" || user?.role === "pharmacist";
  const showFooterAndBot = !user || user.role === "customer";

  const badgeCounts = {
    cart: totalItems ?? 0,
    rx: pendingRx,
    wishlist: wishlistCount ?? 0,
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {isDashboardRole ? (
        <>
          <Sidebar badgeCounts={badgeCounts} />
          <div className="lg:pl-64 flex flex-col min-h-screen">
            <TopBar title={title} searchPlaceholder={searchPlaceholder} />
            <main className="p-4 lg:p-6 page-enter flex-1">
              <Outlet />
            </main>
          </div>
        </>
      ) : (
        <>
          <CustomerNavbar />
          <main className="p-4 lg:p-6 page-enter flex-1 flex flex-col">
            <Outlet />
          </main>
          {showFooterAndBot && <Footer />}
          {showFooterAndBot && <MediBot />}
        </>
      )}
    </div>
  );
}
