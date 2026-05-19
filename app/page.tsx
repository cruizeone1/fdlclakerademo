import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const FEATURES = [
  {
    title: "Input screening",
    description:
      "Every prompt is sent to Lakera Guard before it reaches OpenAI, catching injection attempts early.",
  },
  {
    title: "Fail-closed blocking",
    description:
      "Flagged prompts are blocked server-side. OpenAI is never called when a threat is detected.",
  },
  {
    title: "Transparent results",
    description:
      "See safe vs. blocked status, detector breakdown, and whether an AI response was generated.",
  },
];

const STEPS = [
  "Enter a prompt or pick a sample test case",
  "Lakera Guard screens the input for prompt injection",
  "Safe prompts get an OpenAI response; flagged prompts are blocked",
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="page landing-page">
        <section className="hero">
          <div className="header-badge">Live security demo</div>
          <h1>Protect LLM chat with Lakera Guard</h1>
          <p className="hero-lead">
            A public demo showing how to gate OpenAI requests with Lakera Guard prompt
            injection detection. Try safe prompts and attack examples side by side.
          </p>
          <div className="hero-actions">
            <Link href="/demo" className="btn btn-primary btn-large">
              Open interactive demo
            </Link>
            <a
              href="https://docs.lakera.ai/docs/api/guard"
              className="btn btn-secondary btn-large"
              target="_blank"
              rel="noopener noreferrer"
            >
              Lakera Guard docs
            </a>
          </div>
        </section>

        <section className="landing-section">
          <h2>How it works</h2>
          <ol className="steps-list">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <pre className="flow-diagram flow-diagram-landing">
            User → Lakera Guard → if safe → OpenAI → Response{"\n"}
            {"                    "}→ if flagged → Block + show details
          </pre>
        </section>

        <section className="landing-section feature-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="feature-card card">
              <div className="card-body">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="landing-section cta-panel card">
          <div className="card-body cta-panel-body">
            <div>
              <h2>Ready to test?</h2>
              <p>
                Use built-in sample prompts including normal requests, direct injection,
                and indirect RAG-style attacks.
              </p>
            </div>
            <Link href="/demo" className="btn btn-primary btn-large">
              Try the demo
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
