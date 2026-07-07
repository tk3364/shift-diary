import type { Metadata, Viewport } from "next";
import { Noto_Serif_JP } from "next/font/google";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import "./globals.css";

const mincho = Noto_Serif_JP({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mincho",
});

export const metadata: Metadata = {
  title: "短冊",
  description: "一首と、その解凍のための場所。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="ja" className={mincho.variable}>
      <body>
        <div className="frame">
          <header className="siteHeader">
            <Link href="/" className="mark">
              短冊
            </Link>
            <nav>
              <Link href="/yomu">詠む</Link>
              {user ? <Link href="/nanoru">{user.handle}</Link> : <Link href="/nanoru">名乗る</Link>}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
