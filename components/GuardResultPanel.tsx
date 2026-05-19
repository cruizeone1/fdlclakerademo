"use client";

import type { GuardBreakdownItem } from "@/lib/lakera";

interface GuardResultPanelProps {
  flagged: boolean;
  requestUuid?: string;
  breakdown: GuardBreakdownItem[];
  triggeredDetectors?: string[];
  blockMessage?: string;
}

export function GuardResultPanel({
  flagged,
  requestUuid,
  breakdown,
  triggeredDetectors = [],
  blockMessage,
}: GuardResultPanelProps) {
  return (
    <div className={`guard-result ${flagged ? "blocked" : "safe"}`}>
      <h3>{flagged ? "Potential prompt injection detected" : "Safe prompt"}</h3>
      <p className="guard-meta">
        Lakera Guard {flagged ? "flagged" : "cleared"} this input before the OpenAI
        request {flagged ? "was blocked" : "proceeded"}.
      </p>

      {blockMessage && <p className="guard-meta">{blockMessage}</p>}

      {requestUuid && (
        <p className="guard-meta" style={{ marginTop: "0.5rem" }}>
          Request ID: {requestUuid}
        </p>
      )}

      {triggeredDetectors.length > 0 && (
        <div className="detector-list">
          {triggeredDetectors.map((detector) => (
            <span key={detector} className="detector-pill">
              {detector}
            </span>
          ))}
        </div>
      )}

      {breakdown.length > 0 && (
        <table className="breakdown-table">
          <thead>
            <tr>
              <th>Detector</th>
              <th>Type</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item, index) => (
              <tr key={`${item.detector_id ?? item.detector_type}-${index}`}>
                <td>{item.detector_id ?? "—"}</td>
                <td>{item.detector_type ?? "—"}</td>
                <td>{item.detected ? "Detected" : "Clear"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
