const db = require("../db/database");

/**
 * Get current inventory for a product.
 */
function getInventory(productId) {
  return db
    .prepare(`
      SELECT
        product_id,
        node_id,
        quantity,
        storage_capacity
      FROM inventory
      WHERE product_id = ?
    `)
    .get(productId);
}

/**
 * Get demand forecast for a product.
 */
function getDemandForecast(productId) {
  return db
    .prepare(`
      SELECT
        product_id,
        daily_demand,
        forecast_days
      FROM demand_forecasts
      WHERE product_id = ?
    `)
    .get(productId);
}

/**
 * Get currently open purchase orders.
 */
function getOpenPurchaseOrders(productId) {
  return db
    .prepare(`
      SELECT
        id,
        product_id,
        supplier_id,
        quantity,
        status,
        created_at
      FROM purchase_orders
      WHERE product_id = ?
        AND status = 'OPEN'
    `)
    .all(productId);
}

/**
 * Get supplier information.
 */
function getSupplier(productId) {
  return db
    .prepare(`
      SELECT
        s.id,
        s.name,
        s.lead_time_days,
        s.minimum_order_quantity,
        s.available_quantity
      FROM suppliers s
      JOIN products p
        ON p.supplier_id = s.id
      WHERE p.id = ?
    `)
    .get(productId);
}

/**
 * Get available purchasing budget for a node.
 */
function getBudget(nodeId) {
  return db
    .prepare(`
      SELECT
        node_id,
        available_amount
      FROM budgets
      WHERE node_id = ?
    `)
    .get(nodeId);
}

/**
 * Get storage capacity for a product's node.
 */
function getStorageCapacity(productId) {
  return db
    .prepare(`
      SELECT
        node_id,
        storage_capacity,
        quantity AS current_inventory
      FROM inventory
      WHERE product_id = ?
    `)
    .get(productId);
}

module.exports = {
  getInventory,
  getDemandForecast,
  getOpenPurchaseOrders,
  getSupplier,
  getBudget,
  getStorageCapacity,
};