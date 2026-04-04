'use client';

/**
 * Configurator Client Page — wraps the state machine hook + components.
 * Product-routed sessions start at "Choose Setting Type" with the stone pre-selected.
 */

import { useMemo } from 'react';
import { useGoldRate } from '@/lib/hooks/useGoldRate';
import {
  createConfiguratorState,
  useConfigurator,
} from '@/lib/hooks/useConfigurator';
import ConfiguratorWrapper from '@/components/configurator/ConfiguratorWrapper';
import type { ProductCard } from '@/lib/types/product';
import type { ConfiguratorState, GemCategory } from '@/lib/types/configurator';

interface ConfiguratorClientProps {
  /** Pre-selected product (routed from PDP "Configure" button) */
  preselectedProduct?: ProductCard | null;
}

interface ConfiguratorSessionProps {
  initialState: ConfiguratorState;
  startStep: number;
  storageKey: string;
}

function ConfiguratorSession({
  initialState,
  startStep,
  storageKey,
}: ConfiguratorSessionProps) {
  const { goldRate } = useGoldRate();
  const { state, dispatch, canGoToStep, canProceed, isComplete, reset } =
    useConfigurator(goldRate, { initialState, storageKey });

  return (
    <ConfiguratorWrapper
      state={state}
      dispatch={dispatch}
      canGoToStep={canGoToStep}
      canProceed={canProceed}
      isComplete={isComplete}
      reset={reset}
      goldRate={goldRate}
      startStep={startStep}
    />
  );
}

export default function ConfiguratorClient({
  preselectedProduct,
}: ConfiguratorClientProps) {
  const session = useMemo(() => {
    if (!preselectedProduct) {
      return {
        key: 'full',
        initialState: createConfiguratorState(),
        startStep: 1,
        storageKey: 'pvg_configurator:full',
      };
    }

    const category: GemCategory =
      preselectedProduct.sub_category || preselectedProduct.category || 'other';

    return {
      key: `product:${preselectedProduct.id}`,
      initialState: createConfiguratorState({
        current_step: 3,
        gem_category: category,
        selected_product: preselectedProduct,
      }),
      startStep: 3,
      storageKey: `pvg_configurator:product:${preselectedProduct.id}`,
    };
  }, [preselectedProduct]);

  return (
    <ConfiguratorSession
      key={session.key}
      initialState={session.initialState}
      startStep={session.startStep}
      storageKey={session.storageKey}
    />
  );
}
