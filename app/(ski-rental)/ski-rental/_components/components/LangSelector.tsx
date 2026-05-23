import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { LANGS } from "@/ski-rental/lib/i18n";
import { setGroup, useGroup } from "@/ski-rental/lib/session";

export function LangSelector({ compact = false }: { compact?: boolean }) {
  const g = useGroup();
  const [open, setOpen] = useState(false);
  const cur = LANGS.find((l) => l.code === g.language) ?? LANGS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur transition hover:border-primary/40 ${compact ? "text-xs" : ""}`}
      >
        <span className="text-base leading-none">{cur.flag}</span>
        <span className="label-mono">{cur.code.toUpperCase()}</span>
        <span className="text-muted-foreground">▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-background/95 p-2 backdrop-blur-2xl shadow-2xl"
          >
            <div className="px-3 pb-2 pt-1 label-mono">// LANGUAGE</div>
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setGroup({ language: l.code });
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/5 ${
                  l.code === g.language ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <span className="text-lg">{l.flag}</span>
                <span className="font-display">{l.label}</span>
                {l.code === g.language && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary glow-ring" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
