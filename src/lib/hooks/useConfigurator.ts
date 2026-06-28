'use client';

/**
 * useConfigurator — State machine hook for the 7-Step Gem-to-Jewelry Configurator.
 * Manages step navigation, selections, pricing calculations, and localStorage persistence.
 */

import { useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  ConfiguratorState,
  ConfiguratorAction,
  ConfigPricingBreakdown,
  GoldRateData,
} from '@/lib/types/configurator';
import { resolveProductDisplayPrice } from '@/lib/shop/product-pricing';
import { getDesignConfiguratorNote, getStoneAddonLabelFromDesign } from '@/lib/utils/jewelry-design-fields';
import { calculateJewelryDesignPricing, getDesignWideDiamondCharge } from '@/lib/utils/jewelry-pricing';
import {
  resolveLaborRatesForJewelry,
  type JewelrySettingMetalProfiles,
} from '@/lib/utils/jewelry-setting-metal-profiles';
import { resolveMetalRatePerGram } from '@/lib/hooks/useManualMetalPrices';
import {
  isRudrakshaConfiguratorContext,
} from '@/lib/utils/rudraksha-design-rules';

const DEFAULT_STORAGE_KEY = 'pvg_configurator:full';

const EMPTY_PRICING: ConfigPricingBreakdown = {
  gem_price: 0,
  making_charge: 0,
  diamond_charge: 0,
  stone_addon_label: null,
  design_note: null,
  metal_price: 0,
  metal_weight_grams: 0,
  gold_rate_per_gram: 0,
  labor_rate_percent: 0,
  jewelry_pricing_mode: null,
  certification_fee: 0,
  energization_fee: 0,
  custom_design_fee: 0,
  total: 0,
};

export function createConfiguratorState(
  overrides: Partial<ConfiguratorState> = {}
): ConfiguratorState {
  return {
    current_step: 1,
    gem_category: null,
    selected_product: null,
    setting_type: null,
    selected_design: null,
    custom_design_url: null,
    metal: null,
    ring_size: null,
    chain_length: null,
    selected_lab: null,
    certification_skipped: false,
    selected_energization: null,
    energization_form: null,
    pricing: { ...EMPTY_PRICING, ...(overrides.pricing ?? {}) },
    ...overrides,
  };
}

export const INITIAL_STATE: ConfiguratorState = createConfiguratorState();

function cloneConfiguratorState(state: ConfiguratorState): ConfiguratorState {
  return createConfiguratorState({
    ...state,
    pricing: { ...state.pricing },
  });
}

/** Drop selections that no longer match the current setting (e.g. pendant design + ring setting). */
export function sanitizeConfiguratorSelections(
  state: ConfiguratorState
): ConfiguratorState {
  const next = cloneConfiguratorState(state);

  if (
    next.selected_design &&
    next.setting_type &&
    next.selected_design.setting_type !== next.setting_type
  ) {
    next.selected_design = null;
  }

  if (next.setting_type === 'loose') {
    next.selected_design = null;
    next.custom_design_url = null;
    next.metal = null;
    next.ring_size = null;
    next.chain_length = null;
  } else {
    if (next.setting_type !== 'ring') next.ring_size = null;
    if (next.setting_type !== 'pendant') next.chain_length = null;
  }

  return next;
}

export function isDesignCompatibleWithSetting(
  state: ConfiguratorState
): boolean {
  if (!state.selected_design || !state.setting_type) return true;
  return state.selected_design.setting_type === state.setting_type;
}

function mergeHydratedState(
  saved: ConfiguratorState,
  initialState: ConfiguratorState
): ConfiguratorState {
  const selectedProductId = initialState.selected_product?.id;

  if (!selectedProductId) {
    return sanitizeConfiguratorSelections(cloneConfiguratorState(saved));
  }

  if (saved.selected_product?.id && saved.selected_product.id !== selectedProductId) {
    return cloneConfiguratorState(initialState);
  }

  return sanitizeConfiguratorSelections(
    createConfiguratorState({
      ...saved,
      current_step: Math.max(initialState.current_step, saved.current_step),
      gem_category: initialState.gem_category,
      selected_product: initialState.selected_product,
      pricing: { ...saved.pricing },
    })
  );
}

interface UseConfiguratorOptions {
  initialState?: ConfiguratorState;
  storageKey?: string;
  laborRates?: Record<string, number> | null;
  pricingModes?: Record<string, 'weight' | 'fixed_sheet'> | null;
  ratesBySlug?: Record<string, number> | null;
  settingProfiles?: JewelrySettingMetalProfiles | null;
}

/**
 * If setting is 'loose', skip design + metal steps (4 & 5).
 * Rudraksha flow skips setting-type step (3) — mountings are always pendant.
 */
function getNextStep(step: number, state: ConfiguratorState): number {
  const rudraksha = isRudrakshaConfiguratorContext(
    state.gem_category,
    state.selected_product
  );
  if (step === 3 && state.setting_type === 'loose') return 6;
  if (step === 2 && rudraksha) return 4;
  return Math.min(step + 1, 7);
}

function getPrevStep(step: number, state: ConfiguratorState): number {
  const rudraksha = isRudrakshaConfiguratorContext(
    state.gem_category,
    state.selected_product
  );
  if (step === 6 && state.setting_type === 'loose') return 3;
  if (step === 4 && rudraksha) return 2;
  return Math.max(step - 1, 1);
}

/** Recalculate pricing from current state selections */
function recalcPricing(
  state: ConfiguratorState,
  goldRate?: GoldRateData | null,
  laborRates?: Record<string, number> | null,
  pricingModes?: Record<string, 'weight' | 'fixed_sheet'> | null,
  ratesBySlug?: Record<string, number> | null,
  settingProfiles?: JewelrySettingMetalProfiles | null
): ConfigPricingBreakdown {
  const gemPrice = state.selected_product
    ? resolveProductDisplayPrice(state.selected_product) ?? 0
    : 0;

  let makingCharge = 0;
  let diamondCharge = 0;
  let metalPrice = 0;
  let metalWeightGrams = 0;
  let goldRatePerGram = 0;
  let laborRatePercent = 0;
  let jewelryPricingMode: 'weight' | 'fixed' | null = null;
  let stoneAddonLabel: string | null = null;
  let designNote: string | null = null;

  if (state.selected_design) {
    diamondCharge = getDesignWideDiamondCharge(state.selected_design.diamond_charges);
    stoneAddonLabel = getStoneAddonLabelFromDesign(state.selected_design);
    designNote = getDesignConfiguratorNote(state.selected_design);
  }

  if (state.selected_design && state.metal && goldRate) {
    goldRatePerGram = resolveMetalRatePerGram(state.metal, goldRate, ratesBySlug);

    const effectiveLaborRates = resolveLaborRatesForJewelry(
      state.setting_type,
      state.selected_design,
      settingProfiles,
      state.selected_product?.category === 'rudraksha' ? 'rudraksha' : 'gemstone'
    );

    const breakdown = calculateJewelryDesignPricing({
      metal: state.metal,
      makingCharges: state.selected_design.making_charges,
      estimatedMetalWeight: state.selected_design.estimated_metal_weight,
      diamondCharges: state.selected_design.diamond_charges,
      metalRatePerGram: goldRatePerGram,
      laborRates: effectiveLaborRates,
      pricingModes,
    });
    makingCharge = breakdown.makingCharge;
    diamondCharge = breakdown.diamondCharge;
    metalPrice = breakdown.metalPrice;
    metalWeightGrams = breakdown.metalWeightGrams;
    laborRatePercent = breakdown.laborRatePercent;
    jewelryPricingMode = breakdown.pricingKind;
    stoneAddonLabel = getStoneAddonLabelFromDesign(state.selected_design);
  }

  const certificationFee = state.selected_lab?.extra_charge ?? 0;
  const energizationFee = state.selected_energization?.price ?? 0;
  const customDesignFee = 0;

  const total =
    gemPrice +
    makingCharge +
    diamondCharge +
    metalPrice +
    certificationFee +
    energizationFee +
    customDesignFee;

  return {
    gem_price: gemPrice,
    making_charge: makingCharge,
    diamond_charge: diamondCharge,
    stone_addon_label: stoneAddonLabel,
    design_note: designNote,
    metal_price: metalPrice,
    metal_weight_grams: metalWeightGrams,
    gold_rate_per_gram: goldRatePerGram,
    labor_rate_percent: laborRatePercent,
    jewelry_pricing_mode: jewelryPricingMode,
    certification_fee: certificationFee,
    energization_fee: energizationFee,
    custom_design_fee: customDesignFee,
    total,
  };
}

function createConfiguratorReducer(initialState: ConfiguratorState) {
  return function configuratorReducer(
    state: ConfiguratorState,
    action: ConfiguratorAction
  ): ConfiguratorState {
    switch (action.type) {
      case 'SET_CATEGORY':
        return {
          ...state,
          gem_category: action.payload,
          // Reset downstream selections when category changes
          selected_product: null,
          setting_type: null,
          selected_design: null,
          custom_design_url: null,
          metal: null,
          ring_size: null,
          chain_length: null,
          selected_lab: null,
          certification_skipped: false,
          selected_energization: null,
          energization_form: null,
          pricing: { ...EMPTY_PRICING },
        };

      case 'SET_PRODUCT': {
        const rudraksha = isRudrakshaConfiguratorContext(
          state.gem_category,
          action.payload
        );
        return {
          ...state,
          selected_product: action.payload,
          ...(rudraksha
            ? {
                setting_type: 'pendant' as const,
                selected_design: null,
                custom_design_url: null,
                metal: null,
                chain_length: null,
              }
            : {}),
        };
      }

      case 'SET_SETTING_TYPE':
        return {
          ...state,
          setting_type: action.payload,
          // Reset downstream if setting type changes
          selected_design: null,
          custom_design_url: null,
          metal: null,
          ring_size: null,
          chain_length: null,
        };

      case 'SET_DESIGN':
        return {
          ...state,
          selected_design: action.payload,
          custom_design_url: null,
        };

      case 'SET_CUSTOM_DESIGN_URL':
        return {
          ...state,
          custom_design_url: action.payload,
          selected_design: null,
        };

      case 'SET_METAL':
        return { ...state, metal: action.payload };

      case 'SET_RING_SIZE':
        return { ...state, ring_size: action.payload };

      case 'SET_CHAIN_LENGTH':
        return { ...state, chain_length: action.payload };

      case 'SET_LAB':
        return { ...state, selected_lab: action.payload, certification_skipped: false };

      case 'SKIP_CERTIFICATION':
        return { ...state, selected_lab: null, certification_skipped: true };

      case 'SET_ENERGIZATION':
        return {
          ...state,
          selected_energization: action.payload,
          energization_form: action.payload ? state.energization_form : null,
        };

      case 'SET_ENERGIZATION_FORM':
        return { ...state, energization_form: action.payload };

      case 'GO_TO_STEP':
        return { ...state, current_step: Math.max(1, Math.min(7, action.payload)) };

      case 'NEXT_STEP':
        return {
          ...state,
          current_step: getNextStep(state.current_step, state),
        };

      case 'PREV_STEP':
        return {
          ...state,
          current_step: getPrevStep(state.current_step, state),
        };

      case 'RESET':
        return cloneConfiguratorState(initialState);

      case 'HYDRATE':
        return sanitizeConfiguratorSelections(cloneConfiguratorState(action.payload));

      default:
        return state;
    }
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/** Validate a saved state is structurally sound before hydrating */
function isValidSavedState(s: unknown): s is ConfiguratorState {
  if (!s || typeof s !== 'object') return false;
  const obj = s as Record<string, unknown>;
  return (
    typeof obj.current_step === 'number' &&
    obj.current_step >= 1 &&
    obj.current_step <= 7 &&
    'gem_category' in obj &&
    'pricing' in obj &&
    typeof obj.pricing === 'object'
  );
}

export function useConfigurator(
  goldRate: GoldRateData | null,
  options: UseConfiguratorOptions = {}
) {
  const initialStateRef = useRef(
    cloneConfiguratorState(options.initialState ?? INITIAL_STATE)
  );
  const storageKeyRef = useRef(options.storageKey ?? DEFAULT_STORAGE_KEY);
  const initialState = initialStateRef.current;
  const storageKey = storageKeyRef.current;
  const reducer = useMemo(
    () => createConfiguratorReducer(initialState),
    [initialState]
  );
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrationComplete = useRef(false);
  const skipInitialPersist = useRef(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (isValidSavedState(saved)) {
          dispatch({
            type: 'HYDRATE',
            payload: mergeHydratedState(saved, initialState),
          });
        }
      }
    } catch {
      // corrupt data — ignore
    } finally {
      hydrationComplete.current = true;
    }
  }, [initialState, storageKey]);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrationComplete.current) return;
    if (skipInitialPersist.current) {
      skipInitialPersist.current = false;
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // storage full — ignore
    }
  }, [state, storageKey]);

  const laborRatesRef = useRef(options.laborRates ?? null);
  const pricingModesRef = useRef(options.pricingModes ?? null);
  const ratesBySlugRef = useRef(options.ratesBySlug ?? null);
  const settingProfilesRef = useRef(options.settingProfiles ?? null);
  laborRatesRef.current = options.laborRates ?? null;
  pricingModesRef.current = options.pricingModes ?? null;
  ratesBySlugRef.current = options.ratesBySlug ?? null;
  settingProfilesRef.current = options.settingProfiles ?? null;

  const pricing = useMemo(
    () =>
      recalcPricing(
        state,
        goldRate,
        laborRatesRef.current,
        pricingModesRef.current,
        ratesBySlugRef.current,
        settingProfilesRef.current
      ),
    // Only recalc when the specific fields that affect pricing change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      state.selected_product?.price,
      state.selected_design?.id,
      state.selected_design?.labor_rates,
      state.metal,
      state.selected_lab?.extra_charge,
      state.selected_energization?.price,
      state.setting_type,
      options.settingProfiles,
      goldRate?.gold_22k_per_gram,
      goldRate?.gold_18k_per_gram,
      goldRate?.gold_14k_per_gram,
      goldRate?.platinum_per_gram,
      goldRate?.silver_per_gram,
      goldRate?.panchdhatu_per_gram,
      options.laborRates,
      options.pricingModes,
      options.ratesBySlug,
    ]
  );

  const stateWithPricing: ConfiguratorState = useMemo(
    () => ({ ...state, pricing }),
    [state, pricing]
  );

  // Helper: check if a completed step can be navigated to
  const canGoToStep = useCallback(
    (step: number): boolean => {
      if (step === 1) return true;
      if (step === 2) return !!state.gem_category;
      if (step === 3) return !!state.selected_product;
      if (step === 4) return !!state.setting_type && state.setting_type !== 'loose';
      if (step === 5) return !!state.selected_design || !!state.custom_design_url;
      if (step === 6) {
        if (state.setting_type === 'loose') return !!state.setting_type;
        return !!state.metal;
      }
      if (step === 7) return !!state.selected_lab || state.certification_skipped;
      return false;
    },
    [
      state.gem_category,
      state.selected_product,
      state.setting_type,
      state.selected_design,
      state.custom_design_url,
      state.metal,
      state.selected_lab,
      state.certification_skipped,
    ]
  );

  // Check whether current step is valid to proceed
  const canProceed = useCallback((): boolean => {
    switch (state.current_step) {
      case 1:
        return !!state.gem_category;
      case 2:
        return !!state.selected_product;
      case 3:
        return !!state.setting_type;
      case 4:
        return (
          (!!state.selected_design && isDesignCompatibleWithSetting(state)) ||
          !!state.custom_design_url
        );
      case 5:
        return !!state.metal && (
          state.setting_type === 'pendant'
            ? !!state.chain_length
            : state.setting_type === 'ring'
              ? !!state.ring_size
              : true // bracelet — no extra size needed
        );
      case 6:
        return !!state.selected_lab || state.certification_skipped;
      case 7:
        return true; // energization is optional
      default:
        return false;
    }
  }, [
    state.current_step,
    state.gem_category,
    state.selected_product,
    state.setting_type,
    state.selected_design,
    state.custom_design_url,
    state.metal,
    state.chain_length,
    state.ring_size,
    state.selected_lab,
    state.certification_skipped,
  ]);

  const isComplete = useCallback((): boolean => {
    const hasGem = !!state.selected_product;
    const hasLab = !!state.selected_lab || state.certification_skipped;

    if (state.setting_type === 'loose') {
      return hasGem && hasLab;
    }

    const hasValidDesign =
      !!state.custom_design_url ||
      (!!state.selected_design && isDesignCompatibleWithSetting(state));

    return (
      hasGem &&
      !!state.setting_type &&
      hasValidDesign &&
      !!state.metal &&
      hasLab &&
      (state.setting_type === 'ring'
        ? !!state.ring_size
        : state.setting_type === 'pendant'
          ? !!state.chain_length
          : true)
    );
  }, [
    state.selected_product,
    state.selected_lab,
    state.certification_skipped,
    state.setting_type,
    state.selected_design,
    state.custom_design_url,
    state.metal,
    state.ring_size,
    state.chain_length,
  ]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }, [storageKey]);

  return {
    state: stateWithPricing,
    dispatch,
    canGoToStep,
    canProceed,
    isComplete,
    reset,
  };
}
