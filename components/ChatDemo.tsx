"use client";

import { useRef, useState } from "react";
import { GuardResultPanel } from "@/components/GuardResultPanel";
import {
  formatAcceptedDocumentTypes,
  getDocumentAcceptAttribute,
  type UploadedDocument,
} from "@/lib/documents.shared";
import { readDocumentFileClient } from "@/lib/read-document.client";
import { SAMPLE_DOCUMENTS } from "@/lib/sample-documents";
import { SAMPLE_PROMPTS } from "@/lib/sample-prompts";
import type { ChatErrorResponse, ChatResponse } from "@/lib/types";

export function ChatDemo() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [document, setDocument] = useState<UploadedDocument | null>(null);
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
        body: JSON.stringify({
          prompt,
          documentContent: document?.content,
          documentName: document?.name,
        }),
      });

      const raw = await response.text();
      let data: ChatResponse | ChatErrorResponse | null = null;

      try {
        data = raw ? (JSON.parse(raw) as ChatResponse | ChatErrorResponse) : null;
      } catch {
        setError(
          response.ok
            ? "Unexpected server response."
            : `Server error (${response.status}). Try restarting the dev server.`,
        );
        return;
      }

      if (!response.ok) {
        setError("error" in (data ?? {}) ? (data as ChatErrorResponse).error : "Request failed");
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

  function loadSampleDocument(sampleId: string) {
    const sample = SAMPLE_DOCUMENTS.find((item) => item.id === sampleId);
    if (!sample) return;
    setDocument({ name: sample.name, content: sample.content });
    setResult(null);
    setError(null);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setError(null);
      const uploaded = await readDocumentFileClient(file);
      setDocument(uploaded);
      setResult(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not read file.");
    }
  }

  function clearAll() {
    setPrompt("");
    setDocument(null);
    setResult(null);
    setError(null);
  }

  const acceptTypes = getDocumentAcceptAttribute();

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

          <div className="sidebar-section">
            <h3>Sample documents</h3>
            <div className="sample-list">
              {SAMPLE_DOCUMENTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className="sample-button"
                  onClick={() => loadSampleDocument(sample.id)}
                >
                  <strong>{sample.label}</strong>
                  <span>{sample.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="card">
        <div className="card-header">
          <h2>Chat with protection</h2>
        </div>
        <div className="card-body">
          <form className="chat-form" onSubmit={handleSubmit}>
            <div className="document-upload">
              <label className="document-upload-label" htmlFor="document-upload">
                Reference document (optional)
              </label>
              <div className="document-upload-row">
                <input
                  id="document-upload"
                  ref={fileInputRef}
                  type="file"
                  accept={acceptTypes}
                  className="document-file-input"
                  onChange={handleFileChange}
                />
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  Upload document
                </button>
                {document && (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setDocument(null)}
                    disabled={loading}
                  >
                    Remove document
                  </button>
                )}
              </div>
              <p className="document-help">
                Supported: {formatAcceptedDocumentTypes()} — max 8,000 characters, 5 MB file size.
                Lakera screens both the document and your prompt before OpenAI runs.
              </p>
              {document && (
                <div className="document-preview">
                  <p className="document-preview-title">{document.name}</p>
                  <pre>{document.content}</pre>
                </div>
              )}
            </div>

            <textarea
              className="prompt-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask a question about the document, or enter any prompt to test..."
              aria-label="User prompt"
            />
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={loading || !prompt.trim()}>
                {loading ? "Screening..." : "Send prompt"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={clearAll} disabled={loading}>
                Clear
              </button>
            </div>
          </form>

          <div className="flow-diagram">
            Document + prompt → Lakera Guard (RAG screen) →{" "}
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
                {result.hasDocument && (
                  <p className="document-attached-note">
                    Screened with document: {result.documentName ?? "uploaded document"}
                  </p>
                )}

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
