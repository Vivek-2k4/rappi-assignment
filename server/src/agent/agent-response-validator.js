const VALID_DECISIONS = [
  "ACCEPT",
  "MODIFY",
  "REJECT",
  "INVESTIGATE",
];

function validateAgentDecision(rawResponse) {
  let parsedResponse;

  try {
    parsedResponse =
      typeof rawResponse === "string"
        ? JSON.parse(rawResponse)
        : rawResponse;
  } catch (error) {
    throw new Error("Gemini returned invalid JSON");
  }

  if (!parsedResponse || typeof parsedResponse !== "object") {
    throw new Error("Agent response must be a JSON object");
  }

  const {
    decision,
    summary,
    key_factors,
    recommended_action,
    human_approval_required,
  } = parsedResponse;

  if (!VALID_DECISIONS.includes(decision)) {
    throw new Error(`Invalid decision: ${decision}`);
  }

  if (typeof summary !== "string" || summary.trim() === "") {
    throw new Error("Summary must be a non-empty string");
  }

  if (
    !Array.isArray(key_factors) ||
    key_factors.some((factor) => typeof factor !== "string")
  ) {
    throw new Error("Key factors must be an array of strings");
  }

  if (
    typeof recommended_action !== "string" ||
    recommended_action.trim() === ""
  ) {
    throw new Error("Recommended action must be a non-empty string");
  }

  if (typeof human_approval_required !== "boolean") {
    throw new Error("human_approval_required must be boolean");
  }

  return {
    decision,
    summary,
    key_factors,
    recommended_action,
    human_approval_required,
  };
}

module.exports = {
  validateAgentDecision,
};