"use client";

import React from "react";

import { useState, useMemo } from "react";
import rawTrades from "@/data/trades.json";
import { Trade } from "@/lib/types";
import { computeStats, shortAddr } from "@/lib/utils";
import PnLSummary from "@/components/PnLSummary";
import WalletPanel from "@/components/WalletPanel";
import VolumeChart from "@/components/VolumeChart";
import TradesTable from "@/components/TradesTable";
import AssetBreakdown from "@/components/AssetBreakdown";
import ShortcutPanel from "@/components/ShortcutPanel";

const WALLET = "0x564dCa5C975eD19B29785c7Aa8841ae23143dfd5";

export default function Dashboard() {
  const [trades] = useState<Trade[]>(rawTrades as Trade[]);
  const [currency, setCurrency] = useState<"USD" | "THB">("USD");
  const stats = useMemo(() => computeStats(trades), [trades]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="border-b border-[#1e1e2e] bg-[#0a0a0f]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#f7931a] rounded flex items-center justify-center">
              <span className="text-[10px] font-bold text-black">₿</span>
            </div>
            <span className="font-display text-sm font-bold tracking-widest text-[#e8e8f0] uppercase">
              crypto-fiat-ledger
            </span>
            <span className="text-[#1e1e2e] text-sm">·</span>
            <span className="text-[#4a4a6a] font-mono text-xs">personal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#4a4a6a] font-mono text-xs hidden sm:block">
              {stats.dateRange.from} → {stats.dateRange.to}
            </span>
            <div className="flex items-center bg-[#111118] border border-[#1e1e2e] rounded-lg p-0.5">
              {(["USD", "THB"] as const).map((c) => (
                <button key={c} onClick={() => setCurrency(c)}
                  className={`px-3 py-1 text-xs font-mono rounded transition-all ${
                    currency === c ? "bg-[#f7931a] text-black font-bold" : "text-[#4a4a6a] hover:text-[#e8e8f0]"
                  }`}>
                  {c === "USD" ? "$ USD" : "฿ THB"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f7931a]" />
              <span className="font-mono text-xs text-[#8888aa]">{shortAddr(WALLET)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* P&L summary — 4 cards + open positions table */}
        <PnLSummary
          realizedPnL={stats.realizedPnL}
          openPositions={stats.openPositions}
          totalCostBasis={stats.totalCostBasis}
          currency={currency}
        />

        {/* P&L chart + Asset breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <VolumeChart data={stats.chartData} currency={currency} />
          </div>
          <div>
            <AssetBreakdown assetVolume={stats.assetVolume} />
          </div>
        </div>

        {/* Wallet + Shortcut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <WalletPanel currency={currency} />
          </div>
          <div>
            <ShortcutPanel />
          </div>
        </div>

        {/* Trades table */}
        <TradesTable trades={trades} currency={currency} />

        <footer className="mt-12 text-center">
          <p className="text-[#1e1e2e] font-mono text-xs">
            crypto-fiat-ledger · personal use · Binance CEX + Ethereum mainnet · FIFO P&L accounting
          </p>
        </footer>
      </main>
    </div>
  );
}
