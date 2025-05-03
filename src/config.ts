// Google Gemini API Configuration
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// API Endpoints and Settings
export const API_CONFIG = {
  summarizeEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  chatEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  maxOutputTokens: 1024,
  temperature: 0.7,
  topP: 0.8,
  topK: 40
};

// Validate API key
export function validateApiKey(): boolean {
  return GEMINI_API_KEY.length > 0;
}