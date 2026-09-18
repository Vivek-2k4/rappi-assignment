const { askGeminiWithTools } = require("./llm-service");
const { validateAgentDecision } = require("./agent-response-validator");
const { evaluatePurchase } = require("./decision-engine");

const {
  getInventory,
  getDemandForecast,
  getOpenPurchaseOrders,
  getSupplier,
  getStorageCapacity,
} = require("./tools");

function getOperationalContext(productId, requestedQuantity) {
  const inventory = getInventory(productId);
  const demandForecast = getDemandForecast(productId);
  const openOrders = getOpenPurchaseOrders(productId);
  const supplier = getSupplier(productId);
  const storage = getStorageCapacity(productId);

  const incomingQuantity = openOrders.reduce(
    (total, order) => total + order.quantity,
    0
  );

  const currentInventory = inventory?.quantity ?? 0;
  const storageCapacity = storage?.storage_capacity ?? 0;

  const availableStorage =
    storageCapacity - currentInventory - incomingQuantity;

  const supplierAvailable = supplier?.available_quantity ?? 0;

  const feasibleQuantity = Math.max(
    0,
    Math.min(supplierAvailable, availableStorage)
  );

  const shortageQuantity = Math.max(
    0,
    requestedQuantity - supplierAvailable
  );

  return {
    inventory,
    demandForecast,
    openOrders,
    supplier,
    storage,
    incomingQuantity,
    currentInventory,
    storageCapacity,
    availableStorage,
    supplierAvailable,
    feasibleQuantity,
    shortageQuantity,
  };
}

function generateFallbackDecision({
  productId,
  requestedQuantity,
  error,
  context,
}) {
  const evaluation = evaluatePurchase({
    productId,
    requestedQuantity,
  });

  const decision = evaluation.decision;

  let summary;
  let recommendedAction;
  let humanApprovalRequired;

  const supplierShortage =
    context?.supplierAvailable !== undefined &&
    requestedQuantity > context.supplierAvailable;

  if (supplierShortage) {
    const available = context.supplierAvailable;
    const remaining = Math.max(0, requestedQuantity - available);

    summary =
      `The supplier can provide only ${available} units, ` +
      `which is less than the requested ${requestedQuantity} units.`;

    recommendedAction =
      `Consider purchasing up to ${available} units from the current supplier ` +
      `and investigate alternate sourcing for the remaining ${remaining} units. ` +
      `Human approval is required before creating any purchase order.`;

    humanApprovalRequired = true;
  } else if (decision === "ACCEPT") {
    summary =
      "The purchase satisfies the available supplier, budget, MOQ, and storage constraints.";

    recommendedAction =
      "Submit the purchase request for human approval.";

    humanApprovalRequired = true;
  } else if (decision === "MODIFY") {
    summary =
      "The requested purchase requires modification because one or more constraints are not satisfied.";

    recommendedAction =
      "Review the evaluation and adjust the requested quantity before seeking approval.";

    humanApprovalRequired = true;
  } else if (decision === "REJECT") {
    summary =
      "The purchase should not proceed because the current purchasing constraints are not satisfied.";

    recommendedAction =
      "Do not create a purchase order. Re-evaluate inventory requirements later.";

    humanApprovalRequired = false;
  } else {
    summary =
      "The purchasing request requires further investigation before taking action.";

    recommendedAction =
      "Review the failed checks and escalate to a human decision-maker.";

    humanApprovalRequired = true;
  }

  return {
    decision,
    summary,
    key_factors: [
      `Backend evaluation decision: ${decision}`,
      evaluation.reason ||
        "Decision generated using backend purchasing rules.",
      supplierShortage
        ? `Supplier availability: ${context.supplierAvailable} units`
        : "Supplier availability checked.",
      "Gemini fallback activated because the AI service was unavailable.",
    ],
    recommended_action: recommendedAction,
    human_approval_required: humanApprovalRequired,
    source: "RULE_BASED_FALLBACK",
    fallback_reason: error.message,
  };
}

async function generateToolAgentDecision({
  productId,
  requestedQuantity,
}) {
  let context;

  try {
    context = getOperationalContext(productId, requestedQuantity);

    const prompt = `
You are an AI Purchasing Agent for a retail supply chain.

IMPORTANT RULES:
- All monetary values are in Indian Rupees (INR).
- Use ₹ or INR when mentioning prices, costs, or budgets.
- Never use dollars ($).
- Do not create or approve any purchase order.
- Human approval is required before purchase execution.
- Use available tools to verify the information.
- Return only valid JSON.
- Do not include Markdown or text outside the JSON object.

PURCHASE REQUEST:
- Product ID: ${productId}
- Requested quantity: ${requestedQuantity} units

OPERATIONAL CONTEXT:
${JSON.stringify(context, null, 2)}

ANALYSIS REQUIREMENTS:
1. Inspect inventory, demand forecast, open purchase orders,
   supplier information, storage capacity, and budget using tools.

2. Check whether the supplier can fulfill the complete request.

3. If supplier availability is lower than the requested quantity:
   - Mention the available supplier quantity.
   - Calculate the remaining shortage.
   - Consider partial fulfillment.
   - Suggest investigating an alternate supplier for the remaining quantity.
   - Do not recommend purchasing more than the supplier can provide.

4. Check whether the requested or partial quantity fits in storage.

5. If storage capacity limits the purchase, recommend a feasible quantity
   only when it is supported by the available supplier quantity and storage.

6. Never blindly approve a purchase.
   Clearly mention human approval when purchase action is recommended.

7. Keep the final decision consistent with the backend evaluation:
   ACCEPT, MODIFY, REJECT, or INVESTIGATE.

RETURN THIS JSON STRUCTURE:

{
  "decision": "ACCEPT | MODIFY | REJECT | INVESTIGATE",
  "summary": "Short explanation of the purchasing decision",
  "key_factors": [
    "Important verified factor"
  ],
  "recommended_action": "Specific next action",
  "human_approval_required": true
}
`;

    const rawResponse = await askGeminiWithTools(prompt);

    const validatedDecision = validateAgentDecision(rawResponse);

    return {
      ...validatedDecision,
      source: "GEMINI_TOOL_AGENT_WITH_OPERATIONAL_CONTEXT",
    };
  } catch (error) {
    console.warn(
      "Gemini unavailable. Using rule-based fallback:",
      error.message
    );

    return generateFallbackDecision({
      productId,
      requestedQuantity,
      error,
      context,
    });
  }
}

module.exports = {
  generateToolAgentDecision,
};