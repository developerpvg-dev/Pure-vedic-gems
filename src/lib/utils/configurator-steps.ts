import type { ConfiguratorState } from '@/lib/types/configurator';
import { isRudrakshaConfiguratorContext } from '@/lib/utils/rudraksha-design-rules';

export function isConfiguratorStepSkipped(step: number, state: ConfiguratorState): boolean {
  if ((step === 4 || step === 5) && state.setting_type === 'loose') return true;
  if (
    step === 3 &&
    isRudrakshaConfiguratorContext(state.gem_category, state.selected_product)
  ) {
    return true;
  }
  return false;
}
