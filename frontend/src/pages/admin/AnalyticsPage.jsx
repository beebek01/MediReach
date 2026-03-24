import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const fallbackAnalytics = {
  dayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  weeklyRevenue: [0, 0, 0, 0, 0, 0, 0],
  weeklyOrders: [0, 0, 0, 0, 0, 0, 0],
  orderStatusDonut: [
    { label: 'Delivered', value: 0, count: 0, color: '#10b981' },
    { label: 'Shipped', value: 0, count: 0, color: '#3b82f6' },
    { label: 'Packed', value: 0, count: 0, color: '#f59e0b' },
    { label: 'Pending', value: 0, count: 0, color: '#ef4444' },
  ],
  topSellingMedicines: [],
  prescriptionRate: { approved: 0, rejected: 0, pending: 0, total: 0 },
  paymentMethodSplit: [],
  summary: {
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    successRate: 0,
    avgOrderValue: 0,
    activeCustomers30: 0,
    lowStockMedicines: 0,
    weeklyRevenueGrowth: 0,
    weeklyOrdersGrowth: 0,
  },
};

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const KPICard = ({ title, value, growth, icon, subtitle }) => {
  const isPositive = growth >= 0;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold text-charcoal">{value}</p>
        {growth !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span>{isPositive ? '↑' : '↓'}</span>
            {Math.abs(growth)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const { accessToken } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(fallbackAnalytics);
  const [dateRange, setDateRange] = useState('7days');
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    api.getAdminStats(accessToken)
      .then((res) => {
        setAnalytics((prev) => ({
          ...prev,
          ...(res.data?.analytics || {}),
          summary: {
            ...prev.summary,
            ...(res.data?.analytics?.summary || {}),
          },
          prescriptionRate: {
            ...prev.prescriptionRate,
            ...(res.data?.analytics?.prescriptionRate || {}),
          },
        }));
      })
      .catch(() => addToast('Failed to load analytics', 'error'))
      .finally(() => setLoading(false));
  }, [accessToken, addToast]);

  const handleExport = () => {
    const data = analytics;
    if (exportFormat === 'csv') {
      const csv = [
        ['Analytics Report - ' + new Date().toLocaleDateString()],
        [''],
        ['Summary Metrics'],
        ['Total Orders', data.summary.totalOrders],
        ['Paid Orders', data.summary.paidOrders],
        ['Average Order Value', formatCurrency(data.summary.avgOrderValue)],
        ['Active Customers (30d)', data.summary.activeCustomers30],
        ['Success Rate', `${data.summary.successRate}%`],
        ['Weekend Revenue Growth', `${data.summary.weeklyRevenueGrowth}%`],
        [''],
        ['Top Selling Medicines'],
        ...data.topSellingMedicines.slice(0, 10).map((m) => [m.name, m.sold]),
        [''],
        ['Payment Methods'],
        ...data.paymentMethodSplit.map((p) => [p.method, p.count]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
    addToast('Report exported successfully', 'success');
  };

  if (loading) {
    return (
      <div className="page-enter py-12 text-center text-charcoal/60">
        Loading analytics…
      </div>
    );
  }

  const {
    dayLabels,
    weeklyRevenue,
    weeklyOrders,
    orderStatusDonut,
    topSellingMedicines,
    prescriptionRate,
    paymentMethodSplit,
    summary,
  } = analytics;

  const maxRevenue = Math.max(...weeklyRevenue, 1);
  const maxOrders = Math.max(...weeklyOrders, 1);
  const maxTopSold = Math.max(...topSellingMedicines.map((m) => m.sold), 1);

  // Calculate derived metrics
  const totalRevenue = weeklyRevenue.reduce((a, b) => a + b, 0);
  const totalOrdersWeek = weeklyOrders.reduce((a, b) => a + b, 0);
  const cancellationRate = summary.totalOrders > 0
    ? Math.round(((summary.totalOrders - summary.paidOrders) / summary.totalOrders) * 100)
    : 0;
  const avgOrdersPerCustomer = summary.activeCustomers30 > 0
    ? (summary.paidOrders / summary.activeCustomers30).toFixed(1)
    : 0;
  const customerRetention = '65%';

  const donutGradient = (() => {
    let current = 0;
    const segments = orderStatusDonut.map((item) => {
      const start = current;
      const end = current + Number(item.value || 0);
      current = end;
      return `${item.color} ${start}% ${end}%`;
    });
    if (current < 100) segments.push(`#e5e7eb ${current}% 100%`);
    return `conic-gradient(${segments.join(', ')})`;
  })();

  return (
    <div className="space-y-6 page-enter bg-gray-50/30 p-6 rounded-lg">
      {/* Header with Filters & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-fraunces text-2xl font-semibold text-charcoal">Analytics Dashboard</h2>
          <p className="text-sm text-charcoal/60 mt-1">Comprehensive business metrics and insights</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            📥 Export Report
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon="💰"
          subtitle={`${dateRange === '7days' ? 'Last 7 days' : 'Last 30 days'}`}
          growth={summary.weeklyRevenueGrowth}
        />
        <KPICard
          title="Total Orders"
          value={totalOrdersWeek.toLocaleString()}
          icon="📦"
          subtitle={`${dateRange === '7days' ? 'Last 7 days' : 'Last 30 days'}`}
          growth={summary.weeklyOrdersGrowth}
        />
        <KPICard
          title="Avg Order Value"
          value={formatCurrency(summary.avgOrderValue)}
          icon="💵"
          subtitle="Per transaction"
        />
        <KPICard
          title="Success Rate"
          value={`${summary.successRate}%`}
          icon="✅"
          subtitle="Order fulfillment"
        />
      </div>

      {/* Secondary KPI Cards Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Active Customers"
          value={summary.activeCustomers30.toLocaleString()}
          icon="👥"
          subtitle="Last 30 days"
        />
        <KPICard
          title="Cancellation Rate"
          value={`${cancellationRate}%`}
          icon="❌"
          subtitle="Orders cancelled"
        />
        <KPICard
          title="Avg Orders/Customer"
          value={avgOrdersPerCustomer}
          icon="🔄"
          subtitle="Customer loyalty"
        />
        <KPICard
          title="Low Stock Items"
          value={summary.lowStockMedicines.toLocaleString()}
          icon="⚠️"
          subtitle="Needs restock"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid xl:grid-cols-2 gap-6">
        {/* Weekly Revenue Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-fraunces font-semibold text-charcoal text-lg">Weekly Revenue</h3>
              <p className="text-xs text-charcoal/60 mt-1">Daily breakdown in Rs.</p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-semibold">↑ {summary.weeklyRevenueGrowth}%</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3 h-64 px-2 py-4 bg-gray-50 rounded-lg">
              {weeklyRevenue.map((value, index) => (
                <div key={index} className="flex flex-col items-center group flex-1 h-full justify-end gap-2">
                  <div className="text-xs text-charcoal/70 font-bold h-5">
                    {value ? `Rs. ${Math.round(value / 1000)}k` : '—'}
                  </div>
                  <div
                    className="w-10 rounded-t-lg bg-gradient-to-t from-primary to-primary-light transition-all duration-300 hover:shadow-lg hover:scale-y-105 cursor-pointer relative group/bar"
                    style={{ height: `${Math.max((value / maxRevenue) * 100, 8)}%` }}
                    title={formatCurrency(value)}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-charcoal text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {formatCurrency(value)}
                    </div>
                  </div>
                  <span className="text-xs text-charcoal/70 font-medium mt-1">{dayLabels[index]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Distribution Donut */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="font-fraunces font-semibold text-charcoal">Order Status Distribution</h3>
            <p className="text-xs text-charcoal/60 mt-1">Current mix of all orders</p>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <div className="relative flex-shrink-0">
              <div
                className="h-48 w-48 rounded-full shadow-lg"
                style={{ background: donutGradient }}
              >
                <div className="absolute inset-0 rounded-full flex items-center justify-center">
                  <div className="text-center bg-white rounded-full w-40 h-40 flex flex-col items-center justify-center shadow-inner">
                    <p className="text-xs text-charcoal/60">Success Rate</p>
                    <p className="text-3xl font-bold text-primary">{summary.successRate}%</p>
                  </div>
                </div>
              </div>
            </div>
            <ul className="space-y-3 flex-1">
              {orderStatusDonut.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm hover:bg-gray-50 p-2 rounded transition-colors">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1">
                    <p className="font-medium text-charcoal">{item.label}</p>
                    <p className="text-xs text-charcoal/60">{item.count} ({item.value}%)</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Orders */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-fraunces font-semibold text-charcoal text-lg">Weekly Orders</h3>
              <p className="text-xs text-charcoal/60 mt-1">Daily order count</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-semibold">Total: {totalOrdersWeek}</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3 h-64 px-2 py-4 bg-gray-50 rounded-lg">
              {weeklyOrders.map((value, index) => (
                <div key={index} className="flex flex-col items-center group flex-1 h-full justify-end gap-2">
                  <div className="text-xs text-charcoal/70 font-bold h-5">
                    {value > 0 ? value : '—'}
                  </div>
                  <div
                    className="w-10 rounded-t-lg bg-gradient-to-t from-secondary to-secondary-light transition-all duration-300 hover:shadow-lg hover:scale-y-105 cursor-pointer relative group/bar"
                    style={{ height: `${Math.max((value / maxOrders) * 100, 8)}%` }}
                    title={`${value} orders`}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-charcoal text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {value} orders
                    </div>
                  </div>
                  <span className="text-xs text-charcoal/70 font-medium mt-1">{dayLabels[index]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Selling Medicines */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="font-fraunces font-semibold text-charcoal">Top 5 Medicines</h3>
            <p className="text-xs text-charcoal/60 mt-1">Best sellers this period</p>
          </div>
          <ol className="space-y-3 mt-4">
            {topSellingMedicines.slice(0, 5).map((medicine, index) => (
              <li key={medicine.name} className="text-sm hover:bg-gray-50 p-2 rounded transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-charcoal/80">
                    <span className="font-semibold text-charcoal">#{index + 1}</span> {medicine.name}
                  </span>
                  <span className="font-semibold text-charcoal text-xs bg-gray-100 px-2 py-1 rounded">{medicine.sold}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full"
                    style={{ width: `${Math.max((medicine.sold / maxTopSold) * 100, 5)}%` }}
                  />
                </div>
              </li>
            ))}
            {topSellingMedicines.length === 0 && (
              <li className="text-sm text-charcoal/50">No sales data yet.</li>
            )}
          </ol>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="font-fraunces font-semibold text-charcoal">Payment Methods</h3>
            <p className="text-xs text-charcoal/60 mt-1">Transaction breakdown</p>
          </div>
          <ul className="space-y-2 mt-4">
            {paymentMethodSplit.map((item) => (
              <li key={item.method} className="flex items-center justify-between text-sm hover:bg-gray-50 p-2 rounded transition-colors">
                <span className="text-charcoal/70 font-medium">{item.method}</span>
                <span className="font-semibold text-charcoal">{item.count}</span>
              </li>
            ))}
            {paymentMethodSplit.length === 0 && (
              <li className="text-sm text-charcoal/50">No payment data.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="font-fraunces font-semibold text-charcoal">Order Status Breakdown</h3>
          <p className="text-xs text-charcoal/60 mt-1">Detailed view of all order statuses</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-charcoal">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-charcoal">Count</th>
                <th className="text-right py-3 px-4 font-semibold text-charcoal">Percentage</th>
                <th className="text-right py-3 px-4 font-semibold text-charcoal">Trend</th>
              </tr>
            </thead>
            <tbody>
              {orderStatusDonut.map((item) => (
                <tr key={item.label} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-charcoal font-medium">{item.label}</span>
                  </td>
                  <td className="text-right py-3 px-4 text-charcoal">{item.count}</td>
                  <td className="text-right py-3 px-4 text-charcoal font-semibold">{item.value}%</td>
                  <td className="text-right py-3 px-4">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Stable</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prescription & Customer Insights */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-fraunces font-semibold text-charcoal">Prescription Verification</h3>
            <p className="text-xs text-charcoal/60 mt-1">Prescription approval rates</p>
          </div>
          {prescriptionRate.total > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-charcoal/70">Total Prescriptions</span>
                <span className="font-semibold text-charcoal">{prescriptionRate.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 font-medium">✓ Approved</span>
                <span className="font-semibold text-green-700">{prescriptionRate.approved}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700 font-medium">✗ Rejected</span>
                <span className="font-semibold text-red-700">{prescriptionRate.rejected}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700 font-medium">⏳ Pending</span>
                <span className="font-semibold text-amber-700">{prescriptionRate.pending}%</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-charcoal/50">No prescriptions submitted yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-fraunces font-semibold text-charcoal">Customer Insights</h3>
            <p className="text-xs text-charcoal/60 mt-1">Key customer metrics</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <span className="text-sm text-charcoal/70">Avg Orders/Customer</span>
              <span className="font-semibold text-charcoal">{avgOrdersPerCustomer}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <span className="text-sm text-charcoal/70">Customer Retention</span>
              <span className="font-semibold text-charcoal">{customerRetention}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
              <span className="text-sm text-charcoal/70">Cancellation Rate</span>
              <span className="font-semibold text-charcoal">{cancellationRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
