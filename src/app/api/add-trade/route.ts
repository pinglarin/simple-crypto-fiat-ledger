import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store — in production you'd use a DB or append to a JSON file
// For local personal use, we write to a newline-delimited log that the app can reload
// The Apple Shortcut POSTs to this endpoint after each Binance trade

/**
 * Expected JSON body from the Apple Shortcut:
 * {
 *   "date": "2024-03-15 14:22:00",   // UTC datetime string
 *   "pair": "BTCUSDT",
 *   "side": "BUY",                   // or "SELL"
 *   "type": "Limit",                 // or "Market"
 *   "avgPrice": 71200.50,
 *   "executed": 0.00140,
 *   "executedUnit": "BTC",
 *   "total": 99.68,
 *   "totalUnit": "USDT",
 *   "secret": "ledger-local-2024"    // simple shared secret to prevent random POSTs
 * }
 */

const SHARED_SECRET = process.env.SHORTCUT_SECRET ?? "ledger-local-2024";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Auth check
    if (body.secret !== SHARED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    const required = ["date", "pair", "side", "avgPrice", "executed", "executedUnit", "total", "totalUnit"];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    if (!["BUY", "SELL"].includes(body.side)) {
      return NextResponse.json({ error: "side must be BUY or SELL" }, { status: 400 });
    }

    const trade = {
      date: String(body.date),
      pair: String(body.pair).toUpperCase(),
      side: body.side as "BUY" | "SELL",
      type: String(body.type ?? "Market"),
      avgPrice: Number(body.avgPrice),
      executed: Number(body.executed),
      executedUnit: String(body.executedUnit).toUpperCase(),
      total: Number(body.total),
      totalUnit: String(body.totalUnit).toUpperCase(),
    };

    // In a real deployment, you'd persist this (append to JSON file, write to DB, etc.)
    // For now we return it so the Shortcut can confirm receipt and the UI can append it
    console.log("[add-trade]", JSON.stringify(trade));

    return NextResponse.json({
      ok: true,
      trade,
      message: `Trade recorded: ${trade.side} ${trade.executed} ${trade.executedUnit} @ ${trade.avgPrice}`,
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "POST /api/add-trade",
    description: "Accepts Binance trade records from Apple Shortcuts",
    required_fields: ["date", "pair", "side", "avgPrice", "executed", "executedUnit", "total", "totalUnit", "secret"],
    secret_env_var: "SHORTCUT_SECRET",
  });
}
