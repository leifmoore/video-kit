import { getApiKey } from './preferences';

const handleJson = async (response) => {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return text ? JSON.parse(text) : {};
};

const withKieApiKey = (headers = {}) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return headers;
  }
  return { ...headers, 'x-kie-api-key': apiKey };
};

export const uploadImageToKie = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/kie/upload', {
    method: 'POST',
    headers: withKieApiKey(),
    body: formData,
  });

  return handleJson(response);
};

export const createKieTask = async (payload) => {
  const response = await fetch('/api/kie/generate', {
    method: 'POST',
    headers: withKieApiKey({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  return handleJson(response);
};

export const getKieTaskStatus = async (taskId, model = 'sora2') => {
  const params = new URLSearchParams({ taskId, model });
  const response = await fetch(`/api/kie/status?${params.toString()}`, {
    headers: withKieApiKey(),
  });
  return handleJson(response);
};

export const fixTimestamps = async (prompt) => {
  const response = await fetch('/api/claude/fix-timestamps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  return handleJson(response);
};

export const getDownloadUrl = (videoUrl) =>
  `/api/kie/download?url=${encodeURIComponent(videoUrl)}`;
