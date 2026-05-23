"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`label-mono transition-colors hover:text-foreground ${pathname === href ? "text-foreground" : ""}`}
    >
      {label}
    </Link>
  );
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/ski-rental" className="flex items-center gap-2.5">
          <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-md bg-primary/20 blur-md" />
            <span className="relative h-3 w-3 rounded-sm bg-primary glow-ring" />
          </span>
          <span className="font-display text-sm font-semibold tracking-[0.32em]">FEETFIRST</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {link("/ski-rental/start", "Terminal")}
        </nav>
        <Link
          href="/ski-rental/start"
          className="group relative inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium tracking-[0.2em] text-primary transition hover:bg-primary/20"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary glow-ring" />
          BEGIN
        </Link>
      </div>
    </header>
  );
}
