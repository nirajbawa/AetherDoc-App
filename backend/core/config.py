import os
from dotenv import load_dotenv

# Resolve the .env path relative to this file's directory (core/)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, '.env')

# Load environment variables
load_dotenv(dotenv_path=env_path)

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "doc_generator_db")
    PORT: int = int(os.getenv("PORT", "8000"))
    OUTPUT_DIR: str = os.path.join(base_dir, os.getenv("OUTPUT_DIR", "generated_docs"))

settings = Settings()

# Ensure output directory exists
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
