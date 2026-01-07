export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return Response.json({ error: 'url is required' }, { status: 400 });
  }

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    return new Response(text, { status: response.status });
  }

  const contentType = response.headers.get('content-type') || 'video/mp4';
  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Content-Disposition', `attachment; filename="video-${Date.now()}.mp4"`);

  return new Response(response.body, {
    status: 200,
    headers,
  });
}
