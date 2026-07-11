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
}

export interface ErpOrphanOnWebsite {
  kind: 'orphan_on_website';
  productId: string;
  tagNumber: string;
  productName: string;
  websitePurchasable: boolean;
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
}
