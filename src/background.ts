let HUGGINGFACE_API_KEY: string | null = null;

// Initialize Hugging Face API key from environment variables
const initializeHuggingFace = async () => {
  try {
    const response = await fetch(chrome.runtime.getURL('config.env'));
    if (!response.ok) {
      throw new Error('Failed to load config.env file');
    }
    
    const config = await response.text();
    const apiKeyMatch = config.match(/HUGGINGFACE_API_KEY=(.*)/);
    
    if (!apiKeyMatch || !apiKeyMatch[1]) {
      throw new Error('Invalid or missing API key in config.env');
    }
    
    HUGGINGFACE_API_KEY = apiKeyMatch[1].trim();
    if (!HUGGINGFACE_API_KEY) {
      throw new Error('API key cannot be empty');
    }
    
    console.log('Hugging Face API initialized successfully');
  } catch (error) {
    console.error('Error initializing Hugging Face:', error);
    chrome.storage.local.set({ 
      error: `Failed to initialize Hugging Face API: ${error.message}. Please check your config.env file and API key.`
    });
  }
};

initializeHuggingFace();

// Create context menu items
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CREATE_CONTEXT_MENU') {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'summarizeApi',
        title: 'Summarize API Documentation',
        contexts: ['selection']
      });
      chrome.contextMenus.create({
        id: 'askQuestion',
        title: 'Ask a Question About Selection',
        contexts: ['selection']
      });
    });
  } else if (request.type === 'SUMMARIZE_TEXT') {
    summarizeText(request.text)
      .then(summary => sendResponse({ summary }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  } else if (request.type === 'CHAT_MESSAGE') {
    handleChatMessage(request.message, request.context || '')
      .then(response => sendResponse({ response }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  } else if (request.type === 'COPY_SUMMARY') {
    try {
      navigator.clipboard.writeText(request.text);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: 'Failed to copy text to clipboard' });
    }
    return true;
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'summarizeApi') {
    chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' }, async (response) => {
      if (response && response.text) {
        try {
          const summary = await summarizeText(response.text);
          chrome.storage.local.set({ 
            summary,
            originalText: response.text,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error summarizing text:', error);
          chrome.storage.local.set({ error: error.message });
        }
      }
    });
  } else if (info.menuItemId === 'askQuestion') {
    chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' }, (response) => {
      if (response && response.text) {
        chrome.storage.local.set({ 
          selectedText: response.text,
          timestamp: new Date().toISOString()
        });
      }
    });
  }
});

// Function to summarize text using BART model
const BACKEND_URL = 'http://localhost:8000';

// Function to summarize text using our FastAPI backend
async function summarizeText(text: string): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.summary;
  } catch (error) {
    console.error('Error calling summarize API:', error);
    throw error;
  }
}

// Function to handle chat messages using our FastAPI backend
async function handleChatMessage(message: string, context: string = ''): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, context })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.response;
  } catch (error) {
    console.error('Error calling chat API:', error);
    throw error;
  }
}

// Store chat history in chrome.storage.local
const updateChatHistory = async (message: string, response: string) => {
  try {
    const { chatHistory = [] } = await chrome.storage.local.get('chatHistory');
    const updatedHistory = [
      ...chatHistory,
      { 
        message, 
        response, 
        timestamp: new Date().toISOString() 
      }
    ].slice(-50); // Keep last 50 messages
    
    await chrome.storage.local.set({ chatHistory: updatedHistory });
  } catch (error) {
    console.error('Error updating chat history:', error);
  }
};