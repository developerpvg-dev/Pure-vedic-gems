import type { ConfiguratorState } from '@/lib/types/configurator';
import type { ConfiguratorOptionRules } from '@/lib/utils/configurator-rules';
import {
  isCertificationStepAvailable,
  isEnergizationStepAvailable,
} from '@/lib/utils/configurator-rules';
import { isRudrakshaConfiguratorContext } from '@/lib/utils/rudraksha-design-rules';

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
  return false;
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
