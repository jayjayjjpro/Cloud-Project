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
  const [insights, setInsights] = useState<
    { query: string; result?: any[]; error?: string }[]
  >([]);
  const [rawInsightsExplanation, setRawInsightsExplanation] = useState("");
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [openInsight, setOpenInsight] = useState<number | null>(null);
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

  const generateInsights = async () => {
    if (!tableName) return;
    const formData = new FormData();
    formData.append("table_name", tableName);
    formData.append("column_info", columnInfo);
    setInsightsLoading(true)
    try {
      const res = await axios.post("http://localhost:8000/insights/", formData);
      setRawInsightsExplanation(res.data.raw_explanation);
      setInsights(res.data.insights);
    } catch (err) {
      console.error(err);
      alert("Failed to generate insights.");
    }
    setInsightsLoading(false);
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
          <button
            onClick={generateInsights}
            className="ml-4 px-4 py-2 rounded bg-[#6c5ce7] text-white text-sm hover:bg-[#5e4db8] transition"
          >
            {insightsLoading ? "Thinking..." : "Generate Insights"}
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
      {insights.length > 0 && (
        <div className="bg-white p-6 mt-6 rounded-md shadow space-y-6 border border-neutral-200">
          <h3 className="text-lg font-medium mb-3">📊 Generated Insights</h3>
          <pre className="bg-[#f9f9fa] text-sm text-[#1e1e1e] p-3 rounded-md whitespace-pre-wrap">{rawInsightsExplanation}</pre>

          {insights.map((insight, i) => {
            const isOpen = openInsight === i;
            return (
              <div key={i} className="border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => setOpenInsight(isOpen ? null : i)}
                  className={`w-full flex justify-between items-center px-4 py-3 text-left font-medium transition ${
                    isOpen ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <span>Results for Insight {i + 1}</span>
                  <span className="text-xl leading-none">
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 py-3 space-y-2 bg-white">
                    <div>
                      <span className="font-medium">SQL:</span>
                      <pre className="bg-[#f4f4f5] text-sm p-3 rounded-md overflow-x-auto">
                        {insight.query}
                      </pre>
                    </div>

                    {insight.result && (
                      <div>
                        <span className="font-medium">Result:</span>
                        <pre className="bg-[#f4f4f5] text-sm p-3 rounded-md overflow-x-auto">
                          {JSON.stringify(insight.result, null, 2)}
                        </pre>
                      </div>
                    )}

                    {insight.error && (
                      <p className="text-red-500 text-sm">Error: {insight.error}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
