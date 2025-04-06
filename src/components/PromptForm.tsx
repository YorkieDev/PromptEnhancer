import { useState, useEffect } from 'react';

interface Props {
  onResult: (response: string) => void;
  setLoading: (loading: boolean) => void;
  apiEndpoint: string;
  darkMode: boolean;
}

type ModelPreset = {
  id: string;
  name: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_PRESETS: ModelPreset[] = [
  {
    id: '1',
    name: 'Rhyming Assistant',
    model: 'mistral-nemo-instruct-2407',
    systemPrompt: 'Always answer in rhymes. Today is Thursday',
    temperature: 0.7,
    maxTokens: -1
  },
  {
    id: '2',
    name: 'Helpful Assistant',
    model: 'mistral-nemo-instruct-2407',
    systemPrompt: 'You are a helpful, harmless, and honest AI assistant.',
    temperature: 0.7,
    maxTokens: -1
  },
  {
    id: '3',
    name: 'Precise Analyst',
    model: 'mistral-nemo-instruct-2407',
    systemPrompt: 'You are a precise, analytical assistant that provides factual, well-reasoned responses.',
    temperature: 0.3,
    maxTokens: -1
  }
];

const PromptForm = ({ onResult, setLoading, apiEndpoint, darkMode }: Props) => {
  const [systemPrompt, setSystemPrompt] = useState('Always answer in rhymes. Today is Thursday');
  const [userPrompt, setUserPrompt] = useState('What day is it today?');
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState('mistral-nemo-instruct-2407');
  const [maxTokens, setMaxTokens] = useState(-1);
  const [stream, setStream] = useState(false);
  const [presets, setPresets] = useState<ModelPreset[]>(DEFAULT_PRESETS);
  const [showPresets, setShowPresets] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('promptPresets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error('Failed to load presets:', e);
      }
    }
  }, []);

  // Save presets to localStorage when they change
  useEffect(() => {
    localStorage.setItem('promptPresets', JSON.stringify(presets));
  }, [presets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${apiEndpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          max_tokens: maxTokens,
          stream
        }),
      });

      const data = await res.json();
      onResult(data.choices[0].message.content);
    } catch (error) {
      onResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: ModelPreset = {
      id: crypto.randomUUID(),
      name: newPresetName,
      model,
      systemPrompt,
      temperature,
      maxTokens
    };
    
    setPresets([...presets, newPreset]);
    setNewPresetName('');
    setActivePreset(newPreset.id);
  };

  const loadPreset = (preset: ModelPreset) => {
    setSystemPrompt(preset.systemPrompt);
    setModel(preset.model);
    setTemperature(preset.temperature);
    setMaxTokens(preset.maxTokens);
    setActivePreset(preset.id);
    setShowPresets(false);
  };

  const deletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPresets(presets.filter(p => p.id !== id));
    if (activePreset === id) setActivePreset(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          Prompt Engineering
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className={`flex items-center gap-1 px-2 py-1 rounded ${darkMode 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-200 hover:bg-gray-300'} text-sm`}
            title="Presets"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Presets</span>
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1 px-2 py-1 rounded ${darkMode 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-200 hover:bg-gray-300'} text-sm`}
            title="Advanced"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>Advanced</span>
          </button>
        </div>
      </div>

      {showPresets && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Saved Presets</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="New preset name"
                className={`px-2 py-1 text-sm rounded ${darkMode 
                  ? 'bg-gray-600 border-gray-500 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'} border`}
              />
              <button 
                onClick={saveCurrentAsPreset}
                disabled={!newPresetName.trim()}
                className={`px-2 py-1 text-sm rounded ${newPresetName.trim() 
                  ? (darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600') 
                  : (darkMode ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')} text-white`}
              >
                Save
              </button>
            </div>
          </div>
          
          <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
            {presets.map(preset => (
              <div 
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className={`p-2 rounded flex justify-between items-center cursor-pointer ${
                  activePreset === preset.id 
                    ? (darkMode ? 'bg-blue-600' : 'bg-blue-100 text-blue-800') 
                    : (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200')
                }`}
              >
                <div>
                  <p className="font-medium">{preset.name}</p>
                  <p className="text-xs opacity-70 truncate">{preset.systemPrompt.slice(0, 40)}...</p>
                </div>
                <button 
                  onClick={(e) => deletePreset(preset.id, e)}
                  className={`p-1 rounded-full ${darkMode ? 'hover:bg-red-800' : 'hover:bg-red-200'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))}
            {presets.length === 0 && (
              <p className="text-sm opacity-70 text-center py-2">No presets saved yet</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="systemPrompt" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            System Prompt
          </label>
          <textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="Enter system instructions..."
          />
          <div className="mt-1 flex justify-between">
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Define the AI's behavior and context
            </p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {systemPrompt.length} characters
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="userPrompt" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            User Prompt
          </label>
          <textarea
            id="userPrompt"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={5}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="Enter your prompt..."
          />
          <div className="mt-1 flex justify-between">
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              The prompt you want the AI to respond to
            </p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {userPrompt.length} characters
            </p>
          </div>
        </div>

        {showAdvanced && (
          <>
            <div>
              <label htmlFor="model" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Model
              </label>
              <input
                id="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="temperature" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Temperature: {temperature}
                </label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Precise</span>
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Creative</span>
                </div>
              </div>

              <div>
                <label htmlFor="maxTokens" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Max Tokens ({maxTokens === -1 ? "unlimited" : maxTokens})
                </label>
                <input
                  id="maxTokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center">
              <label htmlFor="stream" className="flex items-center cursor-pointer">
                <input
                  id="stream"
                  type="checkbox"
                  checked={stream}
                  onChange={(e) => setStream(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`relative w-11 h-6 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500`}></div>
                <span className={`ms-3 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Stream</span>
              </label>
            </div>
          </>
        )}

        <button
          type="submit"
          className={`w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-colors duration-200 ${userPrompt.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={userPrompt.trim() === ''}
        >
          Generate Response
        </button>
      </form>
    </div>
  );
};

export default PromptForm;
