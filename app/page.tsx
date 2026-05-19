import { ChatDemo } from "@/components/ChatDemo";

export default function HomePage() {
  return (
    <main className="page">
      <header className="header">
        <div className="header-badge">Security Demo</div>
        <h1>Lakera Guard + OpenAI Chat</h1>
        <p>
          Enter a prompt to see Lakera Guard screen it for prompt injection before
          any request reaches OpenAI. Flagged prompts are blocked server-side.
        </p>
      </header>
      <ChatDemo />
    </main>
  );
}
