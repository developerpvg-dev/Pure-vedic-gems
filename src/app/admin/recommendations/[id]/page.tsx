'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ReportEditor } from '@/components/admin/recommendations/ReportEditor';
import type { RecommendationReport } from '@/lib/recommendations/types';

export default function RecommendationEditorPage() {
  const params = useParams();
  const id = String(params.id);
  const [report, setReport] = useState<RecommendationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/recommendations/${id}`);
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error || 'Failed to load');
        return;
      }
      setReport(data.report);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  if (!report) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading editor…
      </div>
    );
  }

  return <ReportEditor initial={report} />;
}
