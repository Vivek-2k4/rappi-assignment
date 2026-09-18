
const express = require("express");
const { z } = require("zod");

const { evaluatePurchase } = require("../agent/decision-engine");
const { runPurchaseWorkflow } = require("../agent/purchase-workflow");
const { generatePurchaseAnalysis } = require("../agent/agent-service");
const { generateToolAgentDecision } = require("../agent/tool-agent-service");

const router = express.Router();

const purchaseSchema = z.object({
  productId: z.number().int().positive(),
  requestedQuantity: z.number().int().positive(),
});

const workflowSchema = purchaseSchema.extend({
  approved: z.boolean().default(false),
});

// --------------------------------------------------
// 1. RULE-BASED PURCHASE EVALUATION
// --------------------------------------------------

router.post("/evaluate", (req, res) => {
  try {
    const parsed = purchaseSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid purchase request",
        details: parsed.error.issues,
      });
    }

    const result = evaluatePurchase(parsed.data);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Purchase evaluation error:", error);

    return res.status(500).json({
      error: "Failed to evaluate purchase",
    });
  }
});

// --------------------------------------------------
// 2. PURCHASE EXECUTION WORKFLOW
// --------------------------------------------------

router.post("/execute", (req, res) => {
  try {
    const parsed = workflowSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid purchase workflow request",
        details: parsed.error.issues,
      });
    }

    const result = runPurchaseWorkflow(parsed.data);

    return res.json(result);
  } catch (error) {
    console.error("Purchase workflow error:", error);

    return res.status(500).json({
      error: "Failed to execute purchase workflow",
    });
  }
});

// --------------------------------------------------
// 3. PURCHASE HISTORY
// --------------------------------------------------

router.get("/history", (req, res) => {
  try {
    const db = require("../db/database");

    const orders = db
      .prepare(`
        SELECT
          purchase_orders.id AS purchaseOrderId,
          products.name AS productName,
          products.sku,
          suppliers.name AS supplierName,
          purchase_orders.quantity,
          purchase_orders.status,
          purchase_orders.created_at AS createdAt
        FROM purchase_orders
        JOIN products
          ON purchase_orders.product_id = products.id
        JOIN suppliers
          ON purchase_orders.supplier_id = suppliers.id
        ORDER BY purchase_orders.created_at DESC
      `)
      .all();

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Purchase history error:", error);

    return res.status(500).json({
      error: "Failed to fetch purchase history",
    });
  }
});

// --------------------------------------------------
// 4. BASIC GEMINI ANALYSIS
// --------------------------------------------------

router.post("/agent-analyze", async (req, res) => {
  try {
    const parsed = purchaseSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid purchase request",
        details: parsed.error.issues,
      });
    }

    const evaluation = evaluatePurchase(parsed.data);

    const analysis = await generatePurchaseAnalysis(evaluation);

    return res.json({
      success: true,
      evaluation,
      analysis,
    });
  } catch (error) {
    console.error("Agent analysis failed:", error.message);

    return res.status(500).json({
      success: false,
      error: "Failed to generate agent analysis",
    });
  }
});

// --------------------------------------------------
// 5. TOOL-BASED AI AGENT WITH SAFETY VALIDATION
// --------------------------------------------------

router.post("/agent-tool-analyze", async (req, res) => {
  try {
    const parsed = purchaseSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid purchase request",
        details: parsed.error.issues,
      });
    }

    const { productId, requestedQuantity } = parsed.data;

    // The deterministic backend evaluation is always performed first.
    const backendEvaluation = evaluatePurchase({
      productId,
      requestedQuantity,
    });

    let toolDecision;

    try {
      // Gemini investigates the request using available tools.
      toolDecision = await generateToolAgentDecision({
        productId,
        requestedQuantity,
      });
    } catch (error) {
      console.error("Gemini tool agent unavailable:", error.message);

      // Safe fallback if Gemini is unavailable.
      return res.json({
        success: true,
        decision: {
          decision: backendEvaluation.decision,
          summary:
            backendEvaluation.reason ||
            "Decision generated by the deterministic backend evaluation.",
          key_factors: [
            "Gemini tool agent was unavailable.",
            "The backend rule-based evaluation was used as a fallback.",
          ],
          recommended_action:
            backendEvaluation.decision === "ACCEPT"
              ? "Submit the purchase request for human approval."
              : "Do not create a purchase order. Review the failed constraints.",
          human_approval_required:
            backendEvaluation.decision === "ACCEPT",
          source: "RULE_BASED_FALLBACK",
          fallback_reason: error.message,
          backend_evaluation: backendEvaluation,
          tool_decision: null,
          decision_match: true,
        },
      });
    }

    // Read Gemini's decision safely.
    const aiDecision =
      toolDecision?.decision ||
      toolDecision?.validatedDecision ||
      null;

    // The backend remains the final safety authority.
    const finalDecision = backendEvaluation.decision;

    const decisionMatch = aiDecision === finalDecision;

    const combinedDecision = {
      decision: finalDecision,

      summary:
        toolDecision?.summary ||
        backendEvaluation.reason ||
        "Purchase evaluated successfully.",

      key_factors: [
        ...(Array.isArray(toolDecision?.key_factors)
          ? toolDecision.key_factors
          : []),

        `Backend rule-based decision: ${finalDecision}.`,

        ...(decisionMatch
          ? ["Gemini and backend decisions match."]
          : [
              `Decision difference detected: Gemini suggested ${
                aiDecision || "UNKNOWN"
              }, while the backend determined ${finalDecision}.`,
              "The backend decision takes priority for safety.",
            ]),
      ],

      recommended_action:
        decisionMatch && toolDecision?.recommended_action
          ? toolDecision.recommended_action
          : finalDecision === "ACCEPT"
          ? "Submit the purchase request for human approval."
          : "Do not create a purchase order. Review the failed constraints.",

      human_approval_required:
        finalDecision === "ACCEPT",

      source: "GEMINI_TOOL_AGENT_WITH_BACKEND_VALIDATION",

      backend_evaluation: backendEvaluation,

      tool_decision: toolDecision,

      decision_match: decisionMatch,

      safety_authority: "RULE_BASED_BACKEND",
    };

    return res.json({
      success: true,
      decision: combinedDecision,
    });
  } catch (error) {
    console.error("Tool agent analysis failed:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to generate tool-based agent decision",
    });
  }
});

module.exports = router;