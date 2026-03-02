import { NextRequest, NextResponse } from "next/server";
import { fetchPrices } from "@/lib/prices";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",") ?? ["BTC", "ETH"];
  const data = await fetchPrices(symbols);
  return NextResponse.json(data);
}
