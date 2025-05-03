import { GEMINI_API_KEY, API_CONFIG, validateApiKey } from './config';

let apiKey: string | null = null;

// Initialize Gemini API key from environment variables
const initializeGeminiAPI = async () => {
  try {
    const response = await fetch(chrome.runtime.getURL('config.env'));
    if (!response.ok) {
      throw new Error('Failed to load config.env file');
    }
    
    const config = await response.text();
    const apiKeyMatch = config.match(/GEMINI_API_KEY=(.*)/);
    
    if (!apiKeyMatch || !apiKeyMatch[1]) {
      throw new Error('Invalid or missing API key in config.env');
    }
    
    apiKey = apiKeyMatch[1].trim();
    if (!apiKey) {
      throw new Error('API key cannot be empty');
    }
    
    console.log('Gemini API initialized successfully');
  } catch (error) {
    console.error('Error initializing Gemini API:', error);
    chrome.storage.local.set({ 
      error: `Failed to initialize Gemini API: ${error.message}. Please check your config.env file and API key.`
    });
  }
};

initializeGeminiAPI();

// Create context menu item
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CREATE_CONTEXT_MENU') {
    chrome.contextMenus.create({
      id: 'summarizeApi',
      title: 'Summarize API Documentation',
      contexts: ['selection', 'page']
    });
  } else if (request.type === 'SUMMARIZE_TEXT') {
    summarizeText(request.text)
      .then(summary => sendResponse({ summary }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  } else if (request.type === 'CHAT_MESSAGE') {
    handleChatMessage(request.message, request.context)
      .then(response => sendResponse({ response }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'summarizeApi' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' }, async (response) => {
      if (response && response.text) {
        try {
          const summary = await summarizeText(response.text);
          chrome.storage.local.set({ summary });
        } catch (error) {
          console.error('Error summarizing text:', error);
          chrome.storage.local.set({ error: error.message });
        }
      }
    });
  }
});

// Function to summarize text using Gemini API
async function summarizeText(text: string): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error('Gemini API key not initialized');
    }

    const response = await fetch(`${API_CONFIG.summarizeEndpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Summarize the following API documentation in a concise and informative way. Focus on the main functionality, parameters, and usage examples:\n\n${text}`
          }]
        }],
        generationConfig: {
          temperature: API_CONFIG.temperature,
          topP: API_CONFIG.topP,
          topK: API_CONFIG.topK,
          maxOutputTokens: API_CONFIG.maxOutputTokens,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API for summarization:', error);
    throw error;
  }
}

// Store page context
let currentPageContext = '';

// Function to extract and store page context
async function extractPageContext(tabId: number) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_CONTEXT' });
    if (response && response.context) {
      currentPageContext = response.context;
      chrome.storage.local.set({ pageContext: currentPageContext });
    }
  } catch (error) {
    console.error('Error extracting page context:', error);
  }
}

// Function to handle chat messages using Gemini API
async function handleChatMessage(message: string, context: string): Promise<string> {
  try {
    if (!apiKey) {
      throw new Error('Gemini API key not initialized');
    }

    const response = await fetch(`${API_CONFIG.chatEndpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an API documentation assistant. Use the following API documentation context to answer the user's question. If you can't answer based on the context, say so politely.\n\nAPI Documentation Context:\n${context}\n\nUser Question: ${message}`
          }]
        }],
        generationConfig: {
          temperature: API_CONFIG.temperature,
          topP: API_CONFIG.topP,
          topK: API_CONFIG.topK,
          maxOutputTokens: API_CONFIG.maxOutputTokens,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API for chat:', error);
    throw error;
  }
}

// Listen for chat messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHAT_MESSAGE') {
    handleChatMessage(request.message, request.context)
      .then(response => sendResponse({ response }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});