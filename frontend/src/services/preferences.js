const API_KEY_STORAGE_KEY = 'video-kit.kieApiKey';
const API_KEY_STORAGE_MODE_KEY = 'video-kit.kieApiKeyStorage';
const DEFAULT_ORIENTATION_KEY = 'video-kit.defaultOrientation';
const DEFAULT_ORIENTATION = 'portrait';

const canUseStorage = () => typeof window !== 'undefined';

export const getApiKeyStorageMode = () => {
  if (!canUseStorage()) {
    return 'session';
  }

  if (window.localStorage.getItem(API_KEY_STORAGE_KEY)) {
    return 'local';
  }

  if (window.sessionStorage.getItem(API_KEY_STORAGE_KEY)) {
    return 'session';
  }

  const storedMode = window.localStorage.getItem(API_KEY_STORAGE_MODE_KEY);
  return storedMode === 'local' ? 'local' : 'session';
};

export const getApiKey = () => {
  if (!canUseStorage()) {
    return '';
  }

  const localKey = window.localStorage.getItem(API_KEY_STORAGE_KEY);
  if (localKey) {
    return localKey;
  }

  return window.sessionStorage.getItem(API_KEY_STORAGE_KEY) || '';
};

export const setApiKey = (key, remember) => {
  if (!canUseStorage()) {
    return;
  }

  const trimmed = (key || '').trim();
  if (!trimmed) {
    return;
  }

  if (remember) {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
    window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    window.localStorage.setItem(API_KEY_STORAGE_MODE_KEY, 'local');
  } else {
    window.sessionStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    window.localStorage.setItem(API_KEY_STORAGE_MODE_KEY, 'session');
  }
};

export const clearApiKey = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(API_KEY_STORAGE_KEY);
  window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
};

export const getDefaultOrientation = () => {
  if (!canUseStorage()) {
    return DEFAULT_ORIENTATION;
  }

  const stored = window.localStorage.getItem(DEFAULT_ORIENTATION_KEY);
  if (stored === 'portrait' || stored === 'landscape') {
    return stored;
  }

  return DEFAULT_ORIENTATION;
};

export const setDefaultOrientation = (orientation) => {
  if (!canUseStorage()) {
    return;
  }

  if (orientation !== 'portrait' && orientation !== 'landscape') {
    return;
  }

  window.localStorage.setItem(DEFAULT_ORIENTATION_KEY, orientation);
};
