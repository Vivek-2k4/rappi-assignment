
require("dotenv").config();

const { askGeminiWithTools } = require("./llm-service");
const { validateAgentDecision } = require("./agent-response-validator");

async function testToolAgent() {
  try {
    const response = await askGeminiWithTools(`
        You are an AI Purchasing Agent responsible for making purchasing decisions.

        Analyze whether we should purchase 100 units of product ID 1.

        Before making your recommendation, use the available tools to inspect:
        - Current inventory
        - Demand forecast
        - Open purchase orders
        - Supplier information
        - Storage capacity
        - Available budget

        Use the actual tool results in your analysis.

        Do not create or approve any purchase order.

        Return your final response ONLY as valid JSON using this exact structure:

        {
            "decision": "ACCEPT | MODIFY | REJECT | INVESTIGATE",
            "summary": "Short explanation of the decision",
            "key_factors": [
            "Important factual factor 1",
            "Important factual factor 2"
            ],
            "recommended_action": "What should happen next",
            "human_approval_required": true
        }

        Decision rules:
        - ACCEPT: Purchase can proceed if human approval is obtained.
        - MODIFY: Adjust the requested quantity or purchasing approach.
        - REJECT: Do not place the purchase order because purchasing is unnecessary or unsuitable.
        - INVESTIGATE: More information or human intervention is required.

        Set human_approval_required to:
        - true when a purchase action is recommended or human intervention is needed.
        - false when the decision is REJECT and no action is required.

        Do not include Markdown, code fences, or any text outside the JSON object.
    `);

    console.log("\nFinal Gemini Agent Response:\n");
    const validatedDecision = validateAgentDecision(response);

    console.log("\nValidated Agent Decision:\n");
    console.log(JSON.stringify(validatedDecision, null, 2));
  } catch (error) {
    console.error("Tool agent test failed:", error.message);
  }
}

testToolAgent();