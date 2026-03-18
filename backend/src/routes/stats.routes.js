/**
 * Stats Routes — /api/stats
 *
 * GET /public      — landing page totals (no auth)
 * GET /admin       — admin dashboard & analytics (admin only)
 * GET /customer    — customer dashboard (customer only)
 * GET /pharmacist  — pharmacist dashboard (pharmacist only)
 */

const { Router } = require("express");
const statsController = require("../controllers/stats.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const router = Router();

// Public (no auth)
router.get("/public", statsController.publicStats);

// Protected
router.get(
  "/admin",
  authenticate,
  authorize("admin"),
  statsController.adminStats,
);
router.get(
  "/customer",
  authenticate,
  authorize("customer"),
  statsController.customerStats,
);
router.get(
  "/pharmacist",
  authenticate,
  authorize("pharmacist"),
  statsController.pharmacistStats,
);

module.exports = router;
