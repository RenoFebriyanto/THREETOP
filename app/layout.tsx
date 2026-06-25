import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
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
  title: {
    default: "ThreeTop — Platform Top Up Game Indonesia",
    template: "%s — ThreeTop",
  },
  description: "Top up game favorit kamu dengan harga terbaik. Mobile Legends, Free Fire, PUBG Mobile, Genshin Impact, dan 50+ game lainnya. Proses instan, aman, dan terpercaya.",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  keywords: ["top up game", "diamond ml", "uc pubg", "free fire diamond", "top up murah", "threetop"],
  authors: [{ name: "ThreeTop" }],
  creator: "ThreeTop",
  icons: {
    icon: [
      { url: "/threetop-16x16.png",  sizes: "16x16",  type: "image/png" },
      { url: "/threetop-32x32.png",  sizes: "32x32",  type: "image/png" },
      { url: "/threetop.ico",         rel: "shortcut icon" },
    ],
    apple: "/threetop-apple-touch-icon.png",
    other: [
      { rel: "android-chrome-192x192", url: "/threetop-android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/threetop-android-chrome-512x512.png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: process.env.AUTH_URL ?? "https://threetopofficial.vercel.app",
    siteName: "ThreeTop",
    title: "ThreeTop — Platform Top Up Game Indonesia",
    description: "Top up game favorit kamu dengan harga terbaik. Proses instan, aman, dan terpercaya.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ThreeTop — Platform Top Up Game Indonesia",
    description: "Top up game favorit kamu dengan harga terbaik.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
