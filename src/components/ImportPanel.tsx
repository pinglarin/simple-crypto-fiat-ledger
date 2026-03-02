"use client";

import React from "react";

import { useState, useRef } from "react";
import { Trade } from "@/lib/types";

interface Props {
  onImport: (trades: Trade[]) => void;
}

export default function ImportPanel({ onImport }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/import-csv", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onImport(data.trades);
      setResult(`✓ Imported ${data.count} filled trades from ${file.name}`);
    } catch (e) {
      setResult(`✗ ${e}`);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div
      className="card p-5 animate-slide-up"
      style={{ animationDelay: "500ms", opacity: 0 }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <h2 className="font-display text-sm font-bold text-[#e8e8f0] tracking-wide uppercase mb-1">
        Import CSV
      </h2>
      <p className="text-[#cbd1e0] font-mono text-xs mb-4">
        Drop a Binance order history export to merge into ledger
      </p>

      <div
        className="border-2 border-dashed border-[#1e1e2e] hover:border-[#f7931a44] rounded-lg p-6 text-center cursor-pointer transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <p className="text-2xl mb-2">📄</p>
        <p className="text-[#cbd1e0] font-mono text-xs">
          {loading ? "Processing…" : "Click or drag CSV here"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {result && (
        <p
          className={`mt-3 font-mono text-xs px-3 py-2 rounded border ${
            result.startsWith("✓")
              ? "text-green-400 bg-green-400/10 border-green-400/20"
              : "text-red-400 bg-red-400/10 border-red-400/20"
          }`}
        >
          {result}
        </p>
      )}
    </div>
  );
}
