const handleJson = async (response) => {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return text ? JSON.parse(text) : {};
};

export const uploadImageToKie = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/kie/upload', {
    method: 'POST',
    body: formData,
  });

  return handleJson(response);
};

export const createKieTask = async (payload) => {
  const response = await fetch('/api/kie/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleJson(response);
};

export const getKieTaskStatus = async (taskId, model = 'sora2') => {
  const params = new URLSearchParams({ taskId, model });
  const response = await fetch(`/api/kie/status?${params.toString()}`);
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
