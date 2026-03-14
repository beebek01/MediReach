import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MEDICINE_CATEGORIES } from '../../data/constants';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';

export default function MedicineCatalog() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('name');
  const [medicines, setMedicines] = useState([]);
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
    api.getMedicines()
      .then((res) => setMedicines(res.data?.medicines ?? []))
      .catch(() => addToast('Failed to load medicines', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = medicines.filter(
      (m) =>
        (m.name.toLowerCase().includes(search.toLowerCase()) ||
          (m.manufacturer || '').toLowerCase().includes(search.toLowerCase())) &&
        (!category || m.category === category)
    );
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'price-low') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [medicines, search, category, sort]);

  const handleAddToCart = async (e, medicine) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      await addToCart(medicine, 1);
      addToast(`${medicine.name} added to cart`, 'cart', { name: medicine.name, qty: 1, price: medicine.price });
      addNotification(`${medicine.name} added to cart`, 'cart', { name: medicine.name, qty: 1, price: medicine.price });
    } catch (err) {
      addToast(err.message || 'Failed to add to cart', 'error');
    }
  };

  const handleToggleWishlist = async (e, medicine) => {
    e.preventDefault();
    e.stopPropagation();
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
    <div className="space-y-8 page-enter pt-4">
      {/* ── Filtering & Search ────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 mb-2">
        {/* Search */}
        <div className="glass flex-1 rounded-2xl p-2 flex items-center shadow-glass">
          <svg className="w-5 h-5 text-charcoal/50 ml-3 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search verified medicines..."
            className="w-full bg-transparent border-none outline-none text-charcoal placeholder-charcoal/40 py-2 px-2"
          />
        </div>

        {/* Categories */}
        <div className="glass rounded-2xl p-2 flex flex-wrap lg:flex-nowrap gap-2 items-center shadow-glass overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
              !category ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-charcoal/70 hover:bg-white/50'
            }`}
          >
            All Medicines
          </button>
          {MEDICINE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                category === c ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-charcoal/70 hover:bg-white/50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="glass rounded-2xl p-2 flex items-center shadow-glass shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent border-none outline-none text-charcoal py-2 px-4 cursor-pointer font-medium appearance-none"
          >
            <option value="name">Sort A to Z</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
          <svg className="w-4 h-4 text-charcoal/50 mr-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-charcoal/60">Loading medicines…</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((m) => (
              <Link
                key={m.id}
                to={`/medicines/${m.id}`}
                className="group rounded-[1.5rem] bg-white p-4 shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden border border-charcoal/5"
              >
                {/* Wishlist heart button */}
                <button
                  type="button"
                  onClick={(e) => handleToggleWishlist(e, m)}
                  className={`absolute top-5 right-5 z-10 rounded-full p-2 backdrop-blur-md shadow-sm transition-all duration-300 scale-90 group-hover:scale-100 ${
                    isInWishlist(m.id)
                      ? 'bg-soft-red text-white hover:bg-soft-red/80'
                      : 'bg-white/80 text-charcoal/40 hover:text-soft-red hover:bg-white'
                  }`}
                  title={isInWishlist(m.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                </button>
                
                <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br from-charcoal/5 to-transparent flex items-center justify-center group-hover:shadow-inner transition-all duration-300">
                  {m.imageUrl ? (
                    <img
                      src={m.imageUrl}
                      alt={m.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div className={`h-full w-full items-center justify-center text-5xl opacity-50 ${m.imageUrl ? 'hidden' : 'flex'}`}>💊</div>
                  
                  {/* Quick Add overlay */}
                  <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, m)}
                      className="rounded-full bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary-dark transition-all transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 duration-300 flex items-center gap-2 shadow-lg hover:shadow-primary/50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Quick Add
                    </button>
                  </div>
                </div>

                <div className="flex flex-col flex-1 px-1">
                  <h3 className="font-fraunces text-lg font-bold text-charcoal group-hover:text-primary transition-colors line-clamp-2">
                    {m.name}
                  </h3>
                  <p className="text-sm text-charcoal/60 mt-1 mb-4">{m.manufacturer} • {m.category}</p>
                  
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2 border-t border-charcoal/5">
                    <div>
                      <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-0.5">Price</p>
                      <span className="font-fraunces text-xl font-bold text-primary">Rs. {m.price}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pb-1">
                      {m.stock < 20 && <Badge variant="amber">Low stock</Badge>}
                      {m.requiresPrescription && <Badge variant="soft-red">Rx</Badge>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {filtered.length === 0 && medicines.length > 0 && (
            <div className="rounded-xl border border-dashed border-charcoal/20 py-12 text-center text-charcoal/60">
              No medicines match your filters.
            </div>
          )}
          {medicines.length === 0 && (
            <div className="rounded-xl border border-dashed border-charcoal/20 py-12 text-center text-charcoal/60">
              No medicines available yet. Check back later!
            </div>
          )}
        </>
      )}

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
