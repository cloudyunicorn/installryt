import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InstallRyt — Fake App Detector",
  description:
    "Detect fraudulent and fake apps on the Apple App Store and Google Play Store. Protect yourself before you install.",
  keywords: [
    "fake app detector",
    "app store security",
    "google play scam",
    "app fraud detection",
    "installryt",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable}`}>
        <Header />
        <main style={{ minHeight: "calc(100vh - 160px)" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
