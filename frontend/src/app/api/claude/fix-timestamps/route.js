export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a timestamp validator for video prompts. Your task is to fix any timestamp sequences that are out of order.

Rules:
1. Each [Cut] line has format: [Cut] MM:SS.mm–MM:SS.mm (Xs) — description
2. The start time of each cut MUST equal the end time of the previous cut
3. Keep the duration in parentheses accurate (end time - start time)
4. Do NOT change any text except the timestamps
5. Return ONLY the corrected prompt text, nothing else - no explanations, no markdown

Example input:
[Cut] 00:00.00–00:00.35 (0.35s) — First scene
[Cut] 00:00.35–00:01.00 (0.65s) — Second scene
[Cut] 00:02.00–00:02.50 (0.5s) — Third scene (ERROR: should start at 00:01.00)

Example output:
[Cut] 00:00.00–00:00.35 (0.35s) — First scene
[Cut] 00:00.35–00:01.00 (0.65s) — Second scene
[Cut] 00:01.00–00:01.50 (0.5s) — Third scene`;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY is not set' }, { status: 500 });
  }

  const body = await request.json();
  const prompt = body?.prompt?.trim();

  if (!prompt) {
    return Response.json({ error: 'prompt is required' }, { status: 400 });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Fix the timestamps in this video prompt so they are sequential:\n\n${prompt}`,
        },
      ],
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    return new Response(text, { status: response.status });
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    return Response.json({ error: 'Invalid Claude response' }, { status: 502 });
  }

  const fixedPrompt = payload?.content?.[0]?.text?.trim() || '';
  return Response.json({
    fixedPrompt,
    wasModified: fixedPrompt !== prompt,
  });
}
