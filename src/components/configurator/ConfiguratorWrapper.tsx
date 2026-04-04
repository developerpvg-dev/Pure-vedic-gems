'use client';

/**
 * ConfiguratorWrapper — fixed responsive configurator shell.
 * Desktop uses a 3-column layout: steps, content, and live pricing summary.
 * Mobile/tablet prioritizes a phone-friendly stacked flow with sticky actions.
 */

import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';
import type {
  ConfiguratorAction,
  ConfiguratorState,
  GoldRateData,
} from '@/lib/types/configurator';
import { CONFIGURATOR_STEPS } from '@/lib/types/configurator';

import PriceSummary from './PriceSummary';
import StepSidebar from './StepSidebar';
import CertificationSelector from './steps/CertificationSelector';
import DesignSelector from './steps/DesignSelector';
import EnergizationSelector from './steps/EnergizationSelector';
import GemBrowser from './steps/GemBrowser';
import GemCategorySelector from './steps/GemCategorySelector';
import MetalSizeSelector from './steps/MetalSizeSelector';
import SettingTypeSelector from './steps/SettingTypeSelector';

const STEP_DESCRIPTIONS: Record<number, string> = {};

void STEP_DESCRIPTIONS;

function isStepSkipped(step: number, settingType: string | null): boolean {
  return (step === 4 || step === 5) && settingType === 'loose';
}

function getTotalVisibleSteps(startStep: number, settingType: string | null): number {
  let count = 0;

  for (let step = startStep; step <= 7; step += 1) {
    if (!isStepSkipped(step, settingType)) {
      count += 1;
    }
  }

  return count;
}

function getDisplayStepForState(
  stepId: number,
  startStep: number,
  settingType: string | null
): number {
  let count = 0;

  for (let step = startStep; step <= stepId; step += 1) {
    if (!isStepSkipped(step, settingType)) {
      count += 1;
    }
  }

  return count;
}

function getSelectedProductImage(state: ConfiguratorState): string | null {
  const product = state.selected_product;

  if (!product) {
    return null;
  }

  if (product.thumbnail_url) {
    return product.thumbnail_url;
  }

  const images = product.images;
  return Array.isArray(images) && images.length > 0 ? (images[0] as string) : null;
}

interface ConfiguratorWrapperProps {
  state: ConfiguratorState;
  dispatch: Dispatch<ConfiguratorAction>;
  canGoToStep: (step: number) => boolean;
  canProceed: () => boolean;
  isComplete: () => boolean;
  reset: () => void;
  goldRate: GoldRateData | null;
  startStep?: number;
}

export default function ConfiguratorWrapper({
  state,
  dispatch,
  canGoToStep,
  canProceed,
  isComplete,
  reset,
  goldRate,
  startStep = 1,
}: ConfiguratorWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [priceMobileOpen, setPriceMobileOpen] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const handleStepClick = useCallback(
    (step: number) => {
      if (step < startStep) {
        return;
      }

      if (canGoToStep(step) && !isStepSkipped(step, state.setting_type)) {
        setPriceMobileOpen(false);
        dispatch({ type: 'GO_TO_STEP', payload: step });
      }
    },
    [canGoToStep, dispatch, startStep, state.setting_type]
  );

  const handleNext = useCallback(() => {
    setPriceMobileOpen(false);
    dispatch({ type: 'NEXT_STEP' });
  }, [dispatch]);

  const handlePrev = useCallback(() => {
    if (state.current_step <= startStep) {
      return;
    }

    setPriceMobileOpen(false);
    dispatch({ type: 'PREV_STEP' });
  }, [dispatch, startStep, state.current_step]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      // Only honour dominant horizontal swipes ≥ 60 px
      if (Math.abs(deltaX) < 60 || deltaY > Math.abs(deltaX) * 0.75) return;
      if (deltaX < 0 && canProceed()) {
        handleNext();
      } else if (deltaX > 0 && state.current_step > startStep) {
        handlePrev();
      }
    },
    [canProceed, handleNext, handlePrev, startStep, state.current_step]
  );

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.current_step]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const renderStep = () => {
    switch (state.current_step) {
      case 1:
        return (
          <GemCategorySelector
            selected={state.gem_category}
            onSelect={(category) => {
              dispatch({ type: 'SET_CATEGORY', payload: category });
              dispatch({ type: 'NEXT_STEP' });
            }}
          />
        );
      case 2:
        return (
          <GemBrowser
            category={state.gem_category!}
            selected={state.selected_product}
            onSelect={(product) => {
              dispatch({ type: 'SET_PRODUCT', payload: product });
              dispatch({ type: 'NEXT_STEP' });
            }}
          />
        );
      case 3:
        return (
          <SettingTypeSelector
            selected={state.setting_type}
            onSelect={(settingType) => {
              dispatch({ type: 'SET_SETTING_TYPE', payload: settingType });
              dispatch({ type: 'NEXT_STEP' });
            }}
          />
        );
      case 4:
        return (
          <DesignSelector
            settingType={state.setting_type!}
            selected={state.selected_design}
            customDesignUrl={state.custom_design_url}
            onSelectDesign={(design) => {
              dispatch({ type: 'SET_DESIGN', payload: design });
              dispatch({ type: 'NEXT_STEP' });
            }}
            onCustomDesignUpload={(url) => {
              dispatch({ type: 'SET_CUSTOM_DESIGN_URL', payload: url });
              dispatch({ type: 'NEXT_STEP' });
            }}
          />
        );
      case 5:
        return (
          <MetalSizeSelector
            settingType={state.setting_type!}
            metal={state.metal}
            ringSize={state.ring_size}
            chainLength={state.chain_length}
            goldRate={goldRate}
            selectedDesign={state.selected_design}
            onMetalChange={(metal) => dispatch({ type: 'SET_METAL', payload: metal })}
            onRingSizeChange={(size) => dispatch({ type: 'SET_RING_SIZE', payload: size })}
            onChainLengthChange={(length) =>
              dispatch({ type: 'SET_CHAIN_LENGTH', payload: length })
            }
          />
        );
      case 6:
        return (
          <CertificationSelector
            selected={state.selected_lab}
            certificationSkipped={state.certification_skipped}
            onSelect={(lab) => {
              dispatch({ type: 'SET_LAB', payload: lab });
              dispatch({ type: 'NEXT_STEP' });
            }}
            onSkip={() => {
              dispatch({ type: 'SKIP_CERTIFICATION' });
              dispatch({ type: 'NEXT_STEP' });
            }}
          />
        );
      case 7:
        return (
          <EnergizationSelector
            selected={state.selected_energization}
            energizationForm={state.energization_form}
            onSelect={(option) => dispatch({ type: 'SET_ENERGIZATION', payload: option })}
            onFormChange={(form) =>
              dispatch({ type: 'SET_ENERGIZATION_FORM', payload: form })
            }
          />
        );
      default:
        return null;
    }
  };

  const complete = isComplete();
  const pricing = state.pricing;
  const totalSteps = getTotalVisibleSteps(startStep, state.setting_type);
  const currentDisplayNum = getDisplayStepForState(
    state.current_step,
    startStep,
    state.setting_type
  );
  const currentStepMeta = CONFIGURATOR_STEPS.find(
    (step) => step.id === state.current_step
  );
  const selectedProductImage = getSelectedProductImage(state);
  const progressPct = Math.round((currentDisplayNum / totalSteps) * 100);
  const visibleSteps = CONFIGURATOR_STEPS.filter(
    (step) => step.id >= startStep && !isStepSkipped(step.id, state.setting_type)
  );
  const canGoBack = state.current_step > startStep;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[3px]"
        onClick={() => window.history.back()}
      />

      <div className="pointer-events-none fixed inset-x-0 bottom-0 top-24 z-50 sm:inset-4 sm:top-24 lg:inset-x-6 lg:bottom-6 lg:top-28">
        <div className="mx-auto flex h-full max-w-265 items-stretch">
          <div
            className={cn(
              'pointer-events-auto flex h-full w-full flex-col overflow-hidden',
              'rounded-t-[28px] border border-border/70 shadow-[0_28px_80px_rgba(44,30,17,0.24)]',
              'sm:rounded-[30px]'
            )}
            style={{
              background:
                'linear-gradient(180deg, rgba(255,250,242,0.98) 0%, rgba(255,245,233,0.98) 100%)',
            }}
          >
            {/* ── Mobile header: slim single-row + progress dots ── */}
            <div
              className="shrink-0 lg:hidden"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,248,239,0.88) 100%)',
              }}
            >
              {/* Top action row */}
              <div className="flex items-center gap-1.5 px-3 py-2.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!canGoBack}
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-white/80 text-muted-foreground transition',
                    canGoBack
                      ? 'hover:border-accent/40 hover:text-primary'
                      : 'cursor-not-allowed opacity-30'
                  )}
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1 text-center">
                  <p className="text-[11px] font-semibold uppercase leading-none tracking-[0.18em] text-accent">
                    Step {currentDisplayNum} of {totalSteps}
                  </p>
                  <p className="mt-0.5 truncate font-heading text-sm font-semibold leading-tight text-primary">
                    {currentStepMeta?.title ?? 'Configure'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-white/80 text-muted-foreground transition hover:border-accent/40 hover:text-primary"
                  aria-label="Restart"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-white/80 text-muted-foreground transition hover:border-accent/40 hover:text-primary"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress dots — tap to jump to completed steps */}
              <div
                className="flex items-center justify-center gap-1.5 px-4 pb-2.5 pt-0"
                aria-hidden="true"
              >
                {visibleSteps.map((step) => {
                  const isCurrent = state.current_step === step.id;
                  const isDone = step.id < state.current_step;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => handleStepClick(step.id)}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300 focus:outline-none',
                        isCurrent
                          ? 'w-7 bg-accent'
                          : isDone
                            ? 'w-2 bg-emerald-500'
                            : 'w-2 bg-border/50'
                      )}
                      aria-label={`Go to step: ${step.title}`}
                    />
                  );
                })}
              </div>

              {/* Selected stone context chip */}
              {state.selected_product ? (
                <div className="flex items-center gap-2 border-t border-border/40 px-3 py-1.5">
                  {selectedProductImage && (
                    <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full border border-border/60">
                      <Image
                        src={selectedProductImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="16px"
                      />
                    </div>
                  )}
                  <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                    <span className="font-medium text-primary">
                      {state.selected_product.name}
                    </span>
                    {state.selected_product.carat_weight
                      ? ` · ${state.selected_product.carat_weight.toFixed(2)} ct`
                      : ''}
                  </p>
                </div>
              ) : null}

              <div className="h-px bg-border/50" />
            </div>

            {/* ── Desktop header: compact single row ── */}
            <header
              className="hidden shrink-0 items-center gap-3 border-b border-border/60 px-5 py-2 lg:flex lg:px-6"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,248,239,0.88) 100%)',
              }}
            >
              {selectedProductImage ? (
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted">
                  <Image
                    src={selectedProductImage}
                    alt={state.selected_product?.name ?? 'Selected stone'}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>
              ) : null}

              <div className="min-w-0 flex-1 flex items-center gap-2.5">
                <span className="hidden shrink-0 rounded-full border border-border/60 bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground xl:inline">
                  Configurator
                </span>
                <h2 className="truncate font-heading text-base font-semibold text-primary">
                  {startStep >= 3 && state.selected_product
                    ? `Configure ${state.selected_product.name}`
                    : 'Design Your Jewelry'}
                </h2>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={reset}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-white/75 text-muted-foreground transition hover:border-accent/40 hover:text-primary"
                  aria-label="Restart"
                  title="Restart"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-white/75 text-muted-foreground transition hover:border-accent/40 hover:text-primary"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* ── Desktop 3-column body: step sidebar | content | price ── */}
            <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[180px_minmax(0,1fr)_240px]">

              {/* Left: vertical step sidebar — desktop only */}
              <aside
                className="hidden lg:flex flex-col border-r border-border/40 overflow-y-auto"
                style={{ background: 'rgba(255,253,248,0.7)' }}
              >
                <StepSidebar
                  state={state}
                  canGoToStep={canGoToStep}
                  onStepClick={handleStepClick}
                  startStep={startStep}
                  vertical
                />
              </aside>

              {/* Center: main step content */}
              <section className="flex min-h-0 min-w-0 flex-1 flex-col lg:border-r lg:border-border/40">
                <div
                  ref={contentRef}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 lg:px-5 lg:py-5"
                >
                  <div className="mx-auto w-full max-w-2xl">{renderStep()}</div>
                </div>
              </section>

              {/* Right: price summary — desktop only */}
              <aside
                className="hidden min-h-0 flex-col lg:flex"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,254,250,0.92) 0%, rgba(248,239,226,0.9) 100%)',
                }}
              >
                <div className="min-h-0 flex-1 p-4">
                  <PriceSummary
                    state={state}
                    isComplete={complete}
                    goldRate={goldRate}
                    variant="desktop"
                  />
                </div>
              </aside>
            </div>

            <footer
              className="shrink-0 border-t border-border/60"
              style={{
                background: 'rgba(255,255,255,0.86)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {priceMobileOpen ? (
                <div className="max-h-[36vh] overflow-y-auto border-b border-border/50 px-4 py-3.5 lg:hidden">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-primary">Price Breakdown</p>
                    <button
                      type="button"
                      onClick={() => setPriceMobileOpen(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:text-primary"
                      aria-label="Close price summary"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <PriceSummary
                    state={state}
                    isComplete={complete}
                    goldRate={goldRate}
                    variant="inline"
                  />
                </div>
              ) : null}

              <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 lg:px-6">
                {/* Back — desktop only; on mobile the ← is in the header */}
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={!canGoBack}
                  className="hidden h-11 shrink-0 rounded-2xl border-border/70 bg-white/75 px-3 text-sm text-primary hover:bg-white lg:flex"
                  aria-label="Back"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Button>

                <div className="min-w-0 flex-1">
                  {/* Mobile: tappable price chip */}
                  <button
                    type="button"
                    onClick={() => setPriceMobileOpen(!priceMobileOpen)}
                    aria-expanded={priceMobileOpen}
                    aria-label={priceMobileOpen ? 'Hide price summary' : 'Show price summary'}
                    className="flex w-full items-center gap-2.5 rounded-2xl border border-border/70 bg-white/80 px-3 py-2 text-left transition hover:border-accent/30 lg:hidden"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase leading-none tracking-[0.14em] text-muted-foreground">
                        Estimated Total
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-accent">
                        {pricing.total > 0 ? formatPrice(pricing.total) : 'Build your quote'}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        {currentDisplayNum}/{totalSteps}
                      </span>
                      {priceMobileOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  <div className="hidden items-center gap-3 lg:flex">
                    <div className="h-1.5 flex-1 rounded-full bg-border/50">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {progressPct}% complete
                    </span>
                  </div>
                </div>

                {state.current_step < 7 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="h-11 shrink-0 rounded-2xl bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-40"
                  >
                    Continue
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <div className="hidden rounded-2xl border border-border/70 bg-white/75 px-3 py-2 text-xs text-muted-foreground lg:block">
                      Add to cart from the summary panel.
                    </div>
                    <div className="lg:hidden">
                      <PriceSummary
                        state={state}
                        isComplete={complete}
                        goldRate={goldRate}
                        variant="button-only"
                      />
                    </div>
                  </>
                )}
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
