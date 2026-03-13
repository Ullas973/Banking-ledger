const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const accountController = require("../controllers/account.controller");

const router = express.Router();

/**
 * --GET /api/accounts/
 * --Create a new account
 * --Protected route
 */

router.post(
  "/",
  authMiddleware.authMiddleware,
  accountController.createAccountController,
);

/**
 * GET /api/accounts/
 * --get all accounts of the logged in user
 * --protected route
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountController);

/**
 * GET /api/accounts/balance/:accountId
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware,accountController.getAccountBalanceController)

module.exports = router;
