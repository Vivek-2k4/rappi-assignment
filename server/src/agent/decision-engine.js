const {
  getInventory,
  getDemandForecast,
  getOpenPurchaseOrders,
  getSupplier,
  getBudget,
  getStorageCapacity,
} = require("./tools");

function evaluatePurchase({ productId, requestedQuantity }) {
  // 1. Gather information
  const inventory = getInventory(productId);
  const forecast = getDemandForecast(productId);
  const openOrders = getOpenPurchaseOrders(productId);
  const supplier = getSupplier(productId);

  if (!inventory || !forecast || !supplier) {
    return {
      decision: "INVESTIGATE",
      reason: "Required purchasing information is unavailable.",
    };
  }

  const budget = getBudget(inventory.node_id);
  const storage = getStorageCapacity(productId);

  // 2. Calculate demand
  const forecastDemand =
    forecast.daily_demand * forecast.forecast_days;

  // 3. Calculate existing incoming inventory
  const incomingQuantity = openOrders.reduce(
    (total, order) => total + order.quantity,
    0
  );

  // 4. Calculate projected inventory
  const projectedInventory =
    inventory.quantity +
    incomingQuantity +
    requestedQuantity -
    forecastDemand;

  const purchaseCost =
    requestedQuantity * getProductCost(productId);

  // 5. Check constraints
  const checks = {
    supplierAvailability:
      requestedQuantity <= supplier.available_quantity,

    minimumOrderQuantity:
      requestedQuantity >= supplier.minimum_order_quantity,

    budget:
      budget &&
      purchaseCost <= budget.available_amount,

    storage:
      storage &&
      inventory.quantity + incomingQuantity + requestedQuantity <=
        storage.storage_capacity,
  };

  // 6. Determine decision
  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  if (failedChecks.length > 0) {
    const recommendedQuantity = calculateRecommendedQuantity({
        inventory,
        forecastDemand,
        incomingQuantity,
        supplier,
        budget,
        storage,
    });

    // If no valid quantity can satisfy the constraints,
    // escalate instead of pretending that 0 is a recommendation.
    if (recommendedQuantity === null) {
        return {
        decision: "INVESTIGATE",
        reason:
            "No feasible purchase quantity satisfies all current constraints.",
        requestedQuantity,
        recommendedQuantity: null,
        analysis: {
            forecastDemand,
            incomingQuantity,
            projectedInventory,
            purchaseCost,
            checks,
        },
        };
    }

    return {
        decision: "MODIFY",
        reason: `Purchase violates constraints: ${failedChecks.join(", ")}`,
        requestedQuantity,
        recommendedQuantity,
        analysis: {
        forecastDemand,
        incomingQuantity,
        projectedInventory,
        purchaseCost,
        checks,
        },
    };
    }

    return {
        decision: "ACCEPT",
        reason: "Purchase satisfies supplier, budget, MOQ, and storage constraints.",
        requestedQuantity,
        recommendedQuantity: requestedQuantity,
        analysis: {
        forecastDemand,
        incomingQuantity,
        projectedInventory,
        purchaseCost,
        checks,
        },
    };
}

function getProductCost(productId) {
  const db = require("../db/database");

  const product = db
    .prepare(`
      SELECT unit_cost
      FROM products
      WHERE id = ?
    `)
    .get(productId);

  return product ? product.unit_cost : 0;
}

function calculateRecommendedQuantity({
  inventory,
  forecastDemand,
  incomingQuantity,
  supplier,
  budget,
  storage,
}) {
  const unitCost = getProductCost(inventory.product_id);

  // Maximum quantity allowed by storage.
  const storageLimit = storage
    ? storage.storage_capacity -
      inventory.quantity -
      incomingQuantity
    : Infinity;

  // Maximum quantity allowed by budget.
  const budgetLimit = budget
    ? Math.floor(budget.available_amount / unitCost)
    : Infinity;

  // The actual maximum quantity we can purchase.
  const maximumAllowed = Math.min(
    storageLimit,
    budgetLimit,
    supplier.available_quantity
  );

  // If we cannot even satisfy the supplier MOQ,
  // there is no feasible purchase.
  if (maximumAllowed < supplier.minimum_order_quantity) {
    return null;
  }

  const requiredQuantity = Math.max(
    0,
    forecastDemand -
      inventory.quantity -
      incomingQuantity
  );

  let recommended = Math.max(
    requiredQuantity,
    supplier.minimum_order_quantity
  );

  recommended = Math.min(
    recommended,
    maximumAllowed
  );

  // Round down to a valid MOQ multiple.
  recommended =
    Math.floor(
      recommended / supplier.minimum_order_quantity
    ) * supplier.minimum_order_quantity;

  if (recommended < supplier.minimum_order_quantity) {
    return null;
  }

  return recommended;
}

module.exports = {
  evaluatePurchase,
};