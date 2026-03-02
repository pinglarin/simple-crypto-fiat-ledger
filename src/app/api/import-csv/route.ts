import { NextRequest, NextResponse } from "next/server";

// Parses a Binance order history CSV and returns normalized trades
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const text = await file.text();
    const lines = text.replace(/^\uFEFF/, "").split("\n").filter(Boolean);
    const headers = parseCsvLine(lines[0]);

    const trades = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => (row[h.trim()] = values[idx]?.trim() ?? ""));

      if (row["Status"] !== "FILLED") continue;

      const executed = parseAmount(row["Executed"] ?? "");
      const total = parseAmount(row["Trading total"] ?? "");

      trades.push({
        date: row["Date(UTC)"],
        pair: row["Pair"],
        side: row["Side"],
        type: row["Type"],
        avgPrice: parseFloat(row["Average Price"] || "0"),
        executed: executed.value,
        executedUnit: executed.unit,
        total: total.value,
        totalUnit: total.unit,
      });
    }

    return NextResponse.json({ trades, count: trades.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

function parseCsvLine(line: string): string[] {
  const results: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === "," && !inQuotes) { results.push(current); current = ""; continue; }
    current += char;
  }
  results.push(current);
  return results;
}

function parseAmount(s: string): { value: number; unit: string } {
  const m = s.match(/^([\d.]+)(.*)$/);
  return m ? { value: parseFloat(m[1]), unit: m[2].trim() } : { value: 0, unit: "" };
}
