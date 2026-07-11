export type AgentChannel = 'chat' | 'voice' | 'phone' | 'whatsapp';
export type AgentLocale = 'en' | 'hi';
export type AgentSessionStatus = 'active' | 'closed' | 'handed_off';
export type AgentMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type AgentSessionContext = {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  purpose?: string;
  budgetMin?: number;
  budgetMax?: number;
  recommendedProducts?: string[];
  lastRecommendation?: Record<string, unknown>;
  productViews?: number;
  urgencySignals?: string[];
  handoffRequested?: boolean;
};

export type AgentSessionRow = {
  id: string;
  visitor_id: string;
  user_id: string | null;
  channel: AgentChannel;
  locale: AgentLocale;
  status: AgentSessionStatus;
  lead_score: number;
  context: AgentSessionContext;
  enquiry_id: string | null;
  consent_at: string | null;
  whatsapp_phone: string | null;
  external_ids: Record<string, string>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type AgentMessageRow = {
  id: string;
  session_id: string;
  role: AgentMessageRole;
  content: string;
  language: AgentLocale | null;
  tool_name: string | null;
  tool_payload: Record<string, unknown> | null;
  created_at: string;
};

export type AgentProductCard = {
  id: string;
  name: string;
  hindiName: string | null;
  slug: string;
  href: string;
  price: number | null;
  thumbnailUrl: string | null;
  planet: string | null;
  inStock: boolean;
};

export type AgentKnowledgeRow = {
  id: string;
  title: string;
  content: string;
  language: AgentLocale;
  source: string;
  metadata: Record<string, unknown>;
  similarity?: number;
};
