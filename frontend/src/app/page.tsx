"use client";

import { useState, useRef } from "react";
import axios from "axios";

interface ApiResponse {
  sql: string;
  result?: any[];
  explanation?: string;
  error?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [columnInfo, setColumnInfo] = useState("");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("http://localhost:8000/upload/", formData);
      setTableName(res.data.table_name);
      setColumns(res.data.columns);
      setColumnInfo(res.data.columns.join(", "));
      alert("Upload successful!");
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }
  };

  const askQuestion = async () => {
    if (!question || !columnInfo || !tableName) return;
    const formData = new FormData();
    formData.append("table_name", tableName);
    formData.append("question", question);
    formData.append("column_info", columnInfo);
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/ask/", formData);
      setResponse(res.data);
    } catch (err) {
      console.error(err);
      alert("Query failed.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto font-sans bg-[#f7f8fa] text-[#1e1e1e]">
      <h1 className="text-3xl font-semibold mb-8 tracking-tight">Excel SQL Assistant</h1>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded border border-neutral-300 bg-white shadow hover:shadow-md hover:bg-neutral-100 transition text-sm"
        >
          {file ? file.name : "Choose File"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={uploadFile}
          className="px-4 py-2 rounded bg-[#3a5ba0] text-white text-sm hover:bg-[#324d8b] transition"
        >
          Upload
        </button>
      </div>

      {columns.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-medium mb-2">Ask a Question</h2>
          <p className="text-sm text-neutral-500 mb-2">Columns: {columnInfo}</p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What is the average sales in Q1?"
            className="w-full p-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#cbd7ff] bg-white text-sm resize-none mb-4"
            rows={4}
          />
          <button
            onClick={askQuestion}
            className="px-4 py-2 rounded bg-[#40875d] text-white text-sm hover:bg-[#366d4e] transition"
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>
      )}

      {response && (
        <div className="bg-white p-6 rounded-md shadow space-y-6 border border-neutral-200">
          <div>
            <h3 className="text-lg font-medium mb-1">SQL Query</h3>
            <pre className="bg-[#f4f4f5] text-sm text-[#1e1e1e] p-3 rounded-md overflow-x-auto">
              {response.sql}
            </pre>
          </div>

          {response.result && (
            <div>
              <h3 className="text-lg font-medium mb-1">Result</h3>
              <pre className="bg-[#f4f4f5] text-sm text-[#1e1e1e] p-3 rounded-md overflow-x-auto">
                {JSON.stringify(response.result, null, 2)}
              </pre>
            </div>
          )}

          {response.explanation && (
            <div>
              <h3 className="text-lg font-medium mb-1">Explanation</h3>
              <p className="text-neutral-700 leading-relaxed text-sm">{response.explanation}</p>
            </div>
          )}

          {response.error && (
            <div>
              <h3 className="text-lg font-medium text-red-600 mb-1">Error</h3>
              <p className="text-sm">{response.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
