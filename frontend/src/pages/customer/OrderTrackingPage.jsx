import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LiveTrackingMap from '../../components/ui/LiveTrackingMap';
import api from '../../services/api';

const TRACK_STEPS = ['pending', 'verified', 'packed', 'shipped', 'delivered'];
const STEP_LABELS = { pending: 'Pending', verified: 'Verified', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered' };

export default function OrderTrackingPage() {
  const { accessToken } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const { id: orderIdFromPath } = useParams();
  const orderId = orderIdFromPath || searchParams.get('order');
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(null);

  // Fetch order data
  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    setLoading(true);
    api.getOrder(orderId, accessToken)
      .then((res) => {
        const o = res.data?.order ?? null;
        setOrder(o);
        setItems(o?.items ?? []);
      })
      .catch(() => addToast('Order not found', 'error'))
      .finally(() => setLoading(false));
  }, [orderId, accessToken]);

  // Poll tracking data every 5s when order is shipped
  useEffect(() => {
    if (!orderId || !order || order.status !== 'shipped') return;

    const fetchTracking = () => {
      api.getOrderTracking(orderId, accessToken)
        .then((res) => setTracking(res.data?.tracking ?? null))
        .catch(() => {});
    };

    fetchTracking();
    const interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [orderId, order?.status, accessToken]);

  // Re-fetch order periodically to catch status changes
  useEffect(() => {
    if (!orderId || !order) return;
    const terminal = ['delivered', 'cancelled'];
    if (terminal.includes(order.status)) return;

    const interval = setInterval(() => {
      api.getOrder(orderId, accessToken)
        .then((res) => {
          const o = res.data?.order ?? null;
          if (o) {
            setOrder(o);
            setItems(o.items ?? []);
          }
        })
        .catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId, order?.status, accessToken]);

  const handleLocationUpdate = useCallback(
    ({ lat, lng }) => {
      if (!orderId) return;
      api.updateDeliveryLocation(orderId, { lat, lng }, accessToken).catch(() => {});
    },
    [orderId, accessToken]
  );

  const statusIndex = order ? TRACK_STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';
  const isPrescriptionReview = order?.status === 'prescription_review';

  if (loading) {
    return <div className="page-enter py-12 text-center text-charcoal/60">Loading…</div>;
  }

  return (
    <div className="space-y-8 page-enter">
      <div>
        <h2 className="font-fraunces text-xl font-semibold text-charcoal">Order details</h2>
        {order && <p className="text-charcoal/60 text-sm mt-1">Order #{order.orderNumber}</p>}
      </div>

      {!order && (
        <div className="rounded-xl border border-dashed border-charcoal/20 py-12 text-center text-charcoal/60">
          {orderId ? 'Order not found.' : 'No order selected. Go to My Orders to pick one.'}
        </div>
      )}

      {order && isCancelled && (
        <div className="rounded-xl border border-soft-red/30 bg-soft-red/5 p-6 text-center text-soft-red font-medium">
          This order has been cancelled.
        </div>
      )}

      {order && isPrescriptionReview && (
        <div className="rounded-xl border border-amber-300/40 bg-amber-50 p-6 text-center text-amber-700 font-medium">
          Your prescription is being reviewed by the pharmacist. We&apos;ll update the status once verified.
        </div>
      )}

      {order && !isCancelled && (
        <>
          <div className="rounded-xl border border-charcoal/10 bg-white p-6">
            <div className="flex items-start">
              {TRACK_STEPS.map((st, i) => (
                <div key={st} className="flex flex-1 flex-col items-center">
                  <div className="flex items-center w-full">
                    <div
                      className={`flex h-10 w-10 shrink-0 rounded-full items-center justify-center text-sm font-medium transition-all duration-500 ${
                        i <= statusIndex ? 'bg-primary text-white' : 'bg-charcoal/10 text-charcoal/50'
                      }`}
                    >
                      {i < statusIndex ? '✓' : i + 1}
                    </div>
                    {i < TRACK_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-1 transition-colors duration-500 ${
                          i < statusIndex ? 'bg-primary' : 'bg-charcoal/10'
                        }`}
                      />
                    )}
                  </div>
                  <p className={`mt-2 text-xs font-medium text-center ${i <= statusIndex ? 'text-charcoal' : 'text-charcoal/50'}`}>
                    {STEP_LABELS[st]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-charcoal/10 bg-white p-6 space-y-3">
            <h3 className="font-fraunces font-semibold text-charcoal">Order details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-charcoal/70">Total</p>
              <p className="font-medium">Rs. {order.grandTotal}</p>
              <p className="text-charcoal/70">Payment</p>
              <p className="font-medium uppercase">{order.paymentMethod} — {order.paymentStatus}</p>
              <p className="text-charcoal/70">Delivery address</p>
              <p className="font-medium">{order.shippingAddress}</p>
              <p className="text-charcoal/70">Phone</p>
              <p className="font-medium">{order.shippingPhone}</p>
              <p className="text-charcoal/70">Placed</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {items.length > 0 && (
            <div className="rounded-xl border border-charcoal/10 bg-white p-6">
              <h3 className="font-fraunces font-semibold text-charcoal mb-3">Items</h3>
              <ul className="divide-y divide-charcoal/10 text-sm">
                {items.map((item) => (
                  <li key={item.id} className="flex justify-between py-2">
                    <span>{item.medicineName} × {item.quantity}</span>
                    <span className="font-medium">Rs. {item.totalPrice}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <LiveTrackingMap
              orderId={orderId}
              orderStatus={order.status}
              deliveryLat={tracking?.deliveryLat ?? order.deliveryLat}
              deliveryLng={tracking?.deliveryLng ?? order.deliveryLng}
              destinationLat={tracking?.destinationLat ?? order.destinationLat}
              destinationLng={tracking?.destinationLng ?? order.destinationLng}
              shippingAddress={order.shippingAddress}
              onLocationUpdate={handleLocationUpdate}
            />
        </>
      )}
    </div>
  );
}
