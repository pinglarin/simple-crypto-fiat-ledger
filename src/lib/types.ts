export interface Trade {
  date: string;
  pair: string;
  side: "BUY" | "SELL";
  type: string;
  avgPrice: number;
  executed: number;
  executedUnit: string;
  total: number;
  totalUnit: string;
}

export interface WalletToken {
  symbol: string;
  name: string;
  balance: string;
  balanceUSD: number;
  price: number;
  change24h: number;
  contractAddress?: string;
}

export interface EthTransaction {
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  valueUSD: number;
  tokenSymbol: string;
  tokenName: string;
  type: "IN" | "OUT";
  isContract: boolean;
  status: "success" | "failed";
  contractAddress?: string;
}

export interface WalletData {
  address: string;
  ethBalance: string;
  ethBalanceUSD: number;
  tokens: WalletToken[];
  totalUSD: number;
  transactions: EthTransaction[];
}

export interface PriceData {
  [symbol: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export interface ChartDataPoint {
  date: string;
  volume: number;
  cumulative: number;
}
