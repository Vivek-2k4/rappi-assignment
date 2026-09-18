
require("dotenv").config();

const { askGemini } = require("./llm-service");

async function testGemini() {
  try {
    const response = await askGemini(
      "Explain in two sentences what an AI purchasing agent does."
    );

    console.log("\nGemini response:\n");
    console.log(response);
  } catch (error) {
    console.error("Gemini API test failed:", error.message);
  }
}

testGemini();