const { runPurchaseWorkflow } = require("./purchase-workflow");

const result = runPurchaseWorkflow({
  productId: 1,
  requestedQuantity: 100,
  approved: false,
});

console.log("\n=== PURCHASE WORKFLOW RESULT ===");
console.dir(result, { depth: null });