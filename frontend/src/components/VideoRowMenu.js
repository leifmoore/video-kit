'use client';

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import DeleteIcon from '../assets/icons/ic_delete.svg';
import DownloadIcon from '../assets/icons/ic_download.svg';
import CopyIcon from '../assets/icons/ic_copy.svg';
import RefreshIcon from '../assets/icons/ic_refresh.svg';

function VideoRowMenu({
  onDownload,
  onCopyPrompt,
  onDelete,
  onCheckStatus,
  onClose,
  triggerRef,
  showCheckStatus,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef.current &&
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

  useEffect(() => {
    const handleScroll = () => {
      onClose();
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  useEffect(() => {
    if (triggerRef?.current && menuRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();

      setPosition({
        top: rect.top,
        left: rect.left - menuRect.width - 8,
      });
    }
  }, [triggerRef]);

  const menuContent = (
    <div
      ref={menuRef}
      className="video-row-menu"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {showCheckStatus && (
        <button className="video-row-menu-item" onClick={onCheckStatus}>
          <RefreshIcon />
          <span>Check Status</span>
        </button>
      )}
      <button className="video-row-menu-item" onClick={onDownload}>
        <DownloadIcon />
        <span>Download</span>
      </button>
      <button className="video-row-menu-item" onClick={onCopyPrompt}>
        <CopyIcon />
        <span>Copy Prompt</span>
      </button>
      <button className="video-row-menu-item" onClick={onDelete}>
        <DeleteIcon />
        <span>Delete</span>
      </button>
    </div>
  );

  return ReactDOM.createPortal(menuContent, document.body);
}

export default VideoRowMenu;
