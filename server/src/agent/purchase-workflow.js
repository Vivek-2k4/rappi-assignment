
const { evaluatePurchase } = require("./decision-engine");
const { executePurchaseOrder } = require("./action");
const { validatePurchaseOrder } = require("./validator");

function runPurchaseWorkflow({
  productId,
  requestedQuantity,
  approved = false,
}) {
  // 1. Evaluate purchase
  const evaluation = evaluatePurchase({
    productId,
    requestedQuantity,
  });

  // 2. Stop if purchase is not acceptable
  if (evaluation.decision !== "ACCEPT") {
    return {
      success: false,
      stage: "EVALUATION",
      evaluation,
    };
  }

  // 3. Execute purchase with approval
  const execution = executePurchaseOrder({
    productId,
    requestedQuantity,
    approved,
  });

  if (!execution.success) {
    return {
      success: false,
      stage: "EXECUTION",
      execution,
    };
  }

  // 4. Validate created purchase order
  const validation = validatePurchaseOrder({
    purchaseOrderId: execution.purchaseOrderId,
    productId,
    expectedQuantity: requestedQuantity,
  });

  if (!validation.valid) {
    return {
      success: false,
      stage: "VALIDATION",
      execution,
      validation,
    };
  }

  // 5. Return complete workflow result
  return {
    success: true,
    stage: "COMPLETED",
    evaluation,
    execution,
    validation,
  };
}

module.exports = {
  runPurchaseWorkflow,
};