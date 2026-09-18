
const { validatePurchaseOrder } = require("./validator");

const result = validatePurchaseOrder({
  purchaseOrderId: 1,
  productId: 1,
  expectedQuantity: 300,
});

console.log("\n=== VALIDATION RESULT ===");
console.dir(result, { depth: null });