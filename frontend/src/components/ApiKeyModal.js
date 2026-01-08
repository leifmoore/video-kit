'use client';

import React, { useEffect, useState } from 'react';
import {
  clearApiKey,
  getApiKey,
  getApiKeyStorageMode,
  setApiKey,
} from '../services/preferences';

function ApiKeyModal({ onClose, onSaved, onCleared }) {
  const [apiKey, setApiKeyValue] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [error, setError] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => {
    const storedKey = getApiKey();
    setApiKeyValue(storedKey);
    setHasStoredKey(Boolean(storedKey));
    setRememberKey(getApiKeyStorageMode() === 'local');
  }, []);

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('Please enter your Kie API key.');
      return;
    }

    setApiKey(trimmed, rememberKey);
    setHasStoredKey(true);
    setError('');
    if (onSaved) {
      onSaved();
    }
    onClose();
  };

  const handleClear = () => {
    clearApiKey();
    setApiKeyValue('');
    setHasStoredKey(false);
    setError('');
    if (onCleared) {
      onCleared();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>API Key Setup</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <p>Enter your Kie API key to enable generation.</p>
          <label htmlFor="kie-api-key">Kie API Key</label>
          <input
            id="kie-api-key"
            type="password"
            value={apiKey}
            onChange={(event) => {
              setApiKeyValue(event.target.value);
              if (error) {
                setError('');
              }
            }}
            placeholder="Paste your Kie API key"
            autoComplete="off"
            spellCheck="false"
          />
          {error && <p className="modal-error">{error}</p>}
          <label className="modal-checkbox">
            <input
              type="checkbox"
              checked={rememberKey}
              onChange={(event) => setRememberKey(event.target.checked)}
            />
            Remember this key on this device
          </label>
          <p className="modal-hint">
            Stored locally in your browser. You can clear it anytime.
          </p>
          {hasStoredKey && (
            <button className="modal-link" type="button" onClick={handleClear}>
              Clear stored key
            </button>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>
            Close
          </button>
          <button className="modal-btn modal-btn-save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyModal;
