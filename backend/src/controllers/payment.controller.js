/**
 * Payment Controller — HTTP handlers for /api/payments
 */

const paymentService = require('../services/payment.service');
const { success } = require('../utils/response');
const config = require('../config');

const paymentController = {
  /* ─────────────────────────────── eSewa ───────────────────────────── */

  /**
   * POST /api/payments/esewa/initiate
   * Body: { orderId }
   */
  async initiateEsewa(req, res, next) {
    try {
      const { orderId } = req.body;
      const result = await paymentService.initiateEsewa(orderId, req.user.userId);
      return success(res, result, 'eSewa payment initiated');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/payments/esewa/verify
   * Query: { data } (encodedData from eSewa)
   */
  async verifyEsewa(req, res, next) {
    try {
      const { data } = req.query;
      const result = await paymentService.verifyEsewa(data);
      return success(res, result, 'eSewa payment verified');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/payments/esewa/success
   * Query: data (base64 JSON from ePay)
   */
  async esewaSuccessCallback(req, res) {
    const { data } = req.query;
    try {
      const result = await paymentService.verifyEsewa(data);
      const redirectUrl = new URL('/customer/payment/esewa/success', config.clientUrl);
      redirectUrl.searchParams.set('orderId', result.orderId);
      if (result.transactionUuid) {
        redirectUrl.searchParams.set('transaction_uuid', result.transactionUuid);
      }
      return res.redirect(302, redirectUrl.toString());
    } catch (error) {
      const redirectUrl = new URL('/customer/payment/esewa/failure', config.clientUrl);
      redirectUrl.searchParams.set('transaction_uuid', '');
      redirectUrl.searchParams.set('message', error.message || 'Payment verification failed');
      return res.redirect(302, redirectUrl.toString());
    }
  },

  /**
   * GET /api/payments/esewa/failure
   * Query: data (optional base64 JSON from ePay)
   */
  async esewaFailureCallback(req, res) {
    const { data } = req.query;
    try {
      if (data) {
        const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        const transactionUuid = decoded.transaction_uuid || decoded.pid || '';
        const totalAmount = decoded.total_amount || decoded.tAmt || null;
        if (transactionUuid) {
          const result = await paymentService.markEsewaFailed({
            transactionUuid,
            totalAmount,
            reason: 'Payment failed or cancelled at eSewa',
          });
          const redirectUrl = new URL('/customer/payment/esewa/failure', config.clientUrl);
          redirectUrl.searchParams.set('orderId', result.orderId);
          redirectUrl.searchParams.set('transaction_uuid', transactionUuid);
          return res.redirect(302, redirectUrl.toString());
        }
      }

      const redirectUrl = new URL('/customer/payment/esewa/failure', config.clientUrl);
      redirectUrl.searchParams.set('transaction_uuid', '');
      return res.redirect(302, redirectUrl.toString());
    } catch (error) {
      const redirectUrl = new URL('/customer/payment/esewa/failure', config.clientUrl);
      redirectUrl.searchParams.set('transaction_uuid', '');
      redirectUrl.searchParams.set('message', error.message || 'Payment failed');
      return res.redirect(302, redirectUrl.toString());
    }
  },

  /* ─────────────────────────────── Shared ────────────────────────── */

  /**
   * GET /api/payments/order/:orderId
   * Get all payment records for an order.
   */
  async getOrderPayments(req, res, next) {
    try {
      const payments = await paymentService.getOrderPayments(req.params.orderId);
      return success(res, { payments });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = paymentController;
