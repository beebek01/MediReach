/**
 * Payment Service — business logic for COD and IME Pay payments.
 *
 * IME Pay flow:
 *   1. Frontend calls POST /api/payments/imepay/initiate → gets form data
 *   2. Frontend submits form to IME Pay
 *   3. IME Pay redirects to success/failure URL with response data
 *   4. Frontend calls POST /api/payments/imepay/verify with the response data
 *
 * COD flow:
 *   1. Checkout sets paymentMethod = 'cod' and paymentStatus = 'pending'
 *   2. On delivery, admin marks order delivered → payment status becomes 'paid'
 */

const crypto = require("crypto");
const axios = require("axios");
const config = require("../config");
const paymentRepository = require("../repositories/payment.repository");
const orderRepository = require("../repositories/order.repository");
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
} = require("../utils/errors");

/* ================================================================
   HELPER: generate idempotency key for a payment attempt
   ================================================================ */
function makeIdempotencyKey(orderId, method) {
  return `${orderId}:${method}:${Date.now()}`;
}

/* ================================================================
   Payment Service
   ================================================================ */
const paymentService = {
  /* ──────────────────────────────────────────────── COD ─────────── */

  /**
   * For COD, we simply create a pending payment record.
   * Called automatically during checkout if paymentMethod === 'cod'.
   */
  async createCodPayment(orderId, amount) {
    const existing = await paymentRepository.findByOrderId(orderId);
    const alreadyPaid = existing.find((p) => p.status === "success");
    if (alreadyPaid) throw new ConflictError("Order already paid");

    return paymentRepository.create({
      orderId,
      method: "cod",
      amount,
      status: "pending",
      idempotencyKey: makeIdempotencyKey(orderId, "cod"),
    });
  },

  /**
   * Mark COD payment as paid (called when order is delivered).
   */
  async markCodPaid(orderId) {
    const payments = await paymentRepository.findByOrderId(orderId);
    const codPayment = payments.find(
      (p) => p.method === "cod" && p.status === "pending",
    );
    if (!codPayment) throw new NotFoundError("No pending COD payment found");

    await paymentRepository.updateStatus(codPayment.id, {
      status: "success",
      transactionId: `COD-${orderId.slice(0, 8)}`,
    });

    await orderRepository.updatePaymentStatus(orderId, "paid");
    return { message: "COD payment marked as paid" };
  },

  /* ─────────────────────────────── IME Pay ───────────────────────── */

  /**
   * Build the form data the frontend needs to POST to IME Pay.
   */
  async initiateImepay(orderId, userId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.user_id !== userId) throw new BadRequestError("Access denied");
    if (order.payment_method !== "imepay") {
      throw new BadRequestError("Order payment method is not IME Pay");
    }
    if (order.payment_status === "paid") {
      throw new ConflictError("Order is already paid");
    }

    const amount = parseFloat(order.grand_total);
    const transactionId = `IMP-${order.id.slice(0, 8)}-${Date.now()}`;

    // Create pending payment record
    const idempotencyKey = makeIdempotencyKey(orderId, "imepay");
    await paymentRepository.create({
      orderId,
      method: "imepay",
      amount,
      status: "pending",
      transactionId,
      idempotencyKey,
    });

    // Return data for frontend to submit as an HTML form to IME Pay
    return {
      paymentUrl: "https://payment.imepay.com.np/web/payment",
      formData: {
        MerchantId: config.imepay.merchantId,
        Amount: amount,
        RefId: transactionId,
        SuccessUrl: `${config.clientUrl}/customer/payment/imepay/success`,
        FailureUrl: `${config.clientUrl}/customer/payment/imepay/failure`,
        // Add other required IME Pay fields as needed
      },
    };
  },

  /**
   * Verify IME Pay payment callback.
   * The frontend receives response data from IME Pay and POSTs it here.
   */
  async verifyImepay(responseData) {
    // Find the payment record using the RefId from IME Pay response
    const transactionId = responseData.RefId;
    const payment = await paymentRepository.findByTransactionId(transactionId);
    if (!payment) throw new NotFoundError("Payment record not found");

    // Idempotency: already processed?
    if (payment.status === "success") {
      return { message: "Payment already verified", orderId: payment.order_id };
    }

    // Verify payment status from IME Pay response
    if (responseData.Status === "SUCCESS") {
      await paymentRepository.updateStatus(payment.id, {
        status: "success",
        providerRef: transactionId,
        providerResponse: responseData,
      });
      await orderRepository.updatePaymentStatus(payment.order_id, "paid");

      // If order was pending, move to verified
      const order = await orderRepository.findById(payment.order_id);
      if (order && order.status === "pending") {
        await orderRepository.updateStatus(payment.order_id, "verified");
      }

      return {
        message: "IME Pay payment verified successfully",
        orderId: payment.order_id,
      };
    }

    // Payment failed
    await paymentRepository.updateStatus(payment.id, {
      status: "failed",
      providerResponse: responseData,
    });
    await orderRepository.updatePaymentStatus(payment.order_id, "failed");

    throw new BadRequestError("IME Pay payment was not completed");
  },

  /* ──────────────────────────────────────────── Shared ──────────── */

  /**
   * Get payment records for an order.
   */
  async getOrderPayments(orderId) {
    const payments = await paymentRepository.findByOrderId(orderId);
    return payments.map((p) => ({
      id: p.id,
      orderId: p.order_id,
      method: p.method,
      amount: parseFloat(p.amount),
      status: p.status,
      transactionId: p.transaction_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  },
};

module.exports = paymentService;
