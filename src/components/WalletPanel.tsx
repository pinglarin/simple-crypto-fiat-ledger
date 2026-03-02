"use client";

import React from "react";
import { useState, useEffect } from "react";
import { WalletData } from "@/lib/types";
import { USD_TO_THB } from "@/lib/utils";

interface Props {
  currency: "USD" | "THB";
  walletAddress: string;
}

export default function WalletPanel({ currency, walletAddress }: Props) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokensOpen, setTokensOpen] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setWallet(null);
    fetch(`/api/wallet?address=${walletAddress}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setWallet(data);
      })
      .catch(() => setError("Could not fetch on-chain data."))
      .finally(() => setLoading(false));
  }, [walletAddress]);

  const totalUSD = wallet?.totalUSD ?? 0;
  const totalDisplay = currency === "THB"
    ? `฿${(totalUSD * USD_TO_THB).toLocaleString("th-TH", { maximumFractionDigits: 0 })}`
    : `$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="card p-6 animate-slide-up" style={{ animationDelay: "300ms", opacity: 0 }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-sm font-bold text-[#e8e8f0] tracking-wide uppercase">
            On-Chain Wallet
          </h2>
          <p className="text-[#cbd1e0] font-mono text-[10px] mt-0.5 break-all">
            {walletAddress || "No address set"}
          </p>
        </div>
        <div className="flex-shrink-0 ml-3 text-right">
          {loading ? (
            <span className="flex items-center gap-2 text-xs font-mono text-[#cbd1e0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f7931a] animate-pulse" /> Fetching…
            </span>
          ) : wallet ? (
            <>
              <p className="text-[#f7931a] font-display text-xl font-bold leading-tight">
                {totalDisplay}
              </p>
              <span className="flex items-center justify-end gap-1.5 text-[10px] font-mono text-[#00d4aa] mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" /> Live
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="text-red-400 font-mono text-xs mb-4 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          ⚠ {error}
        </p>
      )}

      {/* ── Skeleton ── */}
      {loading && (
        <div className="flex flex-col gap-2 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-[#1e1e2e] rounded-lg" />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !walletAddress && (
        <p className="text-[#8888aa] font-mono text-xs text-center py-6">
          No wallet address configured. Click the address in the header to set one.
        </p>
      )}

      {/* ── Token list ── */}
      {wallet && !loading && (
        <>
          {/* Collapsible toggle */}
          <button
            onClick={() => setTokensOpen((o) => !o)}
            className="w-full flex items-center justify-between py-2 px-3 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg mb-2 hover:border-[#f7931a33] transition-colors group"
          >
            <span className="text-[#cbd1e0] font-mono text-xs">
              Tokens <span className="text-[#5a5a7a]">({wallet.tokens.length})</span>
            </span>
            <svg
              className={`w-3.5 h-3.5 text-[#5a5a7a] group-hover:text-[#8888aa] transition-transform duration-200 ${tokensOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {tokensOpen && (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {wallet.tokens.length === 0 ? (
                <p className="text-[#8888aa] font-mono text-xs text-center py-6">No tokens found</p>
              ) : (
                wallet.tokens.map((token, i) => {
                  const usdValue = token.balanceUSD;
                  const displayValue = currency === "THB"
                    ? `฿${(usdValue * USD_TO_THB).toLocaleString("th-TH", { maximumFractionDigits: 0 })}`
                    : `$${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 px-3 bg-[#0a0a0f] rounded-lg border border-[#1e1e2e] hover:border-[#f7931a33] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1e1e2e] flex items-center justify-center text-xs font-mono font-bold text-[#f7931a] shrink-0">
                          {token.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[#e8e8f0] font-mono text-xs font-bold">{token.symbol}</p>
                          <p className="text-[#5a5a7a] text-[10px] font-mono">{token.balance}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#e8e8f0] font-mono text-xs font-bold">{displayValue}</p>
                        {token.change24h !== 0 && (
                          <p className={`text-[10px] font-mono ${token.change24h >= 0 ? "text-[#00d4aa]" : "text-red-400"}`}>
                            {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
