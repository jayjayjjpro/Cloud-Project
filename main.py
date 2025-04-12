from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import pandas as pd
import uuid
import openai
from sqlalchemy import create_engine, text
import os
from datetime import datetime

from dotenv import load_dotenv
load_dotenv()

# Load secrets
openai.api_key = os.getenv("OPENAI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

app = FastAPI()
engine = create_engine(DATABASE_URL)

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



# Upload excel
@app.post("/upload/")
async def upload_excel(file: UploadFile = File(...)):
    # Read Excel to DataFrame
    df = pd.read_excel(file.file, header=0)

    # Create unique table name
    table_name = f"user_data_{uuid.uuid4().hex[:8]}"

    # Save to PostgreSQL
    df.to_sql(table_name, engine, if_exists="replace", index=False)

    return {
        "message": "File uploaded and stored.",
        "table_name": table_name,
        "columns": df.columns.tolist()
    }


