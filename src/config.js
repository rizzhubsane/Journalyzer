// Configuration file for API keys and settings
export const CONFIG = {
  // Add your Gemini API key here
  GEMINI_API_KEY: "", // Replace with your actual API key
  
  // API endpoints
  GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
  
  // Analysis settings
  MAX_TOKENS: 2000000, // 2M token limit for Gemini 2.0
  TIMEOUT_MS: 30000, // 30 second timeout
  
  // UI settings
  MAX_FILE_SIZE_MB: 50,
  SUPPORTED_FORMATS: ['.json']
};
