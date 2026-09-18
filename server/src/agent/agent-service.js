
const { askGemini } = require("./llm-service");

async function generatePurchaseAnalysis(evaluation) {
  const prompt = `
You are an AI Purchasing Agent for a retail company.

Analyze the purchasing evaluation below.

Your responsibilities:
1. Explain the purchasing situation clearly.
2. Identify important constraints.
3. Explain the recommended decision.
4. Suggest the next action.

Rules:
- Use only the information provided.
- Do not invent suppliers, prices, inventory, or demand.
- Do not claim that a purchase order has been created.
- The backend decision engine remains responsible for safety checks.

Purchasing evaluation:
${JSON.stringify(evaluation, null, 2)}

Provide a concise, professional explanation for the purchasing team.
`;

  return await askGemini(prompt);
}

module.exports = {
  generatePurchaseAnalysis,
};