import React, { useEffect, useRef, useState } from 'react'
import { Settings2, Volume2, X } from 'lucide-react'
import { DEFAULT_PIPER_VOICE_ID, PIPER_VOICES } from '../../../core/types'
import { useAppStore } from '../store/appStore'

export default function FloatingVoiceSettings() {
  const { config, loadConfig } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  const ttsConfig = config?.tts
  const piperOptions = ttsConfig?.piperOptions || {
    lengthScale: 1.0,
    noiseScale: 0.667,
    noiseW: 0.8
  }
  const voiceId = ttsConfig?.voiceId || DEFAULT_PIPER_VOICE_ID

  const updateConfig = async (newVoiceId: string, newOpts: typeof piperOptions) => {
    try {
      const fullConfig = await window.api.getConfig()
      fullConfig.providers.tts.voiceId = newVoiceId
      fullConfig.providers.tts.piperOptions = newOpts

      await window.api.setConfig(fullConfig)
      await loadConfig()
    } catch (err) {
      console.error(err)
    }
  }

  const applyPreset = (preset: 'natural' | 'fast' | 'expressive') => {
    switch (preset) {
      case 'natural':
        updateConfig(voiceId, { lengthScale: 1.0, noiseScale: 0.667, noiseW: 0.8 })
        break
      case 'fast':
        updateConfig(voiceId, { lengthScale: 0.7, noiseScale: 0.667, noiseW: 0.8 })
        break
      case 'expressive':
        updateConfig(voiceId, { lengthScale: 1.0, noiseScale: 0.85, noiseW: 0.9 })
        break
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (ttsConfig?.provider !== 'piper') {
    return null
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginLeft: '8px' }}>
      <button
        className="btn-icon"
        onClick={() => setIsOpen(!isOpen)}
        title="Opciones avanzadas de Piper"
      >
        <Settings2 size={16} />
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          className="fade-in"
          style={{
            position: 'absolute',
            top: '120%',
            left: '100%',
            marginLeft: '12px',
            width: '360px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 1000
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={16} className="text-primary" /> Ajustes motor offline
            </h4>
            <button className="btn-icon" onClick={() => setIsOpen(false)} style={{ padding: '4px' }}>
              <X size={16} />
            </button>
          </div>

          <div className="settings-field" style={{ marginBottom: '16px' }}>
            <label className="settings-label" style={{ fontSize: '12px' }}>Modelo de voz (Piper)</label>
            <select
              className="settings-select"
              value={PIPER_VOICES.some((voice) => voice.id === voiceId) ? voiceId : DEFAULT_PIPER_VOICE_ID}
              onChange={(e) => updateConfig(e.target.value, piperOptions)}
              style={{ fontSize: '13px', padding: '6px 8px' }}
            >
              {PIPER_VOICES.map((voice) => (
                <option key={voice.id} value={voice.id}>{voice.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="settings-label" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
              Presets rapidos
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '11px' }} onClick={() => applyPreset('natural')}>
                Natural
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '11px' }} onClick={() => applyPreset('fast')}>
                Rapido
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '11px' }} onClick={() => applyPreset('expressive')}>
                Expresivo
              </button>
            </div>
          </div>

          <div className="settings-field" style={{ marginBottom: '12px' }}>
            <label className="settings-label" style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Velocidad (Length Scale)</span>
              <span>{Number(piperOptions.lengthScale).toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={piperOptions.lengthScale}
              onChange={(e) => updateConfig(voiceId, { ...piperOptions, lengthScale: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <div className="settings-field" style={{ marginBottom: '12px' }}>
            <label className="settings-label" style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Naturalidad (Noise Scale)</span>
              <span>{Number(piperOptions.noiseScale).toFixed(3)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={piperOptions.noiseScale}
              onChange={(e) => updateConfig(voiceId, { ...piperOptions, noiseScale: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <div className="settings-field">
            <label className="settings-label" style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Variacion (Noise W)</span>
              <span>{Number(piperOptions.noiseW).toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={piperOptions.noiseW}
              onChange={(e) => updateConfig(voiceId, { ...piperOptions, noiseW: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
