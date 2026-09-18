const {
  purchasingToolDeclarations,
  executePurchasingTool,
} = require("./gemini-tools");

console.log("\n--- TOOL DECLARATIONS ---");
console.log(
  purchasingToolDeclarations.map((tool) => tool.name)
);

console.log("\n--- DISPATCHER: INVENTORY ---");
console.log(executePurchasingTool("getInventory", {
  productId: 1,
}));

console.log("\n--- DISPATCHER: SUPPLIER ---");
console.log(executePurchasingTool("getSupplier", {
  productId: 1,
}));

console.log("\n--- DISPATCHER: BUDGET ---");
console.log(executePurchasingTool("getBudget", {
  nodeId: "DEL-NODE-01",
}));

console.log("\n--- DISPATCHER: STORAGE ---");
console.log(executePurchasingTool("getStorageCapacity", {
  productId: 1,
}));