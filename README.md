# 🧠 Excel SQL Assistant

A minimalistic full-stack application that lets you upload Excel files, automatically store them in a PostgreSQL database, and query them using natural language — powered by OpenAI and FastAPI.

## 🌟 Features

- Upload `.xlsx` files and store data into PostgreSQL
- Auto-generates table names and normalizes column formatting
- Ask natural language questions about your data
- Translates them to SQL using OpenAI
- Displays query results and explanations
- Clean and modern frontend built with Next.js + TailwindCSS

---

## 🧱 Tech Stack

- **Backend**: FastAPI + SQLAlchemy + OpenAI + Pandas
- **Frontend**: Next.js + TypeScript + TailwindCSS
- **Database**: PostgreSQL (via Docker)
- **Deployment-ready**: Docker Compose

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/excel-sql-assistant.git
cd excel-sql-assistant
```


### 2. Create a .env File in the Root Directory

```bash
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://postgres:postgres@db:5432/mydatabase
```

### 3. Running with Docker Compose 🐳

```bash
docker-compose up --build
```

### 4. Running the Frontend (Next.js)

You can run the frontend separately in dev mode:
```bash
cd frontend
npm install
npm run dev
```

---

## 📊 Example Workflow

1. Upload an Excel file via the frontend.
2. Backend stores it as a PostgreSQL table.
3. Ask a question like:
    ```bash
    What was the total revenue in Q1?
    ```
4. OpenAI generates SQL, executes it, and returns the result + explanation.