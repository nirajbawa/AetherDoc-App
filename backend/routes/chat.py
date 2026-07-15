import os
import uuid
import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from typing import List
from core.config import settings
from core.database import get_session, update_session_status, get_all_sessions, delete_session
from models import (
    MessageRequest,
    MessageResponse,
    ChatSessionResponse,
    Message
)
from agent.orchestrator import handle_chat_message
from utils.compiler import compile_document_to_docx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/message", response_model=MessageResponse)
async def send_message(payload: MessageRequest):
    """
    Send a message to the document generation chat assistant.
    If no session_id is provided, a new session is started.
    """
    session_id = payload.session_id
    if not session_id or session_id.strip() == "":
        session_id = str(uuid.uuid4())
        logger.info(f"Generating new session_id: {session_id}")
        
    try:
        result = await handle_chat_message(session_id, payload.content)
        return MessageResponse(
            session_id=result["session_id"],
            response=result["response"],
            status=result["status"]
        )
    except Exception as e:
        logger.error(f"Error handling chat message: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing your request: {str(e)}"
        )

@router.get("/session/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(session_id: str):
    """
    Retrieve the message history, document draft and status for a given session.
    """
    session = await get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Map MongoDB dict to Pydantic ChatSessionResponse
    messages = [
        Message(
            role=msg["role"],
            content=msg["content"],
            timestamp=msg.get("timestamp")
        )
        for msg in session.get("messages", [])
    ]
    
    return ChatSessionResponse(
        session_id=session["session_id"],
        messages=messages,
        document_draft=session.get("document_draft"),
        status=session.get("status", "active"),
        docx_path=session.get("docx_path")
    )

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_chat_sessions():
    """
    Retrieve all chat sessions sorted by creation time.
    """
    try:
        sessions = await get_all_sessions()
        response_list = []
        for s in sessions:
            messages = [
                Message(
                    role=msg["role"],
                    content=msg["content"],
                    timestamp=msg.get("timestamp")
                )
                for msg in s.get("messages", [])
            ]
            response_list.append(
                ChatSessionResponse(
                    session_id=s["session_id"],
                    messages=messages,
                    document_draft=s.get("document_draft"),
                    status=s.get("status", "active"),
                    docx_path=s.get("docx_path")
                )
            )
        return response_list
    except Exception as e:
        logger.error(f"Error listing chat sessions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing sessions: {str(e)}"
        )


@router.get("/download/{session_id}")
async def download_document(session_id: str):
    """
    Download the generated Word document (.docx) for the specified session.
    """
    session = await get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
        
    docx_path = session.get("docx_path")
    if not docx_path or not os.path.exists(docx_path):
        # Double check default path
        default_path = os.path.join(settings.OUTPUT_DIR, f"{session_id}_document.docx")
        if os.path.exists(default_path):
            docx_path = default_path
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document has not been compiled yet. Please request compilation first."
            )
            
    # Send the file back to the user
    return FileResponse(
        path=docx_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"generated_document.docx"
    )

@router.delete("/session/{session_id}", response_model=dict)
async def delete_chat_session(session_id: str):
    """
    Delete a chat session and clean up its database entry.
    """
    try:
        success = await delete_session(session_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
              )
        return {"session_id": session_id, "status": "deleted", "message": "Session successfully deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat session: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting session: {str(e)}"
        )
