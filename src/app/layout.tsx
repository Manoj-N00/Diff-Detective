import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diff Detective — AI-Powered PR Review",
  description: "Diff Detective reviews pull requests, organizes diffs, and flags potential bugs.",
  icons: {
    icon: "/review-your-prs-logo.png",
    shortcut: "/review-your-prs-logo.png",
    apple: "/review-your-prs-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#141414",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "dark", height: "100%" }}>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
