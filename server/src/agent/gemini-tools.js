
const {
  getInventory,
  getDemandForecast,
  getOpenPurchaseOrders,
  getSupplier,
  getBudget,
  getStorageCapacity,
} = require("./tools");

// Descriptions Gemini uses to understand available tools.
const purchasingToolDeclarations = [
  {
    name: "getInventory",
    description: "Get current inventory for a product.",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "integer",
          description: "The product ID.",
        },
      },
      required: ["productId"],
    },
  },
  {
    name: "getDemandForecast",
    description: "Get the demand forecast for a product.",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "integer",
          description: "The product ID.",
        },
      },
      required: ["productId"],
    },
  },
  {
    name: "getOpenPurchaseOrders",
    description: "Get all open purchase orders for a product.",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "integer",
          description: "The product ID.",
        },
      },
      required: ["productId"],
    },
  },
  {
    name: "getSupplier",
    description: "Get supplier details for a product.",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "integer",
          description: "The product ID.",
        },
      },
      required: ["productId"],
    },
  },
  {
    name: "getBudget",
    description: "Get the purchasing budget for a node.",
    parameters: {
      type: "object",
      properties: {
        nodeId: {
          type: "string",
          description: "The inventory node ID.",
        },
      },
      required: ["nodeId"],
    },
  },
  {
    name: "getStorageCapacity",
    description: "Get storage capacity and current inventory for a product.",
    parameters: {
      type: "object",
      properties: {
        productId: {
          type: "integer",
          description: "The product ID.",
        },
      },
      required: ["productId"],
    },
  },
];

// Execute only approved, read-only tools.
function executePurchasingTool(name, args = {}) {
  const productId = Number(args.productId);

  if (
    ["getInventory", "getDemandForecast", "getOpenPurchaseOrders",
      "getSupplier", "getStorageCapacity"].includes(name)
  ) {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error("Invalid productId");
    }
  }

  switch (name) {
    case "getInventory":
      return getInventory(productId);

    case "getDemandForecast":
      return getDemandForecast(productId);

    case "getOpenPurchaseOrders":
      return getOpenPurchaseOrders(productId);

    case "getSupplier":
      return getSupplier(productId);

    case "getBudget":
      if (typeof args.nodeId !== "string" || !args.nodeId.trim()) {
        throw new Error("Invalid nodeId");
      }
      return getBudget(args.nodeId);

    case "getStorageCapacity":
      return getStorageCapacity(productId);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

module.exports = {
  purchasingToolDeclarations,
  executePurchasingTool,
};