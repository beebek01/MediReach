import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import api from "../services/api";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { accessToken, isAuthenticated, user } = useAuth();
  const [items, setItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const isCustomer = user?.role === "customer";

  const fetchWishlist = useCallback(async () => {
    if (!accessToken || !isCustomer) {
      setItems([]);
      setWishlistIds(new Set());
      return;
    }
    try {
      setLoading(true);
      const res = await api.getWishlist(accessToken);
      const wishlist = res.data?.wishlist;
      setItems(wishlist?.items ?? []);
      setWishlistIds(new Set((wishlist?.items ?? []).map((i) => i.medicineId)));
    } catch {
      setItems([]);
      setWishlistIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [accessToken, isCustomer]);

  useEffect(() => {
    if (isAuthenticated && isCustomer) fetchWishlist();
    else {
      setItems([]);
      setWishlistIds(new Set());
    }
  }, [isAuthenticated, isCustomer, fetchWishlist]);

  const toggleWishlist = useCallback(
    async (medicineId) => {
      if (!accessToken) return;
      const res = await api.toggleWishlist({ medicineId }, accessToken);
      const wishlist = res.data?.wishlist;
      setItems(wishlist?.items ?? []);
      setWishlistIds(new Set((wishlist?.items ?? []).map((i) => i.medicineId)));
      return wishlist?.action;
    },
    [accessToken],
  );

  const removeFromWishlist = useCallback(
    async (medicineId) => {
      if (!accessToken) return;
      const res = await api.removeFromWishlist(medicineId, accessToken);
      const wishlist = res.data?.wishlist;
      setItems(wishlist?.items ?? []);
      setWishlistIds(new Set((wishlist?.items ?? []).map((i) => i.medicineId)));
    },
    [accessToken],
  );

  const clearWishlist = useCallback(async () => {
    if (!accessToken) return;
    await api.clearWishlist(accessToken);
    setItems([]);
    setWishlistIds(new Set());
  }, [accessToken]);

  const isInWishlist = useCallback(
    (medicineId) => wishlistIds.has(medicineId),
    [wishlistIds],
  );

  const value = {
    items,
    itemCount: items.length,
    wishlistIds,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
    fetchWishlist,
    loading,
  };

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx)
    throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
