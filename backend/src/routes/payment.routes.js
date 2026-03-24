/**
 * Payment Routes — /api/payments
 *
 * GET    /esewa/success         — public: eSewa success callback (su)
 * GET    /esewa/failure         — public: eSewa failure callback (fu)
 * POST   /esewa/initiate        — customer: get eSewa form data
 * GET    /esewa/verify          — authenticated/manual verify via encoded data
 * GET    /order/:orderId        — authenticated: get payment records for order
 */

const { Router } = require('express');
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  initiatePaymentSchema,
  verifyEsewaSchema,
} = require('../validators/cart.validator');

const router = Router();

// eSewa callbacks (must be public so provider can reach these URLs)
router.get('/esewa/success', paymentController.esewaSuccessCallback);
router.get('/esewa/failure', paymentController.esewaFailureCallback);

router.use(authenticate);

// eSewa
router.post(
  '/esewa/initiate',
  authorize('customer'),
  validate(initiatePaymentSchema),
  paymentController.initiateEsewa
);
router.get(
  '/esewa/verify',
  authorize('customer'),
  validate(verifyEsewaSchema),
  paymentController.verifyEsewa
);

// Shared
router.get(
  '/order/:orderId',
  paymentController.getOrderPayments
);

module.exports = router;
