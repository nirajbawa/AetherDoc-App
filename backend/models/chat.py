from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    role: str = Field(..., description="Role of the message author (e.g. user, assistant, system)")
    content: str = Field(..., description="Text content of the message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time the message was sent")

class ChatSessionResponse(BaseModel):
    session_id: str = Field(..., description="Unique ID of the chat session")
    messages: List[Message] = Field(default=[], description="List of messages in this chat session")
    document_draft: Optional[str] = Field(None, description="The accumulated draft of the document text/markdown")
    status: str = Field("active", description="Status of the session: active, generating, completed, failed")
    docx_path: Optional[str] = Field(None, description="Path to the generated Word document on disk")

class MessageRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="Session ID. If empty, a new session is started.")
    content: str = Field(..., description="User message content")

class MessageResponse(BaseModel):
    session_id: str = Field(..., description="Active session ID")
    response: str = Field(..., description="Response from the assistant")
    status: str = Field(..., description="Current state of the session")

class GenerateDocumentRequest(BaseModel):
    session_id: str = Field(..., description="The session ID from which to compile the document")

class GenerateDocumentResponse(BaseModel):
    session_id: str = Field(..., description="Active session ID")
    status: str = Field(..., description="Status of the document generation task")
    message: str = Field(..., description="Status message detailing next steps")
