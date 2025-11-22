import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Albion Enchanting",
  description: "Tool zur Berechnung von Enchant-Profitabilität",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="site-header" style={{ padding: '1rem', borderBottom: '1px solid var(--cp-overlay2)' }}>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/">Dashboard</Link>
            <Link href="/discovery">Discovery</Link>
            <Link href="/calculate">Calculate</Link>
            <Link href="/my-enchants">My Enchants</Link>
            <Link href="/prices">Prices</Link>
          </nav>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
