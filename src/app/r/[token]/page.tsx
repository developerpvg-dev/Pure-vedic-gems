import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapReportRow } from '@/lib/recommendations/normalize';
import { ReportView } from '@/components/recommendations/ReportView';
import { PrintReportButton } from '@/components/recommendations/PrintReportButton';

type Props = { params: Promise<{ token: string }> };

export default async function PublicRecommendationPage({ params }: Props) {
  const { token } = await params;
  if (!token || token.length < 8) notFound();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('recommendation_reports')
    .select('*')
    .eq('public_token', token)
    .single();

  if (error || !data) notFound();

  const report = mapReportRow(data as Record<string, unknown>);

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white">
      <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3 px-4 py-3 print:hidden">
        <p className="text-sm text-neutral-600">PureVedicGems — Gemstone Recommendation</p>
        <PrintReportButton />
      </div>
      <div className="pb-10">
        <ReportView customer={report.customer} blocks={report.blocks} chartImageUrl={report.chart_image_url} />
      </div>
    </div>
  );
}
