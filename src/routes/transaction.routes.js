const { Router } = require("express");
const transactionRoutes = Router();
const authMiddleware = require("../middlewares/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

/**
 * --POST /api/transactions/
 * --Create a new transaction
 */

transactionRoutes.post(
  "/",
  authMiddleware.authMiddleware,
  transactionController.createTransaction,
);
//now with the middleware and transaction controller we are done with this api.

/**
 * POST /api/transactions.system/initial-funds
 * --create inital funds transactions from system user
 */
transactionRoutes.post(
  "/system/initial-funds",
  authMiddleware.authSystemUserMiddleware,
  transactionController.createInitialFundsTransaction,
);

module.exports = transactionRoutes;
