import type { ReportBlock, ReportCustomer } from '@/lib/recommendations/blocks';

export type RecommendationReportStatus = 'draft' | 'ready' | 'sent';

export type RecommendationReport = {
  id: string;
  title: string;
  status: RecommendationReportStatus;
  customer: ReportCustomer;
  enquiry_id: string | null;
  blocks: ReportBlock[];
  chart_image_url: string | null;
  pdf_path: string | null;
  public_token: string;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RecommendationReportListItem = Pick<
  RecommendationReport,
  'id' | 'title' | 'status' | 'customer' | 'public_token' | 'sent_at' | 'created_at' | 'updated_at'
>;
