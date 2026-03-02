"use client";

import React from "react";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  assetVolume: Record<string, number>;
}

const COLORS = ["#f7931a", "#00d4aa", "#ff4d6a", "#a78bfa", "#60a5fa", "#fbbf24", "#34d399", "#fb923c"];

export default function AssetBreakdown({ assetVolume }: Props) {
  const data = Object.entries(assetVolume)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card p-6 animate-slide-up" style={{ animationDelay: "250ms", opacity: 0 }}>
      <h2 className="font-display text-sm font-bold text-[#e8e8f0] tracking-wide uppercase mb-5">
        Asset Breakdown
      </h2>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              strokeWidth={0}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 11, fontFamily: "JetBrains Mono" }}
              formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="font-mono text-xs text-[#8888aa]">{d.name}</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs text-[#e8e8f0]">
                  {((d.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
