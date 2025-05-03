# API Summarizer Chrome Extension

<div align="center">
![image](https://github.com/user-attachments/assets/c8a0adcd-9825-4abd-a11f-ba71ba34e9f3)

  <h3>Simplify API Documentation Instantly</h3>
</div>

## Overview

API Summarizer is a powerful Chrome extension designed to enhance your experience with API documentation. It uses AI to summarize complex API documentation, making it easier to understand and navigate. The extension also provides a chat interface to ask questions about the documentation and a search feature to quickly find specific information.

## Features

### 🔍 Smart Search
- Search within API documentation pages
- Highlight matching text with context
- Navigate between search results with ease

### ✨ AI-Powered Summaries
- Select any text on an API documentation page
- Get concise, accurate summaries instantly
- Understand complex API concepts quickly

### 💬 Interactive Chat
- Ask questions about the API documentation
- Get detailed explanations and examples
- Maintain context throughout your conversation

## Technology Stack

- **Frontend**: TypeScript, React, TailwindCSS
- **Backend**: Python, FastAPI
- **AI**: Hugging Face models for summarization and chat
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

3. Create a `config.env` file in the root directory with your Hugging Face API key:
   ```
   HUGGINGFACE_API_KEY=your_api_key_here
   ```

4. Install Python backend dependencies:
   ```bash
   pip install fastapi uvicorn python-dotenv transformers torch
   ```

5. Build the extension:
   ```bash
   npm run build
   ```

6. Start the backend server:
   ```bash
   python -m uvicorn src.backend.server:app --reload
   ```

7. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder from your project directory

### Using the Extension

1. Navigate to any API documentation page
2. Use the extension popup to:
   - Select text and generate summaries
   - Search within the documentation
   - Ask questions about the API
![image](https://github.com/user-attachments/assets/e12e8ce2-3f8d-4b15-8741-412d8e8bb3fe)


## Project Structure

```
├── dist/               # Built extension files
├── icons/              # Extension icons
├── src/
│   ├── backend/        # Python FastAPI backend
│   ├── popup/          # React popup components
│   ├── styles/         # TailwindCSS styles
│   ├── background.ts   # Extension background script
│   └── content.ts      # Content script for page interaction
├── manifest.json       # Chrome extension manifest
├── popup.html         # Popup HTML template
└── vite.config.ts     # Vite configuration
```

## How It Works

1. **Content Script**: Injects into web pages to handle text selection, search highlighting, and DOM manipulation
2. **Background Script**: Manages API calls to the backend server and handles context menu operations
3. **Popup Interface**: Provides a user-friendly interface for all extension features
4. **Backend Server**: Processes text using AI models to generate summaries and answer questions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Initial Repository Setup

To initialize and push this project to your GitHub repository, follow these steps from the project root directory (API_Summarizer folder):

```bash
# Initialize git repository
git init

# Add all files to git
git add .

# Commit the changes
git commit -m "Initial commit"

# Add your GitHub repository as remote
git remote add origin https://github.com/TharaneshA/API_Summarizer.git

# Push to main branch
git push -u origin main
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Hugging Face](https://huggingface.co/) for providing the AI models
- [React](https://reactjs.org/) for the frontend framework
- [TailwindCSS](https://tailwindcss.com/) for styling
- [FastAPI](https://fastapi.tiangolo.com/) for the backend API
