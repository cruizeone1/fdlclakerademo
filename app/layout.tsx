import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lakera Guard Demo",
    template: "%s | Lakera Guard Demo",
  },
  description:
    "Live demo of OpenAI chat protected by Lakera Guard prompt injection detection.",
  openGraph: {
    title: "Lakera Guard + OpenAI Demo",
    description:
      "Try prompt injection protection with Lakera Guard before OpenAI inference.",
    url: siteUrl,
    siteName: "Lakera Guard Demo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lakera Guard + OpenAI Demo",
    description:
      "Interactive demo: Lakera Guard screens prompts before OpenAI is called.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
