# crypto-fiat-ledger

A personal portfolio tracker that unifies Binance CEX trading history with on-chain MetaMask wallet data — all denominated in fiat (USD).

Built because Binance's own UI makes it annoyingly hard to answer "how much have I actually made/lost in dollars?" and doesn't show your self-custodied wallet alongside your exchange positions.

![Dashboard preview](docs/preview.png)

## Features

- **Live fiat conversion** — CoinGecko API for real-time + historical USD prices (BTC, ETH, BNB, SHIB, and leveraged pairs)
- **MetaMask wallet connect** — `ethers.js` wallet connection shows on-chain ETH balance + ERC-20 token history
- **P&L calculation** — realized P&L via FIFO matching (sell volume − cost basis)
- **Monthly volume chart** — recharts area chart with per-month and cumulative trade volume
- **Asset breakdown** — pie chart of volume distribution across traded pairs
- **Paginated trade table** — filterable by BUY/SELL and searchable by pair
- **Drag-and-drop CSV import** — add new Binance exports without restarting
- **Zero backend** — runs entirely client-side + Next.js API routes; no database needed

## Stack

| Layer         | Tech                    |
| ------------- | ----------------------- |
| Framework     | Next.js 14 (App Router) |
| Language      | TypeScript              |
| Styling       | Tailwind CSS            |
| Charts        | Recharts                |
| Web3          | ethers.js v6            |
| CSV parsing   | Custom parser (no deps) |
| Price data    | CoinGecko free API      |
| On-chain data | Etherscan public API    |
| Deployment    | Vercel (one-click)      |

## Getting Started

```bash
git clone https://github.com/yourusername/crypto-fiat-ledger
cd crypto-fiat-ledger
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data format

The app expects Binance's standard order export format:

```
Date(UTC), OrderNo, Pair, Type, Side, Order Price, Order Amount, Time, Executed, Average Price, Trading total, Status
```

Only `FILLED` orders are included in calculations. Cancelled and open orders are ignored.

## Caveats

- P&L is a rough approximation (total sell value − total buy value in USDT), not tax-grade FIFO accounting
- Leveraged tokens (BTCUP, BTCDOWN, BNBUP) are included in volume but excluded from price lookups
- CoinGecko free tier is rate-limited; prices refresh every 60 seconds

## License

MIT — personal use, fork freely.
