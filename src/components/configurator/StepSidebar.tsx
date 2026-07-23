'use client';

/**
 * StepSidebar — Vertical numbered step list for the configurator.
 * Shows current, completed, and future step states. On mobile, renders
 * as a horizontal scrollable strip at the top.
 */

import { Fragment } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONFIGURATOR_STEPS } from '@/lib/types/configurator';
import type { ConfiguratorState } from '@/lib/types/configurator';
import type { ConfiguratorOptionRules } from '@/lib/utils/configurator-rules';
import { isConfiguratorStepSkipped, getConfiguratorStepMeta } from '@/lib/utils/configurator-steps';
import { isRudrakshaConfiguratorContext } from '@/lib/utils/rudraksha-design-rules';

interface StepSidebarProps {
  state: ConfiguratorState;
  canGoToStep: (step: number) => boolean;
  onStepClick: (step: number) => void;
  startStep?: number;
  optionRules?: ConfiguratorOptionRules | null;
  /** When true renders a vertical sidebar list (desktop left column) */
  vertical?: boolean;
}

/** Human-readable summary of a completed step's selection */
function getStepValue(step: number, state: ConfiguratorState): string | null {
  switch (step) {
    case 1:
      return state.gem_category
        ? state.gem_category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : null;
    case 2: {
      if (!state.selected_product) return null;
      if (isRudrakshaConfiguratorContext(state.gem_category, state.selected_product)) {
        const comboCount = state.rudraksha_combo_products.filter(
          (item) => item.id !== state.selected_product?.id
        ).length;
        const beadCount = 1 + comboCount;
        return beadCount > 1
          ? `${beadCount} beads · ${state.selected_product.name}`
          : state.selected_product.name;
      }
      return state.selected_product.name;
    }
    case 3:
      return state.setting_type
        ? isRudrakshaConfiguratorContext(state.gem_category, state.selected_product)
          ? 'Rudraksha Pendant'
          : state.setting_type.charAt(0).toUpperCase() + state.setting_type.slice(1)
        : null;
    case 4:
      return state.selected_design?.name ?? (state.custom_design_url ? 'Custom Design' : null);
    case 5:
      return state.metal
        ? state.metal.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : null;
    case 6:
      return state.selected_lab?.name ?? (state.certification_skipped ? 'Without Certification' : null);
    case 7:
      // Don't label future steps as Skipped before the user reaches energization
      if (state.selected_energization?.name) return state.selected_energization.name;
      return state.current_step >= 7 ? 'Skipped' : null;
    default:
      return null;
  }
}

function isStepSkipped(
  step: number,
  state: ConfiguratorState,
  optionRules?: ConfiguratorOptionRules | null
): boolean {
  return isConfiguratorStepSkipped(step, state, optionRules);
}

function getVisibleSteps(
  startStep: number,
  state: ConfiguratorState,
  optionRules?: ConfiguratorOptionRules | null
) {
  return CONFIGURATOR_STEPS.filter(
    (step) => step.id >= startStep && !isStepSkipped(step.id, state, optionRules)
  );
}

function getDisplayStepNum(
  stepId: number,
  startStep: number,
  state: ConfiguratorState,
  optionRules?: ConfiguratorOptionRules | null
) {
  let count = 0;

  for (let step = startStep; step <= stepId; step += 1) {
    if (!isStepSkipped(step, state, optionRules)) {
      count += 1;
    }
  }

  return count;
}

export default function StepSidebar({
  state,
  canGoToStep,
  onStepClick,
  startStep = 1,
  optionRules = null,
  vertical = false,
}: StepSidebarProps) {
  const visibleSteps = getVisibleSteps(startStep, state, optionRules);

  // ── Vertical sidebar (desktop left panel) ────────────────────────────────
  if (vertical) {
    return (
      <nav className="flex flex-col px-4 py-3" aria-label="Configurator steps">
        {visibleSteps.map((step, idx) => {
          const isLast = idx === visibleSteps.length - 1;
          const isCurrent = state.current_step === step.id;
          const isCompleted = step.id < state.current_step;
          const value = getStepValue(step.id, state);
          const canClick = canGoToStep(step.id) && !isCurrent;
          const displayStepNum = getDisplayStepNum(step.id, startStep, state, optionRules);
          const stepMeta = getConfiguratorStepMeta(step.id, state);

          return (
            <div key={step.id} className="flex gap-3">
              {/* Step indicator + connector line */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => canClick && onStepClick(step.id)}
                  disabled={!canClick && !isCurrent}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    isCurrent && 'bg-accent text-white shadow-sm',
                    isCompleted && !isCurrent && 'bg-emerald-500 text-white',
                    !isCurrent && !isCompleted && 'bg-muted text-muted-foreground',
                    canClick && 'cursor-pointer hover:opacity-80'
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : displayStepNum}
                </button>
                {!isLast && (
                  <div className={cn(
                    'mt-0.5 w-px flex-1',
                    isCompleted ? 'bg-emerald-300' : 'bg-border/50'
                  )} style={{ minHeight: '20px' }} />
                )}
              </div>

              {/* Step title + value */}
              <div className={cn('pb-4 min-w-0', isLast && 'pb-1')}>
                <button
                  type="button"
                  onClick={() => canClick && onStepClick(step.id)}
                  disabled={!canClick && !isCurrent}
                  className={cn(
                    'text-left text-xs font-semibold leading-tight transition-colors',
                    isCurrent ? 'text-accent' : isCompleted ? 'text-emerald-700' : 'text-muted-foreground',
                    canClick && 'cursor-pointer hover:opacity-80'
                  )}
                >
                  {stepMeta.title}
                </button>
                {value && (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{value}</p>
                )}
              </div>
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <>
      {/* Desktop horizontal breadcrumb bar */}
      <nav className="hidden lg:flex items-center flex-wrap gap-0.5" aria-label="Configurator steps">
        {visibleSteps.map((step, idx) => {
          const isLast = idx === visibleSteps.length - 1;
          const displayStepNum = getDisplayStepNum(step.id, startStep, state, optionRules);
          const isCurrent = state.current_step === step.id;
          const isCompleted = step.id < state.current_step;
          const value = getStepValue(step.id, state);
          const canClick = canGoToStep(step.id) && !isCurrent;
          const stepMeta = getConfiguratorStepMeta(step.id, state);

          return (
            <Fragment key={step.id}>
              <button
                onClick={() => canClick && onStepClick(step.id)}
                disabled={!canClick && !isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${displayStepNum}: ${stepMeta.title}${value ? ` — ${value}` : ''}`}
                className={cn(
                  'group flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition-all duration-200 text-left',
                  isCurrent && 'border-accent/50 bg-accent/8 shadow-[0_3px_14px_rgba(201,168,76,0.18)]',
                  isCompleted && !isCurrent && 'border-border/50 bg-white/60',
                  !isCurrent && !isCompleted && 'border-transparent bg-transparent opacity-55',
                  canClick && 'cursor-pointer hover:opacity-100 hover:border-border/60 hover:bg-white/60',
                  !canClick && !isCurrent && 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-200',
                    isCurrent && 'bg-accent text-accent-foreground',
                    isCompleted && !isCurrent && 'bg-emerald-500 text-white',
                    !isCurrent && !isCompleted && 'bg-border/50 text-muted-foreground'
                  )}
                >
                  {isCompleted && !isCurrent ? <Check className="h-2.5 w-2.5" /> : displayStepNum}
                </span>

                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-[11px] font-semibold leading-tight truncate max-w-19',
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {stepMeta.short}
                  </p>
                  {value && !isCurrent && (
                    <p className="text-[9px] text-muted-foreground/65 truncate max-w-19 leading-tight">
                      {value}
                    </p>
                  )}
                </div>
              </button>

              {!isLast && (
                <ChevronRight className="h-3 w-3 shrink-0 text-border/40 flex-none" />
              )}
            </Fragment>
          );
        })}
      </nav>

      {/* Mobile horizontal step pills — with scroll fade indicators */}
      <div className="relative lg:hidden">
        <nav
          className="flex gap-2 overflow-x-auto pb-1.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          aria-label="Configurator steps"
        >
          {visibleSteps.map((step) => {
            const displayStepNum = getDisplayStepNum(
              step.id,
              startStep,
              state
            );
            const isCurrent = state.current_step === step.id;
            const isCompleted = step.id < state.current_step;
            const canClick = canGoToStep(step.id) && !isCurrent;
            const stepMeta = getConfiguratorStepMeta(step.id, state);

            return (
              <button
                key={step.id}
                onClick={() => canClick && onStepClick(step.id)}
                disabled={!canClick}
                className={cn(
                  'flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs font-medium whitespace-nowrap transition-colors',
                  isCurrent && 'border-accent bg-accent text-accent-foreground',
                  isCompleted && !isCurrent && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  !isCurrent && !isCompleted && 'border-border bg-white/80 text-muted-foreground',
                  canClick && 'cursor-pointer'
                )}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${displayStepNum}: ${stepMeta.title}`}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="font-semibold">{displayStepNum}</span>
                )}
                <span>{stepMeta.short}</span>
              </button>
            );
          })}
        </nav>
        {/* Right fade edge to hint more content */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-1.5 w-8 bg-linear-to-l from-background to-transparent" />
      </div>
    </>
  );
}
