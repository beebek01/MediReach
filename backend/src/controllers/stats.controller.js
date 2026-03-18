/**
 * Stats Controller — HTTP handlers for /api/stats
 *
 * Provides dashboard statistics for admin, customer, pharmacist, and public.
 */

const { query } = require("../database/db");
const { success } = require("../utils/response");

const statsController = {
  /**
   * GET /api/stats/admin
   * Admin-only: platform-wide KPIs + recent activity + analytics data.
   */
  async adminStats(req, res, next) {
    try {
      const [
        usersResult,
        revenueResult,
        ordersTodayResult,
        medicinesResult,
        pharmacistsResult,
        prescriptionsResult,
        recentOrdersResult,
        weeklySalesResult,
        orderStatusResult,
        topMedicinesResult,
        weeklyRevenueResult,
        prescriptionRateResult,
      ] = await Promise.all([
        query("SELECT COUNT(*) AS total FROM users"),
        query(
          "SELECT COALESCE(SUM(grand_total), 0) AS total FROM orders WHERE status = 'delivered'",
        ),
        query(
          "SELECT COUNT(*) AS total FROM orders WHERE created_at >= CURRENT_DATE",
        ),
        query("SELECT COUNT(*) AS total FROM medicines"),
        query(
          "SELECT COUNT(*) AS total FROM users WHERE role = 'pharmacist' AND status = 'active'",
        ),
        query(
          "SELECT COUNT(*) AS total FROM prescriptions WHERE status = 'pending'",
        ),
        query(`SELECT o.id, o.order_number, o.grand_total, o.status, o.created_at, u.name AS user_name
               FROM orders o JOIN users u ON o.user_id = u.id
               ORDER BY o.created_at DESC LIMIT 5`),
        // Weekly sales (last 7 days, per day)
        query(`SELECT EXTRACT(DOW FROM created_at) AS dow, COALESCE(SUM(grand_total), 0) AS total
               FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
               GROUP BY dow ORDER BY dow`),
        // Order status distribution
        query(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`),
        // Top 5 selling medicines
        query(
          `SELECT name, sold_count FROM medicines ORDER BY sold_count DESC LIMIT 5`,
        ),
        // Weekly revenue (last 7 days, per day)
        query(`SELECT EXTRACT(DOW FROM created_at) AS dow, COALESCE(SUM(grand_total), 0) AS total
               FROM orders WHERE status = 'delivered' AND created_at >= CURRENT_DATE - INTERVAL '6 days'
               GROUP BY dow ORDER BY dow`),
        // Prescription verification rate
        query(
          `SELECT status, COUNT(*) AS count FROM prescriptions GROUP BY status`,
        ),
      ]);

      // Build weekly arrays (Mon=1 .. Sun=0 → index 0..6)
      const weeklySales = [0, 0, 0, 0, 0, 0, 0];
      for (const r of weeklySalesResult.rows) {
        const idx = r.dow === 0 ? 6 : Number(r.dow) - 1; // shift Sun(0)→6
        weeklySales[idx] = parseFloat(r.total);
      }

      const weeklyRevenue = [0, 0, 0, 0, 0, 0, 0];
      for (const r of weeklyRevenueResult.rows) {
        const idx = r.dow === 0 ? 6 : Number(r.dow) - 1;
        weeklyRevenue[idx] = parseFloat(r.total);
      }

      // Order status donut
      const statusMap = {};
      let totalOrders = 0;
      for (const r of orderStatusResult.rows) {
        statusMap[r.status] = parseInt(r.count, 10);
        totalOrders += parseInt(r.count, 10);
      }
      const orderStatusDonut = [
        {
          label: "Delivered",
          value: totalOrders
            ? Math.round(((statusMap.delivered || 0) / totalOrders) * 100)
            : 0,
          color: "#4a7c59",
        },
        {
          label: "Shipped",
          value: totalOrders
            ? Math.round(((statusMap.shipped || 0) / totalOrders) * 100)
            : 0,
          color: "#3b82f6",
        },
        {
          label: "Packed",
          value: totalOrders
            ? Math.round(((statusMap.packed || 0) / totalOrders) * 100)
            : 0,
          color: "#f59e0b",
        },
        {
          label: "Pending",
          value: totalOrders
            ? Math.round(
                (((statusMap.pending || 0) +
                  (statusMap.prescription_review || 0) +
                  (statusMap.verified || 0)) /
                  totalOrders) *
                  100,
              )
            : 0,
          color: "#6b7280",
        },
      ];

      // Top selling medicines
      const topSellingMedicines = topMedicinesResult.rows.map((r) => ({
        name: r.name,
        sold: parseInt(r.sold_count, 10),
      }));

      // Prescription rate
      const rxMap = {};
      let totalRx = 0;
      for (const r of prescriptionRateResult.rows) {
        rxMap[r.status] = parseInt(r.count, 10);
        totalRx += parseInt(r.count, 10);
      }
      const prescriptionRate = {
        approved: totalRx
          ? Math.round(((rxMap.approved || 0) / totalRx) * 100)
          : 0,
        rejected: totalRx
          ? Math.round(((rxMap.rejected || 0) / totalRx) * 100)
          : 0,
        pending: totalRx
          ? Math.round(((rxMap.pending || 0) / totalRx) * 100)
          : 0,
        total: totalRx,
      };

      return success(res, {
        stats: {
          totalUsers: parseInt(usersResult.rows[0].total, 10),
          totalRevenue: parseFloat(revenueResult.rows[0].total),
          ordersToday: parseInt(ordersTodayResult.rows[0].total, 10),
          medicinesListed: parseInt(medicinesResult.rows[0].total, 10),
          activePharmacists: parseInt(pharmacistsResult.rows[0].total, 10),
          pendingPrescriptions: parseInt(prescriptionsResult.rows[0].total, 10),
        },
        recentActivity: recentOrdersResult.rows.map((r) => ({
          id: r.id,
          text: `Order ${r.order_number} — Rs. ${parseFloat(r.grand_total).toLocaleString()} (${r.status}) by ${r.user_name}`,
          time: new Date(r.created_at).toLocaleString(),
        })),
        analytics: {
          weeklySales,
          orderStatusDonut,
          topSellingMedicines,
          weeklyRevenue,
          prescriptionRate,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/stats/customer
   * Customer: own stats + recent orders.
   */
  async customerStats(req, res, next) {
    try {
      const userId = req.user.id;

      const [
        ordersResult,
        prescriptionsResult,
        inTransitResult,
        spentResult,
        recentResult,
      ] = await Promise.all([
        query("SELECT COUNT(*) AS total FROM orders WHERE user_id = $1", [
          userId,
        ]),
        query(
          "SELECT COUNT(*) AS total FROM prescriptions WHERE user_id = $1",
          [userId],
        ),
        query(
          "SELECT COUNT(*) AS total FROM orders WHERE user_id = $1 AND status IN ('shipped', 'packed')",
          [userId],
        ),
        query(
          "SELECT COALESCE(SUM(grand_total), 0) AS total FROM orders WHERE user_id = $1 AND status = 'delivered'",
          [userId],
        ),
        query(
          `SELECT o.id, o.order_number, o.grand_total, o.delivery_fee, o.status, o.created_at,
                    json_agg(json_build_object('name', oi.medicine_name)) AS items
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             WHERE o.user_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC LIMIT 5`,
          [userId],
        ),
      ]);

      return success(res, {
        stats: {
          totalOrders: parseInt(ordersResult.rows[0].total, 10),
          prescriptions: parseInt(prescriptionsResult.rows[0].total, 10),
          inTransit: parseInt(inTransitResult.rows[0].total, 10),
          totalSpent: parseFloat(spentResult.rows[0].total),
        },
        recent: recentResult.rows.map((r) => ({
          id: r.id,
          orderNumber: r.order_number,
          total: parseFloat(r.grand_total),
          deliveryFee: parseFloat(r.delivery_fee),
          status: r.status,
          date: new Date(r.created_at).toLocaleDateString(),
          items: r.items || [],
        })),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/stats/pharmacist
   * Pharmacist: KPIs + pending prescriptions + low stock.
   */
  async pharmacistStats(req, res, next) {
    try {
      const [
        rxResult,
        lowStockResult,
        ordersTodayResult,
        revenueTodayResult,
        pendingRxResult,
        lowStockListResult,
      ] = await Promise.all([
        query(
          "SELECT COUNT(*) AS total FROM prescriptions WHERE status = 'pending'",
        ),
        query("SELECT COUNT(*) AS total FROM medicines WHERE stock < 20"),
        query(
          "SELECT COUNT(*) AS total FROM orders WHERE created_at >= CURRENT_DATE",
        ),
        query(
          "SELECT COALESCE(SUM(grand_total), 0) AS total FROM orders WHERE created_at >= CURRENT_DATE AND status = 'delivered'",
        ),
        query(`SELECT p.id, m.name AS medicine, p.created_at, p.status
                 FROM prescriptions p
                 LEFT JOIN orders o ON o.prescription_id = p.id
                 LEFT JOIN order_items oi ON oi.order_id = o.id
                 LEFT JOIN medicines m ON m.id = oi.medicine_id
                 WHERE p.status = 'pending'
                 ORDER BY p.created_at DESC LIMIT 5`),
        query(
          "SELECT id, name, stock FROM medicines WHERE stock < 20 ORDER BY stock ASC LIMIT 5",
        ),
      ]);

      return success(res, {
        stats: {
          prescriptionsToVerify: parseInt(rxResult.rows[0].total, 10),
          lowStockAlerts: parseInt(lowStockResult.rows[0].total, 10),
          ordersToday: parseInt(ordersTodayResult.rows[0].total, 10),
          revenueToday: parseFloat(revenueTodayResult.rows[0].total),
        },
        pendingRx: pendingRxResult.rows.map((r) => ({
          id: r.id,
          medicine: r.medicine || "Prescription",
          date: new Date(r.created_at).toLocaleDateString(),
          status: r.status,
        })),
        lowStock: lowStockListResult.rows.map((r) => ({
          id: r.id,
          name: r.name,
          stock: r.stock,
        })),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/stats/public
   * Unauthenticated: basic platform totals for the landing page.
   */
  async publicStats(req, res, next) {
    try {
      const [ordersResult, medicinesResult] = await Promise.all([
        query(
          "SELECT COUNT(*) AS total FROM orders WHERE status = 'delivered'",
        ),
        query("SELECT COUNT(*) AS total FROM medicines"),
      ]);

      return success(res, {
        stats: [
          {
            value: String(parseInt(ordersResult.rows[0].total, 10)),
            label: "Orders Delivered",
          },
          {
            value: String(parseInt(medicinesResult.rows[0].total, 10)),
            label: "Medicines",
          },
          { value: "1", label: "Partner Pharmacies" },
          { value: "1", label: "Districts Covered" },
        ],
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = statsController;
