"use client";

import { useState } from "react";
import { GuardResultPanel } from "@/components/GuardResultPanel";
import { SAMPLE_PROMPTS } from "@/lib/sample-prompts";
import type { ChatErrorResponse, ChatResponse } from "@/lib/types";

export function ChatDemo() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = (await response.json()) as ChatResponse | ChatErrorResponse;

      if (!response.ok) {
        setError("error" in data ? data.error : "Request failed");
        return;
      }

      setResult(data as ChatResponse);
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  function loadSample(samplePrompt: string) {
    setPrompt(samplePrompt);
    setResult(null);
    setError(null);
  }

  return (
    <div className="layout">
      <aside className="card">
        <div className="card-header">
          <h2>Test prompts</h2>
        </div>
        <div className="card-body">
          <div className="sample-list">
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className="sample-button"
                onClick={() => loadSample(sample.prompt)}
              >
                <strong>{sample.label}</strong>
                <span>{sample.description}</span>
                <span
                  className={`sample-tag ${sample.expectedOutcome === "safe" ? "safe" : "blocked"}`}
                >
                  Expected: {sample.expectedOutcome === "safe" ? "Safe" : "Blocked"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="card">
        <div className="card-header">
          <h2>Chat with protection</h2>
        </div>
        <div className="card-body">
          <form className="chat-form" onSubmit={handleSubmit}>
            <textarea
              className="prompt-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Enter a prompt to test Lakera Guard + OpenAI..."
              aria-label="User prompt"
            />
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={loading || !prompt.trim()}>
                {loading ? "Screening..." : "Send prompt"}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setPrompt("");
                  setResult(null);
                  setError(null);
                }}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </form>

          <div className="flow-diagram">
            User prompt → Lakera Guard (input screen) →{" "}
            {result?.status === "blocked"
              ? "BLOCKED ✕"
              : result?.status === "allowed"
                ? "OpenAI → Response ✓"
                : "if safe → OpenAI | if flagged → block"}
          </div>

          <div className="results">
            {loading && <p className="loading">Running Lakera Guard screening...</p>}

            {error && <div className="error-box">{error}</div>}

            {result && (
              <>
                <GuardResultPanel
                  flagged={result.guard.flagged}
                  requestUuid={result.guard.requestUuid}
                  breakdown={result.guard.breakdown}
                  triggeredDetectors={
                    result.status === "blocked" ? result.guard.triggeredDetectors : []
                  }
                  blockMessage={
                    result.status === "blocked" ? result.guard.message : undefined
                  }
                />

                {result.status === "allowed" ? (
                  <div>
                    <p className="response-label">OpenAI response</p>
                    <div className="response-box">{result.response}</div>
                  </div>
                ) : (
                  <div>
                    <p className="response-label">OpenAI response</p>
                    <div className="response-box" style={{ color: "var(--text-muted)" }}>
                      Not generated — request blocked by Lakera Guard.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
