require("dotenv").config();

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const AI_ENABLED = (process.env.AI_ENABLED || "true").trim().toLowerCase() !== "false";

if (!process.env.GEMINI_API_KEY) {
  console.warn("[CONFIG] GEMINI_API_KEY not found in environment. Check .env file.");
}

module.exports = {
  GEMINI_API_KEY,
  hasGeminiKey: GEMINI_API_KEY.length > 0,
  AI_ENABLED
};