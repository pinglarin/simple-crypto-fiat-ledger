"use client";

import React from "react";

import { useState } from "react";

export default function ShortcutPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"setup" | "test">("setup");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const endpoint = `${baseUrl}/api/add-trade`;
  const secret = "ledger-local-2024";

  const examplePayload = JSON.stringify({
    date: new Date().toISOString().slice(0, 19).replace("T", " "),
    pair: "BTCUSDT",
    side: "BUY",
    type: "Market",
    avgPrice: 71200.50,
    executed: 0.0014,
    executedUnit: "BTC",
    total: 99.68,
    totalUnit: "USDT",
    secret,
  }, null, 2);

  async function sendTestTrade() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/add-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 19).replace("T", " "),
          pair: "BTCUSDT",
          side: "BUY",
          type: "Market",
          avgPrice: 71200.50,
          executed: 0.0014,
          executedUnit: "BTC",
          total: 99.68,
          totalUnit: "USDT",
          secret,
        }),
      });
      const data = await res.json();
      setTestResult(data.ok ? `✓ ${data.message}` : `✗ ${data.error}`);
    } catch {
      setTestResult("✗ Request failed — is the server running?");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="card animate-slide-up" style={{ animationDelay: "500ms", opacity: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1e1e2e] rounded-lg flex items-center justify-center text-base">
            🍎
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-[#e8e8f0] tracking-wide uppercase">
              Apple Shortcut Setup
            </h2>
            <p className="text-[#cbd1e0] font-mono text-xs mt-0.5">
              Log trades from iPhone after each Binance fill
            </p>
          </div>
        </div>
        <span className="text-[#cbd1e0] font-mono text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-[#1e1e2e] p-5">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-[#0a0a0f] p-1 rounded-lg">
            {(["setup", "test"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-mono rounded transition-all capitalize ${
                  tab === t ? "bg-[#1e1e2e] text-[#e8e8f0]" : "text-[#cbd1e0] hover:text-[#8888aa]"
                }`}>
                {t === "setup" ? "Setup Guide" : "Test Endpoint"}
              </button>
            ))}
          </div>

          {tab === "setup" && (
            <div className="space-y-5">
              {/* Endpoint */}
              <div>
                <p className="text-[#cbd1e0] font-mono text-[10px] uppercase tracking-wider mb-2">API Endpoint</p>
                <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <code className="text-[#f7931a] font-mono text-xs break-all">{endpoint}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(endpoint)}
                    className="text-[#cbd1e0] hover:text-[#e8e8f0] text-xs font-mono flex-shrink-0 transition-colors"
                  >
                    copy
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                <p className="text-[#cbd1e0] font-mono text-[10px] uppercase tracking-wider">Shortcut Steps</p>

                {[
                  {
                    n: "1",
                    title: "Open Shortcuts app → tap +",
                    body: 'Name it "Log Binance Trade". Add a trigger: you can run it manually, or set an automation when you open the Binance app.',
                  },
                  {
                    n: "2",
                    title: "Add 'Ask for Input' actions",
                    body: 'Add one "Ask for Input" action per field. Prompt text and variable name for each:\n• "Pair (e.g. BTCUSDT)" → pair\n• "Side (BUY or SELL)" → side\n• "Avg Price" → avgPrice  (Number type)\n• "Amount executed" → executed  (Number)\n• "Executed unit (e.g. BTC)" → executedUnit\n• "Total spent" → total  (Number)\n• "Total unit (e.g. USDT)" → totalUnit',
                  },
                  {
                    n: "3",
                    title: "Add 'Get Current Date' action",
                    body: 'Format the result as "yyyy-MM-dd HH:mm:ss" and save to variable: date',
                  },
                  {
                    n: "4",
                    title: "Add 'Get Contents of URL' action",
                    body: `URL: ${endpoint}\nMethod: POST\nHeaders: Content-Type → application/json\nBody (JSON):\n{\n  "date": [date variable],\n  "pair": [pair variable],\n  "side": [side variable],\n  "type": "Market",\n  "avgPrice": [avgPrice variable],\n  "executed": [executed variable],\n  "executedUnit": [executedUnit variable],\n  "total": [total variable],\n  "totalUnit": [totalUnit variable],\n  "secret": "${secret}"\n}`,
                    isCode: true,
                  },
                  {
                    n: "5",
                    title: "Add 'Show Notification' action",
                    body: 'Set the text to the result from the previous step. You will see "✓ Trade recorded: BUY 0.0014 BTC @ 71200.5" as confirmation.',
                  },
                ].map((step) => (
                  <div key={step.n} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#f7931a] flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-black font-mono mt-0.5">
                      {step.n}
                    </div>
                    <div className="flex-1">
                      <p className="text-[#e8e8f0] font-mono text-xs font-bold mb-1">{step.title}</p>
                      {step.isCode ? (
                        <pre className="text-[#8888aa] font-mono text-[10px] bg-[#0a0a0f] border border-[#1e1e2e] rounded p-2 whitespace-pre-wrap leading-relaxed">
                          {step.body}
                        </pre>
                      ) : (
                        <p className="text-[#8888aa] font-mono text-[10px] leading-relaxed whitespace-pre-line">{step.body}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payload reference */}
              <div>
                <p className="text-[#cbd1e0] font-mono text-[10px] uppercase tracking-wider mb-2">Full JSON Payload Reference</p>
                <pre className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-3 text-[10px] font-mono text-[#8888aa] overflow-x-auto">
                  {examplePayload}
                </pre>
              </div>

              <div className="bg-[#f7931a11] border border-[#f7931a33] rounded-lg px-3 py-2.5">
                <p className="text-[#f7931a] font-mono text-[10px] leading-relaxed">
                  <span className="font-bold">Note:</span> Your app must be running and reachable from your iPhone. On local dev,
                  use a tool like <span className="text-[#e8e8f0]">ngrok</span> to expose localhost.
                  In production, deploy to Vercel and use your{" "}
                  <span className="text-[#e8e8f0]">*.vercel.app</span> URL instead.
                </p>
              </div>
            </div>
          )}

          {tab === "test" && (
            <div className="space-y-4">
              <p className="text-[#cbd1e0] font-mono text-xs">
                Sends a sample BUY 0.0014 BTC @ $71,200 trade to the endpoint to verify it is working.
              </p>
              <pre className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-3 text-[10px] font-mono text-[#8888aa] overflow-x-auto">
                {examplePayload}
              </pre>
              <button
                onClick={sendTestTrade}
                disabled={testing}
                className="btn-primary w-full"
              >
                {testing ? "Sending…" : "Send Test Trade →"}
              </button>
              {testResult && (
                <p className={`font-mono text-xs px-3 py-2 rounded border ${
                  testResult.startsWith("✓")
                    ? "text-[#00d4aa] bg-[#00d4aa]/10 border-[#00d4aa]/20"
                    : "text-red-400 bg-red-400/10 border-red-400/20"
                }`}>
                  {testResult}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
