"use client";

import React from "react";

import { useEffect, useState } from "react";
import { OpenPosition } from "@/lib/utils";
import { fmtCurrency, fmtCurrencyShort, USD_TO_THB } from "@/lib/utils";

// CoinGecko IDs for the assets we hold
const ASSET_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  ADA: "cardano",
  PROM: "prometeus",
  TOMO: "tomochain",
  LINK: "chainlink",
  BAND: "band-protocol",
  ALPHA: "alpha-finance",
  XRP: "ripple",
  CAKE: "pancakeswap-token",
  SHIB: "shiba-inu",
};

interface LivePrice {
  usd: number;
  usd_24h_change: number;
}

interface Props {
  realizedPnL: number;
  openPositions: OpenPosition[];
  totalCostBasis: number;
  currency: "USD" | "THB";
}

function PnLCard({
  label, value, sub, positive, negative, accent, loading, delay = 0,
}: {
  label: string; value: string; sub?: string;
  positive?: boolean; negative?: boolean; accent?: boolean;
  loading?: boolean; delay?: number;
}) {
  const color = positive ? "text-[#00d4aa]" : negative ? "text-red-400" : accent ? "text-[#f7931a]" : "text-[#e8e8f0]";
  const glow = positive ? "border-[#00d4aa22]" : negative ? "border-red-400/20" : accent ? "border-[#f7931a22]" : "border-[#1e1e2e]";

  return (
    <div
      className={`card p-5 border ${glow} animate-slide-up`}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <p className="text-[#cbd1e0] font-mono text-[10px] uppercase tracking-widest mb-3">{label}</p>
      {loading ? (
        <div className="h-7 w-24 bg-[#1e1e2e] rounded animate-pulse mb-1" />
      ) : (
        <p className={`font-display text-2xl font-bold ${color} leading-none mb-1`}>{value}</p>
      )}
      {sub && <p className="text-[#cbd1e0] font-mono text-[10px] mt-1.5">{sub}</p>}
    </div>
  );
}

export default function PnLSummary({ realizedPnL, openPositions, totalCostBasis, currency }: Props) {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  async function fetchPrices() {
    const assets = openPositions.map((p) => p.asset).filter((a) => ASSET_TO_ID[a]);
    const ids = Array.from(new Set(assets.map((a) => ASSET_TO_ID[a]))).join(",");
    if (!ids) { setLoading(false); return; }
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );
      const raw = await res.json();
      const mapped: Record<string, LivePrice> = {};
      for (const [asset, id] of Object.entries(ASSET_TO_ID)) {
        if (raw[id]) mapped[asset] = { usd: raw[id].usd, usd_24h_change: raw[id].usd_24h_change ?? 0 };
      }
      setPrices(mapped);
      setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // keep previous prices
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 60_000);
    return () => clearInterval(id);
  }, []);

  // Compute unrealized P&L from live prices
  let currentValue = 0;
  const positionsWithPnL = openPositions.map((pos) => {
    const price = prices[pos.asset]?.usd ?? null;
    const currentVal = price !== null ? pos.qty * price : null;
    const unrealized = currentVal !== null ? currentVal - pos.totalCostUSD : null;
    const pct = unrealized !== null ? (unrealized / pos.totalCostUSD) * 100 : null;
    if (currentVal !== null) currentValue += currentVal;
    return { ...pos, currentPrice: price, currentVal, unrealized, pct };
  });

  const knownCostBasis = openPositions
    .filter((p) => prices[p.asset])
    .reduce((s, p) => s + p.totalCostUSD, 0);

  const unrealizedPnL = currentValue - knownCostBasis;
  const totalPnL = realizedPnL + (knownCostBasis > 0 ? unrealizedPnL : 0);

  const mul = currency === "THB" ? USD_TO_THB : 1;
  const sym = currency === "THB" ? "฿" : "$";

  const fmtPnL = (n: number) =>
    `${n >= 0 ? "+" : ""}${fmtCurrency(n, currency)}`;

  return (
    <div className="space-y-4 mb-8">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <PnLCard
          label="Realized P&L"
          value={fmtPnL(realizedPnL)}
          sub={`FIFO · ${realizedPnL >= 0 ? "profitable" : "net loss"}`}
          positive={realizedPnL >= 0}
          negative={realizedPnL < 0}
          delay={0}
        />
        <PnLCard
          label="Unrealized P&L"
          value={loading ? "…" : knownCostBasis > 0 ? fmtPnL(unrealizedPnL) : "—"}
          sub={loading ? "fetching prices…" : `on ${positionsWithPnL.filter(p => p.currentVal !== null).length} open positions`}
          positive={!loading && unrealizedPnL >= 0 && knownCostBasis > 0}
          negative={!loading && unrealizedPnL < 0}
          loading={loading}
          delay={60}
        />
        <PnLCard
          label="Total P&L"
          value={loading ? "…" : knownCostBasis > 0 ? fmtPnL(totalPnL) : fmtPnL(realizedPnL)}
          sub="realized + unrealized"
          positive={!loading && totalPnL >= 0}
          negative={!loading && totalPnL < 0}
          accent={loading}
          loading={loading}
          delay={120}
        />
        <PnLCard
          label="Cost Basis"
          value={fmtCurrencyShort(totalCostBasis, currency)}
          sub={`${openPositions.length} assets still held`}
          accent
          delay={180}
        />
      </div>

      {/* Open positions breakdown */}
      {positionsWithPnL.length > 0 && (
        <div className="card animate-slide-up" style={{ animationDelay: "240ms", opacity: 0 }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e1e2e]">
            <h3 className="font-display text-xs font-bold text-[#e8e8f0] tracking-wide uppercase">
              Open Positions
            </h3>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-[#cbd1e0] font-mono text-[10px]">prices @ {lastUpdated}</span>
              )}
              <button
                onClick={fetchPrices}
                className="text-[10px] font-mono text-[#cbd1e0] hover:text-[#f7931a] transition-colors"
              >
                ↻ refresh
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {["Asset", "Qty Held", "Avg Cost", "Current Price", "Value", "Unrealized P&L", ""].map((h, i) => (
                    <th key={i} className="px-5 py-2.5 text-left font-mono text-[#cbd1e0] uppercase tracking-widest text-[10px] font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positionsWithPnL.map((pos, i) => (
                  <tr key={i} className="border-b border-[#1e1e2e] last:border-0 hover:bg-[#f7931a06] transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-[#e8e8f0]">{pos.asset}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-[#8888aa]">
                      {pos.qty.toFixed(pos.qty < 1 ? 6 : 4)}
                    </td>
                    <td className="px-5 py-3 font-mono text-[#8888aa]">
                      {sym}{(pos.avgCostUSD * mul).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 font-mono">
                      {loading ? (
                        <span className="text-[#1e1e2e]">…</span>
                      ) : pos.currentPrice !== null ? (
                        <span className="text-[#e8e8f0]">
                          {sym}{(pos.currentPrice * mul).toLocaleString(undefined, { maximumFractionDigits: pos.currentPrice < 1 ? 6 : 2 })}
                        </span>
                      ) : (
                        <span className="text-[#cbd1e0]">no price</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-[#8888aa]">
                      {pos.currentVal !== null
                        ? `${sym}${(pos.currentVal * mul).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : `${sym}${(pos.totalCostUSD * mul).toLocaleString(undefined, { maximumFractionDigits: 0 })} (cost)`}
                    </td>
                    <td className="px-5 py-3">
                      {pos.unrealized !== null ? (
                        <span className={`font-mono font-bold ${pos.unrealized >= 0 ? "text-[#00d4aa]" : "text-red-400"}`}>
                          {pos.unrealized >= 0 ? "+" : ""}
                          {sym}{(Math.abs(pos.unrealized) * mul).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      ) : (
                        <span className="text-[#cbd1e0] font-mono">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {pos.pct !== null && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          pos.pct >= 0
                            ? "bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/20"
                            : "bg-red-400/10 text-red-400 border border-red-400/20"
                        }`}>
                          {pos.pct >= 0 ? "+" : ""}{pos.pct.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
