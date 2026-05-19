import type { Metadata } from "next";
import { ChatDemo } from "@/components/ChatDemo";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Interactive Demo",
  description:
    "Try Lakera Guard prompt injection protection with OpenAI — test safe and malicious prompts live.",
};

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <header className="header">
          <div className="header-badge">Interactive demo</div>
          <h1>Lakera Guard + OpenAI Chat</h1>
          <p>
            Enter a prompt to see Lakera Guard screen it for prompt injection before any
            request reaches OpenAI. Flagged prompts are blocked server-side.
          </p>
        </header>
        <ChatDemo />
      </main>
      <SiteFooter />
    </>
  );
}
