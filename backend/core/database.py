import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    def connect_db(cls):
        logger.info(f"Connecting to MongoDB: {settings.MONGODB_URI}")
        cls.client = AsyncIOMotorClient(settings.MONGODB_URI)
        cls.db = cls.client[settings.MONGODB_DB_NAME]

    @classmethod
    def disconnect_db(cls):
        if cls.client:
            cls.client.close()
            logger.info("Disconnected from MongoDB.")

def get_db():
    if Database.db is None:
        Database.connect_db()
    return Database.db

async def get_session(session_id: str):
    db = get_db()
    return await db.chat_sessions.find_one({"session_id": session_id})

async def create_session(session_id: str):
    db = get_db()
    welcome_message = {
        "role": "assistant",
        "content": (
            "Hello! I am your Autonomous Document Generation Assistant. I can help you draft, outline, "
            "and refine professional business or technical documents (such as proposals, meeting minutes, "
            "project plans, SOPs, or specifications) directly in this chat. \n\n"
            "Once you are satisfied with the draft sections, type **\"compile document\"** and I will compile "
            "the contents into a beautifully formatted Microsoft Word (.docx) document matching your corporate "
            "styles. How can I help you get started today?"
        ),
        "timestamp": datetime.utcnow()
    }
    session = {
        "session_id": session_id,
        "messages": [welcome_message],
        "document_draft": None,
        "status": "active",
        "docx_path": None,
        "created_at": datetime.utcnow()
    }
    await db.chat_sessions.insert_one(session)
    return session

async def add_message_to_session(session_id: str, role: str, content: str):
    db = get_db()
    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow()
    }
    await db.chat_sessions.update_one(
        {"session_id": session_id},
        {"$push": {"messages": message}}
    )

async def update_session_status(session_id: str, status: str, docx_path: str = None):
    db = get_db()
    update_data = {"status": status}
    if docx_path:
        update_data["docx_path"] = docx_path
    await db.chat_sessions.update_one(
        {"session_id": session_id},
        {"$set": update_data}
    )

async def update_session_draft(session_id: str, draft: str):
    db = get_db()
    await db.chat_sessions.update_one(
        {"session_id": session_id},
        {"$set": {"document_draft": draft}}
    )

async def get_all_sessions():
    db = get_db()
    cursor = db.chat_sessions.find().sort("created_at", -1)
    sessions = await cursor.to_list(length=100)
    return sessions

async def delete_session(session_id: str):
    db = get_db()
    result = await db.chat_sessions.delete_one({"session_id": session_id})
    return result.deleted_count > 0

