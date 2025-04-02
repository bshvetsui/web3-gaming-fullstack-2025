import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Web3 Gaming Platform',
  description: 'Multi-chain gaming platform with NFT integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
