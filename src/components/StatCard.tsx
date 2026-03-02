"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  positive?: boolean;
  negative?: boolean;
  delay?: number;
}

export default function StatCard({ label, value, sub, accent, positive, negative, delay = 0 }: StatCardProps) {
  const valueColor = positive
    ? "text-green-400"
    : negative
    ? "text-red-400"
    : accent
    ? "text-[#f7931a]"
    : "text-[#e8e8f0]";

  return (
    <div
      className="card p-5 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <p className="text-[#8888aa] text-xs uppercase tracking-widest font-mono mb-2">{label}</p>
      <p className={`font-display text-2xl font-bold ${valueColor} leading-tight`}>{value}</p>
      {sub && <p className="text-[#4a4a6a] text-xs font-mono mt-1">{sub}</p>}
    </div>
  );
}
