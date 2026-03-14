import { Link } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import Badge from "../../components/ui/Badge";

export default function WishlistPage() {
  const { items, loading, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const handleRemove = async (item) => {
    try {
      await removeFromWishlist(item.medicineId);
      addToast(`${item.name} removed from wishlist`, "info");
    } catch (err) {
      addToast(err.message || "Failed to remove item", "error");
    }
  };

  const handleAddToCart = async (e, item) => {
    e.preventDefault();
    try {
      await addToCart({ id: item.medicineId }, 1);
      addToast(`${item.name} added to cart`, "cart", {
        name: item.name,
        qty: 1,
        price: item.price,
      });
    } catch (err) {
      addToast(err.message || "Failed to add to cart", "error");
    }
  };

  const handleClear = async () => {
    try {
      await clearWishlist();
      addToast("Wishlist cleared", "info");
    } catch (err) {
      addToast(err.message || "Failed to clear wishlist", "error");
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-charcoal/60">
        Loading your wishlist…
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-fraunces text-2xl font-semibold text-charcoal">
            My Wishlist
          </h1>
          <p className="text-sm text-charcoal/60 mt-1">
            {items.length} {items.length === 1 ? "item" : "items"} saved
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-soft-red/30 px-4 py-2 text-sm font-medium text-soft-red hover:bg-soft-red/10 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-charcoal/20 py-16 text-center">
          <div className="text-5xl mb-4">💜</div>
          <h3 className="font-fraunces text-lg font-semibold text-charcoal mb-2">
            Your wishlist is empty
          </h3>
          <p className="text-charcoal/60 mb-6 max-w-sm mx-auto">
            Save medicines you&apos;re interested in and come back to them
            anytime.
          </p>
          <Link
            to="/medicines"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
          >
            Browse Medicines
          </Link>
        </div>
      )}

      {/* Wishlist grid */}
      {items.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl border border-charcoal/10 bg-white p-5 shadow-card hover-lift transition-all duration-300 flex flex-col relative"
            >
              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-1.5 text-soft-red shadow-sm hover:bg-soft-red hover:text-white transition-colors"
                title="Remove from wishlist"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </button>

              <Link
                to={`/medicines/${item.medicineId}`}
                className="flex flex-col flex-1"
              >
                {/* Image */}
                <div className="mb-3 h-40 w-full overflow-hidden rounded-lg bg-charcoal/5">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling.style.display =
                          "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`h-full w-full items-center justify-center text-4xl ${item.imageUrl ? "hidden" : "flex"}`}
                  >
                    💊
                  </div>
                </div>

                {/* Info */}
                <h3 className="font-fraunces font-semibold text-charcoal group-hover:text-primary transition-colors line-clamp-2">
                  {item.name}
                </h3>
                <p className="text-sm text-charcoal/60 mt-0.5">
                  {item.manufacturer} • {item.category}
                </p>
              </Link>

              {/* Price & Actions */}
              <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                <span className="font-fraunces font-semibold text-primary">
                  Rs. {item.price}
                </span>
                <div className="flex items-center gap-2">
                  {item.stock === 0 && (
                    <Badge variant="charcoal">Out of stock</Badge>
                  )}
                  {item.stock > 0 && item.stock < 20 && (
                    <Badge variant="amber">Low stock</Badge>
                  )}
                  {item.requiresPrescription && (
                    <Badge variant="soft-red">Rx</Badge>
                  )}
                  {item.stock > 0 && (
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, item)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark transition-colors"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
