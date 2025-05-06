import { GEMINI_API_KEY, API_CONFIG } from './config';

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
    handleChatMessage(request.message)
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
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not initialized');
    }

    const prompt = `Please provide a concise summary of the following API documentation or technical text, focusing on the key points and main functionality:\n\n${text}`;

    const response = await fetch(`${API_CONFIG.summarizeEndpoint}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: API_CONFIG.temperature,
          topP: API_CONFIG.topP,
          topK: API_CONFIG.topK,
          maxOutputTokens: API_CONFIG.maxOutputTokens
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

// Function to handle chat messages using Gemini API
async function handleChatMessage(message: string): Promise<string> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not initialized');
    }

    const prompt = `You are an expert in API documentation and development. As a knowledgeable API specialist, please provide a detailed and accurate response to the following question about APIs, documentation, or development practices. Include relevant examples and best practices where appropriate.\n\nQuestion: ${message}`;

    const response = await fetch(`${API_CONFIG.chatEndpoint}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: API_CONFIG.temperature,
          topP: API_CONFIG.topP,
          topK: API_CONFIG.topK,
          maxOutputTokens: API_CONFIG.maxOutputTokens
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

