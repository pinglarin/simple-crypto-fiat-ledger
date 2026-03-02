"use client";

import React from "react";

import { useState } from "react";
import { Trade } from "@/lib/types";
import { fmt, fmtCurrency, parsePair } from "@/lib/utils";

interface Props {
  trades: Trade[];
  currency: "USD" | "THB";
}

export default function TradesTable({ trades, currency }: Props) {
  const [filter, setFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const filtered = trades
    .filter((t) => filter === "ALL" || t.side === filter)
    .filter((t) => !search || t.pair.toLowerCase().includes(search.toLowerCase()))
    .slice()
    .reverse();

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "400ms", opacity: 0 }}>
      <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
        <div>
          <h2 className="font-display text-sm font-bold text-[#e8e8f0] tracking-wide uppercase">Trade History</h2>
          <p className="text-[#cbd1e0] font-mono text-xs mt-0.5">{filtered.length} filled orders</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter pair…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="bg-[#0a0a0f] border border-[#1e1e2e] rounded px-3 py-1.5 text-xs font-mono text-[#e8e8f0] placeholder-[#cbd1e0] focus:outline-none focus:border-[#f7931a44] w-28"
          />
          {(["ALL", "BUY", "SELL"] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(0); }}
              className={`text-xs font-mono px-3 py-1.5 rounded border transition-all ${
                filter === f ? "border-[#f7931a] text-[#f7931a] bg-[#f7931a11]" : "border-[#1e1e2e] text-[#cbd1e0] hover:border-[#cbd1e0]"
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e1e2e]">
              {["Date", "From", "", "To", "Side", "Price", "Amount", `Total (${currency})`].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-mono text-[#cbd1e0] uppercase tracking-widest text-[10px] font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((t, i) => {
              const { from, to } = parsePair(t.pair);
              // For a BUY: you spend "to" asset to get "from" asset
              // For a SELL: you spend "from" asset to get "to" asset
              const spendAsset = t.side === "BUY" ? to : from;
              const receiveAsset = t.side === "BUY" ? from : to;
              return (
                <tr key={i} className="border-b border-[#1e1e2e] hover:bg-[#f7931a06] transition-colors">
                  <td className="px-4 py-3 font-mono text-[#cbd1e0] whitespace-nowrap">{t.date.slice(0, 16)}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded">
                      {spendAsset}
                    </span>
                  </td>
                  <td className="px-1 py-3 text-[#cbd1e0] font-mono text-xs">→</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-[#00d4aa] bg-[#00d4aa]/10 border border-[#00d4aa]/20 px-2 py-0.5 rounded">
                      {receiveAsset}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`tag ${t.side === "BUY" ? "tag-buy" : "tag-sell"}`}>{t.side}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#8888aa]">
                    {t.avgPrice > 0 ? `$${fmt(t.avgPrice)}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#8888aa]">
                    {fmt(t.executed, 4)} {t.executedUnit}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className={t.side === "BUY" ? "text-[#00d4aa]" : "text-red-400"}>
                      {t.side === "BUY" ? "-" : "+"}{fmtCurrency(t.total, currency)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e1e2e]">
        <p className="text-[#cbd1e0] font-mono text-xs">Page {page + 1} of {totalPages || 1}</p>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
          <button className="btn-ghost" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next →</button>
        </div>
      </div>
    </div>
  );
}
