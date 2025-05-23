from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from openai import OpenAI
from sqlalchemy import create_engine, text, inspect
import os
import re

from dotenv import load_dotenv
load_dotenv()

# Load secrets
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
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



# Upload excel to PostgreSQL
@app.post("/upload/")
async def upload_excel(file: UploadFile = File(...)):
    # Read Excel to DataFrame
    df = pd.read_excel(file.file, header=0)

    # Normalize column names: lowercase, strip whitespace, replace spaces with underscores
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]

    # Get base table name from the filename (without extension)
    original_name = os.path.splitext(file.filename)[0]
    table_name = original_name

    # Check if table exists, and add suffix if needed
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    suffix = 1
    while table_name in existing_tables:
        table_name = f"{original_name}_{suffix}"
        suffix += 1

    # Save to PostgreSQL
    df.to_sql(table_name, engine, if_exists="replace", index=False)

    return {
        "message": "File uploaded and stored.",
        "table_name": table_name,
        "columns": df.columns.tolist()
    }

# Ask GPT and generate SQL query and return explanation and results
@app.post("/ask/")
async def ask_question(
    table_name: str = Form(...),
    question: str = Form(...),
    column_info: str = Form(None)
):
    # # Validate column_info
    # if not column_info.strip():
    #     raise HTTPException(status_code=400, detail="column_info cannot be empty")

    # Fetch sample rows from the table to give GPT context
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT * FROM {table_name} LIMIT 3"))
        columns = result.keys()
        sample_data = [dict(zip(columns, row)) for row in result]

    # Build full prompt
    system_prompt = "You are an assistant that returns only SQL queries without explanations. Do not use markdown or formatting."


    user_prompt = f"""
    The table is named '{table_name}'.

    Here are some sample rows:
    {sample_data}

    Column info: {column_info}

    User question: {question}

    Generate a valid SQL query for PostgreSQL that can answer the question.
    """

    # Call GPT
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )

    sql_query = response.choices[0].message.content.strip()

    # Run the SQL query
    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql_query))
            columns = result.keys()
            rows = [dict(zip(columns, row)) for row in result]

            # Generate a natural language explanation
            result_summary_prompt = f"""
            You are a helpful assistant.

            Here is the SQL query that was executed:
            {sql_query}

            And here is the result:
            {rows}

            Explain what this result means in one or two clear sentences.
            """

            explanation_response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You explain SQL query results clearly for non-technical users."},
                    {"role": "user", "content": result_summary_prompt}
                ]
            )

            explanation = explanation_response.choices[0].message.content.strip()

        return {
                    "sql": sql_query,
                    "result": rows,
                    "explanation": explanation
                }

    except Exception as e:
        return {"sql": sql_query, "error": str(e)}
    
# ChatGPT provides 3 insights about the excel data
@app.post("/insights/")
async def generate_insights(
    table_name: str = Form(...),
    column_info: str = Form(None)
):
    # Step 1: Fetch sample rows for GPT context
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT * FROM {table_name} LIMIT 5"))
        columns = result.keys()
        sample_data = [dict(zip(columns, row)) for row in result]

    # Step 2: Build the insight prompt
    insight_prompt = f"""
The table is named '{table_name}'.

Here are some sample rows:
{sample_data}

{f"Column info: {column_info}" if column_info else ""}

Please suggest 3 interesting insights based on this data. 
For each insight:
- Write a one-sentence explanation.
- Provide the SQL query needed to derive it.
- Label them as: Insight 1, Insight 2, Insight 3.
Only return the SQL as raw code after each explanation.
"""

    # Step 3: Ask GPT to generate insights and SQL
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a data analyst that suggests SQL insights from data tables."},
            {"role": "user", "content": insight_prompt}
        ]
    )

    raw_output = response.choices[0].message.content.strip()

    # Step 4: Extract all SQL queries using regex
    sql_matches = re.findall(r"```sql\n(.*?)```", raw_output, re.DOTALL)
    if not sql_matches:
        sql_matches = re.findall(r"(SELECT .*?;)", raw_output, re.DOTALL)

    # Step 5: Execute each SQL query and store results
    insights = []
    with engine.connect() as conn:
        for i, sql_query in enumerate(sql_matches):
            try:
                result = conn.execute(text(sql_query.strip()))
                columns = result.keys()
                rows = [dict(zip(columns, row)) for row in result]
                insights.append({
                    "query": sql_query.strip(),
                    "result": rows
                })
            except Exception as e:
                insights.append({
                    "query": sql_query.strip(),
                    "error": str(e)
                })

    return {
        "raw_explanation": raw_output,
        "insights": insights
    }
    



