import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const GA_ID = "G-RFPJC4XCZK";

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentZero",
  description: "AI agent automation platform",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AgentZero",
  },
  formatDetection: {
    telephone: false,
  },
};

// ─── Session Provider wrapper ─────────────────────────────────────────────────
// Async component wrapped in Suspense — does not block page render (PPR).

async function SessionWrapper({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <SessionProvider session={session}>
      <TooltipProvider>{children}</TooltipProvider>
    </SessionProvider>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
// Synchronous — renders immediately. SessionWrapper loads asynchronously inside
// Suspense, allowing the HTML shell to render before the auth fetch completes.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <Suspense>
          <SessionWrapper>{children}</SessionWrapper>
        </Suspense>
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');`}
        </Script>
      </body>
    </html>
  );
}
