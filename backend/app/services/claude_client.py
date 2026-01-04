import os
from anthropic import Anthropic


class ClaudeClient:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")

    def _get_client(self) -> Anthropic:
        """Get Anthropic client with current API key."""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not set")
        return Anthropic(api_key=api_key)

    async def fix_timestamps(self, prompt: str) -> dict:
        """
        Send prompt to Claude to fix timestamp sequences in video prompts.
        Returns dict with fixedPrompt and wasModified flag.
        """
        client = self._get_client()

        system_prompt = """You are a timestamp validator for video prompts. Your task is to fix any timestamp sequences that are out of order.

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
[Cut] 00:01.00–00:01.50 (0.5s) — Third scene"""

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": f"Fix the timestamps in this video prompt so they are sequential:\n\n{prompt}"
                }
            ],
            system=system_prompt
        )

        fixed_prompt = message.content[0].text.strip()
        was_modified = fixed_prompt != prompt

        return {
            "fixedPrompt": fixed_prompt,
            "wasModified": was_modified
        }
