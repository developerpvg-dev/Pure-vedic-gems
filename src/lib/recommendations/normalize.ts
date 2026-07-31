import { emptyCustomer, type ReportBlock, type ReportCustomer } from '@/lib/recommendations/blocks';
import type { RecommendationReport } from '@/lib/recommendations/types';

export function normalizeCustomer(raw: unknown): ReportCustomer {
  const base = emptyCustomer();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  return {
    name: String(o.name ?? ''),
    email: String(o.email ?? ''),
    phone: String(o.phone ?? ''),
    dob: String(o.dob ?? ''),
    birthPlace: String(o.birthPlace ?? ''),
    purpose: String(o.purpose ?? 'General'),
    weightNote: String(o.weightNote ?? ''),
  };
}

export function normalizeBlocks(raw: unknown): ReportBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw as ReportBlock[];
}

export function mapReportRow(row: Record<string, unknown>): RecommendationReport {
  return {
    id: String(row.id),
    title: String(row.title ?? 'Gemstone Recommendation'),
    status: (row.status as RecommendationReport['status']) || 'draft',
    customer: normalizeCustomer(row.customer),
    enquiry_id: (row.enquiry_id as string | null) ?? null,
    blocks: normalizeBlocks(row.blocks),
    chart_image_url: (row.chart_image_url as string | null) ?? null,
    pdf_path: (row.pdf_path as string | null) ?? null,
    public_token: String(row.public_token),
    sent_at: (row.sent_at as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}
