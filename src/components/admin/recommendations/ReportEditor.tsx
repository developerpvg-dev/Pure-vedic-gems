'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Eye, Loader2, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { ReportView } from '@/components/recommendations/ReportView';
import {
  BlockInspector,
  BlockList,
  BlockPalette,
  CustomerInspector,
  ProductPickerDrawer,
  createEmptyBlock,
} from '@/components/admin/recommendations/EditorParts';
import type { ProductRef, ReportBlock, ReportBlockType, ReportCustomer } from '@/lib/recommendations/blocks';
import type { RecommendationReport } from '@/lib/recommendations/types';

export function ReportEditor({ initial }: { initial: RecommendationReport }) {
  const [title, setTitle] = useState(initial.title);
  const [customer, setCustomer] = useState<ReportCustomer>(initial.customer);
  const [blocks, setBlocks] = useState<ReportBlock[]>(initial.blocks);
  const [chartImageUrl, setChartImageUrl] = useState<string | null>(initial.chart_image_url);
  const [selectedId, setSelectedId] = useState<string | null>(initial.blocks[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<'pdf' | 'send' | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAssign, setPickerAssign] = useState<((p: ProductRef) => void) | null>(null);
  const [status, setStatus] = useState(initial.status);
  const [publicToken] = useState(initial.public_token);

  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/recommendations/${initial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          customer,
          blocks,
          chart_image_url: chartImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setStatus(data.report.status);
      toast.success('Saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [blocks, chartImageUrl, customer, initial.id, title]);

  const uploadChart = useCallback(async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/recommendations/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || !data.url) {
      toast.error(data.error || 'Upload failed');
      return null;
    }
    setChartImageUrl(data.url);
    toast.success('Chart uploaded');
    return data.url as string;
  }, []);

  function addBlock(type: ReportBlockType) {
    const block = createEmptyBlock(type);
    setBlocks((prev) => [...prev, block]);
    setSelectedId(block.id);
  }

  function reorder(from: number, to: number) {
    setBlocks((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function updateBlock(next: ReportBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === next.id ? next : b)));
  }

  async function downloadPdf() {
    setBusy('pdf');
    try {
      await save();
      const res = await fetch(`/api/admin/recommendations/${initial.id}/pdf`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || 'PDF failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recommendation-${publicToken}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('ready');
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'PDF failed');
    } finally {
      setBusy(null);
    }
  }

  async function sendEmail() {
    if (!customer.email.trim()) {
      toast.error('Add customer email first');
      return;
    }
    setBusy('send');
    try {
      await save();
      const res = await fetch(`/api/admin/recommendations/${initial.id}/send`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setStatus('sent');
      toast.success(data.pdfAttached ? 'Emailed with PDF attached' : 'Emailed (view link; PDF skipped)');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2">
        <Link href="/admin/recommendations" className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> Reports
        </Link>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-[200px] flex-1 rounded border border-transparent px-2 py-1 text-sm font-semibold hover:border-neutral-200 focus:border-amber-400 focus:outline-none"
        />
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-600">{status}</span>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </button>
        <Link
          href={`/r/${publicToken}`}
          target="_blank"
          className="inline-flex items-center gap-1 rounded border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          <Eye className="h-3.5 w-3.5" /> Preview
        </Link>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 rounded border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50"
        >
          {busy === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          PDF
        </button>
        <button
          type="button"
          onClick={sendEmail}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {busy === 'send' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Send email
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[220px_1fr_280px]">
        <aside className="overflow-y-auto border-r border-neutral-200 bg-neutral-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Blocks</p>
          <BlockList
            blocks={blocks}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={reorder}
            onRemove={(id) => {
              setBlocks((prev) => prev.filter((b) => b.id !== id));
              if (selectedId === id) setSelectedId(null);
            }}
          />
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">Add block</p>
          <BlockPalette onAdd={addBlock} />
        </aside>

        <main className="overflow-y-auto bg-neutral-200/60 p-4">
          <div className="mx-auto shadow-lg">
            <ReportView
              customer={customer}
              blocks={blocks}
              chartImageUrl={chartImageUrl}
              selectedBlockId={selectedId}
              onSelectBlock={setSelectedId}
              interactive
            />
          </div>
        </main>

        <aside className="overflow-y-auto border-l border-neutral-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Customer</p>
          <CustomerInspector customer={customer} onChange={setCustomer} />
          <hr className="my-4" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Selected block</p>
          {selected ? (
            <BlockInspector
              block={selected}
              onChange={updateBlock}
              onOpenPicker={(assign) => {
                setPickerAssign(() => assign);
                setPickerOpen(true);
              }}
              onUploadChart={uploadChart}
            />
          ) : (
            <p className="text-xs text-neutral-500">Click a block on the canvas.</p>
          )}
          <button
            type="button"
            onClick={() => {
              setPickerAssign(null);
              setPickerOpen(true);
            }}
            className="mt-4 w-full rounded border border-amber-300 bg-amber-50 px-2 py-2 text-sm text-amber-900"
          >
            Open product drawer
          </button>
        </aside>
      </div>

      <ProductPickerDrawer
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setPickerAssign(null);
        }}
        onPick={(p) => {
          if (pickerAssign) pickerAssign(p);
        }}
      />
    </div>
  );
}
