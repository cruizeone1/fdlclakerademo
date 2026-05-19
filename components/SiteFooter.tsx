import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        Demo app — OpenAI inference protected by{" "}
        <a href="https://www.lakera.ai/" target="_blank" rel="noopener noreferrer">
          Lakera Guard
        </a>
        . API keys are stored server-side only.
      </p>
    </footer>
  );
}
