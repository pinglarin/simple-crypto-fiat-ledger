import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "crypto-fiat-ledger",
  description: "Personal crypto ↔ fiat portfolio tracker — CEX trades + MetaMask wallet in one view",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
