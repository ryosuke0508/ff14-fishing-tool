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
  title: "ヌシ釣りツール（仮）",
  description: "FF14のヌシ釣りに関する情報をまとめるツールです。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 bg-sky-500 shadow-md">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              ヌシ釣りツール（仮）
            </h1>
            <nav className="flex gap-4 text-sm font-medium text-white sm:text-base">
              <Link href="/" className="hover:underline">
                トップ
              </Link>
              <Link href="/fish" className="hover:underline">
                魚一覧
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
