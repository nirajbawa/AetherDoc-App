import os
import asyncio
import logging
from typing import Dict, List, Any
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

from core.config import settings
from core.database import (
    get_session,
    create_session,
    add_message_to_session,
    update_session_status
)
from mcp_server import generate_docx_document

logger = logging.getLogger(__name__)

# --- Define LangChain tool wrapping the MCP Server compilation logic ---
@tool
def compile_document_tool(session_id: str, title: str, sections: List[Dict[str, str]]) -> str:
    """
    Compile a professionally styled Microsoft Word (.docx) document from structured content sections.
    Use this tool ONLY when the user explicitly requests to compile, generate, create, build, or write the final Word document.
    
    Args:
        session_id: The session ID of the current chat (used for naming the output file).
        title: The title of the document.
        sections: A list of sections, where each section is a dictionary containing:
                  - 'heading': The heading/title of the section (e.g. "1. Executive Summary").
                  - 'content': The text, paragraphs, lists, or tables for that section.
    """
    logger.info(f"LangChain calling compile_document_tool for session: {session_id}")
    return generate_docx_document(session_id, title, sections)

async def handle_chat_message(session_id: str, user_content: str) -> Dict[str, Any]:
    """
    Handles a user message in a chat session.
    Loads chat history, runs the LangChain Agent, triggers tool calls if needed, and saves responses.
    """
    # 1. Retrieve or initialize chat session from MongoDB
    session = await get_session(session_id)
    if not session:
        session = await create_session(session_id)
        
    # Save the new user message to database
    await add_message_to_session(session_id, "user", user_content)
    
    # 2. Define System Prompt instructing the agent
    system_instruction = (
        "You are an expert Document Generation AI assistant. Your goal is to work collaboratively "
        "with the user to draft, discuss, and refine a professional business/technical document in the chat first.\n\n"
        "INSTRUCTIONS:\n"
        "1. Brainstorm with the user and draft the document content section-by-section. Present drafts using clear Markdown headers.\n"
        "2. Keep the formatting professional. Outline tables, bullet lists, or callouts in markdown format as needed.\n"
        "3. When the user is satisfied and explicitly requests to compile, generate, create, build, or write the Word document (e.g. 'create document', 'generate docx', 'build file'), you MUST call the `compile_document_tool` to perform the actual file compilation. DO NOT write code or simulate the file creation yourself.\n"
        "4. Always pass the exact session_id: {session_id} to the tool.\n"
        "5. The tool returns a file path on success. Once the tool runs successfully, inform the user that their document has been successfully created and styled, and is ready for download. IMPORTANT: You must output a download markdown link in EXACTLY this format: [Download compiled document](download). Do NOT output the raw local file path (e.g. do NOT output paths containing 'backend/generated_docs' or 'D:\\...' or similar absolute/relative paths)."
    ).format(session_id=session_id)
    
    # Reconstruct the message history for LangChain
    history_list = []
    for msg in session.get("messages", []):
        if msg["role"] == "user":
            history_list.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            history_list.append(AIMessage(content=msg["content"]))
            
    # 3. Setup LangChain LLM, Tools, Prompt & Agent
    tools = [compile_document_tool]
    
    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        openai_api_key=settings.OPENAI_API_KEY,
        temperature=0.5
    )
    
    # Reconstruct message list for LangGraph react agent
    messages = [SystemMessage(content=system_instruction)] + history_list + [HumanMessage(content=user_content)]
    
    # Build the LangGraph React Agent
    agent = create_react_agent(llm, tools)
    
    # Execute the agent
    response = await agent.ainvoke({"messages": messages})
    
    ai_response = response["messages"][-1].content
    
    # Save the assistant's reply to MongoDB
    await add_message_to_session(session_id, "assistant", ai_response)
    
    # 4. Check if the Word file was compiled and update the database state
    expected_path = os.path.join(settings.OUTPUT_DIR, f"{session_id}_document.docx")
    if os.path.exists(expected_path):
        await update_session_status(session_id, "completed", expected_path)
        status = "completed"
    else:
        status = "active"
        
    return {
        "session_id": session_id,
        "response": ai_response,
        "status": status
    }
