
import { PriceData, WalletData, EthTransaction } from "./types";
import { formatUnits } from "ethers";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const ETHERSCAN_BASE = "https://api.etherscan.io/api";
const ETHERSCAN_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_KEY || ""; // Set your Etherscan key in .env.local

const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SHIB: "shiba-inu",
};

export async function fetchPrices(symbols: string[]): Promise<PriceData> {
  const ids = Array.from(new Set(symbols.map((s) => SYMBOL_TO_ID[s]).filter(Boolean)));
  if (!ids.length) return {};
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 60 } }
    );
    const raw = await res.json();
    const out: PriceData = {};
    for (const [sym, id] of Object.entries(SYMBOL_TO_ID)) {
      if (raw[id]) {
        out[sym] = { usd: raw[id].usd, usd_24h_change: raw[id].usd_24h_change ?? 0 };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export async function fetchWalletData(address: string): Promise<WalletData | null> {
  try {
    const api = (params: string) =>
      `${ETHERSCAN_BASE}?${params}&apikey=${ETHERSCAN_KEY}`;

    // Parallel: ETH balance + normal txs + ERC-20 txs + ETH price

    // Use Etherscan API v2 for ETH balance
    const ethBalanceUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_KEY}`;
    const [ethBalRes, normalTxRes, erc20TxRes, priceRes] = await Promise.all([
      fetch(ethBalanceUrl),
      fetch(api(`module=account&action=txlist&address=${address}&sort=desc&offset=50&page=1`)),
      fetch(api(`module=account&action=tokentx&address=${address}&sort=desc&offset=50&page=1`)),
      fetch(`${COINGECKO_BASE}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true`),
    ]);

    const [ethBalData, normalTxData, erc20TxData, priceData] = await Promise.all([
      ethBalRes.json(),
      normalTxRes.json(),
      erc20TxRes.json(),
      priceRes.json(),
    ]);

    const ethPrice = priceData.ethereum?.usd ?? 0;
    const ethChange = priceData.ethereum?.usd_24h_change ?? 0;
    // Etherscan v2 returns { status, message, result: "<balance>" }
    const ethBalanceWei = ethBalData.status === "1" && ethBalData.result ? ethBalData.result : "0";
    // Use ethers.js for precise conversion
    const ethBalance = formatUnits(ethBalanceWei, 18);
    const ethBalanceFixed = parseFloat(ethBalance).toFixed(6);
    const ethBalanceUSD = parseFloat(ethBalance) * ethPrice;
    // Normalize normal ETH transactions
    const normalTxs: EthTransaction[] = [];
    if (normalTxData.status === "1" && Array.isArray(normalTxData.result)) {
      for (const tx of normalTxData.result.slice(0, 30)) {
        const valueEth = Number(BigInt(tx.value || "0")) / 1e18;
        if (valueEth === 0 && tx.input === "0x") continue; // skip zero-value non-contract calls
        normalTxs.push({
          hash: tx.hash,
          timestamp: parseInt(tx.timeStamp) * 1000,
          from: tx.from,
          to: tx.to,
          value: valueEth.toFixed(6),
          valueUSD: valueEth * ethPrice,
          tokenSymbol: "ETH",
          tokenName: "Ethereum",
          type: tx.from.toLowerCase() === address.toLowerCase() ? "OUT" : "IN",
          isContract: tx.input !== "0x",
          status: tx.isError === "0" ? "success" : "failed",
        });
      }
    }

    // Normalize ERC-20 token transactions
    const erc20Txs: EthTransaction[] = [];
    if (erc20TxData.status === "1" && Array.isArray(erc20TxData.result)) {
      for (const tx of erc20TxData.result.slice(0, 30)) {
        const decimals = parseInt(tx.tokenDecimal || "18");
        const value = Number(BigInt(tx.value || "0")) / Math.pow(10, decimals);
        erc20Txs.push({
          hash: tx.hash,
          timestamp: parseInt(tx.timeStamp) * 1000,
          from: tx.from,
          to: tx.to,
          value: value.toFixed(4),
          valueUSD: 0, // would need token price lookup
          tokenSymbol: tx.tokenSymbol,
          tokenName: tx.tokenName,
          type: tx.from.toLowerCase() === address.toLowerCase() ? "OUT" : "IN",
          isContract: false,
          status: "success",
          contractAddress: tx.contractAddress,
        });
      }
    }

    // Merge and sort all transactions by time desc
    const allTxs = [...normalTxs, ...erc20Txs].sort((a, b) => b.timestamp - a.timestamp);

    // Token holdings: unique tokens seen
    const seen = new Set<string>(["ETH"]);
    const tokens: WalletData["tokens"] = [{
      symbol: "ETH", name: "Ethereum",
      balance: ethBalanceFixed, balanceUSD: ethBalanceUSD,
      price: ethPrice, change24h: ethChange,
    }];
    for (const tx of erc20TxData.status === "1" ? erc20TxData.result : []) {
      if (seen.has(tx.tokenSymbol)) continue;
      seen.add(tx.tokenSymbol);
      tokens.push({
        symbol: tx.tokenSymbol, name: tx.tokenName,
        balance: "—", balanceUSD: 0, price: 0, change24h: 0,
        contractAddress: tx.contractAddress,
      });
      if (tokens.length >= 6) break;
    }

    return {
      address,
      ethBalance,
      ethBalanceUSD,
      tokens,
      totalUSD: ethBalanceUSD,
      transactions: allTxs,
    };
  } catch (e) {
    console.error("fetchWalletData error:", e);
    return null;
  }
}
