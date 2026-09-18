
require("dotenv").config();

const { evaluatePurchase } = require("./decision-engine");
const { generatePurchaseAnalysis } = require("./agent-service");

async function testAgent() {
  try {
    const evaluation = evaluatePurchase({
      productId: 1,
      requestedQuantity: 100,
    });

    console.log("Backend evaluation:");
    console.log(evaluation);

    const analysis = await generatePurchaseAnalysis(evaluation);

    console.log("\nGemini agent analysis:\n");
    console.log(analysis);
  } catch (error) {
    console.error("Agent test failed:", error.message);
  }
}

testAgent();