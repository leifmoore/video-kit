from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.claude_client import ClaudeClient

router = APIRouter()
claude_client = ClaudeClient()


class FixTimestampsRequest(BaseModel):
    prompt: str


class FixTimestampsResponse(BaseModel):
    fixedPrompt: str
    wasModified: bool


@router.post("/claude/fix-timestamps", response_model=FixTimestampsResponse)
async def fix_timestamps(request: FixTimestampsRequest):
    """
    Send a prompt to Claude to fix timestamp sequences.
    Returns the fixed prompt and whether any changes were made.
    """
    try:
        result = await claude_client.fix_timestamps(request.prompt)
        return FixTimestampsResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process prompt: {str(e)}")
