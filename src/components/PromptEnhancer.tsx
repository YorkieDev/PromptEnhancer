import { useState, useEffect } from 'react';

type EnhancedPrompt = {
  id: string;
  originalPrompt: string;
  enhancedPrompt: string;
  systemPrompt: string;
  category: string;
  createdAt: Date;
  favorite: boolean;
}

interface Props {
  apiEndpoint: string;
  darkMode: boolean;
  onApplyEnhancedPrompt: (systemPrompt: string, userPrompt: string) => void;
  activeResult?: string;
  isLoading?: boolean;
  onSetLoadingState?: (isLoading: boolean) => void;
}

const PROMPT_CATEGORIES = [
  'General',
  'Creative Writing',
  'Business',
  'Web Development',
  'Marketing',
  'Academic',
  'Coding',
  'Data Analysis'
];

const ENHANCEMENT_SYSTEM_PROMPT = `You are an expert prompt engineer. Your task is to enhance the user's basic prompt into a more detailed, effective prompt that will produce better results.

Follow these guidelines to improve the user's prompt:
1. Add specific details and context that seem appropriate
2. Include clear instructions on tone, format, and style
3. Break complex requests into structured parts
4. Add constraints and specific requirements
5. Avoid making the prompt too verbose or repetitive

Return ONLY the enhanced prompt without any explanations or additional text. The enhanced prompt should be professional and ready to be used directly.`;

const PromptEnhancer = ({ apiEndpoint, darkMode, onApplyEnhancedPrompt, activeResult, isLoading, onSetLoadingState }: Props) => {
  const [basePrompt, setBasePrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [filterCategory, setFilterCategory] = useState('All');
  const [savedPrompts, setSavedPrompts] = useState<EnhancedPrompt[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  // Load saved prompts from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('enhancedPrompts');
    if (savedData) {
      try {
        setSavedPrompts(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to load saved enhanced prompts:', e);
      }
    }
  }, []);

  // Save prompts to localStorage when they change
  const saveToLocalStorage = (prompts: EnhancedPrompt[]) => {
    localStorage.setItem('enhancedPrompts', JSON.stringify(prompts));
  };

  // Show result when activeResult changes
  useEffect(() => {
    if (activeResult) {
      setShowResult(true);
    }
  }, [activeResult]);

  const enhancePrompt = async () => {
    if (!basePrompt.trim()) return;
    
    // If we have our own loading state handler from parent, use it
    if (onSetLoadingState) {
      onSetLoadingState(true);
    } else {
      setIsEnhancing(true);
    }
    
    setEnhancedPrompt('');
    
    try {
      const res = await fetch(`${apiEndpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral-nemo-instruct-2407',
          messages: [
            { role: 'system', content: ENHANCEMENT_SYSTEM_PROMPT },
            { role: 'user', content: basePrompt }
          ],
          temperature: 0.7,
          max_tokens: -1
        }),
      });

      const data = await res.json();
      setEnhancedPrompt(data.choices[0].message.content);
    } catch (error) {
      setEnhancedPrompt(`Error enhancing prompt: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (onSetLoadingState) {
        onSetLoadingState(false);
      } else {
        setIsEnhancing(false);
      }
    }
  };

  const saveEnhancedPrompt = () => {
    if (!enhancedPrompt) return;
    
    const newPrompt: EnhancedPrompt = {
      id: crypto.randomUUID(),
      originalPrompt: basePrompt,
      enhancedPrompt: enhancedPrompt,
      systemPrompt: ENHANCEMENT_SYSTEM_PROMPT,
      category: selectedCategory,
      createdAt: new Date(),
      favorite: false
    };
    
    const updated = [...savedPrompts, newPrompt];
    setSavedPrompts(updated);
    saveToLocalStorage(updated);
  };

  const toggleFavorite = (id: string) => {
    const updated = savedPrompts.map(p => 
      p.id === id ? { ...p, favorite: !p.favorite } : p
    );
    setSavedPrompts(updated);
    saveToLocalStorage(updated);
  };

  const deletePrompt = (id: string) => {
    const updated = savedPrompts.filter(p => p.id !== id);
    setSavedPrompts(updated);
    saveToLocalStorage(updated);
  };

  const usePrompt = (prompt: EnhancedPrompt) => {
    // Set as current input
    setBasePrompt(prompt.originalPrompt);
    setEnhancedPrompt(prompt.enhancedPrompt);
    
    // Use the enhanced prompt
    onApplyEnhancedPrompt(prompt.systemPrompt, prompt.enhancedPrompt);
  };

  // Format output text with proper code block styling
  const formatOutput = (text: string) => {
    if (!text) return null;
    
    // Split by code blocks
    const parts = text.split(/```(?:[\w]*\n)?/);
    const isCodeBlock = text.trim().startsWith("```");
    
    return parts.map((part, index) => {
      // Skip empty parts
      if (!part.trim()) return null;
      
      const isCode = (isCodeBlock && index % 2 === 1) || (!isCodeBlock && index % 2 === 0);
      
      if (isCode) {
        // Format as code block
        return (
          <div 
            key={index} 
            className={`rounded-lg p-4 font-mono text-sm overflow-x-auto my-3 ${
              darkMode 
                ? 'bg-slate-900/80 border border-slate-700 text-slate-200' 
                : 'bg-slate-100 border border-slate-200 text-slate-800'
            }`}
          >
            {part.trim()}
          </div>
        );
      } else {
        // Format as regular text with paragraphs
        return (
          <div key={index} className="font-medium leading-relaxed my-3">
            {part.split('\n').map((paragraph, pidx) => (
              paragraph.trim() ? (
                <p key={`p-${index}-${pidx}`} className={`${pidx > 0 ? 'mt-3' : ''}`}>
                  {paragraph}
                </p>
              ) : null
            ))}
          </div>
        );
      }
    }).filter(Boolean);
  };

  const currentlyLoading = isLoading || isEnhancing;

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Left side: Input and controls */}
      <div className={`p-8 flex-1 border-b lg:border-b-0 lg:border-r ${darkMode ? 'border-slate-700' : 'border-slate-200'} overflow-y-auto`}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              <div className="w-8 h-8 rounded-lg animated-gradient bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm shadow-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Prompt Enhancer
            </h2>
            <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Transform basic prompts into powerful, detailed instructions
            </p>
          </div>
          <button
            onClick={() => setShowSaved(!showSaved)}
            className={`text-sm px-3 py-2 rounded-lg ${
              darkMode 
                ? `${showSaved ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`
                : `${showSaved ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`
            } flex items-center gap-1.5 transition-all shadow-sm hover-lift`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {showSaved ? 'Hide Library' : 'View Library'} ({savedPrompts.length})
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label 
              htmlFor="basePrompt" 
              className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}
            >
              Basic Prompt
            </label>
            <div className="relative">
              <textarea
                id="basePrompt"
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
                placeholder="e.g., Create a website for a coffee shop"
                rows={4}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${
                  darkMode 
                    ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-400'
                }`}
              />
              {!basePrompt && (
                <div className="absolute right-3 bottom-3 pointer-events-none opacity-70">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={enhancePrompt}
              disabled={!basePrompt.trim() || currentlyLoading}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                !basePrompt.trim() || currentlyLoading
                  ? (darkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed')
                  : (darkMode 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover-lift' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-indigo-400/20 hover:shadow-lg hover:shadow-indigo-400/30 hover-lift')
              }`}
            >
              {currentlyLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enhancing...
                </span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Enhance Prompt
                </>
              )}
            </button>
            
            <div className="relative">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`appearance-none pl-3 pr-8 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500' 
                    : 'bg-white border-slate-300 text-slate-800 focus:ring-indigo-500 focus:border-indigo-400'
                }`}
              >
                <option value="All">All Categories</option>
                {PROMPT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg className={`fill-current h-4 w-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
          
          {/* Enhanced Prompt Display */}
          {enhancedPrompt && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Enhanced Prompt
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={saveEnhancedPrompt}
                    className={`text-xs flex items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                      darkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white hover-lift' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 hover-lift'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </button>
                </div>
              </div>
              <div className={`p-5 border rounded-xl overflow-auto max-h-72 backdrop-blur-sm ${
                darkMode 
                  ? 'bg-slate-800/80 border-slate-700 text-white shadow-inner' 
                  : 'bg-slate-50/90 border-slate-300 text-slate-900 shadow-inner'
              }`}>
                <div className="whitespace-pre-wrap font-medium leading-relaxed">
                  {enhancedPrompt.split('\n').map((paragraph, index) => (
                    <p key={index} className={`${index > 0 ? 'mt-3' : ''}`}>
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => navigator.clipboard.writeText(enhancedPrompt)}
                    className={`text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
                      darkMode 
                        ? 'text-slate-300 bg-slate-700/50 hover:bg-slate-700 hover:text-white' 
                        : 'text-slate-600 bg-slate-200/70 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Saved prompts or Results */}
      <div className="lg:w-2/5 flex-shrink-0 p-8 overflow-hidden flex flex-col h-full">
        {showResult && activeResult && (
          <div className="h-full flex flex-col">
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Response Output
            </h3>
            
            <div className={`flex-1 overflow-y-auto p-6 rounded-xl border ${
              darkMode 
                ? 'bg-slate-800/80 border-slate-700 text-white' 
                : 'bg-white border-slate-200 text-slate-800'
            } backdrop-blur-sm space-y-4 shadow-sm`}>
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="animate-pulse flex space-x-2 mb-3">
                    <div className="h-2.5 w-2.5 bg-indigo-400 rounded-full"></div>
                    <div className="h-2.5 w-2.5 bg-indigo-500 rounded-full"></div>
                    <div className="h-2.5 w-2.5 bg-indigo-600 rounded-full"></div>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Generating response...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formatOutput(activeResult || '')}
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      onClick={() => navigator.clipboard.writeText(activeResult)}
                      className={`text-sm flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                        darkMode 
                          ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy
                    </button>
                    <button
                      onClick={() => setShowResult(false)}
                      className={`text-sm flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                        darkMode 
                          ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {showSaved && savedPrompts.length > 0 && !showResult && (
          <div className="h-full flex flex-col">
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Prompt Library
            </h3>
            
            <div className="mb-4">
              <div className="relative">
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className={`appearance-none w-full pl-3 pr-8 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                    darkMode 
                      ? 'bg-slate-800/80 border-slate-700 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500' 
                      : 'bg-white border-slate-300 text-slate-800 focus:ring-indigo-500 focus:border-indigo-400'
                  }`}
                >
                  <option value="All">All Categories</option>
                  {PROMPT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                  <svg className={`fill-current h-4 w-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className={`rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'} overflow-hidden`}>
                {savedPrompts
                  .filter(p => filterCategory === 'All' || p.category === filterCategory)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(prompt => (
                    <div 
                      key={prompt.id} 
                      className={`p-4 border-b last:border-b-0 ${
                        darkMode ? 'border-slate-700' : 'border-slate-200'
                      } hover:bg-opacity-50 ${
                        darkMode ? 'hover:bg-slate-800/70' : 'hover:bg-slate-100/70'
                      } transition-all hover-lift`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleFavorite(prompt.id)}
                            className={`${prompt.favorite ? 'text-yellow-400' : 'text-slate-400'} hover:scale-110 transition-transform`}
                            title={prompt.favorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            {prompt.favorite ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            )}
                          </button>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {prompt.category}
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {new Date(prompt.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => usePrompt(prompt)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              darkMode ? 'hover:bg-indigo-900/50 text-indigo-400 hover:text-indigo-300' : 'hover:bg-indigo-100 text-indigo-500 hover:text-indigo-600'
                            }`}
                            title="Use this prompt"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deletePrompt(prompt.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              darkMode ? 'hover:bg-red-900/50 text-red-400 hover:text-red-300' : 'hover:bg-red-100 text-red-500 hover:text-red-600'
                            }`}
                            title="Delete this prompt"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="font-medium">Original:</span> {prompt.originalPrompt.length > 60 
                          ? prompt.originalPrompt.substring(0, 60) + '...' 
                          : prompt.originalPrompt}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
        
        {!showResult && !showSaved && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className={`p-8 rounded-xl ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl animated-gradient bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Enhance Your Prompts
              </h4>
              <p className="text-sm max-w-md mb-8">
                Enter a basic prompt on the left, and our AI will transform it into a more effective, detailed instruction that produces better results.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowSaved(true)}
                  className={`text-sm px-4 py-2.5 rounded-lg ${
                    darkMode 
                      ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                      : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-sm'
                  } flex items-center gap-2 transition-all hover-lift`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  View Prompt Library
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showSaved && savedPrompts.length === 0 && !showResult && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className={`p-8 text-center rounded-xl border ${
              darkMode 
                ? 'bg-slate-800/60 border-slate-700 text-slate-300' 
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h4 className="text-lg font-medium mb-2">No Saved Prompts</h4>
              <p className="text-sm">
                Your saved prompts will appear here. Enhance a prompt and click "Save" to add it to your library.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptEnhancer;