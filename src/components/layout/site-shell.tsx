import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { APP_NAME, APP_SHORT, DISCLAIMER, FOOTER_NAV, NAV } from "@/lib/site";
import { cn } from "@/lib/utils";
import { SearchDialog } from "@/components/search-dialog";

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-bg text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 bg-accent text-accent-fg px-3 py-2 rounded-sm"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="page-wrap flex h-14 items-center gap-3">
          <Link to="/" className="flex items-baseline gap-2 shrink-0">
            <span className="font-display text-lg font-semibold tracking-tight">{APP_SHORT}</span>
            <span className="hidden sm:inline text-xs text-ink-muted">{APP_NAME}</span>
          </Link>
          <nav className="ml-auto hidden md:flex items-center gap-1" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 h-9 inline-flex items-center rounded-sm text-sm",
                  pathname === item.to || pathname.startsWith(item.to + "/")
                    ? "bg-surface text-ink"
                    : "text-ink-muted hover:text-ink hover:bg-surface",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setSearch(true)}
            className="ml-auto md:ml-2 inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink-muted hover:bg-surface hover:text-ink"
            aria-label="Search processors"
          >
            <Search className="size-4" />
          </button>
          <button
            type="button"
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink-muted hover:bg-surface"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open ? (
          <nav className="md:hidden border-t border-border bg-bg px-4 py-3 flex flex-col" aria-label="Mobile">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="h-11 flex items-center text-sm">
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border mt-16">
        <div className="page-wrap py-10">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {FOOTER_NAV.map((item) => (
              <Link key={item.to} to={item.to} className="text-ink-muted hover:text-ink h-11 inline-flex items-center">
                {item.label}
              </Link>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-xs text-ink-subtle leading-relaxed">{DISCLAIMER}</p>
          <p className="mt-4 text-xs text-ink-muted">
            Independent payment-risk research. No processor gets to buy a better score.
          </p>
          <p className="mt-1 text-xs text-ink-subtle">Your accountant may still judge your life choices.</p>
          <p className="mt-4 text-xs text-ink-subtle">
            Provider names belong to their respective owners. PRI is not affiliated with any processor.
          </p>
        </div>
      </footer>
      <SearchDialog open={search} onOpenChange={setSearch} />
    </div>
  );
}
