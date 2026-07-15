import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.database import Database
from routes.chat import router as chat_router

# Configure Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up FastAPI application...")
    Database.connect_db()
    yield
    # Shutdown
    logger.info("Shutting down FastAPI application...")
    Database.disconnect_db()

app = FastAPI(
    title="Autonomous Document Generation API",
    description="FastAPI backend utilizing LangChain and MCP tools to generate formatted Word documents.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(chat_router)

@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {
        "name": "Autonomous Document Generation API",
        "status": "online",
        "documentation": "/docs"
    }

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok"}