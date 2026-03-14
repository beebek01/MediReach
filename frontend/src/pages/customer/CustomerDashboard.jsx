import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../services/api';

export default function CustomerDashboard() {
  const { user, accessToken } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState({ totalOrders: 0, prescriptions: 0, inTransit: 0, totalSpent: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCustomerStats(accessToken)
      .then((res) => {
        setStats(res.data.stats);
        setRecent(res.data.recent || []);
      })
      .catch(() => addToast('Failed to load dashboard stats', 'error'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div className="space-y-8 page-enter">
      <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 p-6">
        <h2 className="font-fraunces text-xl font-semibold text-charcoal">
          Hello, {user?.name?.split(' ')[0] || 'Customer'} 👋
        </h2>
        <p className="text-charcoal/70 mt-1">Here's your medicine and order overview.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={stats.totalOrders} icon="📋" />
        <StatCard title="Prescriptions" value={stats.prescriptions} icon="📄" />
        <StatCard title="In Transit" value={stats.inTransit} icon="🚚" />
        <StatCard title="Total Spent" value={`Rs. ${stats.totalSpent.toLocaleString()}`} icon="💰" />
      </div>

      <div className="rounded-xl border border-charcoal/10 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-charcoal/10">
          <h3 className="font-fraunces font-semibold text-charcoal">Recent Orders</h3>
          <Link to="/customer/orders" className="text-sm text-primary font-medium hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-charcoal/5 text-left">
                <th className="px-4 py-3 font-medium text-charcoal">Order ID</th>
                <th className="px-4 py-3 font-medium text-charcoal">Items</th>
                <th className="px-4 py-3 font-medium text-charcoal">Total</th>
                <th className="px-4 py-3 font-medium text-charcoal">Date</th>
                <th className="px-4 py-3 font-medium text-charcoal">Status</th>
                <th className="px-4 py-3 font-medium text-charcoal"></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-t border-charcoal/5 hover:bg-charcoal/[0.02]">
                  <td className="px-4 py-3 font-medium">{o.orderNumber || o.id}</td>
                  <td className="px-4 py-3 text-charcoal/70">{(o.items || []).map((i) => i.name).join(', ')}</td>
                  <td className="px-4 py-3">Rs. {(o.total + o.deliveryFee).toLocaleString()}</td>
                  <td className="px-4 py-3 text-charcoal/70">{o.date}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/customer/orders?order=${o.id}`} className="text-primary font-medium hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recent.length === 0 && (
          <div className="p-8 text-center text-charcoal/50">No orders yet. <Link to="/medicines" className="text-primary">Browse medicines</Link>.</div>
        )}
      </div>

      <div className="rounded-xl border border-charcoal/10 bg-white p-6">
        <h3 className="font-fraunces font-semibold text-charcoal mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/medicines" className="rounded-lg bg-primary/10 text-primary px-4 py-2 text-sm font-medium hover:bg-primary/20 transition-colors">
            Browse Medicines
          </Link>
          <Link to="/customer/prescriptions" className="rounded-lg border border-charcoal/20 px-4 py-2 text-sm font-medium hover:bg-charcoal/5 transition-colors">
            Upload Prescription
          </Link>
          <Link to="/customer/track" className="rounded-lg border border-charcoal/20 px-4 py-2 text-sm font-medium hover:bg-charcoal/5 transition-colors">
            Track Order
          </Link>
          <Link to="/customer/cart" className="rounded-lg border border-charcoal/20 px-4 py-2 text-sm font-medium hover:bg-charcoal/5 transition-colors">
            View Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
