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
        weeklyRevenueResult,
        weeklyOrdersResult,
        orderStatusResult,
        topMedicinesResult,
        prescriptionRateResult,
        paidOrdersResult,
        totalOrdersResult,
        avgOrderValueResult,
        paymentMethodResult,
        currentWeekRevenueResult,
        previousWeekRevenueResult,
        currentWeekOrdersResult,
        previousWeekOrdersResult,
        activeCustomers30Result,
        lowStockMedicinesResult,
      ] = await Promise.all([
        query("SELECT COUNT(*) AS total FROM users"),
        query(
          `SELECT COALESCE(SUM(grand_total), 0) AS total
           FROM orders
           WHERE payment_status = 'paid' OR status = 'delivered'`,
        ),
        query(
          "SELECT COUNT(*) AS total FROM orders WHERE created_at >= CURRENT_DATE",
        ),
        query("SELECT COUNT(*) AS total FROM medicines"),
        query(
          "SELECT COUNT(*) AS total FROM users WHERE role = 'pharmacist' AND (status = 'active' OR status IS NULL)",
        ),
        query(
          "SELECT COUNT(*) AS total FROM prescriptions WHERE status = 'pending'",
        ),
        query(`SELECT o.id, o.order_number, o.grand_total, o.status, o.created_at, u.name AS user_name
               FROM orders o JOIN users u ON o.user_id = u.id
               ORDER BY o.created_at DESC LIMIT 5`),
        query(`SELECT EXTRACT(DOW FROM created_at) AS dow, COALESCE(SUM(grand_total), 0) AS total
               FROM orders
               WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
                 AND (payment_status = 'paid' OR status = 'delivered')
               GROUP BY dow ORDER BY dow`),
        query(`SELECT EXTRACT(DOW FROM created_at) AS dow, COUNT(*) AS total
               FROM orders
               WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
               GROUP BY dow ORDER BY dow`),
        query(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`),
        query(`SELECT oi.medicine_name AS name, COALESCE(SUM(oi.quantity), 0) AS sold
               FROM order_items oi
               JOIN orders o ON o.id = oi.order_id
               WHERE o.payment_status = 'paid' OR o.status = 'delivered'
               GROUP BY oi.medicine_name
               ORDER BY sold DESC
               LIMIT 5`),
        query(
          `SELECT status, COUNT(*) AS count FROM prescriptions GROUP BY status`,
        ),
        query(
          `SELECT COUNT(*) AS total
           FROM orders
           WHERE payment_status = 'paid' OR status = 'delivered'`,
        ),
        query(`SELECT COUNT(*) AS total FROM orders`),
        query(
          `SELECT COALESCE(AVG(grand_total), 0) AS avg
           FROM orders
           WHERE payment_status = 'paid' OR status = 'delivered'`,
        ),
        query(
          `SELECT payment_method, COUNT(*) AS count
           FROM orders
           GROUP BY payment_method`,
        ),
        query(
          `SELECT COALESCE(SUM(grand_total), 0) AS total
           FROM orders
           WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
             AND (payment_status = 'paid' OR status = 'delivered')`,
        ),
        query(
          `SELECT COALESCE(SUM(grand_total), 0) AS total
           FROM orders
           WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
             AND created_at < CURRENT_DATE - INTERVAL '6 days'
             AND (payment_status = 'paid' OR status = 'delivered')`,
        ),
        query(
          `SELECT COUNT(*) AS total
           FROM orders
           WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'`,
        ),
        query(
          `SELECT COUNT(*) AS total
           FROM orders
           WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
             AND created_at < CURRENT_DATE - INTERVAL '6 days'`,
        ),
        query(
          `SELECT COUNT(DISTINCT user_id) AS total
           FROM orders
           WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`,
        ),
        query("SELECT COUNT(*) AS total FROM medicines WHERE stock <= 20"),
      ]);

      const toWeeklyArray = (rows) => {
        const data = [0, 0, 0, 0, 0, 0, 0];
        for (const row of rows) {
          const dow = Number(row.dow);
          const index = dow === 0 ? 6 : dow - 1;
          data[index] = parseFloat(row.total);
        }
        return data;
      };

      const weeklyRevenue = toWeeklyArray(weeklyRevenueResult.rows);
      const weeklyOrders = toWeeklyArray(weeklyOrdersResult.rows);
      const weeklySales = weeklyRevenue;

      const statusMap = {};
      let totalOrdersCount = 0;
      for (const row of orderStatusResult.rows) {
        const count = parseInt(row.count, 10);
        statusMap[row.status] = count;
        totalOrdersCount += count;
      }

      const pendingCombined =
        (statusMap.pending || 0) +
        (statusMap.prescription_review || 0) +
        (statusMap.verified || 0);

      const orderStatusDonut = [
        {
          label: "Delivered",
          value: totalOrdersCount
            ? Math.round(((statusMap.delivered || 0) / totalOrdersCount) * 100)
            : 0,
          count: statusMap.delivered || 0,
          color: "#4a7c59",
        },
        {
          label: "Shipped",
          value: totalOrdersCount
            ? Math.round(((statusMap.shipped || 0) / totalOrdersCount) * 100)
            : 0,
          count: statusMap.shipped || 0,
          color: "#3b82f6",
        },
        {
          label: "Packed",
          value: totalOrdersCount
            ? Math.round(((statusMap.packed || 0) / totalOrdersCount) * 100)
            : 0,
          count: statusMap.packed || 0,
          color: "#f59e0b",
        },
        {
          label: "Pending",
          value: totalOrdersCount
            ? Math.round((pendingCombined / totalOrdersCount) * 100)
            : 0,
          count: pendingCombined,
          color: "#6b7280",
        },
      ];

      const topSellingMedicines = topMedicinesResult.rows.map((row) => ({
        name: row.name,
        sold: parseInt(row.sold, 10),
      }));

      const rxMap = {};
      let totalRx = 0;
      for (const row of prescriptionRateResult.rows) {
        const count = parseInt(row.count, 10);
        rxMap[row.status] = count;
        totalRx += count;
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

      const paymentMethodSplit = paymentMethodResult.rows.map((row) => ({
        method: (row.payment_method || 'unknown').toUpperCase(),
        count: parseInt(row.count, 10),
      }));

      const currentWeekRevenue = parseFloat(currentWeekRevenueResult.rows[0].total);
      const previousWeekRevenue = parseFloat(previousWeekRevenueResult.rows[0].total);
      const currentWeekOrders = parseInt(currentWeekOrdersResult.rows[0].total, 10);
      const previousWeekOrders = parseInt(previousWeekOrdersResult.rows[0].total, 10);

      const getGrowth = (current, previous) => {
        if (previous > 0) {
          return Math.round(((current - previous) / previous) * 100);
        }
        return current > 0 ? 100 : 0;
      };

      const paidOrders = parseInt(paidOrdersResult.rows[0].total, 10);
      const totalOrders = parseInt(totalOrdersResult.rows[0].total, 10);
      const avgOrderValue = parseFloat(avgOrderValueResult.rows[0].avg);

      return success(res, {
        stats: {
          totalUsers: parseInt(usersResult.rows[0].total, 10),
          totalRevenue: parseFloat(revenueResult.rows[0].total),
          ordersToday: parseInt(ordersTodayResult.rows[0].total, 10),
          medicinesListed: parseInt(medicinesResult.rows[0].total, 10),
          activePharmacists: parseInt(pharmacistsResult.rows[0].total, 10),
          pendingPrescriptions: parseInt(prescriptionsResult.rows[0].total, 10),
        },
        recentActivity: recentOrdersResult.rows.map((row) => ({
          id: row.id,
          text: `Order ${row.order_number} — Rs. ${parseFloat(row.grand_total).toLocaleString()} (${row.status}) by ${row.user_name}`,
          time: new Date(row.created_at).toLocaleString(),
        })),
        analytics: {
          dayLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          weeklySales,
          weeklyRevenue,
          weeklyOrders,
          orderStatusDonut,
          topSellingMedicines,
          prescriptionRate,
          paymentMethodSplit,
          summary: {
            totalOrders,
            paidOrders,
            pendingOrders: Math.max(totalOrders - paidOrders, 0),
            successRate: totalOrders
              ? Math.round((paidOrders / totalOrders) * 100)
              : 0,
            avgOrderValue,
            activeCustomers30: parseInt(activeCustomers30Result.rows[0].total, 10),
            lowStockMedicines: parseInt(lowStockMedicinesResult.rows[0].total, 10),
            weeklyRevenueGrowth: getGrowth(currentWeekRevenue, previousWeekRevenue),
            weeklyOrdersGrowth: getGrowth(currentWeekOrders, previousWeekOrders),
          },
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
      const userId = req.user.userId;

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
          `SELECT COALESCE(SUM(grand_total), 0) AS total
           FROM orders
           WHERE user_id = $1
             AND (payment_status = 'paid' OR status = 'delivered')`,
          [userId],
        ),
        query(
          `SELECT o.id, o.order_number, o.grand_total, o.delivery_fee, o.status, o.created_at,
                    COALESCE(
                      json_agg(json_build_object('name', oi.medicine_name))
                        FILTER (WHERE oi.id IS NOT NULL),
                      '[]'::json
                    ) AS items
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
          deliveryFee: parseFloat(r.delivery_fee || 0),
          status: r.status,
          date: new Date(r.created_at).toLocaleDateString(),
          items: Array.isArray(r.items) ? r.items : [],
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
