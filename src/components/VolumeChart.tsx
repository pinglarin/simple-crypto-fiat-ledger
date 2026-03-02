"use client";

import React from "react";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { ChartDataPoint } from "@/lib/types";
import { USD_TO_THB } from "@/lib/utils";

interface Props {
  data: ChartDataPoint[];
  currency: "USD" | "THB";
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  const mul = currency === "THB" ? USD_TO_THB : 1;
  const sym = currency === "THB" ? "฿" : "$";
  const monthly = (payload[0]?.value ?? 0) * mul;
  const cumulative = (payload[1]?.value ?? 0) * mul;
  const fmtN = (n: number) =>
    `${n >= 0 ? "+" : ""}${sym}${Math.abs(n) >= 1000 ? (Math.abs(n) / 1000).toFixed(1) + "k" : Math.abs(n).toFixed(0)}`;

  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-3 text-xs font-mono shadow-xl">
      <p className="text-[#8888aa] mb-1.5">{label}</p>
      <p className={monthly >= 0 ? "text-[#00d4aa]" : "text-red-400"}>
        Monthly P&L: {fmtN(monthly)}
      </p>
      <p className={cumulative >= 0 ? "text-[#f7931a]" : "text-red-400"}>
        Running total: {fmtN(cumulative)}
      </p>
    </div>
  );
};

export default function VolumeChart({ data, currency }: Props) {
  const mul = currency === "THB" ? USD_TO_THB : 1;
  const sym = currency === "THB" ? "฿" : "$";

  const scaled = data.map((d) => ({
    ...d,
    volume: Math.round(d.volume * mul),
    cumulative: Math.round(d.cumulative * mul),
  }));

  const totalPnL = scaled[scaled.length - 1]?.cumulative ?? 0;
  const tickEvery = Math.max(1, Math.floor(data.length / 10));

  const fmtAxis = (v: number) => {
    if (Math.abs(v) >= 1000) return `${sym}${(v / 1000).toFixed(0)}k`;
    return `${sym}${v}`;
  };

  return (
    <div className="card p-6 animate-slide-up" style={{ animationDelay: "200ms", opacity: 0 }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-sm font-bold text-[#e8e8f0] tracking-wide uppercase">
            Realized P&L
          </h2>
          <p className="text-[#4a4a6a] font-mono text-xs mt-0.5">
            FIFO cost basis · {data[0]?.date ?? "—"} → today
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[#4a4a6a] font-mono text-[10px] uppercase tracking-wider">Total</p>
            <p className={`font-display text-lg font-bold ${totalPnL >= 0 ? "text-[#00d4aa]" : "text-red-400"}`}>
              {totalPnL >= 0 ? "+" : ""}{sym}{Math.abs(totalPnL).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] font-mono text-[#4a4a6a] mb-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#00d4aa]" /> Profit month
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> Loss month
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 border-t-2 border-dashed border-[#f7931a]" /> Running P&L
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={scaled} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="lineGradPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7931a" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#f7931a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <ReferenceLine y={0} stroke="#4a4a6a" strokeWidth={1} strokeDasharray="0" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#4a4a6a", fontSize: 9, fontFamily: "JetBrains Mono" }}
            tickFormatter={(v, i) => (i % tickEvery === 0 ? v.slice(2) : "")}
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#4a4a6a", fontSize: 9, fontFamily: "JetBrains Mono" }}
            tickFormatter={fmtAxis}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Bar dataKey="volume" radius={[2, 2, 0, 0]} maxBarSize={18}>
            {scaled.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.volume >= 0 ? "#00d4aa" : "#ff4d6a"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#f7931a"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 3"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
