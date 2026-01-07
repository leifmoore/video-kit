'use client';

import React, { useRef, useState } from 'react';
import SettingsPopup from './SettingsPopup';
import { fixTimestamps } from '../services/api';

function InputPanel({ jobs, selectedImage, onGenerate, isGenerating }) {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('portrait');
  const [duration, setDuration] = useState(10);
  const [noMusic, setNoMusic] = useState(false);
  const [noCrowd, setNoCrowd] = useState(false);
  const [noCommentators, setNoCommentators] = useState(false);
  const [likeAnime, setLikeAnime] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [historyViewActive, setHistoryViewActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [isFixingTimestamps, setIsFixingTimestamps] = useState(false);
  const settingsBtnRef = useRef(null);
  const skipSettingsClickRef = useRef(false);
  const skipOrientationClickRef = useRef(false);
  const toggleSettingsPopup = () =>
    setShowSettingsPopup((prev) => !prev);

  const toggleCardExpansion = (jobId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const handlePromptCardClick = (job) => {
    setPrompt(job.prompt);
    setHistoryViewActive(false);
  };

  const toggleHistoryView = () => {
    if (historyViewActive) {
      setExpandedCards({});
      setSearchQuery('');
    }
    setHistoryViewActive(!historyViewActive);
  };

  const handleFixTimestamps = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt first');
      return;
    }

    setIsFixingTimestamps(true);
    try {
      const result = await fixTimestamps(prompt);
      setPrompt(result.fixedPrompt);
      if (!result.wasModified) {
        alert('Timestamps are already in correct sequence');
      }
    } catch (error) {
      console.error('Failed to fix timestamps:', error);
      alert('Failed to fix timestamps: ' + error.message);
    } finally {
      setIsFixingTimestamps(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    if (!selectedImage) {
      alert('Please select or upload an image');
      return;
    }

    let finalPrompt = prompt.trim();

    if (noMusic) {
      finalPrompt += ' No music.';
    }

    if (noCrowd) {
      finalPrompt += ' No crowd.';
    }

    if (noCommentators) {
      finalPrompt += ' No commentators.';
    }

    if (likeAnime) {
      finalPrompt += ' Filmed like anime.';
    }

    onGenerate({
      model: 'sora2',
      customImageId: selectedImage.id,
      prompt: finalPrompt,
      music: noMusic,
      crowd: noCrowd,
      commentators: noCommentators,
      likeAnime,
      duration,
      aspectRatio: aspectRatio === 'portrait' ? '9:16' : '16:9',
    });
  };

  const promptHistory = jobs
    .filter((job) => {
      if (searchQuery.trim()) {
        return job.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .slice(0, 20);

  const handleSettingsPointerDown = (event) => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      skipSettingsClickRef.current = true;
      toggleSettingsPopup();
    }
  };

  const handleSettingsClick = () => {
    if (skipSettingsClickRef.current) {
      skipSettingsClickRef.current = false;
      return;
    }
    toggleSettingsPopup();
  };

  const handleOrientationPointerDown = (event, nextOrientation) => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      skipOrientationClickRef.current = true;
      setAspectRatio(nextOrientation);
    }
  };

  const handleOrientationClick = (nextOrientation) => {
    if (skipOrientationClickRef.current) {
      skipOrientationClickRef.current = false;
      return;
    }
    setAspectRatio(nextOrientation);
  };

  return (
    <div className="input-panel-new">
      {historyViewActive ? (
        <div className="history-view">
          <div className="history-header">
            <input
              type="text"
              className="history-search-input"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              className="history-close-btn"
              onClick={toggleHistoryView}
              title="Close history"
            >
              <img src="/icons/ic_close.svg" alt="" />
            </button>
          </div>

          <div className="prompt-history">
            {promptHistory.map((job) => {
              const isExpanded = expandedCards[job.id];
              const isLong = job.prompt.length > 200;
              const truncatedText =
                isLong && !isExpanded ? job.prompt.substring(0, 200) : job.prompt;

              return (
                <div
                  key={job.id}
                  className="prompt-card"
                  onClick={() => handlePromptCardClick(job)}
                >
                  <div className="prompt-card-text">
                    {truncatedText}
                    {isLong && !isExpanded && (
                      <button
                        className="prompt-card-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCardExpansion(job.id);
                        }}
                      >
                        more...
                      </button>
                    )}
                    {isLong && isExpanded && (
                      <button
                        className="prompt-card-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCardExpansion(job.id);
                        }}
                      >
                        less
                      </button>
                    )}
                  </div>
                  <div className="prompt-card-meta">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="input-form">
          <div className="top-right-buttons">
            <button
              type="button"
              className="fix-timestamps-btn"
              onClick={handleFixTimestamps}
              disabled={isFixingTimestamps}
              title={isFixingTimestamps ? 'Fixing timestamps...' : 'Fix timestamps'}
              aria-label="Fix timestamps"
            >
              <img src="/icons/ic_fix_timestamps.svg" alt="" />
            </button>
          </div>

          {showSettingsPopup && (
            <SettingsPopup
              duration={duration}
              noMusic={noMusic}
              noCrowd={noCrowd}
              noCommentators={noCommentators}
              likeAnime={likeAnime}
              onDurationChange={setDuration}
              onToggleMusic={() => setNoMusic((prev) => !prev)}
              onToggleCrowd={() => setNoCrowd((prev) => !prev)}
              onToggleCommentators={() => setNoCommentators((prev) => !prev)}
              onToggleLikeAnime={() => setLikeAnime((prev) => !prev)}
              onClose={() => setShowSettingsPopup(false)}
              triggerRef={settingsBtnRef}
            />
          )}

          <div className="prompt-section-new">
            <textarea
              placeholder="your next big idea..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="input-controls">
            <div className="bottom-row">
              <button
                type="submit"
                className="generate-btn-new"
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
                <img src="/icons/ic_smart.svg" alt="" />
              </button>
              <div className="orientation-toggle" role="group" aria-label="Orientation">
                <button
                  type="button"
                  className={`orientation-btn ${
                    aspectRatio === 'portrait' ? 'active' : ''
                  }`}
                  onPointerDown={(event) =>
                    handleOrientationPointerDown(event, 'portrait')
                  }
                  onClick={() => handleOrientationClick('portrait')}
                  title="Portrait"
                  aria-pressed={aspectRatio === 'portrait'}
                  aria-label="Portrait orientation"
                >
                  <img src="/icons/ic_portrait.svg" alt="" />
                </button>
                <button
                  type="button"
                  className={`orientation-btn ${
                    aspectRatio === 'landscape' ? 'active' : ''
                  }`}
                  onPointerDown={(event) =>
                    handleOrientationPointerDown(event, 'landscape')
                  }
                  onClick={() => handleOrientationClick('landscape')}
                  title="Landscape"
                  aria-pressed={aspectRatio === 'landscape'}
                  aria-label="Landscape orientation"
                >
                  <img src="/icons/ic_landscape.svg" alt="" />
                </button>
              </div>
              <div className="settings-btn-wrapper">
                <button
                  type="button"
                  className="settings-btn"
                  ref={settingsBtnRef}
                  onPointerDown={handleSettingsPointerDown}
                  onClick={handleSettingsClick}
                  title="Settings"
                >
                  <img src="/icons/ic_settings.svg" alt="" />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default InputPanel;
