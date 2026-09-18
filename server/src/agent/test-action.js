
const { executePurchaseOrder } = require("./action");

const result = executePurchaseOrder({
  productId: 1,
  requestedQuantity: 500,
  approved: true,
});

console.log("\n=== PURCHASE ACTION RESULT ===");
console.dir(result, { depth: null });