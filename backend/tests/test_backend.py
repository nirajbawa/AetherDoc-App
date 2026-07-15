import os
import sys
import asyncio

# Add backend root to python search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import settings
from utils.compiler import compile_document_to_docx
from core.database import Database, get_db

async def test_compiler():
    print("\n--- Running Compiler Test ---")
    session_id = "test_verification_session"
    title = "Test Clean Energy Analytics Platform Proposal"
    
    sections = [
        {
            "heading": "1. Executive Summary",
            "content": (
                "This is a demonstration document compiled by the Autonomous Document Generation Agent.\n\n"
                "Here is an important callout message:\n"
                "> [!NOTE]\n"
                "> The transition to renewable energy requires robust cloud analytics. "
                "All downtime must be strictly minimized to guarantee operational success."
            )
        },
        {
            "heading": "2. Project Timeline & Scope",
            "content": (
                "Here is the tentative project timeline for the analytics integration:\n\n"
                "| Phase | Description | Duration | Milestone |\n"
                "|---|---|---|---|\n"
                "| Phase 1 | Requirements Gathering | 2 Weeks | Design Sign-off |\n"
                "| Phase 2 | Database Migration to Aurora | 3 Weeks | DB Live |\n"
                "| Phase 3 | Frontend Dashboard Development | 4 Weeks | User Acceptance Test |\n"
                "| Phase 4 | Final Review & Handoff | 1 Week | Final Handoff |\n\n"
                "Please refer to the following bullet points for deliverables:\n"
                "- Complete cloud architecture blueprint.\n"
                "- High-throughput DB connector with failover redundancy.\n"
                "- Real-time monitoring metrics dashboard."
            )
        }
    ]
    
    try:
        filepath = compile_document_to_docx(session_id, title, sections)
        print(f"Success: Compiler compiled document successfully.")
        print(f"Saved to: {os.path.abspath(filepath)}")
        assert os.path.exists(filepath), "Error: File does not exist on disk!"
        print("Verification: File exists on disk.")
    except Exception as e:
        print(f"Error in compiler: {str(e)}")

async def test_mongodb():
    print("\n--- Running MongoDB Connection Test ---")
    try:
        Database.connect_db()
        db = get_db()
        # Perform simple server status or ping
        ping_res = await db.command("ping")
        print(f"Success: MongoDB connected successfully. Ping response: {ping_res}")
        
        # Test session creation
        test_session_id = "test_mongodb_conn"
        # Clear existing if any
        await db.chat_sessions.delete_one({"session_id": test_session_id})
        
        # Insert
        session = {
            "session_id": test_session_id,
            "status": "active",
            "messages": [{"role": "system", "content": "Test connection"}]
        }
        await db.chat_sessions.insert_one(session)
        print("Success: Inserted test chat session.")
        
        # Query
        fetched = await db.chat_sessions.find_one({"session_id": test_session_id})
        print(f"Success: Retrieved test chat session status: {fetched['status']}")
        
        # Clean up
        await db.chat_sessions.delete_one({"session_id": test_session_id})
        print("Success: Cleaned up test session.")
        
        Database.disconnect_db()
    except Exception as e:
        print(f"Error in MongoDB connection: {str(e)}")

async def main():
    await test_compiler()
    await test_mongodb()

if __name__ == "__main__":
    asyncio.run(main())
