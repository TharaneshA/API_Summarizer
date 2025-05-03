import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import { 
  ChatBubbleLeftIcon, 
  DocumentTextIcon, 
  SparklesIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import '../styles/animations.css';

// Define interface for search results
interface SearchResult {
  id: string;
  text: string;
  context: string;
}

// Define interface for first match in search
interface FirstMatch {
  element: HTMLElement;
  range: Range;
}

// Define custom components for ReactMarkdown
const markdownComponents: Components = {
  code: ({
    node,
    inline,
    className,
    children,
    ...props
  }: React.PropsWithChildren<{
    node?: any;
    inline?: boolean;
    className?: string;
  }>) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={vscDarkPlus as any}
        language={match[1]}
        PreTag="div"
        children={String(children).replace(/\n$/, '')}
        {...props}
      />
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const App: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'chat' | 'search'>('summary');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [pageContext, setPageContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for selection updates from content script
  useEffect(() => {
    const handleSelectionUpdate = (message: any) => {
      if (message.type === 'SELECTION_UPDATED') {
        setSelectedText(message.text);
      }
    };
    chrome.runtime.onMessage.addListener(handleSelectionUpdate);
    return () => chrome.runtime.onMessage.removeListener(handleSelectionUpdate);
  }, []);

  useEffect(() => {
    // Get the stored summary when popup opens
    chrome.storage.local.get(['summary'], (result) => {
      if (result.summary) {
        setSummary(result.summary);
      }
    });

    // Get the selected text from the active tab
    refreshSelectedText();
  }, []);

  // Render the main content area
  const renderMainContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className="p-4 space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg shadow-inner">
              <div className="flex items-center space-x-2 mb-2">
                <DocumentTextIcon className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-medium text-white">Selected Text</h2>
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap font-mono bg-gray-900 p-3 rounded">
                {selectedText || 'No text selected. Select text on the page to get started.'}
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <SparklesIcon className="h-5 w-5 text-purple-400" />
                  <h2 className="text-lg font-medium text-white">Summary</h2>
                </div>
                <button
                  onClick={() => summarizeText(selectedText)}
                  disabled={!selectedText || loading}
                  className={`px-4 py-2 rounded-md flex items-center space-x-2 ${!selectedText || loading ? 'bg-gray-700 text-gray-400' : 'bg-purple-500 hover:bg-purple-600 text-white'} transition-colors`}
                >
                  {loading ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  ) : (
                    <SparklesIcon className="h-5 w-5" />
                  )}
                  <span>Summarize</span>
                </button>
              </div>
              {summary ? (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown components={markdownComponents}>{summary}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-8">
                  <SparklesIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Select text and click Summarize to generate a summary</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="flex flex-col h-full p-4">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300'}`}
                  >
                    <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        );
      case 'search':
        return (
          <div className="flex flex-col h-full p-4">
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search in API documentation..."
                className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className={`px-4 py-2 rounded-lg ${searchLoading ? 'bg-gray-700 text-gray-400' : 'bg-purple-500 hover:bg-purple-600 text-white'} transition-colors`}
              >
                {searchLoading ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleSearchResultClick(result.id)}
                  className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="text-sm text-gray-300">{result.text}</div>
                  <div className="text-xs text-gray-500 mt-1">{result.context}</div>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && !searchLoading && (
                <div className="text-center py-8">
                  <MagnifyingGlassIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No results found</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Refresh selected text from the active tab
  const refreshSelectedText = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_SELECTION' }, (response) => {
          if (response && response.text) {
            setSelectedText(response.text);
          }
        });
      }
    });
  };
  
  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const summarizeText = async (text: string) => {
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      chrome.runtime.sendMessage(
        { type: 'SUMMARIZE_TEXT', text },
        (response) => {
          if (response && response.summary) {
            setSummary(response.summary);
          } else if (response && response.error) {
            console.error('Error:', response.error);
          }
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error summarizing text:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: 'user', content: input };
    setMessages([...messages, newMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get stored page context and send with chat message
      chrome.storage.local.get(['pageContext'], (result) => {
        chrome.runtime.sendMessage(
          { 
            type: 'CHAT_MESSAGE', 
            message: input,
            context: result.pageContext || ''
          },
        (response) => {
          if (response && response.response) {
            setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
          } else if (response && response.error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I encountered an error. Please try again.' }]);
            console.error('Error:', response.error);
          }
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I encountered an error. Please try again.' }]);
      setLoading(false);
    }
  };

  // Define navigation tabs
const tabs = [
  { id: 'summary' as const, icon: DocumentTextIcon, label: 'Summary' },
  { id: 'chat' as const, icon: ChatBubbleLeftIcon, label: 'Chat' },
  { id: 'search' as const, icon: MagnifyingGlassIcon, label: 'Search' }
];


// Render the app
const handleSearch = () => {
  if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    setSearchResults([]);
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'SEARCH_API_DOCS', searchQuery },
          (response) => {
            if (response && response.results) {
              setSearchResults(response.results);
            }
            setSearchLoading(false);
          }
        );
      }
    });
  };

  const handleSearchResultClick = (resultId: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'SCROLL_TO_RESULT', elementId: resultId }
        );
      }
    });
  };

  return (
    <div className="w-popup h-popup flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="header-gradient p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <SparklesIcon className="w-8 h-8 text-purple-400 icon-rotate" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white tracking-wide">API Summarizer</h1>
              <p className="text-sm text-purple-200/80">Simplify documentation instantly</p>
            </div>
          </div>
          <div className="flex space-x-1 bg-gray-800/30 rounded-lg p-1">
            {tabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all ${activeTab === id ? 'bg-purple-500 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        {renderMainContent()}
      </div>

      {/* Chat input field - only visible in chat tab */}
      {activeTab === 'chat' && (
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the documentation..."
              className="modern-input text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading}
              className="modern-button disabled:opacity-50 w-10 h-10 flex items-center justify-center"
            >
              {loading ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <ChatBubbleLeftIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
