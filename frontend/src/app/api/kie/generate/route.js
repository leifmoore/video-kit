export const runtime = 'nodejs';

const API_BASE_URL = 'https://api.kie.ai';

const aspectMap = {
  '16:9': 'landscape',
  '9:16': 'portrait',
  '1:1': 'square',
};

export async function POST(request) {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'KIE_API_KEY is not set' }, { status: 500 });
  }

  const body = await request.json();
  const {
    prompt,
    imageUrl,
    duration = 5,
    quality = '720p',
    aspectRatio = '16:9',
    model = 'sora2',
  } = body || {};

  if (!prompt) {
    return Response.json({ error: 'prompt is required' }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (model === 'sora2') {
    const payload = {
      model: 'sora-2-image-to-video',
      input: {
        prompt,
        aspect_ratio: aspectMap[aspectRatio] || 'landscape',
        n_frames: '10',
        remove_watermark: true,
      },
    };

    if (imageUrl) {
      payload.input.image_urls = [imageUrl];
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (!response.ok) {
      return new Response(text, { status: response.status });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      return Response.json({ error: 'Invalid generate response' }, { status: 502 });
    }

    const taskId = data?.data?.taskId || data?.taskId;
    if (!taskId) {
      return Response.json({ error: 'Missing taskId from response' }, { status: 502 });
    }

    return Response.json({ taskId });
  }

  const payload = {
    prompt,
    duration,
    quality,
    aspectRatio,
    waterMark: '',
  };

  if (imageUrl) {
    payload.imageUrl = imageUrl;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/runway/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    return new Response(text, { status: response.status });
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return Response.json({ error: 'Invalid generate response' }, { status: 502 });
  }

  const taskId = data?.data?.taskId;
  if (!taskId) {
    return Response.json({ error: 'Missing taskId from response' }, { status: 502 });
  }

  return Response.json({ taskId });
}
