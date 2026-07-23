import type { ConfiguratorState } from '@/lib/types/configurator';
import { CONFIGURATOR_STEPS } from '@/lib/types/configurator';
import type { ConfiguratorOptionRules } from '@/lib/utils/configurator-rules';
import {
  isCertificationStepAvailable,
  isEnergizationStepAvailable,
} from '@/lib/utils/configurator-rules';
import { isRudrakshaConfiguratorContext } from '@/lib/utils/rudraksha-design-rules';

const RUDRAKSHA_STEP_LABELS: Record<number, { title: string; short: string }> = {
  1: { title: 'Rudraksha Type', short: 'Bead Type' },
  2: { title: 'Choose Beads', short: 'Your Beads' },
  4: { title: 'Pendant Design', short: 'Mounting' },
  5: { title: 'Metal & Chain', short: 'Metal & Chain' },
  6: { title: 'Certification', short: 'Certification' },
};

export function getConfiguratorStepMeta(
  stepId: number,
  state: Pick<ConfiguratorState, 'gem_category' | 'selected_product'>
): { title: string; short: string } {
  const defaultStep = CONFIGURATOR_STEPS.find((step) => step.id === stepId);
  const fallback = defaultStep
    ? { title: defaultStep.title, short: defaultStep.short }
    : { title: 'Configure', short: 'Step' };

  if (!isRudrakshaConfiguratorContext(state.gem_category, state.selected_product)) {
    return fallback;
  }

  return RUDRAKSHA_STEP_LABELS[stepId] ?? fallback;
}

export function isConfiguratorStepSkipped(
  step: number,
  state: ConfiguratorState,
  optionRules?: ConfiguratorOptionRules | null
): boolean {
  if ((step === 4 || step === 5) && state.setting_type === 'loose') return true;
  if (
    step === 3 &&
    isRudrakshaConfiguratorContext(state.gem_category, state.selected_product)
  ) {
    return true;
  }
  if (step === 6 && !isCertificationStepAvailable(optionRules ?? null)) {
    return true;
  }
  if (step === 7 && !isEnergizationStepAvailable(optionRules ?? null)) {
    return true;
  }
  if (
    step === 7 &&
    isRudrakshaConfiguratorContext(state.gem_category, state.selected_product)
  ) {
    return true;
  }
  return false;
}

/** Last non-skipped step id — Add to Cart only after the user reaches this. */
export function getConfiguratorLastVisibleStep(
  startStep: number,
  state: ConfiguratorState,
  optionRules?: ConfiguratorOptionRules | null
): number {
  let last = startStep;
  for (let step = startStep; step <= 7; step += 1) {
    if (!isConfiguratorStepSkipped(step, state, optionRules)) {
      last = step;
    }
  }
  return last;
}

function advancePastSkippedSteps(
  step: number,
  state: ConfiguratorState,
  optionRules: ConfiguratorOptionRules | null | undefined,
  direction: 1 | -1
) {
  let candidate = step;
  while (
    candidate >= 1 &&
    candidate <= 7 &&
    isConfiguratorStepSkipped(candidate, state, optionRules)
  ) {
    candidate += direction;
  }
  return Math.max(1, Math.min(candidate, 7));
}

export function getConfiguratorNextStep(
  step: number,
  state: ConfiguratorState,
  optionRules?: ConfiguratorOptionRules | null
): number {
  const rudraksha = isRudrakshaConfiguratorContext(
    state.gem_category,
    state.selected_product
  );

  let candidate: number;
  if (step === 3 && state.setting_type === 'loose') {
    candidate = 6;
  } else if (step === 2 && rudraksha) {
    candidate = 4;
  } else {
    candidate = Math.min(step + 1, 7);
  }

  return advancePastSkippedSteps(candidate, state, optionRules, 1);
}

export function getConfiguratorPrevStep(
  step: number,
  state: ConfiguratorState,
  optionRules?: ConfiguratorOptionRules | null
): number {
  const rudraksha = isRudrakshaConfiguratorContext(
    state.gem_category,
    state.selected_product
  );

  let candidate: number;
  if (step === 6 && state.setting_type === 'loose') {
    candidate = 3;
  } else if (step === 4 && rudraksha) {
    candidate = 2;
  } else {
    candidate = Math.max(step - 1, 1);
  }

  return advancePastSkippedSteps(candidate, state, optionRules, -1);
}
