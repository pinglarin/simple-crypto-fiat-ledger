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

const DEFAULT_WALLET = process.env.NEXT_PUBLIC_WALLET_ADDRESS || "";

export default function Dashboard() {
  const [trades] = useState<Trade[]>(rawTrades as Trade[]);
  const [currency, setCurrency] = useState<"USD" | "THB">("USD");
  const [wallet, setWallet] = useState<string>(DEFAULT_WALLET);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletInput, setWalletInput] = useState("");
  const stats = useMemo(() => computeStats(trades), [trades]);

  function handleWalletSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = walletInput.trim();
    if (trimmed) {
      setWallet(trimmed);
    }
    setShowWalletModal(false);
    setWalletInput("");
  }

  function openModal() {
    setWalletInput(wallet);
    setShowWalletModal(true);
  }

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
            <span className="text-[#cbd1e0] font-mono text-xs">personal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#cbd1e0] font-mono text-xs hidden sm:block">
              {stats.dateRange.from} → {stats.dateRange.to}
            </span>
            <div className="flex items-center bg-[#111118] border border-[#1e1e2e] rounded-lg p-0.5">
              {(["USD", "THB"] as const).map((c) => (
                <button key={c} onClick={() => setCurrency(c)}
                  className={`px-3 py-1 text-xs font-mono rounded transition-all ${
                    currency === c ? "bg-[#f7931a] text-black font-bold" : "text-[#cbd1e0] hover:text-[#e8e8f0]"
                  }`}>
                  {c === "USD" ? "$ USD" : "฿ THB"}
                </button>
              ))}
            </div>
            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-1.5 hover:border-[#f7931a]/50 hover:bg-[#1a1a24] transition-all group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#f7931a] shrink-0" />
              <span className="font-mono text-xs text-[#8888aa] group-hover:text-[#cbd1e0] transition-colors">
                {shortAddr(wallet)}
              </span>
              <svg className="w-3 h-3 text-[#3a3a55] group-hover:text-[#8888aa] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1a2 2 0 01.586-1.414z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowWalletModal(false); }}
        >
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl shadow-black/80">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#f7931a] rounded flex items-center justify-center">
                  <span className="text-[9px] font-bold text-black">₿</span>
                </div>
                <h2 className="text-[#e8e8f0] font-mono text-sm font-bold tracking-wider uppercase">
                  Update Wallet
                </h2>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-[#3a3a55] hover:text-[#8888aa] transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-[#8888aa] font-mono text-xs mb-4">
              Enter a new wallet address to track. Currently tracking:
            </p>
            <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 mb-4">
              <span className="font-mono text-xs text-[#5a5a7a] break-all">{wallet || "—"}</span>
            </div>

            <form onSubmit={handleWalletSubmit}>
              <label className="block text-[#8888aa] font-mono text-xs mb-2 uppercase tracking-wider">
                New Address
              </label>
              <input
                type="text"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                placeholder="0x... or bc1..."
                autoFocus
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] focus:border-[#f7931a]/60 rounded-lg px-3 py-2.5 font-mono text-xs text-[#e8e8f0] placeholder-[#3a3a55] outline-none transition-colors mb-4"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="flex-1 bg-transparent border border-[#1e1e2e] hover:border-[#3a3a55] text-[#8888aa] hover:text-[#cbd1e0] font-mono text-xs rounded-lg py-2.5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#f7931a] hover:bg-[#e8841a] text-black font-mono text-xs font-bold rounded-lg py-2.5 transition-all"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            <VolumeChart realizedData={stats.chartData} unrealizedData={stats.unrealizedChartData} currency={currency} />
          </div>
          <div>
            <AssetBreakdown assetVolume={stats.assetVolume} />
          </div>
        </div>

        {/* Wallet + Shortcut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <WalletPanel currency={currency} walletAddress={wallet} />
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
