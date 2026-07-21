'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Palette, Printer, UserPlus, Plus } from 'lucide-react';

type WorkshopDesigner = { id: string; name: string };
type PortalDesigner = { id: string; name: string };

export type DesignSlipItem = {
  name: string;
  setting?: string | null;
  metal?: string | null;
  ring_size?: string | null;
  chain_length?: string | null;
  design_name?: string | null;
  design_image_url?: string | null;
  summary?: string | null;
  carat?: string | null;
};

interface OrderAssignDesignerProps {
  orderId: string;
  orderNumber: string;
  currentDesignerId: string | null;
  currentDesignerName?: string | null;
  orderStatus: string;
  needsDesigner?: boolean;
  currentDesignPrice?: number | null;
  currentDesignDueAt?: string | null;
  currentDesignSlipNotes?: string | null;
  currentDesignMetalEstimate?: string | null;
  slipItems?: DesignSlipItem[];
}

function fmtInr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function OrderAssignDesigner({
  orderId,
  orderNumber,
  currentDesignerId,
  currentDesignerName,
  orderStatus,
  needsDesigner = true,
  currentDesignPrice = null,
  currentDesignDueAt = null,
  currentDesignSlipNotes = null,
  currentDesignMetalEstimate = null,
  slipItems = [],
}: OrderAssignDesignerProps) {
  const [workshop, setWorkshop] = useState<WorkshopDesigner[]>([]);
  const [portal, setPortal] = useState<PortalDesigner[]>([]);
  const [designerName, setDesignerName] = useState(currentDesignerName ?? '');
  const [portalId, setPortalId] = useState(currentDesignerId ?? '');
  const [designPrice, setDesignPrice] = useState(
    currentDesignPrice != null ? String(currentDesignPrice) : '',
  );
  const [designDue, setDesignDue] = useState(currentDesignDueAt?.slice(0, 10) ?? '');
  const [slipNotes, setSlipNotes] = useState(currentDesignSlipNotes ?? '');
  const [metalEstimate, setMetalEstimate] = useState(currentDesignMetalEstimate ?? '');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [migrationHint, setMigrationHint] = useState(false);

  const canRoute = ['processing', 'confirmed', 'placed', 'design_assigned', 'design_in_progress'].includes(
    orderStatus,
  );

  const loadDesigners = useCallback(async () => {
    const [ws, pt] = await Promise.all([
      fetch('/api/admin/workshop-designers'),
      fetch('/api/admin/designers'),
    ]);
    const wsData = await ws.json().catch(() => ({}));
    const ptData = await pt.json().catch(() => ({}));
    setLoading(false);
    if (ws.ok) {
      setWorkshop(wsData.designers ?? []);
      if (wsData.needsMigration) setMigrationHint(true);
    }
    if (pt.ok) setPortal(ptData.designers ?? []);
  }, []);

  useEffect(() => {
    void loadDesigners();
  }, [loadDesigners]);

  const savePayload = useMemo(
    () => ({
      designer_name: designerName.trim() || undefined,
      designer_id: portalId || undefined,
      design_price: designPrice.trim() === '' ? null : Number(designPrice),
      design_due_at: designDue ? `${designDue}T18:00:00.000Z` : null,
      design_slip_notes: slipNotes.trim() || null,
      design_metal_estimate: metalEstimate.trim() || null,
    }),
    [designerName, portalId, designPrice, designDue, slipNotes, metalEstimate],
  );

  const assign = useCallback(async () => {
    if (!designerName.trim() && !portalId) {
      setError('Enter or select a designer name');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/orders/${orderId}/assign-designer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savePayload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Failed to assign designer');
      return;
    }
    if (data.designer_name) setDesignerName(data.designer_name);
    setMessage('Assigned. Design job saved — you can print the work slip below.');
    void loadDesigners();
  }, [orderId, savePayload, designerName, portalId, loadDesigners]);

  const saveSlipOnly = useCallback(async () => {
    setSaving(true);
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/orders/${orderId}/assign-designer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...savePayload, slip_only: true }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Failed to save slip details');
      return;
    }
    setMessage('Work slip details saved');
    setTimeout(() => setMessage(''), 3000);
  }, [orderId, savePayload]);

  const addDesigner = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/admin/workshop-designers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Could not add designer');
      return;
    }
    setNewName('');
    setDesignerName(data.designer?.name || name);
    void loadDesigners();
  }, [newName, loadDesigners]);

  const printSlip = () => {
    window.print();
  };

  if (!needsDesigner) {
    return (
      <section className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] print:hidden">
        <div className="border-b border-stone-100 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            <Palette className="h-3.5 w-3.5" />
            Design routing
          </h2>
        </div>
        <p className="px-5 py-4 text-xs text-stone-400">
          Not required for this order type.
        </p>
      </section>
    );
  }

  const field =
    'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5';
  const labelCls = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400';

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .pvg-design-slip, .pvg-design-slip * { visibility: visible !important; }
          .pvg-design-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
          }
          .pvg-design-slip img {
            max-height: 140px !important;
            object-fit: contain !important;
          }
        }
      `}</style>
      <section className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] print:hidden">
        <div className="border-b border-stone-100 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            <Palette className="h-3.5 w-3.5" />
            Design &amp; work slip
          </h2>
        </div>
        <div className="space-y-3 px-5 py-4">
          {migrationHint ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Run <code className="font-mono">week35_workshop_designers.sql</code> in Supabase first.
            </p>
          ) : null}

          {designerName || currentDesignerName ? (
            <p className="rounded-xl bg-stone-50 px-3 py-2.5 text-sm text-stone-800">
              Designer: <strong>{designerName || currentDesignerName}</strong>
            </p>
          ) : null}

          {loading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-stone-400" />
          ) : (
            <>
              <div>
                <label className={labelCls}>Designer name</label>
                <input
                  list="workshop-designer-list"
                  value={designerName}
                  onChange={(e) => setDesignerName(e.target.value)}
                  placeholder="Type or pick a name…"
                  className={field}
                />
                <datalist id="workshop-designer-list">
                  {workshop.map((d) => (
                    <option key={d.id} value={d.name} />
                  ))}
                </datalist>
              </div>

              <div className="flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Add new designer"
                  className={`min-w-0 flex-1 ${field}`}
                />
                <button
                  type="button"
                  onClick={() => void addDesigner()}
                  disabled={saving || !newName.trim()}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {portal.length > 0 ? (
                <div>
                  <label className={labelCls}>Portal designer (optional)</label>
                  <select
                    value={portalId}
                    onChange={(e) => {
                      setPortalId(e.target.value);
                      const match = portal.find((d) => d.id === e.target.value);
                      if (match) setDesignerName(match.name);
                    }}
                    className={field}
                  >
                    <option value="">Name only</option>
                    {portal.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Making price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={designPrice}
                    onChange={(e) => setDesignPrice(e.target.value)}
                    className={field}
                  />
                </div>
                <div>
                  <label className={labelCls}>Due date</label>
                  <input
                    type="date"
                    value={designDue}
                    onChange={(e) => setDesignDue(e.target.value)}
                    className={field}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Metal estimate</label>
                <input
                  value={metalEstimate}
                  onChange={(e) => setMetalEstimate(e.target.value)}
                  placeholder="e.g. 4.5g of 14K gold"
                  className={field}
                />
              </div>

              <div>
                <label className={labelCls}>Slip notes</label>
                <textarea
                  value={slipNotes}
                  onChange={(e) => setSlipNotes(e.target.value)}
                  rows={2}
                  className={field}
                />
              </div>

              <button
                type="button"
                onClick={() => void assign()}
                disabled={!canRoute || saving || (!designerName.trim() && !portalId)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {currentDesignerName || currentDesignerId ? 'Re-assign' : 'Assign designer'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void saveSlipOnly()}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                >
                  Save slip
                </button>
                <button
                  type="button"
                  onClick={printSlip}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
              </div>

              {!canRoute ? (
                <p className="text-xs text-stone-400">Assign after order is placed / processing.</p>
              ) : null}
            </>
          )}

          {message ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
          ) : null}
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
        </div>
      </section>

      {/* Print-only work slip */}
      <div className="pvg-design-slip hidden print:block">
        <div className="mx-auto max-w-[800px] p-6 text-black">
          <div className="flex items-start justify-between border-b-2 border-black pb-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">PureVedicGems — Design Work Slip</h1>
              <p className="mt-1 text-sm">Order #{orderNumber}</p>
            </div>
            <div className="text-right text-sm">
              <p>Printed {new Date().toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Designer</p>
              <p className="text-lg font-semibold">{designerName || currentDesignerName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Due date</p>
              <p className="text-lg font-semibold">
                {designDue
                  ? new Date(`${designDue}T00:00:00`).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Design / making price</p>
              <p className="text-lg font-semibold">
                {designPrice.trim() !== '' && !Number.isNaN(Number(designPrice))
                  ? fmtInr(Number(designPrice))
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Metal estimate</p>
              <p className="text-lg font-semibold">{metalEstimate.trim() || '—'}</p>
            </div>
          </div>

          <h2 className="mt-6 border-b border-black pb-1 text-sm font-bold uppercase tracking-wide">
            Pieces to make
          </h2>
          <div className="mt-2 space-y-3">
            {slipItems.length ? (
              slipItems.map((item, i) => (
                <div key={i} className="rounded border border-black/30 p-3 text-sm">
                  <div className="flex gap-3">
                    {item.design_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- print slip needs plain img
                      <img
                        src={item.design_image_url}
                        alt={item.design_name || item.name}
                        className="h-28 w-28 shrink-0 rounded border border-black/20 object-contain bg-white"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {item.design_name ? <p>Design: {item.design_name}</p> : null}
                        {item.setting ? <p>Setting: {item.setting}</p> : null}
                        {item.metal ? <p>Metal: {item.metal}</p> : null}
                        {item.ring_size ? <p>Ring size: {item.ring_size}</p> : null}
                        {item.chain_length ? <p>Chain: {item.chain_length}</p> : null}
                        {item.carat ? <p>Carat: {item.carat}</p> : null}
                      </div>
                      {item.summary ? <p className="mt-1 text-xs text-gray-700">{item.summary}</p> : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No configured jewelry lines on this order.</p>
            )}
          </div>

          {slipNotes.trim() ? (
            <div className="mt-4">
              <h2 className="border-b border-black pb-1 text-sm font-bold uppercase tracking-wide">
                Workshop notes
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{slipNotes}</p>
            </div>
          ) : null}

          <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
            <div className="border-t border-black pt-2">
              <p>Designer signature</p>
            </div>
            <div className="border-t border-black pt-2">
              <p>Completed on _______________</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
