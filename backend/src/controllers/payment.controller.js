/**
 * Payment Controller — HTTP handlers for /api/payments
 */

const paymentService = require("../services/payment.service");
const { success } = require("../utils/response");

const paymentController = {
  /* ─────────────────────────────── IME Pay ───────────────────────── */

  /**
   * POST /api/payments/imepay/initiate
   * Body: { orderId }
   * Returns form data for frontend to submit to IME Pay.
   */
  async initiateImepay(req, res, next) {
    try {
      const { orderId } = req.body;
      const result = await paymentService.initiateImepay(
        orderId,
        req.user.userId,
      );
      return success(res, result, "IME Pay payment initiated");
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/payments/imepay/verify
   * Body: { responseData }  (IME Pay response data)
   * Verifies the IME Pay payment and updates order status.
   */
  async verifyImepay(req, res, next) {
    try {
      const { responseData } = req.body;
      const result = await paymentService.verifyImepay(responseData);
      return success(res, result, "IME Pay payment verified");
    } catch (err) {
      next(err);
    }
  },

  /* ─────────────────────────────── Shared ────────────────────────── */

  /**
   * GET /api/payments/order/:orderId
   * Get all payment records for an order.
   */
  async getOrderPayments(req, res, next) {
    try {
      const payments = await paymentService.getOrderPayments(
        req.params.orderId,
      );
      return success(res, { payments });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = paymentController;
