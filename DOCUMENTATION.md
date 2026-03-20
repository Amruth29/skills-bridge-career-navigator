# Skill Bridge CLI - Design Documentation

## Overview
Skill Bridge CLI is a command-line application that helps users evaluate their current skills against a target role and receive a structured learning roadmap. The system supports two input modes:

- Manual skill entry
- Resume upload (PDF or TXT)

The design emphasizes reliability, predictable behavior, and graceful fallback when AI services are unavailable.

## Problem Statement
Users often know their target role but are unsure about:

- Which required skills they are missing
- How job-ready they are for the selected role
- What order to follow when learning missing skills

This project solves that by combining role-based skill matching with roadmap generation.

## Technical Stack

### Runtime and Language
- Node.js
- JavaScript (CommonJS modules)

### Core Dependencies
- dotenv: environment variable management
- pdf-parse: PDF resume text extraction

### Testing
- Jest: unit and integration-oriented tests

### Data Storage
- JSON files in the data directory for role/skills and sample data

## High-Level Architecture
The project follows a layered structure:

- CLI layer: handles user interaction and display
- Controller layer: orchestrates application flow
- Service layer: business logic for parsing, skill-gap analysis, AI roadmap generation, fallback roadmap generation, and caching
- Validator layer: input validation for roles and skills
- Exception layer: typed application errors
- Utility layer: logging, file picking, and roadmap diagram rendering

## Core Design Choices

### 1. CLI-first interaction
The application is intentionally CLI-based to keep setup minimal, execution fast, and user flow focused.

Why this choice:
- Fast to run locally
- Lower implementation overhead than a web UI
- Suitable for interview/demo scenarios

### 2. Dual input flow
Users can provide skills either manually or through resume upload.

Why this choice:
- Supports both quick testing and realistic usage
- Improves accessibility for users with existing resumes

### 3. Deterministic role validation
Target role selection is validated against structured job data before analysis.

Why this choice:
- Prevents invalid downstream processing
- Improves clarity and user feedback on unsupported roles

### 4. Service-based decomposition
Business logic is split into focused services, such as:
- skillGapService
- aiRoadmapService
- fallbackRoadmapService
- responseCacheService
- resumeParser

Why this choice:
- Better maintainability
- Easier testability
- Reduced controller complexity

### 5. AI with robust fallback
Roadmap generation attempts AI first and falls back to deterministic generation when AI is unavailable, rate-limited, or malformed.

Why this choice:
- Preserves user experience under API failures
- Ensures output continuity
- Enables predictable behavior in restricted environments

### 6. Caching for repeated requests
Roadmap results are cached by role and skills.

Why this choice:
- Reduces duplicate AI calls
- Improves response time
- Helps control API usage and quotas

### 7. Debug trace for observability
Controllers maintain debug traces to record key path decisions (cache hit, AI usage, fallback path).

Why this choice:
- Simplifies troubleshooting
- Makes behavior easier to verify in tests and demos

## Request Flow Summary

### Manual Skills Flow
1. User enters skills and target role
2. Inputs are validated
3. Skill gaps are computed from role categories
4. Cached roadmap is checked
5. If cache miss, AI roadmap is attempted
6. If AI fails, fallback roadmap is generated
7. Result and roadmap are printed in CLI

### Resume Upload Flow
1. User uploads or selects resume file
2. Resume parser extracts skills and certifications
3. Role gap analysis computes coverage and missing skills
4. Certification recommendations are generated
5. AI roadmap is attempted for missing required skills
6. If AI fails, fallback roadmap is generated
7. Consolidated output is printed in CLI

## Reliability and Error Handling Strategy
- Input validation before controller execution
- Explicit domain errors for role and skill validation
- Try/catch guarded AI calls
- Deterministic fallback when AI fails
- Cache-assisted resilience and performance

## Testing Strategy
The test suite focuses on behavior-critical modules:

- Analysis controller behavior
- Fallback roadmap generation
- Input validation
- Resume analysis flow
- Skill gap service logic

This strategy covers both normal and degraded execution paths.

## Tradeoffs
- Chosen simplicity over persistent database-backed state
- Chosen CLI speed over richer UX from a web interface
- Chosen deterministic fallback quality over dependence on AI-only outputs

## Future Enhancements
- Add report export support (PDF/CSV)
- Add user profile persistence and progress tracking
- Add confidence metrics for readiness scoring
- Extend role taxonomy and seniority depth
- Add optional web dashboard while retaining CLI mode

## Conclusion
The current design provides a practical, reliable CLI solution for role-based skill gap analysis. It balances AI-assisted personalization with deterministic fallback logic, making the system robust enough for both demo and real-world low-scale usage.
