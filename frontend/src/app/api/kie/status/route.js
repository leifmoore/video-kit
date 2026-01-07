export const runtime = 'nodejs';

const API_BASE_URL = 'https://api.kie.ai';

export async function GET(request) {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'KIE_API_KEY is not set' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  const model = searchParams.get('model') || 'sora2';

  if (!taskId) {
    return Response.json({ error: 'taskId is required' }, { status: 400 });
  }

  const url =
    model === 'sora2'
      ? `${API_BASE_URL}/api/v1/jobs/recordInfo`
      : `${API_BASE_URL}/api/v1/runway/record-detail`;

  const response = await fetch(`${url}?taskId=${encodeURIComponent(taskId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    return new Response(text, { status: response.status });
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    return Response.json({ error: 'Invalid status response' }, { status: 502 });
  }

  const data = payload?.data || payload;
  const state = data?.state || data?.status || 'unknown';
  const result = { state };

  if (model === 'sora2') {
    result.generateTime = data?.generateTime || null;
    result.failMsg = data?.failMsg || null;

    if (data?.resultJson) {
      try {
        const parsed = typeof data.resultJson === 'string'
          ? JSON.parse(data.resultJson)
          : data.resultJson;
        const urls = parsed?.resultUrls || [];
        result.videoUrl = urls[0] || null;
      } catch (error) {
        result.videoUrl = null;
      }
    }

    return Response.json(result);
  }

  const videoInfo = data?.videoInfo || {};
  result.videoUrl = videoInfo.videoUrl || null;
  result.thumbnailUrl = videoInfo.imageUrl || null;
  result.failMsg = data?.failMsg || null;
  return Response.json(result);
}
