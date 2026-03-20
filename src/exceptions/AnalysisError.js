class AnalysisError extends Error {
  constructor(message, code = "ANALYSIS_ERROR") {
    super(message);
    this.name = "AnalysisError";
    this.code = code;
  }
}

module.exports = AnalysisError;
