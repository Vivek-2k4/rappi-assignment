
const db = require("../db/database");
const { evaluatePurchase } = require("./decision-engine");

function executePurchaseOrder({
  productId,
  requestedQuantity,
  approved = false,
}) {
  // 1. Evaluate the purchase again before execution.
  const evaluation = evaluatePurchase({
    productId,
    requestedQuantity,
  });

  // 2. Never execute infeasible purchases.
  if (evaluation.decision !== "ACCEPT") {
    return {
      success: false,
      status: "BLOCKED",
      reason: evaluation.reason,
      evaluation,
    };
  }

  // 3. Require explicit human approval.
  if (!approved) {
    return {
      success: false,
      status: "APPROVAL_REQUIRED",
      reason: "Human approval is required before creating a purchase order.",
      evaluation,
    };
  }

  // 4. Create the purchase order.
  const inventory = db
    .prepare(`
      SELECT node_id
      FROM inventory
      WHERE product_id = ?
    `)
    .get(productId);

  const supplier = db
    .prepare(`
      SELECT supplier_id
      FROM products
      WHERE id = ?
    `)
    .get(productId);

  if (!inventory || !supplier) {
    return {
      success: false,
      status: "FAILED",
      reason: "Product or supplier information is unavailable.",
    };
  }

  const insertOrder = db.prepare(`
    INSERT INTO purchase_orders (
      product_id,
      supplier_id,
      quantity,
      status,
      created_at
    )
    VALUES (?, ?, ?, 'OPEN', datetime('now'))
  `);

  const result = insertOrder.run(
    productId,
    supplier.supplier_id,
    requestedQuantity
  );

  return {
    success: true,
    status: "CREATED",
    purchaseOrderId: result.lastInsertRowid,
    productId,
    supplierId: supplier.supplier_id,
    quantity: requestedQuantity,
  };
}

module.exports = {
  executePurchaseOrder,
};