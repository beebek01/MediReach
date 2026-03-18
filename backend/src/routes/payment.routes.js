/**
 * Payment Routes — /api/payments
 *
 * POST   /imepay/initiate      — customer: get IME Pay form data
 * POST   /imepay/verify        — customer: verify IME Pay callback
 * GET    /order/:orderId       — authenticated: get payment records for order
 */

const { Router } = require("express");
const paymentController = require("../controllers/payment.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const {
  initiatePaymentSchema,
  verifyImepaySchema,
} = require("../validators/cart.validator");

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// IME Pay
router.post(
  "/imepay/initiate",
  authorize("customer"),
  validate(initiatePaymentSchema),
  paymentController.initiateImepay,
);
router.post(
  "/imepay/verify",
  authorize("customer"),
  validate(verifyImepaySchema),
  paymentController.verifyImepay,
);

// Shared
router.get("/order/:orderId", paymentController.getOrderPayments);

module.exports = router;
