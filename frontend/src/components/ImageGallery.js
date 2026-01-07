'use client';

import React, { useRef, useState } from 'react';
import ImageMenu from './ImageMenu';
import MoreVertIcon from '../assets/icons/ic_more_vert.svg';
import KeyIcon from '../assets/icons/ic_key.svg';
import LightIcon from '../assets/icons/ic_light.svg';
import NightIcon from '../assets/icons/ic_night.svg';
import DeleteIcon from '../assets/icons/ic_delete.svg';

function ImageGallery({
  images,
  selectedImage,
  onImageSelect,
  onUploadImage,
  onDeleteImage,
  onClearLocalData,
  theme,
  onToggleTheme,
  onOpenApiKey,
}) {
  const [menuOpen, setMenuOpen] = useState(null);
  const fileInputRef = useRef(null);
  const menuButtonRefs = useRef({});

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const newImage = await onUploadImage(file);
      onImageSelect(newImage);
      event.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image: ' + error.message);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageClick = (image) => {
    onImageSelect(image);
  };

  const handleMenuClick = (e, imageId) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === imageId ? null : imageId);
  };

  const handleDelete = async (image) => {
    try {
      await onDeleteImage(image.id);
    } catch (error) {
      console.error('Delete error:', error);
    }
    setMenuOpen(null);
  };

  return (
    <div className="image-gallery">
      <div className="gallery-scroll-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <button
          className="gallery-upload-btn"
          onClick={handleUploadClick}
          title="Upload image"
        >
          +
        </button>

        <div className="gallery-thumbnails">
          {images.map((image) => (
            <div
              key={image.id}
              className={`gallery-thumbnail ${selectedImage?.id === image.id ? 'selected' : ''}`}
              onClick={() => handleImageClick(image)}
            >
              <img src={image.previewUrl} alt={`Custom ${image.id}`} />
              <button
                ref={(el) => {
                  menuButtonRefs.current[image.id] = el;
                }}
                className="gallery-menu-btn"
                onClick={(e) => handleMenuClick(e, image.id)}
              >
                <MoreVertIcon />
              </button>
              {menuOpen === image.id && (
                <ImageMenu
                  onDelete={() => handleDelete(image)}
                  onClose={() => setMenuOpen(null)}
                  triggerRef={{ current: menuButtonRefs.current[image.id] }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="gallery-bottom-controls">
        <button className="control-btn" onClick={onOpenApiKey} title="API Key">
          <KeyIcon />
        </button>
        <button
          className="control-btn"
          onClick={onClearLocalData}
          title="Clear local data"
        >
          <DeleteIcon />
        </button>
        <button
          className="control-btn"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? <NightIcon /> : <LightIcon />}
        </button>
      </div>
    </div>
  );
}

export default ImageGallery;
