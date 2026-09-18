
const { GoogleGenAI } = require("@google/genai");

const {
  purchasingToolDeclarations,
  executePurchasingTool,
} = require("./gemini-tools");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.6-flash";

// Existing simple Gemini function.
async function askGemini(prompt) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return response.text;
}

// Gemini function-calling agent.
async function askGeminiWithTools(prompt) {
  const contents = [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  const config = {
    tools: [
      {
        functionDeclarations: purchasingToolDeclarations,
      },
    ],
  };

  const maxIterations = 5;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config,
    });

    const functionCalls = response.functionCalls;

    // Gemini has finished and returned a text response.
    if (!functionCalls || functionCalls.length === 0) {
      return response.text || "No analysis generated.";
    }

    // Preserve Gemini's function-call message.
    if (response.candidates?.[0]?.content) {
      contents.push(response.candidates[0].content);
    }

    const functionResponseParts = [];

    for (const functionCall of functionCalls) {
      try {
        console.log(
          `Gemini requested tool: ${functionCall.name}`,
          functionCall.args
        );

        const result = executePurchasingTool(
          functionCall.name,
          functionCall.args || {}
        );

        functionResponseParts.push({
          functionResponse: {
            name: functionCall.name,
            response: {
              result: result ?? null,
            },
          },
        });
      } catch (error) {
        functionResponseParts.push({
          functionResponse: {
            name: functionCall.name,
            response: {
              error: error.message,
            },
          },
        });
      }
    }

    // Return tool results to Gemini.
    contents.push({
      role: "user",
      parts: functionResponseParts,
    });
  }

  throw new Error("Maximum Gemini tool-calling iterations reached.");
}

module.exports = {
  askGemini,
  askGeminiWithTools,
};