'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

function SettingsPopup({
  duration,
  noMusic,
  noCrowd,
  noCommentators,
  likeAnime,
  onDurationChange,
  onToggleMusic,
  onToggleCrowd,
  onToggleCommentators,
  onToggleLikeAnime,
  onClose,
  triggerRef,
}) {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const popupRef = useRef(null);
  const [position, setPosition] = useState({ bottom: 0, right: 0, left: null });

  useEffect(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setPosition({
          bottom: 16,
          right: 16,
          left: 16,
        });
      } else {
        setPosition({
          bottom: window.innerHeight - rect.top + 10,
          right: window.innerWidth - rect.right - 10,
          left: null,
        });
      }
    }
  }, [triggerRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, triggerRef]);

  const handleDurationSelect = (dur) => {
    onDurationChange(dur);
    setActiveSubmenu(null);
  };

  const toggleSubmenu = (submenu) => {
    setActiveSubmenu((prev) => (prev === submenu ? null : submenu));
  };

  const popupContent = (
    <div
      className="settings-popup"
      ref={popupRef}
      style={{
        position: 'fixed',
        bottom: `${position.bottom}px`,
        right: position.right !== null ? `${position.right}px` : 'auto',
        left: position.left !== null ? `${position.left}px` : 'auto',
      }}
    >
      <div className="popup-option" onClick={() => toggleSubmenu('duration')}>
        <div className="option-row">
          <div className="option-left">
            <img src="/icons/ic_duration.svg" alt="" />
            <span className="option-label">Duration</span>
          </div>
          <div className="option-right">
            <span className="option-value">{duration}s</span>
            <span className="option-arrow">›</span>
          </div>
        </div>

        {activeSubmenu === 'duration' && (
          <div className="submenu" onClick={(event) => event.stopPropagation()}>
            <div className="submenu-item" onClick={() => handleDurationSelect(10)}>
              <img src="/icons/ic_duration.svg" alt="" />
              <span>10s</span>
              {duration === 10 && <span className="checkmark">✓</span>}
            </div>
            <div className="submenu-item" onClick={() => handleDurationSelect(15)}>
              <img src="/icons/ic_duration.svg" alt="" />
              <span>15s</span>
              {duration === 15 && <span className="checkmark">✓</span>}
            </div>
          </div>
        )}
      </div>

      <div className="popup-option" onClick={() => toggleSubmenu('modifiers')}>
        <div className="option-row">
          <div className="option-left">
            <img src="/icons/ic_edit.svg" alt="" />
            <span className="option-label">Prompt modifiers</span>
          </div>
          <div className="option-right">
            <span className="option-arrow">›</span>
          </div>
        </div>

        {activeSubmenu === 'modifiers' && (
          <div className="submenu" onClick={(event) => event.stopPropagation()}>
            <div className="submenu-item" onClick={onToggleMusic}>
              <span>No music</span>
              {noMusic && <span className="checkmark">✓</span>}
            </div>
            <div className="submenu-item" onClick={onToggleCrowd}>
              <span>No crowd</span>
              {noCrowd && <span className="checkmark">✓</span>}
            </div>
            <div className="submenu-item" onClick={onToggleCommentators}>
              <span>No commentators</span>
              {noCommentators && <span className="checkmark">✓</span>}
            </div>
            <div className="submenu-item" onClick={onToggleLikeAnime}>
              <span>Like anime</span>
              {likeAnime && <span className="checkmark">✓</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(popupContent, document.body);
}

export default SettingsPopup;
