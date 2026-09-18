
const db = require("../db/database");

function validatePurchaseOrder({
  purchaseOrderId,
  productId,
  expectedQuantity,
}) {
  const order = db
    .prepare(`
      SELECT *
      FROM purchase_orders
      WHERE id = ?
    `)
    .get(purchaseOrderId);

  // 1. Check whether the purchase order exists.
  if (!order) {
    return {
      valid: false,
      status: "NOT_FOUND",
      reason: "Purchase order was not found.",
    };
  }

  // 2. Validate the purchase order details.
  const quantityMatches =
    order.product_id === productId &&
    order.quantity === expectedQuantity;

  if (!quantityMatches) {
    return {
      valid: false,
      status: "MISMATCH",
      reason: "Purchase order details do not match the expected values.",
      order,
    };
  }

  // 3. Confirm the order status.
  if (order.status !== "OPEN") {
    return {
      valid: false,
      status: "INVALID_STATUS",
      reason: `Unexpected purchase order status: ${order.status}`,
      order,
    };
  }

  return {
    valid: true,
    status: "VALIDATED",
    reason: "Purchase order was successfully validated.",
    order,
  };
}

module.exports = {
  validatePurchaseOrder,
};