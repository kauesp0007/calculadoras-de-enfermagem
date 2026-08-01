import os
from pathlib import Path

import truststore
from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[2]

truststore.inject_into_ssl()

from openai import OpenAI


load_dotenv(ROOT_DIR / ".env")

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY não encontrada no .env")

client = OpenAI(api_key=api_key)
