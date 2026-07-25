import {
  ASTROLOGER_EDITABLE_STAGES,
  TELECOM_EDITABLE_STAGES,
  type LeadPipelineStage,
} from '@/lib/leads/constants';

/** Leads manager = owner / admin / sales */
export function isLeadManager(role: string | null | undefined) {
  return role === 'owner' || role === 'admin' || role === 'sales';
}

export function isTelecomRole(role: string | null | undefined) {
  return role === 'telecom';
}

export function isAstrologerRole(role: string | null | undefined) {
  return role === 'astrologer';
}

/** Scope list: telecom/astrologer only see their queue */
export function leadListScope(
  role: string | null | undefined,
  userId: string
): { column: 'assigned_to' | 'astrologer_id'; value: string } | null {
  if (isTelecomRole(role)) return { column: 'assigned_to', value: userId };
  if (isAstrologerRole(role)) return { column: 'astrologer_id', value: userId };
  return null;
}

export function canViewEnquiry(
  role: string | null | undefined,
  userId: string,
  enquiry: { assigned_to?: string | null; astrologer_id?: string | null }
) {
  if (isLeadManager(role) || role === 'support' || role === 'content' || role === 'finance' || role === 'inventory' || role === 'stock_manager') {
    return true;
  }
  if (isTelecomRole(role)) return enquiry.assigned_to === userId;
  if (isAstrologerRole(role)) return enquiry.astrologer_id === userId;
  return false;
}

/** Only leads manager assigns telecallers */
export function canAssignLeads(role: string | null | undefined) {
  return isLeadManager(role);
}

/** Only leads manager forwards verified leads to pandit/astrologer */
export function canForwardToAstrologer(role: string | null | undefined) {
  return isLeadManager(role);
}

/** Astrologer writes; manager may edit before sending to telecaller */
export function canEditRemedies(role: string | null | undefined) {
  return isLeadManager(role) || isAstrologerRole(role);
}

/** Manager sends final remedies back to the same telecaller */
export function canSendRemediesToTelecaller(role: string | null | undefined) {
  return isLeadManager(role);
}

export function canSetPipelineStage(role: string | null | undefined, stage: LeadPipelineStage) {
  if (isLeadManager(role) || role === 'support') return true;
  if (isTelecomRole(role)) return TELECOM_EDITABLE_STAGES.includes(stage);
  if (isAstrologerRole(role)) return ASTROLOGER_EDITABLE_STAGES.includes(stage);
  return false;
}

export function canEditBirthFields(role: string | null | undefined) {
  return isLeadManager(role) || isTelecomRole(role) || role === 'support';
}

export function canEditOutcomeFlags(role: string | null | undefined) {
  // ponytail: sale/outcome toggles are manager-only — telecaller uses call remarks
  return isLeadManager(role);
}

export function canAddRemarks(role: string | null | undefined) {
  return isLeadManager(role) || isTelecomRole(role) || role === 'support';
}
