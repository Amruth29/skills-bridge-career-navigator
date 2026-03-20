# Skill Bridge CLI

🎥 Project Demo: https://youtu.be/YaAHWLOGwqQ

✨ A practical CLI that helps users compare their current skills with a target role and get a clear, step-by-step learning roadmap.

---

## 📌 Project Snapshot

Candidate Name:
Amruth R

Scenario Chosen:
AI-assisted Skill Gap Analysis and Roadmap Generation (CLI)

Estimated Time Spent:
6-8 hours (implementation, reliability improvements, testing, and documentation)

---

## 🚀 Quick Start

Prerequisites:
- Node.js 18+
- npm
- Gemini API key (free-tier works, but quota limits may apply)

Run Commands:
1. Install dependencies
   ```bash
   npm install
   ```
2. Create environment file
   ```bash
   copy .env.example .env
   ```
3. Add API key in .env
   ```env
   GEMINI_API_KEY=your_key_here
   AI_ENABLED=true
   ```
4. Start application
   ```bash
   npm start
   ```

Test Commands:
```bash
npm test
```

---

## 🤖 AI Disclosure

Did you use an AI assistant (Copilot, ChatGPT, etc.)?
- Yes

How did you verify the suggestions?
- I cross-checked suggested skills with the role requirements listed in data/jobs.json.
- I validated both AI and fallback behavior using npm test.
- I manually tested both user flows: manual skill input and resume upload.
- I used debug traces to confirm whether the roadmap came from AI or fallback.

One suggestion rejected or changed:
- I rejected the idea that role + plain skill names were enough.
- I moved to category-aware mapping (core, frontend, backend, security, tools, concepts) so the guidance is easier to understand and more useful.

---

## 🛠️ Technical Stack Used

Programming Languages:
- JavaScript (Node.js runtime)

Core Libraries and Tools:
- dotenv: Loads environment variables from .env
- pdf-parse: Extracts text from PDF resumes
- jest: Unit and integration testing

AI Model and Integration:
- Gemini API (`gemini-2.5-flash`) for AI-guided roadmap generation
- Structured fallback engine when AI is unavailable or rate-limited
- Retry + parsing + cache-based reliability layer around AI calls

Data and Project Assets:
- Internal role and skills catalog (`data/jobs.json`)
- Resume sample/test assets for parser validation

---

## ⚖️ Tradeoffs and Prioritization

What was cut to stay within the time limit:
- Full web UI (kept a CLI-first implementation)
- Persistent user history/profile storage
- Advanced analytics dashboard

What would be built next:
- Role-level explanation report with confidence scoring
- Progress tracking and milestone completion
- Deeper personalization in roadmap generation

Known limitations:
- Free-tier AI quota can run out quickly.
- AI response formatting can vary, so parsing safeguards are still needed.
- Resume extraction quality still depends on PDF/text structure.

---

## 🧠 AI Integration

Gemini API is used to generate personalized learning roadmaps.

To make the system reliable in real-world conditions (especially 429 rate-limit scenarios), the app includes:
- Retry with backoff
- Prompt-size optimization
- Structured fallback roadmap generation
- Debug tracing to distinguish AI path vs fallback path

✅ Result: users still get a usable roadmap even when the AI call fails.

---

## 🛡️ AI Reliability Strategy

Implemented reliability features:
- Retries on 429 errors
- Smaller prompts for response stability
- JSON and plain-text response parsing
- Automatic fallback when AI output is malformed or unavailable
- Local cache to avoid calling the API for repeated queries
- AI mock mode removed from production flow

Note:
- A free API key is enough to run the project, but limits still apply.
- If quota is exceeded, wait for reset or use a billing-enabled project.

---

## 🧩 Issues Faced and Fixes

1. Quota exceeded during roadmap generation (429 RESOURCE_EXHAUSTED)
   - Added retry handling with controlled wait intervals.
   - Added a fallback roadmap path so the user flow is never blocked.

2. API key not loaded from environment
   - Added startup warnings and environment checks.
   - Standardized .env.example setup and dotenv loading.

3. Plan text looked repetitive across steps
   - Updated fallback generation so each step gets more varied, level-aware wording.

4. AI provider instability during testing
   - Kept the design provider-resilient with a deterministic fallback path.

5. Too many duplicate API calls
   - Added local caching to improve response speed and reduce quota consumption.

---

## ✅ Role-Skill Alignment Verification

Skill recommendations are validated against role definitions, not guessed blindly:
- User and resume skills are compared with role requirements from internal role data.
- Required and nice-to-have skills are separated clearly.
- Category-aware interpretation improves recommendation quality.

This keeps roadmap suggestions aligned with actual role expectations.

---

## 🗺️ Roadmap Learning Order

Roadmaps are intentionally structured from beginner to advanced:
1. Foundation
2. Practice
3. Applied Concepts
4. Advanced

This progression helps users start correctly and build confidence step by step.

---

## 🔍 Debugging and Observability

Debug output helps confirm runtime behavior:
- Whether output came from AI or fallback
- Retry count and wait intervals
- Parse and recovery path

This is helpful during development, demos, and troubleshooting.

---

## 🔮 Potential Future Enhancements

- Build a web dashboard (in addition to CLI) for broader usability
- Add persistent user profiles and progress history
- Introduce confidence scoring for skill-gap and readiness estimates
- Improve roadmap personalization using user goals, available time, and learning pace
- Add project/course recommendations linked to each missing skill
- Add export options for reports (PDF/CSV)
- Expand role taxonomy with more domains and seniority levels
- Add authentication and cloud sync for multi-device continuity
- Add observability metrics for API usage, cache hit rates, and fallback frequency

---

## 🧪 Commands

```bash
npm start
npm test
```




