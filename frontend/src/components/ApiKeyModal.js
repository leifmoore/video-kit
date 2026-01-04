import React, { useState, useEffect } from 'react';
import './ApiKeyModal.css';
import { getKieApiKey, updateKieApiKey, getAnthropicApiKey, updateAnthropicApiKey } from '../services/api';

function ApiKeyModal({ onClose }) {
  const [kieApiKey, setKieApiKey] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current API keys on mount
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const [kieData, anthropicData] = await Promise.all([
          getKieApiKey(),
          getAnthropicApiKey()
        ]);
        if (kieData.api_key) {
          setKieApiKey(kieData.api_key);
        }
        if (anthropicData.api_key) {
          setAnthropicApiKey(anthropicData.api_key);
        }
      } catch (error) {
        console.error('Failed to load API keys:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApiKeys();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = [];
      if (kieApiKey.trim()) {
        promises.push(updateKieApiKey(kieApiKey.trim()));
      }
      if (anthropicApiKey.trim()) {
        promises.push(updateAnthropicApiKey(anthropicApiKey.trim()));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        alert('API Keys saved successfully to .env file!');
        onClose();
      } else {
        alert('Please enter at least one API key');
      }
    } catch (error) {
      console.error('Failed to save API keys:', error);
      alert('Failed to save API keys: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>API Key Settings</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <label>
            Kie.ai API Key
            <input
              type="text"
              value={kieApiKey}
              onChange={(e) => setKieApiKey(e.target.value)}
              placeholder="Enter your Kie.ai API key"
              autoFocus
              disabled={loading}
            />
          </label>
          <p className="modal-hint">
            Get your API key from <a href="https://kie.ai" target="_blank" rel="noopener noreferrer">kie.ai</a>
          </p>

          <label>
            Anthropic API Key
            <input
              type="text"
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
              placeholder="Enter your Anthropic API key"
              disabled={loading}
            />
          </label>
          <p className="modal-hint">
            Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>
          </p>
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="modal-btn modal-btn-save" onClick={handleSave} disabled={loading || saving}>
            {saving ? 'Saving...' : 'Save to .env'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyModal;
