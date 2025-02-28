import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatBubbleLeftIcon, DocumentTextIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Components } from 'react-markdown';

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
  const [activeTab, setActiveTab] = useState<'summary' | 'chat' | 'search'>('summary');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; text: string; context: string }>>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get the stored summary when popup opens
    chrome.storage.local.get(['summary'], (result) => {
      if (result.summary) {
        setSummary(result.summary);
      }
    });

    // Set up real-time text selection listener
    const updateSelectedText = () => {
      if (activeTab === 'summary') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id!, { type: 'GET_SELECTION' }, (response) => {
            if (response) {
              setSelectedText(response.text || '');
            }
          });
        });
      }
    };

    // Initial text selection check
    updateSelectedText();

    // Set up interval for checking text selection
    const selectionInterval = setInterval(updateSelectedText, 1000);

    return () => {
      clearInterval(selectionInterval);
    };
  }, [activeTab]);
  
  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const summarizeText = async (text: string) => {
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearchResults([]);

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0].id) {
        setLoading(false);
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: 'SEARCH_API_DOCS', searchQuery: searchQuery.trim() },
        (response) => {
          if (response && response.results) {
            setSearchResults(response.results);
          } else if (response && response.error) {
            console.error('Search error:', response.error);
          }
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error searching:', error);
      setLoading(false);
    }
  };

  const handleResultClick = async (resultId: string) => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0].id) return;

      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: 'SCROLL_TO_RESULT', elementId: resultId },
        (response) => {
          if (response && response.success) {
            setSelectedResultId(resultId);
          }
        }
      );
    } catch (error) {
      console.error('Error scrolling to result:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: 'user', content: input };
    setMessages([...messages, newMessage]);
    setInput('');
    setLoading(true);

    try {
      chrome.runtime.sendMessage(
        { 
          type: 'CHAT_MESSAGE', 
          message: input
        },
        (response) => {
          if (response && response.response) {
            setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
          } else if (response && response.error) {
            console.error('Error:', response.error);
          }
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  };

  return (
    <div className="w-popup h-popup bg-gray-900 flex flex-col font-sans transition-all duration-300 overflow-hidden shadow-xl">
      {/* Header with logo and tabs */}
      <div className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-800 border-b border-purple-700/50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-4 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cohere-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-gray-900 rounded-full p-1.5 flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-12" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cohere-300 tracking-tight">API Summarizer</h1>
              <div className="text-xs text-purple-400/70 -mt-1 font-medium">Simplify documentation instantly</div>
            </div>
          </div>
        </div>
        
        {/* Navigation tabs */}
        <div className="flex border-b border-purple-800/30 px-1">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 rounded-t-lg ${activeTab === 'summary' 
              ? 'text-white border-b-2 border-purple-500 bg-gray-800/50' 
              : 'text-gray-400 hover:text-purple-300 hover:bg-gray-800/30'}`}
          >
            <SparklesIcon className="w-4 h-4" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 rounded-t-lg ${activeTab === 'chat' 
              ? 'text-white border-b-2 border-purple-500 bg-gray-800/50' 
              : 'text-gray-400 hover:text-purple-300 hover:bg-gray-800/30'}`}
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 rounded-t-lg ${activeTab === 'search' 
              ? 'text-white border-b-2 border-purple-500 bg-gray-800/50' 
              : 'text-gray-400 hover:text-purple-300 hover:bg-gray-800/30'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-4 scrollbar-custom">
        {/* Selected text section - only visible in summary tab */}
        {activeTab === 'summary' && (
          <div className="modern-card animate-fade-in">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
              <DocumentTextIcon className="w-5 h-5 text-purple-500" />
              Selected Text
            </h2>
            {selectedText ? (
              <p className="mt-2 text-gray-300 text-sm max-h-48 overflow-y-auto scrollbar-custom leading-relaxed whitespace-pre-wrap">
                {selectedText}
              </p>
            ) : (
              <p className="mt-2 text-gray-400 text-sm italic">
                No text selected. Select some text on the page to get started.
              </p>
            )}
          </div>
        )}

        {/* Summary tab content */}
        {activeTab === 'summary' && (
          <div className="space-y-4 overflow-y-auto scrollbar-custom">
            {loading && !summary && (
              <div className="flex justify-center items-center py-12">
                <div className="relative">
                  <ArrowPathIcon className="w-10 h-10 text-purple-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-900 rounded-full"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-purple-300 animate-pulse" />
                  </div>
                </div>
                <p className="ml-3 text-purple-300 animate-pulse">Generating summary...</p>
              </div>
            )}
            
            {!summary && !loading && (
              <div className="modern-card p-8 text-center bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg animate-fade-in">
                <div className="bg-purple-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                  <SparklesIcon className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">No Summary Yet</h3>
                <p className="text-gray-400 mb-6 max-w-xs mx-auto">Select text on a page and generate a summary to help understand the API documentation.</p>
                {selectedText && (
                  <button 
                    onClick={() => summarizeText(selectedText)}
                    className="modern-button group flex items-center justify-center mx-auto gap-2 px-6 py-2.5"
                  >
                    <SparklesIcon className="w-5 h-5 transition-transform group-hover:rotate-12" />
                    <span>Summarize Selected Text</span>
                  </button>
                )}
              </div>
            )}
            
            {summary && (
              <div className="modern-card animate-slide-up bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-purple-500" />
                    Summary
                  </h2>
                  <button 
                    onClick={() => summarizeText(selectedText)}
                    className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors duration-200"
                    title="Regenerate summary"
                  >
                    <ArrowPathIcon className="w-3 h-3" />
                    Refresh
                  </button>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                  <ReactMarkdown
                    className="prose-custom dark:prose-invert max-w-none text-sm leading-relaxed"
                    components={{
                      code: ({ node, inline, className, children, ...props }: any) => {
                        return !inline ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language="javascript"
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {summary}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat tab content */}
        {activeTab === 'chat' && (
          <div className="space-y-4 overflow-y-auto scrollbar-custom">
            {messages.length === 0 ? (
              <div className="modern-card p-8 text-center bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-lg animate-fade-in">
                <div className="bg-purple-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                  <ChatBubbleLeftIcon className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Chat with Your API Docs</h3>
                <p className="text-gray-400 mb-6 max-w-xs mx-auto">Ask questions about the API documentation to get detailed explanations and examples.</p>
                <div className="flex justify-center">
                  <div className="bg-gray-900/70 rounded-xl p-3 border border-gray-700 max-w-xs">
                    <p className="text-gray-400 text-sm italic">"How do I authenticate with this API?"</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto scrollbar-custom">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mr-2">
                        <SparklesIcon className="w-4 h-4 text-purple-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 shadow-lg ${message.role === 'user' 
                        ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white rounded-br-none' 
                        : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-100 shadow border border-gray-600 rounded-bl-none'}`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center ml-2">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mr-2">
                      <SparklesIcon className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="bg-gradient-to-r from-gray-800 to-gray-850 shadow rounded-lg p-4 border border-gray-700 rounded-bl-none">
                      <div className="flex space-x-2 items-center h-6">
                        <div className="w-2 h-2 bg-cohere-300 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-cohere-400 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-cohere-500 rounded-full animate-pulse delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search tab content */}
      {activeTab === 'search' && (
        <div className="space-y-4 overflow-y-auto scrollbar-custom p-4">
          <div className="modern-card p-4">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in API documentation..."
                className="modern-input text-sm flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="modern-button"
                disabled={loading}
              >
                {loading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${selectedResultId === result.id ? 'bg-purple-600/20 border border-purple-500' : 'bg-gray-800 border border-gray-700 hover:border-purple-500/50'}`}
                    onClick={() => handleResultClick(result.id)}
                  >
                    <div className="text-sm text-gray-300 mb-1">{result.text}</div>
                    <div className="text-xs text-gray-500">{result.context}</div>
                  </div>
                ))}
              </div>
            ) : searchQuery && !loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8 animate-fade-in">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No results found</p>
              </div>
            ) : !searchQuery && !loading ? (
              <div className="text-center py-8 animate-fade-in">
                <svg className="w-16 h-16 mx-auto mb-4 text-purple-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-400">Enter a search term to find content in the API documentation</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Chat input field - only visible in chat tab */}
      {activeTab === 'chat' && (
        <div className="p-4 border-t border-gray-700 bg-gray-800/90 backdrop-blur-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the documentation..."
              className="modern-input text-sm focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading}
              className="modern-button disabled:opacity-50 group"
              title="Send message"
            >
              {loading ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <ChatBubbleLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
