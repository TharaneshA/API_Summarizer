// Add styles for text selection and search highlight
const style = document.createElement('style');
style.textContent = `
::selection {
  background-color: rgba(92, 124, 255, 0.4);
  color: inherit;
  text-shadow: none;
}

.api-search-highlight {
  background-color: rgba(147, 51, 234, 0.3);
  border-radius: 2px;
  transition: background-color 0.3s ease;
}

.api-search-highlight.active {
  background-color: rgba(147, 51, 234, 0.5);
  outline: 2px solid rgba(147, 51, 234, 0.8);
}

.api-native-find-highlight {
  background-color: rgba(255, 193, 7, 0.4) !important;
  color: inherit !important;
  border-radius: 2px !important;
  padding: 2px 0 !important;
}
`;
document.head.appendChild(style);

// Initialize message listener when the content script loads
let isListenerInitialized = false;

function initializeMessageListener() {
  if (!isListenerInitialized) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'SEARCH_API_DOCS') {
        const { searchQuery } = request;
        try {
          const results = searchInPage(searchQuery);
          sendResponse({ results: results.results });
        } catch (error) {
          console.error('Error searching in page:', error);
          sendResponse({ results: [], error: error.message });
        }
        return true; // Keep the message channel open for async response
      } else if (request.type === 'SCROLL_TO_RESULT') {
        const { elementId } = request;
        const element = document.getElementById(elementId);
        if (element) {
          // Remove active class from all highlights
          document.querySelectorAll('.api-search-highlight.active').forEach(el => {
            el.classList.remove('active');
          });
          
          // Add active class to current highlight
          element.classList.add('active');
          
          // Scroll element into view with smooth behavior
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
        return true;
      } else if (request.type === 'CLEAR_HIGHLIGHTS') {
        clearHighlights();
        sendResponse({ success: true });
        return true;
      } else if (request.type === 'GET_SELECTION') {
        // Get the selected text from the page
        let selectedText = '';
        const selection = window.getSelection();
        
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (range.toString().trim()) {
            // Get the text content directly without HTML
            selectedText = range.toString();
          }
        }

        // Don't default to page content when no text is selected
        // Just return the empty string to show "No text selected" message

        sendResponse({ text: selectedText.trim() });
        return true;
      }
      return true; // Required for async response
    });

    // Add context menu item
    chrome.runtime.sendMessage({ type: 'CREATE_CONTEXT_MENU' });
    isListenerInitialized = true;
  }
}

// Function to search for text in the page
function searchInPage(searchQuery: string) {
  // Clear existing highlights first
  clearHighlights();
  
  if (!searchQuery.trim()) {
    return { results: [] };
  }

  // Use a combination of custom highlighting and browser's native find
  const results: Array<{ id: string; text: string; context: string }> = [];
  
  try {
    // First approach: Use browser's native find functionality
    if (window.find) {
      // Save current selection to restore later
      const selection = window.getSelection();
      let originalRange = null;
      if (selection && selection.rangeCount > 0) {
        originalRange = selection.getRangeAt(0).cloneRange();
      }
      
      // Clear any existing selection
      if (selection) {
        selection.removeAllRanges();
      }
      
      // Use the browser's find functionality
      const findOptions = {
        caseSensitive: false,
        backwards: false,
        wrapAround: true,
        wholeWord: false,
        searchInFrames: true,
        showDialog: false
      };
      
      // Find all occurrences and highlight them
      let found = window.find(searchQuery, findOptions.caseSensitive, findOptions.backwards, 
                            findOptions.wrapAround, findOptions.wholeWord, 
                            findOptions.searchInFrames, findOptions.showDialog);
      
      let resultIndex = 0;
      let firstMatch = null;
      
      // If found, create our custom highlight
      while (found && resultIndex < 100) { // Limit to prevent infinite loops
        const currentSelection = window.getSelection();
        
        if (currentSelection && currentSelection.rangeCount > 0) {
          const range = currentSelection.getRangeAt(0);
          const matchedText = range.toString();
          
          try {
            // Create a span for highlighting
            const span = document.createElement('span');
            const uniqueId = `api-search-result-${resultIndex}`;
            span.id = uniqueId;
            span.className = 'api-search-highlight';
            span.textContent = matchedText;
            
            // Save the first match to scroll to it later
            if (resultIndex === 0) {
              firstMatch = { element: span, range: range.cloneRange() };
            }
            
            // Replace the selection with our highlighted span
            range.deleteContents();
            range.insertNode(span);
            
            // Get surrounding context
            let contextNode = span.parentNode;
            let context = contextNode ? (contextNode.textContent || '').trim() : '';
            
            // If context is too long, trim it
            if (context.length > 100) {
              const matchIndex = context.indexOf(matchedText);
              if (matchIndex !== -1) { // Check if the text is found in the context
                const start = Math.max(0, matchIndex - 50);
                const end = Math.min(context.length, matchIndex + matchedText.length + 50);
                context = '...' + context.substring(start, end) + '...';
              } else {
                // Fallback if the text isn't found in the context
                context = context.substring(0, 100) + '...';
              }
            }
            
            results.push({
              id: uniqueId,
              text: matchedText,
              context: context
            });
            
            resultIndex++;
          } catch (innerError) {
            console.error('Error processing match:', innerError);
          }
          
          // Continue searching for the next match
          try {
            found = window.find(searchQuery, findOptions.caseSensitive, findOptions.backwards, 
                              findOptions.wrapAround, findOptions.wholeWord, 
                              findOptions.searchInFrames, findOptions.showDialog);
          } catch (findError) {
            console.error('Error finding next match:', findError);
            break;
          }
        } else {
          break;
        }
      }
      
      // Restore original selection if there was one
      try {
        if (selection && originalRange) {
          selection.removeAllRanges();
          selection.addRange(originalRange);
        }
      } catch (restoreError) {
        console.error('Error restoring original selection:', restoreError);
      }
      
      // Scroll to the first match if found
      if (firstMatch && firstMatch.element) {
        try {
          firstMatch.element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          firstMatch.element.classList.add('active');
        } catch (scrollError) {
          console.error('Error scrolling to match:', scrollError);
        }
      }
    } else {
      // Fallback to the original implementation if window.find is not available
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node: Node | null;
      let resultIndex = 0;

      while ((node = walker.nextNode())) {
        const text = node.textContent || '';
        const searchRegex = new RegExp(searchQuery, 'gi');
        let match;

        while ((match = searchRegex.exec(text)) !== null) {
          try {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + searchQuery.length);

            const span = document.createElement('span');
            const uniqueId = `api-search-result-${resultIndex}`;
            span.id = uniqueId;
            span.className = 'api-search-highlight';
            span.textContent = match[0];

            range.deleteContents();
            range.insertNode(span);

            // Get surrounding context
            const contextStart = Math.max(0, match.index - 50);
            const contextEnd = Math.min(text.length, match.index + searchQuery.length + 50);
            const context = text.slice(contextStart, contextEnd);

            results.push({
              id: uniqueId,
              text: match[0],
              context: '...' + context + '...'
            });

            // Scroll to first result
            if (resultIndex === 0) {
              span.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
              span.classList.add('active');
            }

            resultIndex++;
            
            // Update the walker since we modified the DOM
            walker.currentNode = span;
          } catch (error) {
            console.error('Error highlighting match:', error);
            continue;
          }
        }
      }
    }
  } catch (error) {
    console.error('Search error:', error);
  }

  return { results };
}

// Function to clear all search highlights
function clearHighlights() {
  const highlights = document.querySelectorAll('.api-search-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
      parent.normalize();
    }
  });
}

// Initialize the message listener when the content script loads
initializeMessageListener();
