'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { absoluteUrl } from '@/lib/utils/seo';

export function DesignShareLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const url = absoluteUrl(path);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-lg border border-[#e8dfd0] bg-white/70 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a7a68]">
        Share this design
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate text-xs text-[#3d3429]">{url}</code>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#6b3b23] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#5a3120]"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
