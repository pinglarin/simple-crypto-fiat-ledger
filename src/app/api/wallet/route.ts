import { NextRequest, NextResponse } from "next/server";
import { fetchWalletData } from "@/lib/prices";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return NextResponse.json({ error: "Missing address" }, { status: 400 });
  const data = await fetchWalletData(address);
  if (!data) return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 });
  return NextResponse.json(data);
}
