import { PriceData, WalletData, EthTransaction } from "./types";
import { formatUnits } from "ethers";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const ETHERSCAN_BASE = "https://api.etherscan.io/api";
const ETHERSCAN_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_KEY || "";

const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SHIB: "shiba-inu",
  USDT: "tether",
  USDC: "usd-coin",
  DAI: "dai",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
  MATIC: "matic-network",
  LDO: "lido-dao",
  MKR: "maker",
  CRV: "curve-dao-token",
  COMP: "compound-governance-token",
  SNX: "havven",
  ENS: "ethereum-name-service",
  SOL: "solana",
  APE: "apecoin",
  SAND: "the-sandbox",
  MANA: "decentraland",
  GRT: "the-graph",
  "1INCH": "1inch",
  SUSHI: "sushi",
  YFI: "yearn-finance",
  BAL: "balancer",
  RPL: "rocket-pool",
  FXS: "frax-share",
  FRAX: "frax",
  STETH: "staked-ether",
  WETH: "weth",
  WBTC: "wrapped-bitcoin",
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

/** Fetch actual ERC-20 token balance for a specific contract */
async function fetchTokenBalance(
  walletAddress: string,
  contractAddress: string
): Promise<string> {
  try {
    const url = `${ETHERSCAN_BASE}?module=account&action=tokenbalance&address=${walletAddress}&contractaddress=${contractAddress}&tag=latest&apikey=${ETHERSCAN_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.status === "1" ? data.result : "0";
  } catch {
    return "0";
  }
}

/** Resolve a CoinGecko coin ID from a contract address */
async function resolveCoingeckoId(contractAddress: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/ethereum/contract/${contractAddress}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

/** Fetch price + 24h change for a list of CoinGecko IDs */
async function fetchPricesByIds(
  ids: string[]
): Promise<Record<string, { usd: number; usd_24h_change: number }>> {
  if (!ids.length) return {};
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 60 } }
    );
    return await res.json();
  } catch {
    return {};
  }
}

export async function fetchWalletData(address: string): Promise<WalletData | null> {
  try {
    const api = (params: string) =>
      `${ETHERSCAN_BASE}?${params}&apikey=${ETHERSCAN_KEY}`;

    // ── Step 1: parallel base fetches ──────────────────────────────────────
    const ethBalanceUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_KEY}`;
    const [ethBalRes, normalTxRes, erc20TxRes, priceRes] = await Promise.all([
      fetch(ethBalanceUrl),
      fetch(api(`module=account&action=txlist&address=${address}&sort=desc&offset=50&page=1`)),
      fetch(api(`module=account&action=tokentx&address=${address}&sort=desc&offset=100&page=1`)),
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
    const ethBalanceWei = ethBalData.status === "1" && ethBalData.result ? ethBalData.result : "0";
    const ethBalance = formatUnits(ethBalanceWei, 18);
    const ethBalanceFixed = parseFloat(ethBalance).toFixed(6);
    const ethBalanceUSD = parseFloat(ethBalance) * ethPrice;

    // ── Step 2: discover all unique ERC-20 tokens from tx history ──────────
    interface TokenMeta {
      symbol: string;
      name: string;
      contractAddress: string;
      decimals: number;
    }
    const tokenMap = new Map<string, TokenMeta>(); // keyed by contractAddress (lower)

    if (erc20TxData.status === "1" && Array.isArray(erc20TxData.result)) {
      for (const tx of erc20TxData.result) {
        const key = tx.contractAddress.toLowerCase();
        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            symbol: tx.tokenSymbol,
            name: tx.tokenName,
            contractAddress: tx.contractAddress,
            decimals: parseInt(tx.tokenDecimal || "18"),
          });
        }
      }
    }

    // ── Step 3: fetch actual balances + resolve CoinGecko IDs in parallel ──
    const tokenEntries = Array.from(tokenMap.values());

    // For known symbols use SYMBOL_TO_ID; for unknowns resolve via contract
    const knownIds = tokenEntries
      .map((t) => SYMBOL_TO_ID[t.symbol.toUpperCase()])
      .filter(Boolean);

    const unknownTokens = tokenEntries.filter(
      (t) => !SYMBOL_TO_ID[t.symbol.toUpperCase()]
    );

    const [tokenBalances, unknownIds, allPrices] = await Promise.all([
      // Actual on-chain balances for each token
      Promise.all(
        tokenEntries.map((t) => fetchTokenBalance(address, t.contractAddress))
      ),
      // CoinGecko ID resolution for unknown tokens (batched, max 5 to avoid rate limits)
      Promise.all(
        unknownTokens.slice(0, 5).map((t) => resolveCoingeckoId(t.contractAddress))
      ),
      // Prices for all known symbols
      fetchPricesByIds(knownIds),
    ]);

    // Map resolved IDs back to unknown tokens and fetch their prices
    const resolvedIdMap = new Map<string, string>(); // contractAddress -> geckoId
    unknownTokens.slice(0, 5).forEach((t, i) => {
      if (unknownIds[i]) resolvedIdMap.set(t.contractAddress.toLowerCase(), unknownIds[i]!);
    });

    const resolvedGeckoIds = Array.from(resolvedIdMap.values());
    const resolvedPrices = resolvedGeckoIds.length
      ? await fetchPricesByIds(resolvedGeckoIds)
      : {};

    // ── Step 4: build token holdings list (exclude zero-balance tokens) ────
    const tokens: WalletData["tokens"] = [];

    // ETH first
    tokens.push({
      symbol: "ETH",
      name: "Ethereum",
      balance: ethBalanceFixed,
      balanceUSD: ethBalanceUSD,
      price: ethPrice,
      change24h: ethChange,
    });

    tokenEntries.forEach((token, i) => {
      const rawBalance = tokenBalances[i] ?? "0";
      const balance = Number(BigInt(rawBalance)) / Math.pow(10, token.decimals);

      // Skip dust / zero balances
      if (balance === 0) return;

      // Resolve price
      const knownId = SYMBOL_TO_ID[token.symbol.toUpperCase()];
      const resolvedId = resolvedIdMap.get(token.contractAddress.toLowerCase());
      const geckoId = knownId || resolvedId;
      const priceEntry = geckoId
        ? (allPrices[geckoId] ?? resolvedPrices[geckoId] ?? null)
        : null;

      const price = priceEntry?.usd ?? 0;
      const change24h = priceEntry?.usd_24h_change ?? 0;
      const balanceUSD = balance * price;

      tokens.push({
        symbol: token.symbol,
        name: token.name,
        balance: balance < 0.0001 ? balance.toExponential(2) : balance.toLocaleString("en-US", { maximumFractionDigits: 4 }),
        balanceUSD,
        price,
        change24h,
        contractAddress: token.contractAddress,
      });
    });

    // Sort tokens by USD value descending (ETH stays first if it's highest)
    tokens.sort((a, b) => b.balanceUSD - a.balanceUSD);

    // ── Step 5: normalize transactions ────────────────────────────────────
    const normalTxs: EthTransaction[] = [];
    if (normalTxData.status === "1" && Array.isArray(normalTxData.result)) {
      for (const tx of normalTxData.result.slice(0, 30)) {
        const valueEth = Number(BigInt(tx.value || "0")) / 1e18;
        if (valueEth === 0 && tx.input === "0x") continue;
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

    const erc20Txs: EthTransaction[] = [];
    if (erc20TxData.status === "1" && Array.isArray(erc20TxData.result)) {
      for (const tx of erc20TxData.result.slice(0, 30)) {
        const decimals = parseInt(tx.tokenDecimal || "18");
        const value = Number(BigInt(tx.value || "0")) / Math.pow(10, decimals);

        // Use already-fetched price if available
        const knownId = SYMBOL_TO_ID[tx.tokenSymbol.toUpperCase()];
        const resolvedId = resolvedIdMap.get(tx.contractAddress.toLowerCase());
        const geckoId = knownId || resolvedId;
        const priceEntry = geckoId ? (allPrices[geckoId] ?? resolvedPrices[geckoId] ?? null) : null;
        const tokenPrice = priceEntry?.usd ?? 0;

        erc20Txs.push({
          hash: tx.hash,
          timestamp: parseInt(tx.timeStamp) * 1000,
          from: tx.from,
          to: tx.to,
          value: value.toFixed(4),
          valueUSD: value * tokenPrice,
          tokenSymbol: tx.tokenSymbol,
          tokenName: tx.tokenName,
          type: tx.from.toLowerCase() === address.toLowerCase() ? "OUT" : "IN",
          isContract: false,
          status: "success",
          contractAddress: tx.contractAddress,
        });
      }
    }

    const allTxs = [...normalTxs, ...erc20Txs].sort((a, b) => b.timestamp - a.timestamp);

    const totalUSD = tokens.reduce((sum, t) => sum + t.balanceUSD, 0);

    return {
      address,
      ethBalance,
      ethBalanceUSD,
      tokens,
      totalUSD,
      transactions: allTxs,
    };
  } catch (e) {
    console.error("fetchWalletData error:", e);
    return null;
  }
}