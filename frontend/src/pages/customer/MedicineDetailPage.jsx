import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import Breadcrumb from '../../components/ui/Breadcrumb';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';

export default function MedicineDetailPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { id } = useParams();
  const [qty, setQty] = useState(1);
  const [medicine, setMedicine] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    api.getMedicine(id)
      .then((res) => {
        const med = res.data?.medicine;
        setMedicine(med);
        // Fetch same-category alternatives
        if (med) {
          api.getMedicines(`category=${encodeURIComponent(med.category)}`)
            .then((r) => {
              const others = (r.data?.medicines ?? []).filter((m) => m.id !== med.id).slice(0, 3);
              setAlternatives(others);
            })
            .catch(() => {});
        }
      })
      .catch(() => addToast('Medicine not found', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="page-enter py-12 text-center text-charcoal/60">Loading…</div>;
  }

  if (!medicine) {
    return (
      <div className="page-enter">
        <p className="text-charcoal/60">Medicine not found.</p>
        <Link to="/medicines" className="text-primary mt-2 inline-block">Back to catalog</Link>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      await addToCart(medicine, qty);
      addToast(`${medicine.name} added to cart`, 'cart', { name: medicine.name, qty, price: medicine.price });
      addNotification(`${medicine.name} added to cart`, 'cart', { name: medicine.name, qty, price: medicine.price });
    } catch (err) {
      addToast(err.message || 'Failed to add to cart', 'error');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const action = await toggleWishlist(medicine.id);
      addToast(
        action === 'added'
          ? `${medicine.name} added to wishlist`
          : `${medicine.name} removed from wishlist`,
        'info'
      );
    } catch (err) {
      addToast(err.message || 'Failed to update wishlist', 'error');
    }
  };

  return (
    <div className="page-enter space-y-8">
      <Breadcrumb
        items={[
          { to: '/', label: 'Home' },
          { to: '/medicines', label: 'Medicines' },
          { label: medicine.name },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-xl border border-charcoal/10 bg-white p-6">
          <div className="flex gap-6">
            <div className="h-48 w-48 shrink-0 overflow-hidden rounded-xl bg-charcoal/5">
              {medicine.imageUrl ? (
                <img
                  src={medicine.imageUrl}
                  alt={medicine.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className={`h-full w-full items-center justify-center text-5xl ${medicine.imageUrl ? 'hidden' : 'flex'}`}>💊</div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-fraunces text-2xl font-semibold text-charcoal">{medicine.name}</h1>
              <p className="text-charcoal/60 mt-1">{medicine.manufacturer} • {medicine.category}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {medicine.requiresPrescription && <Badge variant="soft-red">Prescription required</Badge>}
                {medicine.stock < 20 && <Badge variant="amber">Low stock</Badge>}
              </div>
            </div>
          </div>
          <p className="mt-6 text-charcoal/80">{medicine.description}</p>
          <div className="mt-6">
            <p className="text-sm font-medium text-charcoal">Stock</p>
            <ProgressBar value={medicine.stock} max={200} className="mt-1" />
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-charcoal/60">
            <span>Expiry: {medicine.expiryDate || '—'}</span>
            <span>Sold: {(medicine.soldCount ?? 0).toLocaleString()}</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-charcoal">Qty:</label>
              <input
                type="number"
                min={1}
                max={medicine.stock}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 rounded-lg border border-charcoal/20 px-2 py-1.5 text-center"
              />
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary-dark transition-colors"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`rounded-lg border px-6 py-2.5 font-medium transition-colors flex items-center gap-2 ${
                isInWishlist(medicine.id)
                  ? 'border-soft-red bg-soft-red/10 text-soft-red hover:bg-soft-red/20'
                  : 'border-charcoal/20 text-charcoal hover:bg-charcoal/5'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              {isInWishlist(medicine.id) ? 'In Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-charcoal/10 bg-white p-6 h-fit">
          <h3 className="font-fraunces font-semibold text-charcoal">Alternatives</h3>
          <ul className="mt-3 space-y-3">
            {alternatives.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/medicines/${m.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-charcoal/5 transition-colors"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-charcoal/5">
                    {m.imageUrl ? (
                      <img src={m.imageUrl} alt={m.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className={`h-full w-full items-center justify-center text-lg ${m.imageUrl ? 'hidden' : 'flex'}`}>💊</div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-charcoal truncate">{m.name}</p>
                    <p className="text-xs text-charcoal/60">Rs. {m.price}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {alternatives.length === 0 && <p className="text-sm text-charcoal/50">No alternatives in same category.</p>}
        </div>
      </div>

      <Modal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign In Required"
      >
        <div className="space-y-6">
          <p className="text-charcoal/80 text-center">
            Please sign in or create an account to save medicines to your cart and wishlist.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              state={{ from: location }}
              className="w-full rounded-xl bg-primary px-4 py-3 text-center font-medium text-white hover:bg-primary-dark transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              state={{ from: location }}
              className="w-full rounded-xl border border-charcoal/20 px-4 py-3 text-center font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
