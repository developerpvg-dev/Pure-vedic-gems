'use client';

import { ExternalLink, Printer } from 'lucide-react';

export type CustomDesignBriefView = {
  description?: string | null;
  contact_phone?: string | null;
  preferred_metal?: string | null;
  additional_stones?: string | null;
  additional_notes?: string | null;
};

export function CustomDesignBriefCard({
  brief,
  fileUrl,
  className = '',
  ringSize,
  settingType,
  productName,
  printId,
}: {
  brief?: CustomDesignBriefView | null;
  fileUrl?: string | null;
  className?: string;
  ringSize?: string | null;
  settingType?: string | null;
  productName?: string | null;
  /** Unique id for print root */
  printId?: string;
}) {
  if (!brief?.description && !brief?.contact_phone && !fileUrl) return null;

  const rootId = printId ?? 'custom-design-brief-print';

  function handlePrint() {
    const node = document.getElementById(rootId);
    if (!node) {
      window.print();
      return;
    }
    const win = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`<!doctype html><html><head><title>Custom design brief</title>
      <style>
        body{font-family:Georgia,serif;padding:24px;color:#1c1917;line-height:1.45}
        h1{font-size:18px;margin:0 0 12px}
        .meta{font-size:12px;color:#57534e;margin-bottom:16px}
        .block{margin:10px 0;font-size:13px}
        .label{font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:10px;color:#92400e}
        img{max-width:280px;max-height:280px;object-fit:contain;border:1px solid #e7e5e4;border-radius:8px;margin-top:8px}
        a{color:#92400e}
      </style></head><body>${node.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Custom design request</p>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-[10px] font-semibold text-amber-900 hover:bg-amber-100"
        >
          <Printer className="h-3 w-3" />
          Print for designer
        </button>
      </div>

      <div id={rootId}>
        <h1 className="sr-only">Custom design brief</h1>
        {(productName || settingType) && (
          <div className="meta mt-2 hidden print:block">
            {productName ? <div>{productName}</div> : null}
            {settingType ? <div>Setting: {settingType}</div> : null}
          </div>
        )}

        {productName ? (
          <p className="mt-2 text-xs text-amber-900 print:hidden">
            <span className="font-semibold">Product:</span> {productName}
          </p>
        ) : null}
        {settingType ? (
          <p className="mt-1 text-xs text-amber-900">
            <span className="font-semibold">Setting:</span> {settingType}
          </p>
        ) : null}
        {ringSize ? (
          <p className="mt-1 text-xs text-amber-900">
            <span className="font-semibold">Ring size:</span> {ringSize}
          </p>
        ) : null}

        {brief?.description ? (
          <div className="block mt-1.5">
            <p className="label">Description</p>
            <p className="leading-relaxed whitespace-pre-wrap">{brief.description}</p>
          </div>
        ) : null}
        {brief?.contact_phone ? (
          <p className="mt-2">
            <span className="font-semibold">Contact:</span>{' '}
            <a href={`tel:${brief.contact_phone.replace(/\s+/g, '')}`} className="underline-offset-2 hover:underline">
              {brief.contact_phone}
            </a>
          </p>
        ) : null}
        {brief?.preferred_metal ? (
          <p className="mt-1">
            <span className="font-semibold">Preferred metal:</span> {brief.preferred_metal}
          </p>
        ) : null}
        {brief?.additional_stones ? (
          <p className="mt-1">
            <span className="font-semibold">Additional stones:</span> {brief.additional_stones}
          </p>
        ) : null}
        {brief?.additional_notes ? (
          <p className="mt-1 leading-relaxed">
            <span className="font-semibold">Notes:</span> {brief.additional_notes}
          </p>
        ) : null}
        {fileUrl ? (
          <div className="mt-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 underline-offset-2 hover:underline"
            >
              Open reference file
              <ExternalLink className="h-3 w-3" />
            </a>
            {!fileUrl.toLowerCase().endsWith('.pdf') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl} alt="Custom design reference" className="mt-2 hidden print:block" />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
