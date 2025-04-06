import { useRef, useEffect } from 'react';

interface Props {
  text: string;
  loading: boolean;
  darkMode: boolean;
}

const OutputDisplay = ({ text, loading, darkMode }: Props) => {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [text]);

  // Simple function to format code blocks
  const formatContent = (content: string) => {
    if (!content) return '';
    
    // Replace code blocks with styled pre elements
    const formattedContent = content.replace(
      /```([\s\S]*?)```/g, 
      (_match, codeContent) => {
        return `<pre class="${darkMode ? 'bg-gray-800' : 'bg-gray-200'} p-3 rounded-md my-2 overflow-x-auto"><code>${codeContent
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</code></pre>`;
      }
    );
    
    return formattedContent;
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        Output
      </h2>
      
      <div 
        ref={textRef}
        className={`flex-1 overflow-auto p-4 rounded-lg ${
          darkMode ? 'bg-gray-700' : 'bg-gray-100'
        } ${!text && !loading ? 'flex items-center justify-center' : ''}`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="loader">
              <div className={`animate-pulse mb-4 h-8 w-8 rounded-full ${darkMode ? 'bg-blue-500' : 'bg-blue-400'}`}></div>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Generating response...
            </p>
          </div>
        ) : text ? (
          <div 
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatContent(text) }}
          />
        ) : (
          <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Generated output will appear here...
          </p>
        )}
      </div>

      {text && !loading && (
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={() => navigator.clipboard.writeText(text)}
            className={`text-sm flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
              darkMode 
                ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          </button>
          
          <button
            onClick={() => {
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'response.txt';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className={`text-sm flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
              darkMode 
                ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default OutputDisplay;
  