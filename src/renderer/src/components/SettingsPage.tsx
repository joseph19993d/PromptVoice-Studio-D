import { useState, useEffect } from 'react'
import { Brain, Volume2, Mic, Save, RotateCcw } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export default function SettingsPage() {
  const { loadConfig } = useAppStore()

  const [aiProvider, setAiProvider] = useState('mock')
  const [aiModel, setAiModel] = useState('mistralai/mistral-small-3.1-24b-instruct')
  const [aiSystemPrompt, setAiSystemPrompt] = useState('You are a helpful, knowledgeable assistant. Respond clearly and concisely in the same language the user writes in. Use markdown formatting when appropriate.')
  const [aiTemperature, setAiTemperature] = useState('0.7')
  const [aiMaxTokens, setAiMaxTokens] = useState('1024')

  const [ttsProvider, setTtsProvider] = useState('mock')
  const [ttsVoiceId, setTtsVoiceId] = useState('21m00Tcm4TlvDq8ikWAM')
  const [ttsLanguage, setTtsLanguage] = useState('auto')
  const [elevenlabsVoices, setElevenlabsVoices] = useState<Array<{id: string, name: string, category?: string}>>([
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', category: 'premade' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', category: 'premade' }
  ])

  const [sttProvider, setSttProvider] = useState('mock')

  const [openrouterKey, setOpenrouterKey] = useState('')
  const [elevenlabsKey, setElevenlabsKey] = useState('')
  const [whisperKey, setWhisperKey] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')

  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // Load existing config
  useEffect(() => {
    async function load() {
      try {
        const config = await window.api.getConfig()
        setAiProvider(config.providers.ai.provider)
        setAiModel(config.providers.ai.model)
        setAiSystemPrompt(config.providers.ai.systemPrompt)
        setAiTemperature(String(config.providers.ai.temperature))
        setAiMaxTokens(String(config.providers.ai.maxTokens))
        setTtsProvider(config.providers.tts.provider)
        setTtsVoiceId(config.providers.tts.voiceId)
        setTtsLanguage(config.providers.tts.language || 'auto')
        setSttProvider(config.providers.stt.provider)
        setOpenrouterKey(config.keys.openrouter || '')
        setElevenlabsKey(config.keys.elevenlabs || '')
        setWhisperKey(config.keys.whisper || '')
        setOllamaUrl(config.keys.ollama_url || 'http://localhost:11434')

        if (config.providers.tts.provider === 'elevenlabs' && config.keys.elevenlabs) {
          try {
            const voices = await window.api.getVoices()
            if (voices && voices.length > 0) {
              setElevenlabsVoices(voices)
            }
          } catch (e) {
            console.error('Failed to load ElevenLabs voices:', e)
          }
        }
      } catch (err) {
        console.error('Failed to load config:', err)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    try {
      await window.api.setConfig({
        providers: {
          ai: {
            provider: aiProvider as 'openrouter' | 'ollama' | 'mock',
            model: aiModel,
            systemPrompt: aiSystemPrompt,
            temperature: parseFloat(aiTemperature) || 0.7,
            maxTokens: parseInt(aiMaxTokens) || 1024
          },
          tts: {
            provider: ttsProvider as 'elevenlabs' | 'webspeech' | 'mock',
            voiceId: ttsVoiceId,
            speed: 1.0,
            language: ttsLanguage
          },
          stt: {
            provider: sttProvider as 'whisper' | 'webspeech' | 'mock',
            language: 'en'
          }
        },
        keys: {
          openrouter: openrouterKey || undefined,
          elevenlabs: elevenlabsKey || undefined,
          whisper: whisperKey || undefined,
          ollama_url: ollamaUrl || undefined
        }
      })

      await loadConfig()
      setSaveStatus('✅ Settings saved!')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      setSaveStatus(`❌ Error: ${(err as Error).message}`)
    }
  }

  return (
    <div className="settings-page fade-in">
      {saveStatus && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          background: saveStatus.startsWith('✅') ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          border: `1px solid ${saveStatus.startsWith('✅') ? 'var(--success)' : 'var(--error)'}`,
          fontSize: 14
        }}>
          {saveStatus}
        </div>
      )}

      {/* AI Settings */}
      <div className="settings-section">
        <h3><Brain size={18} /> AI Provider</h3>
        <div className="settings-field">
          <label className="settings-label">Provider</label>
          <select
            id="ai-provider-select"
            className="settings-select"
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value)}
          >
            <option value="mock">Mock (Testing)</option>
            <option value="openrouter">OpenRouter</option>
            <option value="ollama">Ollama (Local)</option>
          </select>
        </div>

        {aiProvider === 'openrouter' && (
          <>
            <div className="settings-field">
              <label className="settings-label">API Key</label>
              <input
                id="openrouter-key-input"
                className="settings-input"
                type="password"
                placeholder="sk-or-..."
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Model</label>
              <select
                className="settings-select"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              >
                {/* ⚖️ Balance (recommended) */}
                <option value="mistralai/mistral-small-3.1-24b-instruct">Mistral Small 3.1 (Recommended)</option>
                <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                <option value="meta-llama/llama-3.1-8b-instruct">Llama 3.1 8B</option>
                <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option>
                {/* 💪 Powerful (paid) */}
                <option value="openai/gpt-4o">GPT-4o</option>
                <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku</option>
                <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B</option>
                <option value="mistralai/mixtral-8x7b-instruct">Mixtral 8x7B</option>
              </select>
            </div>
          </>
        )}

        {aiProvider === 'ollama' && (
          <div className="settings-field">
            <label className="settings-label">Ollama URL</label>
            <input
              className="settings-input"
              type="text"
              placeholder="http://localhost:11434"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
            />
          </div>
        )}

        <div className="settings-field">
          <label className="settings-label">System Prompt</label>
          <textarea
            className="settings-input"
            style={{ minHeight: 60, resize: 'vertical' }}
            value={aiSystemPrompt}
            onChange={(e) => setAiSystemPrompt(e.target.value)}
          />
        </div>

        <div className="settings-row">
          <div className="settings-field">
            <label className="settings-label">Temperature</label>
            <input
              className="settings-input"
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={aiTemperature}
              onChange={(e) => setAiTemperature(e.target.value)}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">Max Tokens</label>
            <input
              className="settings-input"
              type="number"
              step="256"
              min="64"
              max="8192"
              value={aiMaxTokens}
              onChange={(e) => setAiMaxTokens(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TTS Settings */}
      <div className="settings-section">
        <h3><Volume2 size={18} /> Text-to-Speech</h3>
        <div className="settings-field">
          <label className="settings-label">Provider</label>
          <select
            id="tts-provider-select"
            className="settings-select"
            value={ttsProvider}
            onChange={(e) => setTtsProvider(e.target.value)}
          >
            <option value="mock">Mock (Silent)</option>
            <option value="elevenlabs">ElevenLabs</option>
          </select>
        </div>

        {ttsProvider === 'elevenlabs' && (
          <>
            <div className="settings-field">
              <label className="settings-label">API Key</label>
              <input
                id="elevenlabs-key-input"
                className="settings-input"
                type="password"
                placeholder="Your ElevenLabs API key..."
                value={elevenlabsKey}
                onChange={(e) => setElevenlabsKey(e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Voice</label>
              <select
                id="tts-voice-id-select"
                className="settings-select"
                value={ttsVoiceId}
                onChange={(e) => setTtsVoiceId(e.target.value)}
              >
                {elevenlabsVoices.filter(v => v.category === 'cloned').length > 0 && (
                  <optgroup label="Your Voices (Cloned)">
                    {elevenlabsVoices.filter(v => v.category === 'cloned').map(v => (
                      <option key={v.id} value={v.id}>{v.name} (cloned) ✅</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Default Voices (Premade)">
                  {elevenlabsVoices.filter(v => v.category !== 'cloned').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.category === 'premade' ? '(locked) 🔒' : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="settings-field">
              <label className="settings-label">Language</label>
              <select
                className="settings-select"
                value={ttsLanguage}
                onChange={(e) => setTtsLanguage(e.target.value)}
              >
                <option value="auto">Auto-detect</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
                <option value="it">Italiano</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="zh">中文</option>
                <option value="ar">العربية</option>
                <option value="hi">हिन्दी</option>
                <option value="pl">Polski</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* STT Settings */}
      <div className="settings-section">
        <h3><Mic size={18} /> Speech-to-Text</h3>
        <div className="settings-field">
          <label className="settings-label">Provider</label>
          <select
            id="stt-provider-select"
            className="settings-select"
            value={sttProvider}
            onChange={(e) => setSttProvider(e.target.value)}
          >
            <option value="mock">Mock (Sample Text)</option>
            <option value="whisper">Whisper (OpenAI)</option>
          </select>
        </div>

        {sttProvider === 'whisper' && (
          <div className="settings-field">
            <label className="settings-label">OpenAI API Key</label>
            <input
              id="whisper-key-input"
              className="settings-input"
              type="password"
              placeholder="sk-..."
              value={whisperKey}
              onChange={(e) => setWhisperKey(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          id="save-settings-btn"
          className="btn btn-primary"
          onClick={handleSave}
        >
          <Save size={16} /> Save Settings
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (confirm('Reset all settings to defaults?')) {
              window.api.setConfig({
                providers: {
                  ai: { provider: 'mock', model: 'mistralai/mistral-small-3.1-24b-instruct', systemPrompt: 'You are a helpful, knowledgeable assistant. Respond clearly and concisely in the same language the user writes in. Use markdown formatting when appropriate.', temperature: 0.7, maxTokens: 1024 },
                  tts: { provider: 'mock', voiceId: '21m00Tcm4TlvDq8ikWAM', speed: 1.0, language: 'auto' },
                  stt: { provider: 'mock', language: 'en' }
                },
                keys: {},
                ui: { theme: 'dark', autoGenerate: false, setupCompleted: true }
              }).then(() => {
                loadConfig()
                window.location.reload()
              })
            }
          }}
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>
    </div>
  )
}
