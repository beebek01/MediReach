/**
 * Payment Service — business logic for COD and eSewa ePay payments.
 *
 * eSewa ePay flow:
 *   1. Frontend calls POST /api/payments/esewa/initiate with orderId
 *   2. Backend returns signed ePay form fields
 *   3. Frontend auto-submits form to eSewa hosted checkout
 *   4. eSewa redirects to success_url / failure_url
 *   5. Backend verifies transaction against eSewa status API
 *   6. Backend updates payment + order status
 */

const config = require('../config');
const paymentRepository = require('../repositories/payment.repository');
const orderRepository = require('../repositories/order.repository');
const esewaService = require('./esewa.service');
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
} = require('../utils/errors');

/* ================================================================
   HELPER: generate idempotency key for a payment attempt
   ================================================================ */
function makeIdempotencyKey(orderId, method) {
  return `${orderId}:${method}:${Date.now()}`;
}

function generateTransactionUuid(orderId) {
  return `ESW-${orderId.slice(0, 8)}-${Date.now()}`;
}

function buildCallbackUrl(path) {
  return new URL(path, config.serverUrl).toString();
}

const paymentService = {
  /* ──────────────────────────────────────────────── COD ─────────── */
  async createCodPayment(orderId, amount) {
    const existing = await paymentRepository.findByOrderId(orderId);
    const alreadyPaid = existing.find((p) => p.status === 'success');
    if (alreadyPaid) throw new ConflictError('Order already paid');

    return paymentRepository.create({
      orderId,
      method: 'cod',
      amount,
      status: 'pending',
      idempotencyKey: makeIdempotencyKey(orderId, 'cod'),
    });
  },

  async markCodPaid(orderId) {
    const payments = await paymentRepository.findByOrderId(orderId);
    const codPayment = payments.find((p) => p.method === 'cod' && p.status === 'pending');
    if (!codPayment) throw new NotFoundError('No pending COD payment found');

    await paymentRepository.updateStatus(codPayment.id, {
      status: 'success',
      transactionId: `COD-${orderId.slice(0, 8)}`,
    });

    await orderRepository.updatePaymentStatus(orderId, 'paid');
    return { message: 'COD payment marked as paid' };
  },

  /* ──────────────────────────────────────────────── eSewa ───────── */

  /**
    * Initiate eSewa ePay payment.
    * Returns signed payload fields required by https://uat.esewa.com.np/epay/main
   */
  async initiateEsewa(orderId, userId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.user_id !== userId) throw new BadRequestError('Access denied');
    if (order.payment_method !== 'esewa') {
      throw new BadRequestError('Order payment method is not eSewa');
    }
    if (order.payment_status === 'paid') {
      throw new ConflictError('Order already paid');
    }

    const existingPayments = await paymentRepository.findByOrderId(orderId);
    const successfulPayment = existingPayments.find((payment) => payment.status === 'success');
    if (successfulPayment) {
      throw new ConflictError('Order already paid');
    }

    const existingPending = existingPayments.find(
      (payment) =>
        payment.method === 'esewa' &&
        payment.status === 'pending' &&
        payment.transaction_id
    );

    const transactionUuid =
      existingPending?.transaction_id || generateTransactionUuid(order.id);

    if (!existingPending) {
      const idempotencyKey = makeIdempotencyKey(orderId, 'esewa');
      await paymentRepository.create({
        orderId,
        method: 'esewa',
        amount: order.grand_total,
        status: 'pending',
        transactionId: transactionUuid,
        idempotencyKey,
      });
    }

    const successUrl = buildCallbackUrl(config.esewa.successPath);
    const failureUrl = buildCallbackUrl(config.esewa.failurePath);
    const formData = esewaService.buildEsewaFormData({
      totalAmount: order.grand_total,
      transactionUuid,
      successUrl,
      failureUrl,
    });

    if (config.esewa.mock) {
      return {
        paymentUrl: `${config.clientUrl}/customer/payment/esewa/mock-checkout`,
        formData,
        mock: true,
      };
    }

    return {
      paymentUrl: config.esewa.initiateUrl,
      formData,
    };
  },

  /**
   * Verify eSewa callback by checking provider-side transaction status.
   * Accepts data from ePay callback or normalized fields from manual verify endpoint.
   */
  async verifyEsewaCallback({ transactionUuid, totalAmount, transactionCode }) {
    if (!transactionUuid) {
      throw new BadRequestError('Missing required transaction UUID');
    }

    const payment = await paymentRepository.findByTransactionId(transactionUuid);
    if (!payment) throw new NotFoundError('Payment record not found');

    const order = await orderRepository.findById(payment.order_id);
    if (!order) throw new NotFoundError('Order not found for payment');

    if (payment.status === 'success') {
      return {
        message: 'Payment already verified',
        orderId: payment.order_id,
        transactionUuid,
      };
    }

    const expectedAmount = esewaService.normalizeMoney(order.grand_total);
    const callbackAmount = esewaService.normalizeMoney(
      totalAmount ?? order.grand_total
    );
    if (expectedAmount !== callbackAmount) {
      await paymentRepository.updateStatus(payment.id, {
        status: 'failed',
        providerRef: transactionCode,
        providerResponse: {
          reason: 'Amount mismatch',
          expectedAmount,
          callbackAmount,
        },
      });
      await orderRepository.updatePaymentStatus(order.id, 'failed');
      throw new BadRequestError('Invalid payment amount');
    }

    let verificationResult = { isSuccess: true, raw: { mock: true } };

    if (!config.esewa.mock) {
      verificationResult = await esewaService.verifyTransactionStatus({
        productCode: config.esewa.productCode,
        totalAmount: callbackAmount,
        transactionUuid,
      });
    }

    if (!verificationResult.isSuccess) {
      await paymentRepository.updateStatus(payment.id, {
        status: 'failed',
        providerRef: transactionCode,
        providerResponse: {
          verification: verificationResult.raw,
        },
      });
      await orderRepository.updatePaymentStatus(order.id, 'failed');
      throw new BadRequestError('eSewa transaction verification failed');
    }

    await paymentRepository.updateStatus(payment.id, {
      status: 'success',
      providerRef: transactionCode,
      providerResponse: {
        transactionUuid,
        totalAmount: callbackAmount,
        transactionCode,
        verification: verificationResult.raw,
      },
    });
    await orderRepository.updatePaymentStatus(order.id, 'paid');

    if (order.status === 'pending') {
      await orderRepository.updateStatus(order.id, 'verified');
    }

    return {
      message: 'Payment verified successfully',
      orderId: order.id,
      transactionUuid,
    };
  },

  async markEsewaFailed({ transactionUuid, totalAmount, reason = 'Payment failed or cancelled' }) {
    if (!transactionUuid) {
      throw new BadRequestError('Missing required transaction UUID');
    }

    const payment = await paymentRepository.findByTransactionId(transactionUuid);
    if (!payment) {
      throw new NotFoundError('Payment record not found');
    }

    if (payment.status !== 'success') {
      await paymentRepository.updateStatus(payment.id, {
        status: 'failed',
        providerResponse: {
          transactionUuid,
          totalAmount,
          reason,
        },
      });
      await orderRepository.updatePaymentStatus(payment.order_id, 'failed');
    }

    return { orderId: payment.order_id, message: reason };
  },

  async verifyEsewa(encodedData) {
    const decoded = esewaService.decodeEsewaData(encodedData);
    const transactionUuid = decoded.transaction_uuid || decoded.pid || decoded.oid;
    const totalAmount = decoded.total_amount || decoded.tAmt || decoded.amt;
    const transactionCode = decoded.transaction_code || decoded.refId;

    return this.verifyEsewaCallback({
      transactionUuid,
      totalAmount,
      transactionCode,
    });
  },

  /* ──────────────────────────────────────────── Shared ──────────── */
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

