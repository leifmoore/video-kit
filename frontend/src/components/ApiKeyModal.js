'use client';

import React from 'react';

function ApiKeyModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>API Key Setup</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p>Set your API keys as environment variables:</p>
          <pre>
            KIE_API_KEY=your_kie_api_key{'\n'}
            ANTHROPIC_API_KEY=your_anthropic_api_key
          </pre>
          <p className="modal-hint">
            For Vercel: Project Settings → Environment Variables.
          </p>
          <p className="modal-hint">
            For local dev: add them to <code>frontend/.env.local</code>.
          </p>
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyModal;
