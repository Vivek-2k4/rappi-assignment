const {
  getInventory,
  getDemandForecast,
  getOpenPurchaseOrders,
  getSupplier,
  getBudget,
  getStorageCapacity,
} = require("./tools");

const productId = 1;
const nodeId = "DEL-NODE-01";

console.log("\n--- INVENTORY ---");
console.log(getInventory(productId));

console.log("\n--- DEMAND FORECAST ---");
console.log(getDemandForecast(productId));

console.log("\n--- OPEN PURCHASE ORDERS ---");
console.log(getOpenPurchaseOrders(productId));

console.log("\n--- SUPPLIER ---");
console.log(getSupplier(productId));

console.log("\n--- BUDGET ---");
console.log(getBudget(nodeId));

console.log("\n--- STORAGE ---");
console.log(getStorageCapacity(productId));