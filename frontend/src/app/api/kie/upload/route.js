export const runtime = 'nodejs';

const UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-stream-upload';

const extractUploadUrl = (payload) => {
  if (payload?.data) {
    const data = payload.data;
    return data.downloadUrl || data.fileUrl || data.url || null;
  }
  return payload?.fileUrl || payload?.downloadUrl || payload?.url || null;
};

export async function POST(request) {
  const apiKey = request.headers.get('x-kie-api-key')?.trim();
  if (!apiKey) {
    return Response.json(
      { error: 'Kie API key is required. Add your key in Settings.' },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) {
    return Response.json({ error: 'file is required' }, { status: 400 });
  }

  const filename = file.name || 'image.jpg';
  const upstream = new FormData();
  upstream.append('file', file, filename);
  upstream.append('uploadPath', 'fight-videos');
  upstream.append('fileName', filename);

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: upstream,
  });

  const text = await response.text();
  if (!response.ok) {
    return new Response(text, { status: response.status });
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    return Response.json({ error: 'Invalid upload response' }, { status: 502 });
  }

  const url = extractUploadUrl(payload);
  if (!url) {
    return Response.json({ error: 'Upload did not return a file URL' }, { status: 502 });
  }

  return Response.json({ url });
}
