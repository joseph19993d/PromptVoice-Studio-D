import { useState } from 'react'
import { useAppStore } from '../store/appStore'

const STEPS = [
  {
    title: '🎙️ Welcome to PromptVoice Studio',
    description:
      'Transform your ideas into AI-generated content with voice. Type or speak your prompts, generate text with AI, and hear results in natural speech.',
    fields: null
  },
  {
    title: '⚙️ Choose Your Mode',
    description:
      'You can start with Free Mode (mock providers, no API keys needed) and upgrade to real providers later in Settings.',
    fields: 'mode'
  },
  {
    title: '🧠 Connect AI (Optional)',
    description:
      'For real AI responses, connect OpenRouter (free tier available). Go to openrouter.ai, create an account, and paste your API key below.',
    fields: 'ai'
  },
  {
    title: '🔊 Connect Voice (Optional)',
    description:
      'For realistic text-to-speech, connect ElevenLabs. Go to elevenlabs.io, sign up, and paste your API key below.',
    fields: 'tts'
  },
  {
    title: '🚀 You\'re Ready!',
    description:
      'Start creating! Type a prompt or hold the 🎤 button to speak. Click Generate to see AI magic. You can always change providers in Settings.',
    fields: null
  }
]

export default function SetupWizard() {
  const { setShowWizard, loadConfig } = useAppStore()
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'free' | 'connected'>('free')
  const [aiKey, setAiKey] = useState('')
  const [ttsKey, setTtsKey] = useState('')

  const current = STEPS[step]

  const handleFinish = async () => {
    try {
      if (mode === 'connected') {
        await window.api.setConfig({
          providers: {
            ai: {
              provider: aiKey ? 'openrouter' : 'mock',
              model: 'mistralai/mistral-7b-instruct',
              systemPrompt: 'You are a helpful creative assistant.',
              temperature: 0.7,
              maxTokens: 1024
            },
            tts: {
              provider: ttsKey ? 'elevenlabs' : 'mock',
              voiceId: '21m00Tcm4TlvDq8ikWAM',
              speed: 1.0
            },
            stt: {
              provider: 'mock',
              language: 'en'
            }
          },
          keys: {
            openrouter: aiKey || undefined,
            elevenlabs: ttsKey || undefined
          },
          ui: {
            theme: 'dark',
            autoGenerate: false,
            setupCompleted: true
          }
        })
      } else {
        await window.api.setConfig({
          ui: { theme: 'dark', autoGenerate: false, setupCompleted: true }
        })
      }

      await loadConfig()
    } catch (err) {
      console.error('Setup error:', err)
    }

    setShowWizard(false)
  }

  const handleSkip = async () => {
    await window.api.setConfig({
      ui: { theme: 'dark', autoGenerate: false, setupCompleted: true }
    })
    await loadConfig()
    setShowWizard(false)
  }

  return (
    <div className="wizard-overlay">
      <div className="wizard-card fade-in">
        {/* Step indicators */}
        <div className="wizard-step-indicator">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`wizard-step-dot ${i < step ? 'completed' : ''} ${i === step ? 'active' : ''}`}
            />
          ))}
        </div>

        <h2 className="wizard-title">{current.title}</h2>
        <p className="wizard-desc">{current.description}</p>

        {/* Mode selection */}
        {current.fields === 'mode' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className={`btn ${mode === 'free' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ justifyContent: 'flex-start', padding: '14px 20px' }}
              onClick={() => setMode('free')}
            >
              🟢 Free Mode — No setup required, works instantly
            </button>
            <button
              className={`btn ${mode === 'connected' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ justifyContent: 'flex-start', padding: '14px 20px' }}
              onClick={() => setMode('connected')}
            >
              🔵 Connected Mode — Better AI, realistic voices (API keys)
            </button>
          </div>
        )}

        {/* AI key */}
        {current.fields === 'ai' && mode === 'connected' && (
          <div className="settings-field">
            <label className="settings-label">OpenRouter API Key</label>
            <input
              className="settings-input"
              type="password"
              placeholder="sk-or-..."
              value={aiKey}
              onChange={(e) => setAiKey(e.target.value)}
            />
          </div>
        )}

        {current.fields === 'ai' && mode === 'free' && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Skipping — you selected Free Mode. You can add keys later in Settings.
          </p>
        )}

        {/* TTS key */}
        {current.fields === 'tts' && mode === 'connected' && (
          <div className="settings-field">
            <label className="settings-label">ElevenLabs API Key</label>
            <input
              className="settings-input"
              type="password"
              placeholder="Your ElevenLabs key..."
              value={ttsKey}
              onChange={(e) => setTtsKey(e.target.value)}
            />
          </div>
        )}

        {current.fields === 'tts' && mode === 'free' && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Skipping — you selected Free Mode. You can add keys later in Settings.
          </p>
        )}

        {/* Actions */}
        <div className="wizard-actions">
          <div>
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            {step === 0 && (
              <button
                className="btn btn-ghost"
                onClick={handleSkip}
                style={{ fontSize: 13 }}
              >
                Skip Setup
              </button>
            )}
          </div>

          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleFinish}>
              🚀 Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
