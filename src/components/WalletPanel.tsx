"use client";

import React from "react";

import { useState, useEffect } from "react";
import { WalletData, EthTransaction } from "@/lib/types";
import { fmtCurrency, shortAddr, USD_TO_THB } from "@/lib/utils";

const WALLET_ADDRESS = process.env.NEXT_PUBLIC_WALLET_ADDRESS || ""; // Set your wallet address in .env.local

interface Props {
  currency: "USD" | "THB";
}

function TxRow({ tx, currency }: { tx: EthTransaction; currency: "USD" | "THB" }) {
  const isOut = tx.type === "OUT";
  const date = new Date(tx.timestamp);
  const dateStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const counterparty = isOut ? tx.to : tx.from;
  const valueUSD = tx.valueUSD;
  const displayValue = currency === "THB"
    ? `฿${(valueUSD * USD_TO_THB).toLocaleString("th-TH", { maximumFractionDigits: 0 })}`
    : `$${valueUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  return (
    <div className="flex items-center justify-between py-2.5 px-3 bg-[#0a0a0f] rounded-lg border border-[#1e1e2e] hover:border-[#f7931a22] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
          isOut ? "bg-red-400/15 text-red-400" : "bg-green-400/15 text-[#00d4aa]"
        }`}>
          {isOut ? "↑" : "↓"}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#e8e8f0]">
              {tx.value} {tx.tokenSymbol}
            </span>
            {tx.isContract && (
              <span className="text-[9px] font-mono text-[#cbd1e0] bg-[#1e1e2e] px-1.5 py-0.5 rounded">CONTRACT</span>
            )}
            {tx.status === "failed" && (
              <span className="text-[9px] font-mono text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">FAILED</span>
            )}
          </div>
          <p className="text-[#cbd1e0] text-[10px] font-mono truncate">
            {isOut ? "to" : "from"} {shortAddr(counterparty)}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        {valueUSD > 0 && (
          <p className={`font-mono text-xs font-bold ${isOut ? "text-red-400" : "text-[#00d4aa]"}`}>
            {isOut ? "-" : "+"}{displayValue}
          </p>
        )}
        <p className="text-[#cbd1e0] font-mono text-[10px]">{dateStr} {timeStr}</p>
      </div>
    </div>
  );
}

export default function WalletPanel({ currency }: Props) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"txs" | "tokens">("txs");

  useEffect(() => {
    fetch(`/api/wallet?address=${WALLET_ADDRESS}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setWallet(data);
      })
      .catch(() => setError("Could not fetch on-chain data from Etherscan."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card p-6 animate-slide-up" style={{ animationDelay: "300ms", opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-sm font-bold text-[#e8e8f0] tracking-wide uppercase">On-Chain Wallet</h2>
          <p className="text-[#cbd1e0] font-mono text-[10px] mt-0.5 break-all">{WALLET_ADDRESS}</p>
        </div>
        <div className="flex-shrink-0 ml-3">
          {loading ? (
            <span className="flex items-center gap-2 text-xs font-mono text-[#cbd1e0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f7931a] animate-pulse" /> Fetching…
            </span>
          ) : wallet ? (
            <span className="flex items-center gap-2 text-xs font-mono text-[#00d4aa]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" /> Live
            </span>
          ) : null}
        </div>
      </div>

      {error && (
        <p className="text-red-400 font-mono text-xs mb-4 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">⚠ {error}</p>
      )}

      {loading && (
        <div className="flex flex-col gap-2 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-[#1e1e2e] rounded-lg" />)}
        </div>
      )}

      {wallet && !loading && (
        <>
          <div className="bg-[#0a0a0f] border border-[#f7931a22] rounded-lg p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-[#cbd1e0] font-mono text-[10px] mb-0.5">ETH Balance</p>
              <p className="text-[#f7931a] font-display text-xl font-bold">{wallet.ethBalance} ETH</p>
            </div>
            <div className="text-right">
              <p className="text-[#cbd1e0] font-mono text-[10px] mb-0.5">Value</p>
              <p className="text-[#e8e8f0] font-mono text-sm font-bold">{fmtCurrency(wallet.ethBalanceUSD, currency)}</p>
            </div>
          </div>

          <div className="flex gap-1 mb-4 bg-[#0a0a0f] p-1 rounded-lg">
            {(["txs", "tokens"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-mono rounded transition-all ${tab === t ? "bg-[#1e1e2e] text-[#e8e8f0]" : "text-[#cbd1e0] hover:text-[#8888aa]"}`}>
                {t === "txs" ? `Transactions (${wallet.transactions.length})` : `Tokens (${wallet.tokens.length})`}
              </button>
            ))}
          </div>

          {tab === "txs" && (
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {wallet.transactions.length === 0
                ? <p className="text-[#cbd1e0] font-mono text-xs text-center py-6">No transactions found</p>
                : wallet.transactions.map((tx) => (
                  <TxRow key={tx.hash + tx.tokenSymbol} tx={tx} currency={currency} />
                ))}
            </div>
          )}

          {tab === "tokens" && (
            <div className="space-y-1.5">
              {wallet.tokens.map((token, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-[#0a0a0f] rounded-lg border border-[#1e1e2e] hover:border-[#f7931a33] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1e1e2e] flex items-center justify-center text-xs font-mono font-bold text-[#f7931a]">
                      {token.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-[#e8e8f0] font-mono text-xs font-bold">{token.symbol}</p>
                      <p className="text-[#cbd1e0] text-[10px]">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#e8e8f0] font-mono text-xs">{token.balance}</p>
                    {token.change24h !== 0 && (
                      <p className={`text-[10px] font-mono ${token.change24h >= 0 ? "text-[#00d4aa]" : "text-red-400"}`}>
                        {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
