'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileSpreadsheet, Loader2, RotateCcw, UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ImportRow {
  row: number;
  valid: boolean;
  data: Record<string, unknown>;
  warnings: string[];
  errors: string[];
}

interface ImportPreview {
  rows: ImportRow[];
  summary: { total: number; valid: number; invalid: number; warnings: number };
}

export default function ProductImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [commitResult, setCommitResult] = useState<{ batchId: string; inserted: unknown[] } | null>(null);
  const [rollbackBatch, setRollbackBatch] = useState('');
  const [message, setMessage] = useState('');

  async function submit(commit: boolean) {
    if (!file) return;
    setLoading(true);
    setMessage('');
    const form = new FormData();
    form.append('file', file);
    form.append('commit', String(commit));
    const res = await fetch('/api/admin/products/import', { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Import failed');
      if (data.rows) setPreview(data);
    } else if (commit) {
      setCommitResult({ batchId: data.batchId, inserted: data.inserted || [] });
      setMessage(`Imported ${data.inserted?.length ?? 0} products.`);
    } else {
      setPreview(data);
      setCommitResult(null);
    }
    setLoading(false);
  }

  async function rollback() {
    if (!rollbackBatch.trim()) return;
    if (!confirm('Rollback archives products from this import batch. Continue?')) return;
    setLoading(true);
    const res = await fetch(`/api/admin/products/import?batch_id=${encodeURIComponent(rollbackBatch.trim())}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? `Archived ${data.archivedProducts ?? 0} imported products.` : data.error || 'Rollback failed');
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/products" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-amber-700">
            <ArrowLeft className="h-4 w-4" /> Back to products
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Product Import</h1>
          <p className="mt-1 text-sm text-gray-500">Preview CSV/XLSX rows, catch duplicate SKUs, and commit only clean batches.</p>
        </div>
        <button
          type="button"
          onClick={() => { window.location.href = '/api/admin/products/import'; }}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50"
        >
          <Download className="h-4 w-4" /> Template CSV
        </button>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex-1">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Import file</span>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
            />
          </label>
          <button
            onClick={() => submit(false)}
            disabled={!file || loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Validate Preview
          </button>
          <button
            onClick={() => submit(true)}
            disabled={!file || loading || !preview || preview.summary.invalid > 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Commit Import
          </button>
        </div>
        {message && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>}
      </section>

      {preview && (
        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-2 gap-3 border-b border-gray-100 p-4 md:grid-cols-4">
            {[
              ['Total', preview.summary.total],
              ['Valid', preview.summary.valid],
              ['Invalid', preview.summary.invalid],
              ['Warnings', preview.summary.warnings],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
          <div className="max-h-130 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="p-3">Row</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.row} className="border-t border-gray-100">
                    <td className="p-3 text-gray-500">{row.row}</td>
                    <td className="p-3 font-mono text-xs">{String(row.data.sku ?? '')}</td>
                    <td className="p-3">
                      <p className="font-medium text-gray-900">{String(row.data.name ?? '')}</p>
                      <p className="text-xs text-gray-500">{String(row.data.category ?? '')}</p>
                    </td>
                    <td className="p-3">
                      {row.valid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"><CheckCircle2 className="h-3 w-3" /> Valid</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"><AlertTriangle className="h-3 w-3" /> Fix</span>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {[...row.errors, ...row.warnings].length === 0 ? <span className="text-gray-400">-</span> : [...row.errors, ...row.warnings].map((note) => <p key={note} className={row.errors.includes(note) ? 'text-red-600' : 'text-amber-700'}>{note}</p>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Rollback Import Batch</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={rollbackBatch || commitResult?.batchId || ''}
            onChange={(event) => setRollbackBatch(event.target.value)}
            placeholder="Paste import batch ID"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
          />
          <button onClick={rollback} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
            <RotateCcw className="h-4 w-4" /> Rollback
          </button>
        </div>
        {commitResult?.batchId && <p className="mt-2 text-xs text-gray-500">Last batch: {commitResult.batchId}</p>}
      </section>
    </div>
  );
}