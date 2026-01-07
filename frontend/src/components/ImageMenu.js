'use client';

import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

function ImageMenu({ onDelete, onClose, triggerRef }) {
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

  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  useEffect(() => {
    if (triggerRef?.current && menuRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.right + 8,
      });
    }
  }, [triggerRef]);

  const menuContent = (
    <div
      ref={menuRef}
      className="image-menu"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <button className="image-menu-item" onClick={onDelete}>
        <img src="/icons/ic_delete.svg" alt="" />
        <span>Delete</span>
      </button>
    </div>
  );

  return ReactDOM.createPortal(menuContent, document.body);
}

export default ImageMenu;
