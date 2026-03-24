import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/ui/StatusBadge';
import { ORDER_STATUSES } from '../../data/constants';
import api from '../../services/api';

export default function MyOrdersPage() {
  const { accessToken } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = statusFilter ? `status=${statusFilter}` : '';
    api.getMyOrders(params, accessToken)
      .then((res) => setOrders(res.data?.orders ?? []))
      .catch(() => addToast('Failed to load orders', 'error'))
      .finally(() => setLoading(false));
  }, [accessToken, statusFilter]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await api.cancelOrder(orderId, accessToken);
      addToast('Order cancelled');
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err) {
      addToast(err.message || 'Failed to cancel', 'error');
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-fraunces text-xl font-semibold text-charcoal">My Orders</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !statusFilter ? 'bg-primary text-white' : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'
            }`}
          >
            All
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                statusFilter === s ? 'bg-primary text-white' : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-charcoal/60">Loading orders…</div>
      ) : (
        <div className="rounded-xl border border-charcoal/10 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-charcoal/5 text-left">
                  <th className="px-4 py-3 font-medium text-charcoal">Order #</th>
                  <th className="px-4 py-3 font-medium text-charcoal">Total</th>
                  <th className="px-4 py-3 font-medium text-charcoal">Payment</th>
                  <th className="px-4 py-3 font-medium text-charcoal">Date</th>
                  <th className="px-4 py-3 font-medium text-charcoal">Status</th>
                  <th className="px-4 py-3 font-medium text-charcoal"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-charcoal/5 hover:bg-charcoal/[0.02]">
                    <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3">Rs. {o.grandTotal}</td>
                    <td className="px-4 py-3 uppercase text-xs">{o.paymentMethod}</td>
                    <td className="px-4 py-3 text-charcoal/70">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 space-x-2">
                      <Link to={`/customer/orders/${o.id}`} className="text-primary font-medium hover:underline">
                        View
                      </Link>
                      <Link to={`/customer/track?order=${o.id}`} className="text-primary font-medium hover:underline">
                        Track
                      </Link>
                      {['pending', 'prescription_review'].includes(o.status) && (
                        <button type="button" onClick={() => handleCancel(o.id)} className="text-soft-red font-medium hover:underline">
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <div className="p-8 text-center text-charcoal/50">No orders found.</div>
          )}
        </div>
      )}
    </div>
  );
}
