import { createConfiguratorState } from '@/lib/hooks/useConfigurator';
import { parseConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';
import { isRudrakshaConfiguratorContext } from '@/lib/utils/rudraksha-design-rules';
import type { CartItem } from '@/lib/types/cart';
import type { ProductCard } from '@/lib/types/product';
import type {
  ConfiguratorState,
  CustomDesignBrief,
  GemCategory,
  MetalId,
  SettingType,
} from '@/lib/types/configurator';
import type {
  CertificationLab,
  EnergizationOption,
  JewelryDesign,
} from '@/lib/types/database';

const SETTING_TYPES = new Set(['ring', 'pendant', 'bracelet', 'loose']);

function asSettingType(value: string | null | undefined): SettingType | null {
  if (!value || !SETTING_TYPES.has(value)) return null;
  return value as SettingType;
}

/** Build a configurator draft from a cart line so Edit opens the same selections. */
export function buildConfiguratorStateFromCartItem(
  product: ProductCard,
  cartItem: CartItem
): ConfiguratorState | null {
  if (!cartItem.configuration_id) return null;
  const snap = parseConfigurationSnapshot(cartItem.configuration_snapshot);
  if (!snap?.selections) return null;

  const sel = snap.selections;
  const settingType = asSettingType(sel.setting_type ?? null);
  const rudraksha = isRudrakshaConfiguratorContext(null, product);
  const category: GemCategory = rudraksha
    ? 'rudraksha'
    : product.sub_category || product.category || 'other';

  const designStub = sel.design?.id
    ? ({
        id: sel.design.id,
        name: sel.design.name ?? 'Design',
        setting_type: settingType ?? 'ring',
        rudraksha_category: sel.design.rudraksha_category ?? null,
        making_charges: {},
        estimated_metal_weight: {},
        diamond_charges: {},
        labor_rates: {},
        is_active: true,
      } as unknown as JewelryDesign)
    : null;

  const labStub = sel.certification?.id
    ? ({
        id: sel.certification.id,
        name: sel.certification.name ?? 'Lab',
        extra_charge: Number(snap.pricing?.certification_fee ?? 0),
        is_active: true,
      } as unknown as CertificationLab)
    : null;

  const energizationStub = sel.energization?.id
    ? ({
        id: sel.energization.id,
        name: sel.energization.name ?? 'Energization',
        price: Number(snap.pricing?.energization_fee ?? 0),
        is_active: true,
      } as unknown as EnergizationOption)
    : null;

  const brief = sel.custom_design_brief as CustomDesignBrief | null | undefined;

  return createConfiguratorState({
    current_step: 7,
    gem_category: category,
    selected_product: product,
    setting_type: settingType ?? (rudraksha ? 'pendant' : null),
    selected_design: designStub,
    custom_design_url: sel.custom_design_url ?? null,
    custom_design_brief: brief ?? null,
    rudraksha_combo_products: [],
    metal: (sel.metal as MetalId | null | undefined) ?? null,
    ring_size: sel.ring_size ?? null,
    chain_length: sel.chain_length ?? null,
    selected_lab: labStub,
    certification_skipped: Boolean(sel.certification_skipped),
    selected_energization: energizationStub,
    energization_form: sel.energization_form
      ? {
          dob: sel.energization_form.dob,
          birth_time: sel.energization_form.birth_time ?? '',
          birth_place: sel.energization_form.birth_place ?? '',
          gotra: sel.energization_form.gotra,
          rashi: sel.energization_form.rashi ?? '',
          record_ceremony: Boolean(sel.energization_form.record_ceremony),
        }
      : null,
  });
}

export function writeConfiguratorDraft(storageKey: string, state: ConfiguratorState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function productConfiguratorStorageKey(productId: string, adminPos = false) {
  return adminPos
    ? `pvg_configurator:admin-pos:${productId}`
    : `pvg_configurator:product:${productId}`;
}
