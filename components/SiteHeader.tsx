import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo">
          Lakera Guard Demo
        </Link>
        <nav className="site-nav">
          <Link href="/">Home</Link>
          <Link href="/demo" className="site-nav-cta">
            Launch demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
