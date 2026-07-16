export interface ErpTagStockRow {
  tsno: number;
  TGNO: string;
  vtgno?: number;
  INO: number;
  IDESC: string;
  TPRE?: string;
  REMARKS?: string;
  TDATE?: string;
  ITRNID?: number;
  GWT?: number;
  subitems?: Array<Record<string, unknown>>;
  TAGFINE1?: number;
  TAGFINE2?: number;
  COSTDAMT?: number;
  COSTSAMT?: number;
  COSTMAMT?: number;
  /** Full API row preserved for cache / debugging. */
  raw?: Record<string, unknown>;
}

export interface ErpItemMasterGroup {
  groupid: number;
  groupname: string;
  items: Array<{
    ino: number;
    IDESC: string;
    DIAST?: number;
    PNAME?: string;
    UNITID?: number;
    SM?: number;
  }>;
}

export type ErpStockFilter = 0 | 1 | 2;

export interface ErpSyncDiffItem {
  tgno: string;
  tsno: number;
  ino: number | null;
  name: string;
  remarks: string | null;
  erpInStock: boolean;
  estimatedPrice: number;
}

export interface ErpMissingOnWebsite extends ErpSyncDiffItem {
  kind: 'missing_on_website';
  stockCategory?: string | null;
}

export interface ErpStockMismatch {
  kind: 'stock_mismatch';
  tgno: string;
  productId: string;
  productName: string;
  websitePurchasable: boolean;
  erpInStock: boolean;
  availabilityStatus: string;
  stockQuantity: number | null;
  stockCategory?: string | null;
}

export interface ErpOrphanOnWebsite {
  kind: 'orphan_on_website';
  productId: string;
  tagNumber: string;
  productName: string;
  websitePurchasable: boolean;
  category?: string | null;
  productType?: string | null;
}

export interface ErpCategoryCoverage {
  id: string;
  label: string;
  kind: string;
  uploaded: boolean;
  /** Tags currently in Excel for this sheet */
  excelInStock: number;
  /** Live on website + in Excel for this sheet */
  matchedLive: number;
  /** In Excel, no website product */
  needAdd: number;
  /** Missing from Excel, still live on website */
  soldOfflineStillLive: number;
  /** Still in Excel, not purchasable on website */
  soldOnlineStillInExcel: number;
  lastSyncedAt: string | null;
}

export interface ErpOutboundTask {
  id: string;
  tag_number: string;
  action: string;
  status: string;
  order_id: string | null;
  product_id: string | null;
  created_at: string;
  processed_at: string | null;
  last_error: string | null;
  payload: Record<string, unknown> | null;
  productName?: string | null;
  orderNumber?: string | null;
}

export interface ErpSyncReport {
  syncedAt: string | null;
  apiCallsUsed: number;
  apiCallsRemaining: number;
  erpTagCount: number;
  websiteTaggedCount: number;
  matchedInStock: number;
  missingOnWebsite: ErpMissingOnWebsite[];
  stockMismatches: ErpStockMismatch[];
  orphansOnWebsite: ErpOrphanOnWebsite[];
  pendingOutbound: number;
  /** Website sales waiting for staff to mark sold/reserved in offline MMI. */
  pendingOutboundTasks?: ErpOutboundTask[];
  lastSyncMode?: 'api' | 'excel' | null;
  /** Per Excel sheet: has this category been uploaded? */
  categoryCoverage?: ErpCategoryCoverage[];
  /** Convenience counts for the UI overview. */
  counts?: {
    soldOfflineStillLive: number;
    soldOnlineStillInStore: number;
    missingOnWebsite: number;
    orphansLive: number;
    pendingOutbound: number;
    categoriesUploaded: number;
    categoriesTotal: number;
  };
}

export interface ErpTagDetailWebsite {
  id: string;
  name: string;
  slug: string | null;
  tag_number: string | null;
  price: number | null;
  in_stock: boolean | null;
  availability_status: string | null;
  is_active: boolean | null;
  stock_quantity: number | null;
}

export interface ErpTagDetailEnrichment {
  itemGroupName: string | null;
  itemMasterName: string | null;
  designCode: string | null;
  designPhoto: string | null;
  retailRate: number | null;
  laborCharge: number | null;
  liveFetched: boolean;
}

export interface ErpTagDetailPrefill {
  kind: import('@/components/admin/product-form/kinds').FormKind;
  name: string;
  tag_number: string;
  price: number;
  certificate_number?: string;
  metal_weight_grams?: number;
  short_desc?: string;
  sub_category?: string;
  category: string;
  product_type: string;
}

export interface ErpTagDetail {
  tgno: string;
  foundInCache: boolean;
  erp: {
    tsno: number;
    ino: number | null;
    idesc: string | null;
    remarks: string | null;
    tpre: string | null;
    erp_stock: number;
    cost_damt: number | null;
    cost_samt: number | null;
    cost_mamt: number | null;
    estimatedPrice: number;
    synced_at: string | null;
    tdate: string | null;
    gwt: number | null;
    tag_fine1?: number | null;
    tag_fine2?: number | null;
    subitems: Array<Record<string, unknown>>;
    raw: Record<string, unknown>;
  } | null;
  website: ErpTagDetailWebsite | null;
  status: {
    erpInStock: boolean;
    websitePurchasable: boolean;
    onWebsite: boolean;
    inErpCache: boolean;
  };
  enrichment?: ErpTagDetailEnrichment;
  suggestedKind?: import('@/components/admin/product-form/kinds').FormKind;
  prefill?: ErpTagDetailPrefill | null;
}
