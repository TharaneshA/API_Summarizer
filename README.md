# API Summarizer Chrome Extension

<p align="center">
  <img src="https://github.com/user-attachments/assets/87e10646-a43a-423a-b2bc-98600b6880d9" alt="API Summarizer Demo" />
</p>


<h3 align="center">Simplify API Documentation Instantly</h3>

## Overview

API Summarizer is a powerful Chrome extension designed to enhance your experience with API documentation. It uses Google's Gemini AI to summarize complex API documentation, making it easier to understand and navigate. The extension also provides a chat interface to ask questions about the documentation and a search feature to quickly find specific information.

<h2>API Summarizer Demo</h2>

https://github.com/user-attachments/assets/d129c36d-df07-4405-a48a-9cc5465c50a2

## Features

### 🔍 Smart Search
- Search within API documentation pages
- Highlight matching text with context
- Navigate between search results with ease

### ✨ AI-Powered Summaries
- Select any text on an API documentation page
- Get concise, accurate summaries using Gemini AI
- Understand complex API concepts quickly

### 💬 Interactive Chat
- Ask questions about the API documentation
- Get detailed explanations and examples powered by Gemini AI
- Maintain context throughout your conversation

## Technology Stack

- **Frontend**: TypeScript, React, TailwindCSS
- **AI**: Google Gemini API for summarization and chat
- **Build Tools**: Vite, PostCSS

## Installation

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/TharaneshA/API_Summarizer.git
   cd API_Summarizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `config.ts` file in the src directory with your Gemini API key:
   ```typescript
   export const GEMINI_API_KEY = 'your_api_key_here';
   ```

4. Build the extension:
   ```bash
   npm run build
   ```

5. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder from your project directory

### Using the Extension

1. Navigate to any API documentation page
2. Use the extension popup to:
   - Select text and generate summaries
   - Search within the documentation
   - Ask questions about the API
  
   ![image](https://github.com/user-attachments/assets/1e944132-b9d5-4d2e-aab5-0145b0f87ca4)


## Project Structure

```
├── dist/               # Built extension files
├── icons/              # Extension icons
├── src/
│   ├── popup/          # React popup components
│   ├── styles/         # TailwindCSS styles
│   ├── background.ts   # Extension background script
│   ├── content.ts      # Content script for page interaction
│   └── config.ts       # Configuration and API keys
├── manifest.json       # Chrome extension manifest
├── popup.html         # Popup HTML template
└── vite.config.ts     # Vite configuration
```

## How It Works

1. **Content Script**: Injects into web pages to handle text selection, search highlighting, and DOM manipulation
2. **Background Script**: Manages API calls to Gemini AI and handles context menu operations
3. **Popup Interface**: Provides a user-friendly interface for all extension features
4. **Gemini AI Integration**: Processes text to generate summaries and answer questions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Google Gemini](https://ai.google.dev/) for providing the AI capabilities
- [React](https://reactjs.org/) for the frontend framework
- [TailwindCSS](https://tailwindcss.com/) for styling
