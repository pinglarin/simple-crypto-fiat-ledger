import { fetchWalletData } from "@/lib/prices";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") ?? "";
  if (!address) return Response.json({ error: "No address" }, { status: 400 });

  const data = await fetchWalletData(address);
  if (!data) return Response.json({ error: "Failed to fetch wallet" }, { status: 500 });

  return Response.json(data);
}