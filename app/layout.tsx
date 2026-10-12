import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "WhatsApp • Made by Shamshad Khan",
  description:
    "WhatsApp Web & Desktop - End-to-end encrypted messaging, Meta AI Assistant, and calls. Made by Shamshad Khan.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111b21",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full min-h-[100dvh] antialiased dark`}
    >
      <body className="h-full min-h-[100dvh] w-full bg-[#111b21] text-[#e9edef] flex flex-col overflow-hidden">
        {children}
      </body>
    </html>
  );
}
