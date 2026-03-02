import { Trade, ChartDataPoint } from "./types";

// Historical approximate USD prices for non-USDT quote assets
const BNB_USD: Record<string, number> = {
  "2020-12": 30,  "2021-01": 40,  "2021-02": 100, "2021-03": 220,
  "2021-04": 500, "2021-05": 340, "2021-06": 300, "2021-07": 300,
  "2021-08": 350, "2021-09": 370, "2021-10": 450, "2021-11": 600,
  "2021-12": 600, "2022-01": 450, "2022-02": 400, "2022-03": 380,
  "2022-04": 400, "2022-05": 280, "2022-06": 200,
};
const BTC_USD: Record<string, number> = {
  "2020-12": 24000, "2021-01": 35000, "2021-02": 45000, "2021-03": 55000,
  "2021-04": 55000, "2021-05": 40000, "2021-06": 32000, "2021-07": 34000,
  "2021-08": 45000, "2021-09": 43000, "2021-10": 55000, "2021-11": 60000,
  "2021-12": 47000, "2022-01": 38000, "2022-02": 38000, "2022-03": 44000,
};

function toUSD(total: number, unit: string, month: string): number {
  if (unit === "USDT" || unit === "USDC" || unit === "BUSD") return total;
  if (unit === "BNB") return total * (BNB_USD[month] ?? 300);
  if (unit === "BTC") return total * (BTC_USD[month] ?? 40000);
  return total;
}

export interface OpenPosition {
  asset: string;
  qty: number;
  avgCostUSD: number;
  totalCostUSD: number;
}

export function computeStats(trades: Trade[]) {
  const filled = trades.filter((t) => t.total > 0);
  const buys = filled.filter((t) => t.side === "BUY");
  const sells = filled.filter((t) => t.side === "SELL");

  const totalBuyVolume = buys.reduce((s, t) => s + toUSD(t.total, t.totalUnit, t.date.slice(0, 7)), 0);
  const totalSellVolume = sells.reduce((s, t) => s + toUSD(t.total, t.totalUnit, t.date.slice(0, 7)), 0);
  const totalVolume = filled.reduce((s, t) => s + toUSD(t.total, t.totalUnit, t.date.slice(0, 7)), 0);
  const pairs = [...new Set(filled.map((t) => t.pair))];

  // FIFO realized P&L per month + track remaining cost basis
  const costBasis: Record<string, Array<[number, number]>> = {};
  const monthlyPnL: Record<string, number> = {};

  for (const t of [...filled].sort((a, b) => a.date.localeCompare(b.date))) {
    const month = t.date.slice(0, 7);
    const base = t.executedUnit;
    const qty = t.executed;
    const totalUSD = toUSD(t.total, t.totalUnit, month);
    const pricePerUnit = qty > 0 ? totalUSD / qty : 0;

    if (t.side === "BUY") {
      if (!costBasis[base]) costBasis[base] = [];
      costBasis[base].push([qty, pricePerUnit]);
    } else {
      if (!costBasis[base]) costBasis[base] = [];
      let remaining = qty;
      let cost = 0;
      while (remaining > 0 && costBasis[base].length > 0) {
        const [lotQty, lotPrice] = costBasis[base][0];
        const take = Math.min(remaining, lotQty);
        cost += take * lotPrice;
        remaining -= take;
        if (take >= lotQty) costBasis[base].shift();
        else costBasis[base][0] = [lotQty - take, lotPrice];
      }
      const realized = totalUSD - cost;
      monthlyPnL[month] = (monthlyPnL[month] ?? 0) + realized;
    }
  }

  const realizedPnL = Object.values(monthlyPnL).reduce((s, v) => s + v, 0);

  // Open positions — remaining lots after all sells (exclude stables & dust)
  const STABLES = new Set(["USDT", "USDC", "BUSD", "DAI", "BTCUP", "BTCDOWN", "BNBUP", "ETHUP", "ADAUP"]);
  const openPositions: OpenPosition[] = [];
  for (const [asset, lots] of Object.entries(costBasis)) {
    if (STABLES.has(asset)) continue;
    const totalQty = lots.reduce((s, [q]) => s + q, 0);
    const totalCost = lots.reduce((s, [q, p]) => s + q * p, 0);
    const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
    if (totalQty > 0.000001 && totalCost > 1) {
      openPositions.push({ asset, qty: totalQty, avgCostUSD: avgCost, totalCostUSD: totalCost });
    }
  }
  openPositions.sort((a, b) => b.totalCostUSD - a.totalCostUSD);
  const totalCostBasis = openPositions.reduce((s, p) => s + p.totalCostUSD, 0);

  // Generate all months first trade → today
  const firstDate = filled[0]?.date?.slice(0, 7) ?? "2020-01";
  const today = new Date();
  const allMonths: string[] = [];
  const cursor = new Date(`${firstDate}-01T00:00:00Z`);
  while (cursor <= today) {
    allMonths.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  let cumulative = 0;
  const chartData: ChartDataPoint[] = allMonths.map((date) => {
    const pnl = monthlyPnL[date] ?? 0;
    cumulative += pnl;
    return { date, volume: Math.round(pnl), cumulative: Math.round(cumulative) };
  });

  const assetVolume: Record<string, number> = {};
  for (const t of filled) {
    const base = t.pair.replace(/(USDT|USDC|BUSD|BNB|BTC)$/, "");
    const usd = toUSD(t.total, t.totalUnit, t.date.slice(0, 7));
    assetVolume[base] = (assetVolume[base] ?? 0) + usd;
  }

  return {
    totalTrades: filled.length,
    totalBuys: buys.length,
    totalSells: sells.length,
    totalVolume,
    totalBuyVolume,
    totalSellVolume,
    realizedPnL,
    openPositions,
    totalCostBasis,
    pairs,
    chartData,
    assetVolume,
    dateRange: {
      from: filled[0]?.date?.slice(0, 10) ?? "—",
      to: filled[filled.length - 1]?.date?.slice(0, 10) ?? "—",
    },
  };
}

export function fmt(n: number, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

export function fmtTHB(n: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency", currency: "THB",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

export const USD_TO_THB = 33.5;

export function fmtCurrency(n: number, currency: "USD" | "THB") {
  return currency === "THB" ? fmtTHB(n * USD_TO_THB) : fmtUSD(n);
}

export function fmtCurrencyShort(n: number, currency: "USD" | "THB") {
  if (currency === "THB") {
    const thb = n * USD_TO_THB;
    return `฿${thb >= 1000 ? (thb / 1000).toFixed(1) + "k" : thb.toFixed(0)}`;
  }
  return `$${n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toFixed(0)}`;
}

export function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function parsePair(pair: string): { from: string; to: string } {
  const quoteAssets = ["USDT", "USDC", "BUSD", "BTC", "ETH", "BNB"];
  for (const q of quoteAssets) {
    if (pair.endsWith(q) && pair.length > q.length) {
      return { from: pair.slice(0, pair.length - q.length), to: q };
    }
  }
  return { from: pair, to: "?" };
}
