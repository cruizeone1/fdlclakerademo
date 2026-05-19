import type { Metadata } from "next";
import "./globals.css";
import { ChatDemo } from "@/components/ChatDemo";

export const metadata: Metadata = {
  title: "Lakera Guard Demo",
  description:
    "Chat demo with OpenAI inference and Lakera Guard prompt injection protection",
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
