const { evaluatePurchase } = require("./decision-engine");

const result = evaluatePurchase({
  productId: 1,
  requestedQuantity: 500,
});

console.log("\n=== PURCHASE DECISION ===");
console.dir(result, { depth: null });