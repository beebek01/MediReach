import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PAYMENT_METHODS } from '../../data/constants';
import QtyControls from '../../components/ui/QtyControls';
import api from '../../services/api';

export default function CartCheckoutPage() {
  const { items, subtotal, tax, deliveryFee, grandTotal, freeDeliveryThreshold, requiresPrescription, updateQty, removeFromCart, fetchCart, loading: cartLoading } = useCart();
  const { accessToken } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState({ street: '', city: 'Kathmandu', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderPlaced, setOrderPlaced] = useState(null); // holds placed COD order
  const [placing, setPlacing] = useState(false);

  // eSewa two-step state
  const [esewaPendingOrder, setEsewaPendingOrder] = useState(null);
  const [esewaRedirecting, setEsewaRedirecting] = useState(false);
  const [esewaError, setEsewaError] = useState(null);

  // Auto-initiate eSewa as soon as order is created
  useEffect(() => {
    if (!esewaPendingOrder) return;
    setEsewaRedirecting(true);
    setEsewaError(null);
    api.initiateEsewa({ orderId: esewaPendingOrder.id }, accessToken)
      .then((payRes) => {
        const form = payRes.data;
        const isLocalMock =
          form.mock ||
          new URL(form.paymentUrl, window.location.origin).origin === window.location.origin;
        if (isLocalMock) {
          // Navigate with query params for local mock page (SPA can't receive form POSTs)
          const params = new URLSearchParams(form.formData).toString();
          window.location.href = `${form.paymentUrl}?${params}`;
        } else {
          // Real eSewa: submit a hidden form via POST
          const esewaForm = document.createElement('form');
          esewaForm.method = 'POST';
          esewaForm.action = form.paymentUrl;
          Object.entries(form.formData).forEach(([key, val]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(val);
            esewaForm.appendChild(input);
          });
          document.body.appendChild(esewaForm);
          esewaForm.submit();
        }
      })
      .catch((err) => {
        setEsewaRedirecting(false);
        setEsewaError(err.message || 'eSewa unavailable. Please try again.');
      });
  }, [esewaPendingOrder]);


  // Prescription selection state
  const [approvedRx, setApprovedRx] = useState([]);
  const [selectedRxId, setSelectedRxId] = useState('');
  const [loadingRx, setLoadingRx] = useState(false);

  // Fetch approved prescriptions if cart requires one
  useEffect(() => {
    if (requiresPrescription && accessToken) {
      setLoadingRx(true);
      api.getApprovedPrescriptions(accessToken)
        .then((res) => setApprovedRx(res.data?.prescriptions ?? []))
        .catch(() => {})
        .finally(() => setLoadingRx(false));
    }
  }, [requiresPrescription, accessToken]);

  const handlePlaceOrder = async () => {
    if (!address.street.trim() || !address.phone.trim()) {
      addToast('Please fill in delivery address and phone.', 'error');
      setStep(2);
      return;
    }
    if (requiresPrescription && !selectedRxId) {
      addToast('Please select an approved prescription for prescription-only medicines.', 'error');
      return;
    }
    try {
      setPlacing(true);
      const shippingAddress = `${address.street}, ${address.city}`;
      const body = { paymentMethod, shippingAddress, shippingPhone: address.phone };
      if (selectedRxId) body.prescriptionId = selectedRxId;
      const res = await api.checkout(body, accessToken);
      const order = res.data?.order;
      await fetchCart(); // refresh cart (should be empty now)

      // Hosted provider (eSewa): redirect after order creation
      if (paymentMethod === 'esewa' && order) {
        setEsewaPendingOrder(order);
        return;
      }

      // COD: order is confirmed immediately
      setOrderPlaced(order);
      addToast('Order placed successfully!');
    } catch (err) {
      addToast(err.message || 'Checkout failed', 'error');
    } finally {
      setPlacing(false);
    }
  };

  // eSewa redirect screen
  if (esewaPendingOrder) {
    return (
      <div className="max-w-md mx-auto text-center py-16 page-enter">
        {esewaRedirecting ? (
          <>
            <div className="flex items-center justify-center mb-6">
              <svg className="animate-spin h-14 w-14 text-green-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
            <h2 className="font-fraunces text-2xl font-semibold text-charcoal">Redirecting to eSewa…</h2>
            <p className="text-charcoal/60 mt-2 text-sm">Please wait while we connect to eSewa. Do not close this page.</p>
            <p className="text-charcoal/50 mt-4 text-xs">Order #{esewaPendingOrder.orderNumber} — Rs. {esewaPendingOrder.grandTotal}</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="font-fraunces text-2xl font-semibold text-charcoal">eSewa unavailable</h2>
            <p className="text-charcoal/60 mt-2">{esewaError}</p>
            <p className="text-charcoal/50 mt-1 text-sm">Your order has been placed. You can complete payment from My Orders.</p>
            <div className="flex gap-3 justify-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setEsewaRedirecting(true);
                  setEsewaError(null);
                  api.initiateEsewa({ orderId: esewaPendingOrder.id }, accessToken)
                    .then((payRes) => {
                      const form = payRes.data;
                      const isLocalMock =
                        form.mock ||
                        new URL(form.paymentUrl, window.location.origin).origin === window.location.origin;
                      if (isLocalMock) {
                        const params = new URLSearchParams(form.formData).toString();
                        window.location.href = `${form.paymentUrl}?${params}`;
                      } else {
                        const esewaForm = document.createElement('form');
                        esewaForm.method = 'POST';
                        esewaForm.action = form.paymentUrl;
                        Object.entries(form.formData).forEach(([key, val]) => {
                          const input = document.createElement('input');
                          input.type = 'hidden';
                          input.name = key;
                          input.value = String(val);
                          esewaForm.appendChild(input);
                        });
                        document.body.appendChild(esewaForm);
                        esewaForm.submit();
                      }
                    })
                    .catch((err) => {
                      setEsewaRedirecting(false);
                      setEsewaError(err.message || 'eSewa unavailable. Please try again.');
                    });
                }}
                className="rounded-lg bg-green-600 px-6 py-2.5 font-medium text-white hover:bg-green-700"
              >
                Try Again
              </button>
              <Link to="/customer/orders" className="rounded-lg border border-charcoal/20 px-6 py-2.5 font-medium text-charcoal hover:bg-charcoal/5">
                Pay Later
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="max-w-md mx-auto text-center py-12 page-enter">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-fraunces text-2xl font-semibold text-charcoal">Order confirmed</h2>
        <p className="text-charcoal/60 mt-2">Order #{orderPlaced.orderNumber} — Rs. {orderPlaced.grandTotal}</p>
        <p className="text-charcoal/60 text-sm mt-1">Thank you for your order. We&apos;ll deliver soon.</p>
        <Link to="/customer/orders" className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary-dark">
          View My Orders
        </Link>
      </div>
    );
  }

  if (items.length === 0 && step === 1 && !cartLoading) {
    return (
      <div className="max-w-md mx-auto text-center py-12 page-enter">
        <p className="text-charcoal/60">Your cart is empty.</p>
        <Link to="/medicines" className="text-primary font-medium mt-2 inline-block">Browse medicines</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 page-enter">
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              step === s ? 'bg-primary text-white' : 'bg-charcoal/10 text-charcoal'
            }`}
          >
            {s === 1 ? 'Cart' : s === 2 ? 'Address' : 'Payment'}
          </button>
        ))}
      </div>

      {step === 1 && (
        <>
          <div className="rounded-xl border border-charcoal/10 bg-white overflow-hidden">
            <ul className="divide-y divide-charcoal/10">
              {items.map((item) => (
                <li key={item.medicineId} className="flex items-center gap-4 p-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-charcoal/5">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.medicineName} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className={`h-full w-full items-center justify-center text-2xl ${item.imageUrl ? 'hidden' : 'flex'}`}>💊</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal">{item.medicineName}</p>
                    <p className="text-sm text-charcoal/60">Rs. {item.price} each</p>
                  </div>
                  <QtyControls
                    qty={item.quantity}
                    onIncrease={() => updateQty(item.medicineId, item.quantity + 1)}
                    onDecrease={() => updateQty(item.medicineId, item.quantity - 1)}
                  />
                  <p className="font-fraunces font-semibold text-charcoal w-20 text-right">Rs. {item.lineTotal}</p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.medicineId)}
                    className="text-soft-red text-sm hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-charcoal/10 p-4 space-y-1 text-right">
              <p className="text-charcoal/70">Subtotal: Rs. {subtotal}</p>
              <p className="text-charcoal/70">Tax (13% VAT): Rs. {tax}</p>
              <p className="text-charcoal/70">
                Delivery: Rs. {deliveryFee}
                {deliveryFee === 0 && <span className="text-primary ml-1">(Free!)</span>}
              </p>
              <p className="font-fraunces text-lg font-semibold text-charcoal">Total: Rs. {grandTotal}</p>
              {subtotal < freeDeliveryThreshold && (
                <p className="text-xs text-charcoal/50">Add Rs. {freeDeliveryThreshold - subtotal} more for free delivery</p>
              )}
            </div>
          </div>

          {/* Prescription selector — shown only when cart has Rx-required items */}
          {requiresPrescription && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h3 className="font-fraunces font-semibold text-charcoal">Prescription required</h3>
              </div>
              <p className="text-sm text-charcoal/70">
                Your cart contains prescription-only medicines. Select an approved prescription to continue.
              </p>
              {loadingRx ? (
                <p className="text-sm text-charcoal/50">Loading prescriptions…</p>
              ) : approvedRx.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-soft-red font-medium">No approved prescriptions found.</p>
                  <Link to="/customer/prescriptions" className="text-sm text-primary font-medium hover:underline">
                    Upload a prescription →
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedRxId}
                  onChange={(e) => setSelectedRxId(e.target.value)}
                  className="w-full rounded-lg border border-charcoal/20 px-4 py-2.5 focus:border-primary outline-none bg-white"
                >
                  <option value="">— Select a prescription —</option>
                  {approvedRx.map((rx) => (
                    <option key={rx.id} value={rx.id}>
                      Approved on {new Date(rx.updated_at).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {rx.notes ? ` — ${rx.notes}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary-dark"
            >
              Continue to delivery
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="rounded-xl border border-charcoal/10 bg-white p-6 space-y-4">
            <h3 className="font-fraunces font-semibold text-charcoal">Delivery address</h3>
            <input
              type="text"
              value={address.street}
              onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
              placeholder="Street, Ward, Area"
              className="w-full rounded-lg border border-charcoal/20 px-4 py-2.5 focus:border-primary outline-none"
            />
            <input
              type="text"
              value={address.city}
              onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
              placeholder="City"
              className="w-full rounded-lg border border-charcoal/20 px-4 py-2.5 focus:border-primary outline-none"
            />
            <input
              type="tel"
              value={address.phone}
              onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
              placeholder="Phone"
              className="w-full rounded-lg border border-charcoal/20 px-4 py-2.5 focus:border-primary outline-none"
            />
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-charcoal/20 px-4 py-2.5 font-medium text-charcoal">
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!address.street.trim() || !address.phone.trim()}
              className="rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              Continue to payment
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="rounded-xl border border-charcoal/10 bg-white p-6">
            <h3 className="font-fraunces font-semibold text-charcoal mb-4">Payment method</h3>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((pm) => (
                <label
                  key={pm.id}
                  className={`flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === pm.id ? 'border-primary bg-primary/5' : 'border-charcoal/20 hover:bg-charcoal/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={pm.id}
                    checked={paymentMethod === pm.id}
                    onChange={() => setPaymentMethod(pm.id)}
                    className="text-primary"
                  />
                  {typeof pm.logo === 'string' && pm.logo.startsWith('http') ? (
                    <img src={pm.logo} alt={pm.name} className="h-6 w-auto object-contain" />
                  ) : (
                    <span className="text-2xl">{pm.logo}</span>
                  )}
                  <span className="font-medium text-charcoal">{pm.name}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 space-y-1 text-sm text-charcoal/60">
              <p>Subtotal: Rs. {subtotal}</p>
              <p>Tax: Rs. {tax}</p>
              <p>Delivery: Rs. {deliveryFee}</p>
              <p className="font-semibold text-charcoal">Total: Rs. {grandTotal}</p>
            </div>
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-charcoal/20 px-4 py-2.5 font-medium text-charcoal">
              Back
            </button>
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
              className="rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {placing ? 'Placing order…' : paymentMethod === 'esewa' ? 'Pay with eSewa' : 'Place order'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
