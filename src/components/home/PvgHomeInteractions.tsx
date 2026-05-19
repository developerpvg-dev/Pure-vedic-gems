'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TEXT_HREFS: Record<string, string> = {
  Home: '/',
  'Shop Gemstones': '/shop',
  'Explore Gemstones': '/shop',
  'Find Your Gemstone': '/shop',
  'View Collection': '/shop',
  'View All Gemstones': '/shop',
  'Shop All': '/shop/rudraksha',
  'Shop Malas': '/shop/malas/exclusive-rudraksha-malas',
  'Shop Jewellery': '/shop/jewelry/rudraksha-jewelry',
  'Show All Rudrakshas': '/shop/rudraksha',
  'View All Spiritual Idols': '/shop/idols',
  'View All Vedic Jewellery': '/shop/jewelry',
  'View All Picks': '/shop?featured=true',
  'View & Buy': '/shop',
  'Start Configuring': '/configure',
  'Explore All Articles': '/knowledge',
  'Our Full Story': '/about',
  'Book Consultation': '/consultation',
  Consultation: '/consultation',
  'Knowledge Hub': '/knowledge',
  'Our Experts': '/about/experts',
  'Our Legacy': '#our-legacy',
  'About Us': '/about',
  Contact: '/contact',
  'Rudraksha Malas': '/shop/malas/exclusive-rudraksha-malas',
  'Certified Jewellery': '/shop/jewelry',
};

const PARTIAL_HREFS: Array<[RegExp, string]> = [
  [/ruby|manik/i, '/shop/navaratna/ruby'],
  [/pearl|moti/i, '/shop/navaratna/pearl'],
  [/red coral|coral|moonga/i, '/shop/navaratna/red-coral'],
  [/emerald|panna/i, '/shop/navaratna/emerald'],
  [/yellow sapphire|pukhraj/i, '/shop/navaratna/yellow-sapphire'],
  [/blue sapphire|neelam/i, '/shop/navaratna/blue-sapphire'],
  [/hessonite|gomed/i, '/shop/navaratna/hessonite'],
  [/cat'?s eye|lehsun/i, '/shop/navaratna/cats-eye'],
  [/diamond|heera/i, '/shop/navaratna/diamond'],
  [/ganesh/i, '/shop/idols/ganesha'],
  [/shiva linga|shivling/i, '/shop/idols/shivling'],
  [/lakshmi/i, '/shop/idols/lakshmi'],
  [/hanuman/i, '/shop/idols/hanuman'],
  [/saraswati/i, '/shop/idols/saraswati'],
  [/durga/i, '/shop/idols/durga-devi'],
  [/vishnu/i, '/shop/idols/vishnu'],
  [/ring|kada/i, '/shop/jewelry/ring'],
  [/pendant/i, '/shop/jewelry/pendant'],
  [/bracelet/i, '/shop/jewelry/bracelets'],
  [/mukhi/i, '/shop/rudraksha'],
];

type ScrollSequence = {
  section: HTMLElement;
  lockTarget: HTMLElement;
  steps: HTMLElement[];
  scrollLockMode: ScrollLockMode;
  currentIndex: number;
  setActive: (index: number, options?: { scrollStepIntoView?: boolean }) => void;
  cleanup: () => void;
};

type ScrollLockMode = 'fit-or-cover' | 'fully-visible';

type LockableScrollSequence = ScrollSequence & {
  isLockEligible: boolean;
  wheelDelta: number;
  lastStepAt: number;
  lastTouchY: number | null;
};

const LOCK_INTERSECTION_RATIO = 0.64;
const MIN_LOCK_INTERSECTION_RATIO = 0.32;
const STEP_COOLDOWN_MS = 520;
const WHEEL_STEP_DELTA = 48;
const TOUCH_STEP_DELTA = 42;
const SCROLL_LOCK_EDGE_PADDING = 24;
const SCROLL_LOCK_TOP_INSET = 112;
const SCROLL_LOCK_ALIGN_TOLERANCE = 18;
const SCROLL_LOCK_SNAP_DISTANCE = 160;

function normalizeLabel(value: string | null | undefined) {
  return (value ?? '').replace(/[\u2192\u25be]/g, '').replace(/\s+/g, ' ').trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolveHref(label: string) {
  if (TEXT_HREFS[label]) return TEXT_HREFS[label];
  for (const [pattern, href] of PARTIAL_HREFS) {
    if (pattern.test(label)) return href;
  }
  return null;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setupRotatingStack(
  selector: string,
  intervalMs: number,
  options?: { pauseOnReducedMotion?: boolean }
) {
  const cards = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (cards.length <= 1) return undefined;

  const container = cards[0].closest('section') ?? cards[0].parentElement;
  let activeIndex = cards.findIndex((card) => card.dataset.pos === '0');
  if (activeIndex < 0) activeIndex = cards.length - 1;

  let timer: number | null = null;
  let isVisible = true;
  const pauseOnReducedMotion = options?.pauseOnReducedMotion ?? true;

  const render = () => {
    cards.forEach((card, index) => {
      const position = (activeIndex - index + cards.length) % cards.length;
      card.dataset.pos = String(position);
      card.classList.toggle('is-top', position === 0);
    });
  };

  const stop = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };

  const schedule = () => {
    stop();
    if (!isVisible || document.hidden || (pauseOnReducedMotion && prefersReducedMotion())) return;
    timer = window.setTimeout(() => {
      activeIndex = (activeIndex + 1) % cards.length;
      render();
      schedule();
    }, intervalMs);
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
      schedule();
    },
    { rootMargin: '180px 0px' }
  );

  const onVisibilityChange = () => schedule();

  render();
  if (container) observer.observe(container);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    stop();
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

function setupAutoCarousel(
  cardSelector: string,
  dotSelector: string,
  intervalMs: number,
  options?: { pauseOnReducedMotion?: boolean }
) {
  const cards = Array.from(document.querySelectorAll<HTMLElement>(cardSelector));
  const dots = Array.from(document.querySelectorAll<HTMLElement>(dotSelector));
  if (!cards.length) return undefined;

  const carouselRoot = cards[0].parentElement;

  let currentIndex = Math.max(0, cards.findIndex((card) => card.classList.contains('is-active')));
  let timer: number | null = null;
  let isVisible = false;
  const pauseOnReducedMotion = options?.pauseOnReducedMotion ?? true;

  const updateVisibility = () => {
    if (!carouselRoot) {
      isVisible = true;
      schedule();
      return;
    }

    const rect = carouselRoot.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    isVisible = rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
    schedule();
  };

  const goTo = (nextIndex: number) => {
    cards[currentIndex]?.classList.remove('is-active');
    dots[currentIndex]?.classList.remove('is-active');
    currentIndex = (nextIndex + cards.length) % cards.length;
    cards[currentIndex]?.classList.add('is-active');
    dots[currentIndex]?.classList.add('is-active');
  };

  const stop = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };

  const schedule = () => {
    stop();
    if (!isVisible || document.hidden || (pauseOnReducedMotion && prefersReducedMotion())) return;
    timer = window.setTimeout(() => {
      goTo(currentIndex + 1);
      schedule();
    }, intervalMs);
  };

  const dotCleanups = dots.map((dot, index) => {
    const handler = () => {
      goTo(index);
      schedule();
    };
    dot.addEventListener('click', handler);
    return () => dot.removeEventListener('click', handler);
  });

  const observer = new IntersectionObserver(
    ([entry]) => {
      isVisible = Boolean(entry?.isIntersecting);
      schedule();
    },
    { rootMargin: '180px 0px' }
  );

  const onVisibilityChange = () => schedule();

  goTo(currentIndex);
  if (carouselRoot) observer.observe(carouselRoot);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('scroll', updateVisibility, { passive: true });
  window.addEventListener('resize', updateVisibility);
  updateVisibility();

  return () => {
    stop();
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('scroll', updateVisibility);
    window.removeEventListener('resize', updateVisibility);
    dotCleanups.forEach((cleanup) => cleanup());
  };
}

function syncStepWindow(steps: HTMLElement[], index: number) {
  const stepWindow = steps[0]?.parentElement as HTMLElement | null;
  if (!stepWindow || steps.length <= 4) return;
  if (stepWindow.classList.contains('remedy-timeline')) {
    stepWindow.style.setProperty('--step-window-shift', '0px');
    return;
  }

  const firstVisibleIndex = clamp(index - 1, 0, steps.length - 4);
  const rowGap = Number.parseFloat(window.getComputedStyle(stepWindow).rowGap || '0') || 0;
  const stepHeight = steps[0]?.getBoundingClientRect().height ?? 0;
  const targetTop = firstVisibleIndex * (stepHeight + rowGap);
  stepWindow.style.setProperty('--step-window-shift', `${-targetTop}px`);
}

function setupScrollSequence(options: {
  sectionSelector: string;
  stepSelector: string;
  imageSelector: string;
  stepKey: string;
  imageKey: string;
  lockTargetSelector?: string;
  scrollLockMode?: ScrollLockMode;
}): ScrollSequence | null {
  const section = document.querySelector<HTMLElement>(options.sectionSelector);
  const steps = Array.from(document.querySelectorAll<HTMLElement>(options.stepSelector));
  const images = Array.from(document.querySelectorAll<HTMLElement>(options.imageSelector));

  if (!section || !steps.length || !images.length) return null;
  const lockTarget = options.lockTargetSelector ? section.querySelector<HTMLElement>(options.lockTargetSelector) ?? section : section;
  const scrollLockMode = options.scrollLockMode ?? 'fit-or-cover';

  let currentIndex = -1;
  const stepCleanups: Array<() => void> = [];

  const setActive = (index: number, activeOptions?: { scrollStepIntoView?: boolean }) => {
    const safeIndex = clamp(index, 0, steps.length - 1);
    if (safeIndex === currentIndex) {
      syncStepWindow(steps, safeIndex);
      return;
    }

    currentIndex = safeIndex;
    const target = String(safeIndex);

    section.dataset.currentStep = String(safeIndex + 1);
    section.style.setProperty('--sequence-progress', `${steps.length > 1 ? (safeIndex / (steps.length - 1)) * 100 : 100}%`);

    steps.forEach((step) => {
      const isActive = step.dataset[options.stepKey] === target;
      step.classList.toggle('is-active', isActive);
      step.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    images.forEach((image) => {
      image.classList.toggle('is-active', image.dataset[options.imageKey] === target);
    });

    syncStepWindow(steps, safeIndex);

    if (activeOptions?.scrollStepIntoView && !prefersReducedMotion()) {
      steps[safeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  };

  steps.forEach((step) => {
    const handler = () => {
      setActive(Number(step.dataset[options.stepKey] || 0), { scrollStepIntoView: false });
    };
    step.addEventListener('click', handler);
    stepCleanups.push(() => step.removeEventListener('click', handler));
  });

  setActive(0);
  section.dataset.stepCount = String(steps.length);

  return {
    section,
    lockTarget,
    steps,
    scrollLockMode,
    get currentIndex() {
      return currentIndex;
    },
    setActive,
    cleanup() {
      stepCleanups.forEach((cleanup) => cleanup());
    },
  };
}

function normalizeWheelDelta(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

function canStep(sequence: ScrollSequence, direction: number) {
  if (direction < 0) return sequence.currentIndex > 0;
  return sequence.currentIndex < sequence.steps.length - 1;
}

function stepSequence(sequence: LockableScrollSequence, direction: number) {
  sequence.setActive(sequence.currentIndex + direction, { scrollStepIntoView: false });
  sequence.lastStepAt = performance.now();
  sequence.wheelDelta = 0;
}

function canSectionFitFullyVisible(section: HTMLElement) {
  const rect = section.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.height <= viewportHeight - SCROLL_LOCK_EDGE_PADDING * 2;
}

function getScrollLockTargetTop(section: HTMLElement, scrollLockMode: ScrollLockMode) {
  if (scrollLockMode !== 'fully-visible') return SCROLL_LOCK_EDGE_PADDING;

  const rect = section.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const extraSpace = viewportHeight - rect.height;
  return clamp(extraSpace / 2, SCROLL_LOCK_EDGE_PADDING, SCROLL_LOCK_TOP_INSET);
}

function getActiveLockedSequence(sequences: LockableScrollSequence[]) {
  if (prefersReducedMotion()) return null;

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return sequences
    .filter((sequence) => sequence.isLockEligible && isSectionReadyForScrollLock(sequence.lockTarget, sequence.scrollLockMode))
    .sort((left, right) => {
      const leftRect = left.lockTarget.getBoundingClientRect();
      const rightRect = right.lockTarget.getBoundingClientRect();
      const leftDistance = Math.abs(leftRect.top + leftRect.height / 2 - viewportHeight / 2);
      const rightDistance = Math.abs(rightRect.top + rightRect.height / 2 - viewportHeight / 2);
      return leftDistance - rightDistance;
    })[0] ?? null;
}

function isSectionFullyVisible(section: HTMLElement) {
  if (!canSectionFitFullyVisible(section)) return false;

  const rect = section.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const topInset = getScrollLockTargetTop(section, 'fully-visible');
  const bottomInset = Math.max(SCROLL_LOCK_EDGE_PADDING, viewportHeight - rect.height - topInset);

  return rect.top >= topInset - SCROLL_LOCK_ALIGN_TOLERANCE && rect.bottom <= viewportHeight - bottomInset + SCROLL_LOCK_ALIGN_TOLERANCE;
}

function isSectionReadyForScrollLock(section: HTMLElement, scrollLockMode: ScrollLockMode) {
  if (scrollLockMode === 'fully-visible') return isSectionFullyVisible(section);

  const rect = section.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const tolerance = 24;

  if (rect.height <= viewportHeight) {
    return isSectionFullyVisible(section);
  }

  return rect.top <= tolerance && rect.bottom >= viewportHeight - tolerance;
}

function getApproachingLockedSequence(sequences: LockableScrollSequence[], direction: number) {
  if (prefersReducedMotion()) return null;

  return sequences
    .filter((sequence) => sequence.isLockEligible && sequence.scrollLockMode === 'fully-visible')
    .filter((sequence) => canSectionFitFullyVisible(sequence.lockTarget))
    .filter((sequence) => !isSectionReadyForScrollLock(sequence.lockTarget, sequence.scrollLockMode))
    .map((sequence) => {
      const rect = sequence.lockTarget.getBoundingClientRect();
      const targetTop = getScrollLockTargetTop(sequence.lockTarget, sequence.scrollLockMode);
      return {
        sequence,
        rect,
        targetTop,
        deltaToTarget: rect.top - targetTop,
      };
    })
    .filter(({ deltaToTarget }) => Math.abs(deltaToTarget) <= SCROLL_LOCK_SNAP_DISTANCE)
    .filter(({ rect, targetTop }) => {
      if (direction > 0) return rect.top >= targetTop - SCROLL_LOCK_ALIGN_TOLERANCE;
      return rect.top <= targetTop + SCROLL_LOCK_ALIGN_TOLERANCE;
    })
    .sort((left, right) => Math.abs(left.deltaToTarget) - Math.abs(right.deltaToTarget))[0]?.sequence ?? null;
}

function alignSequenceForScrollLock(sequence: LockableScrollSequence) {
  const rect = sequence.lockTarget.getBoundingClientRect();
  const targetTop = getScrollLockTargetTop(sequence.lockTarget, sequence.scrollLockMode);
  const deltaToTarget = rect.top - targetTop;
  if (Math.abs(deltaToTarget) <= 1) return false;

  window.scrollTo({ top: Math.max(0, window.scrollY + deltaToTarget), behavior: 'auto' });
  sequence.wheelDelta = 0;
  sequence.lastTouchY = null;
  return true;
}

function getLockThreshold(entry: IntersectionObserverEntry) {
  const viewportHeight = entry.rootBounds?.height ?? window.innerHeight;
  const maxReachableRatio = clamp(viewportHeight / Math.max(1, entry.boundingClientRect.height), 0, 1);
  if (maxReachableRatio >= LOCK_INTERSECTION_RATIO) return LOCK_INTERSECTION_RATIO;
  return Math.max(MIN_LOCK_INTERSECTION_RATIO, maxReachableRatio - 0.02);
}

function setupLockedScrollSteppers(sequences: ScrollSequence[]) {
  if (!sequences.length) return undefined;

  const lockedSequences: LockableScrollSequence[] = sequences.map((sequence) => ({
    section: sequence.section,
    lockTarget: sequence.lockTarget,
    steps: sequence.steps,
    scrollLockMode: sequence.scrollLockMode,
    get currentIndex() {
      return sequence.currentIndex;
    },
    setActive: sequence.setActive,
    cleanup: sequence.cleanup,
    isLockEligible: false,
    wheelDelta: 0,
    lastStepAt: 0,
    lastTouchY: null,
  }));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const sequence = lockedSequences.find((item) => item.lockTarget === entry.target);
        if (!sequence) return;
        sequence.isLockEligible = entry.isIntersecting && entry.intersectionRatio >= getLockThreshold(entry);
        if (!sequence.isLockEligible) {
          sequence.wheelDelta = 0;
          sequence.lastTouchY = null;
        }
      });
    },
    { threshold: [0, MIN_LOCK_INTERSECTION_RATIO, 0.5, 0.6, LOCK_INTERSECTION_RATIO, 0.95, 1] }
  );

  const onWheel = (event: WheelEvent) => {
    const deltaY = normalizeWheelDelta(event);
    if (Math.abs(deltaY) <= Math.abs(event.deltaX)) return;

    const direction = deltaY > 0 ? 1 : -1;
    const sequence = getActiveLockedSequence(lockedSequences);

    if (!sequence) {
      const approachingSequence = getApproachingLockedSequence(lockedSequences, direction);
      if (approachingSequence && alignSequenceForScrollLock(approachingSequence)) {
        event.preventDefault();
      }
      return;
    }

    if (!canStep(sequence, direction)) {
      sequence.wheelDelta = 0;
      return;
    }

    event.preventDefault();

    const now = performance.now();
    if (now - sequence.lastStepAt < STEP_COOLDOWN_MS) return;

    if (sequence.wheelDelta && Math.sign(sequence.wheelDelta) !== Math.sign(deltaY)) {
      sequence.wheelDelta = 0;
    }

    sequence.wheelDelta += deltaY;
    if (Math.abs(sequence.wheelDelta) >= WHEEL_STEP_DELTA) {
      stepSequence(sequence, direction);
    }
  };

  const onTouchStart = (event: TouchEvent) => {
    const touchY = event.touches[0]?.clientY ?? null;
    if (touchY === null) return;

    const sequence = getActiveLockedSequence(lockedSequences);
    if (sequence) {
      sequence.lastTouchY = touchY;
      return;
    }

    lockedSequences.forEach((item) => {
      item.lastTouchY = touchY;
    });
  };

  const onTouchMove = (event: TouchEvent) => {
    const sequence = getActiveLockedSequence(lockedSequences);
    if (!event.touches.length) return;

    if (!sequence) {
      const fallbackSequence = lockedSequences.find((item) => item.lastTouchY !== null) ?? null;
      const lastTouchY = fallbackSequence?.lastTouchY ?? event.touches[0].clientY;
      const currentTouchY = event.touches[0].clientY;
      const deltaY = lastTouchY - currentTouchY;
      if (Math.abs(deltaY) < 8) return;

      const direction = deltaY > 0 ? 1 : -1;
      const approachingSequence = getApproachingLockedSequence(lockedSequences, direction);
      if (approachingSequence && alignSequenceForScrollLock(approachingSequence)) {
        event.preventDefault();
        lockedSequences.forEach((item) => {
          item.lastTouchY = currentTouchY;
        });
      }
      return;
    }

    if (sequence.lastTouchY === null) return;

    const currentTouchY = event.touches[0].clientY;
    const deltaY = sequence.lastTouchY - currentTouchY;
    if (Math.abs(deltaY) < 8) return;

    const direction = deltaY > 0 ? 1 : -1;
    if (!canStep(sequence, direction)) {
      sequence.lastTouchY = currentTouchY;
      return;
    }

    event.preventDefault();

    const now = performance.now();
    if (now - sequence.lastStepAt < STEP_COOLDOWN_MS) return;

    if (Math.abs(deltaY) >= TOUCH_STEP_DELTA) {
      stepSequence(sequence, direction);
      sequence.lastTouchY = currentTouchY;
    }
  };

  const onTouchEnd = () => {
    lockedSequences.forEach((sequence) => {
      sequence.lastTouchY = null;
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const keyDirections: Record<string, number> = {
      ArrowDown: 1,
      PageDown: 1,
      ArrowUp: -1,
      PageUp: -1,
    };
    const direction = keyDirections[event.key];
    if (!direction) return;

    const sequence = getActiveLockedSequence(lockedSequences);
    if (!sequence || !canStep(sequence, direction)) return;

    event.preventDefault();
    const now = performance.now();
    if (now - sequence.lastStepAt < STEP_COOLDOWN_MS) return;
    stepSequence(sequence, direction);
  };

  lockedSequences.forEach((sequence) => observer.observe(sequence.lockTarget));
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKeyDown);

  return () => {
    observer.disconnect();
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('keydown', onKeyDown);
    sequences.forEach((sequence) => sequence.cleanup());
  };
}

function setupTrustRotation() {
  const trustCards = Array.from(document.querySelectorAll<HTMLElement>('.trust-card'));
  if (!trustCards.length) return undefined;

  let groupIndex = 0;
  let cardsPerTrustGroup = 0;
  let timer: number | null = null;
  let resizeFrame = 0;

  const getCardsPerTrustGroup = () => {
    const width = window.innerWidth;
    if (width <= 767) return 2;
    if (width <= 1024) return 3;
    return 0;
  };

  const clearTrustGroups = () => trustCards.forEach((card) => card.classList.remove('trust-hidden'));

  const showGroup = () => {
    if (!cardsPerTrustGroup || trustCards.length <= cardsPerTrustGroup) {
      clearTrustGroups();
      return;
    }

    const totalGroups = Math.ceil(trustCards.length / cardsPerTrustGroup);
    groupIndex %= totalGroups;
    trustCards.forEach((card, index) => {
      card.classList.toggle('trust-hidden', Math.floor(index / cardsPerTrustGroup) !== groupIndex);
    });
  };

  const restart = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
    cardsPerTrustGroup = getCardsPerTrustGroup();
    groupIndex = 0;
    showGroup();
    if (!prefersReducedMotion() && cardsPerTrustGroup && trustCards.length > cardsPerTrustGroup) {
      timer = window.setInterval(() => {
        groupIndex += 1;
        showGroup();
      }, 3200);
    }
  };

  const onResize = () => {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      restart();
    });
  };

  restart();
  window.addEventListener('resize', onResize, { passive: true });

  return () => {
    if (timer) window.clearInterval(timer);
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    window.removeEventListener('resize', onResize);
    clearTrustGroups();
  };
}

function setupTabs(tabSelector: string, panelSelector: string, panelPrefix: string, dataAttr: string) {
  const tabs = Array.from(document.querySelectorAll<HTMLElement>(tabSelector));
  const panels = Array.from(document.querySelectorAll<HTMLElement>(panelSelector));

  return tabs.map((tab) => {
    const handler = () => {
      tabs.forEach((item) => {
        item.classList.remove('is-active');
        item.setAttribute('aria-selected', 'false');
      });
      panels.forEach((panel) => panel.classList.remove('is-active'));
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(`${panelPrefix}${tab.dataset[dataAttr]}`);
      panel?.classList.add('is-active');
    };

    tab.addEventListener('click', handler);
    return () => tab.removeEventListener('click', handler);
  });
}

function setupSliderButtons() {
  const sliderButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.pvg-slider-btn'));

  return sliderButtons.map((button) => {
    const handler = () => {
      const targetId = button.dataset.sliderTarget;
      const direction = button.dataset.sliderDirection === 'prev' ? -1 : 1;
      const scrollTarget = targetId ? document.getElementById(targetId) : null;
      if (!scrollTarget) return;

      const amount = Math.max(240, Math.round(scrollTarget.clientWidth * 0.82));
      scrollTarget.scrollBy({ left: amount * direction, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    };

    button.addEventListener('click', handler);
    return () => button.removeEventListener('click', handler);
  });
}

function setupKnowledgeHubScrollControls() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.khub-scroll-btn'));
  if (!buttons.length) return undefined;

  const scrollActivePanel = (direction: number) => {
    const activePanel = document.querySelector<HTMLElement>('.khub-panel.is-active');
    if (!activePanel) return;

    const amount = Math.max(220, Math.round(activePanel.clientWidth * 0.82));
    activePanel.scrollBy({ left: amount * direction, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const cleanups = buttons.map((button) => {
    const handler = () => scrollActivePanel(button.dataset.khubDirection === 'prev' ? -1 : 1);
    button.addEventListener('click', handler);
    return () => button.removeEventListener('click', handler);
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function setupTestimonials() {
  const testimonialTrack = document.getElementById('testiTrackV2');
  if (!testimonialTrack) return undefined;

  const cards = Array.from(testimonialTrack.querySelectorAll<HTMLElement>('.testi-card-v2'));
  let index = 0;

  const getVisibleCount = () => {
    const width = testimonialTrack.parentElement?.offsetWidth ?? 0;
    if (width < 600) return 1;
    if (width < 940) return 2;
    return 3;
  };

  const goTo = (nextIndex: number) => {
    const firstCard = cards[0];
    if (!firstCard) return;
    const max = Math.max(0, cards.length - getVisibleCount());
    index = clamp(nextIndex, 0, max);
    testimonialTrack.style.transform = `translate3d(-${index * (firstCard.offsetWidth + 20)}px, 0, 0)`;
  };

  const nextButton = document.getElementById('testiNextV2');
  const prevButton = document.getElementById('testiPrevV2');
  const nextHandler = () => goTo(index + 1);
  const prevHandler = () => goTo(index - 1);
  const resizeHandler = () => goTo(0);

  nextButton?.addEventListener('click', nextHandler);
  prevButton?.addEventListener('click', prevHandler);
  window.addEventListener('resize', resizeHandler, { passive: true });

  return () => {
    nextButton?.removeEventListener('click', nextHandler);
    prevButton?.removeEventListener('click', prevHandler);
    window.removeEventListener('resize', resizeHandler);
  };
}

function setupScrollTopButton() {
  const scrollTopButton = document.getElementById('pvgScrollTop');
  if (!scrollTopButton) return undefined;

  let frame = 0;
  const scrollHandler = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      scrollTopButton.classList.toggle('show', window.scrollY > 500);
    });
  };
  const clickHandler = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  window.addEventListener('scroll', scrollHandler, { passive: true });
  scrollTopButton.addEventListener('click', clickHandler);
  scrollHandler();

  return () => {
    if (frame) window.cancelAnimationFrame(frame);
    window.removeEventListener('scroll', scrollHandler);
    scrollTopButton.removeEventListener('click', clickHandler);
  };
}

function setupLegacyHashLinks(router: ReturnType<typeof useRouter>) {
  const root = document.querySelector<HTMLElement>('.pvg-react-home-root');
  if (!root) return undefined;

  const linkHandler = (event: MouseEvent) => {
    const target = event.target as Element | null;
    const anchor = target?.closest<HTMLAnchorElement>('a[href="#"]');
    if (!anchor) return;

    const href = resolveHref(normalizeLabel(anchor.textContent));
    if (!href) return;

    event.preventDefault();
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    } else {
      router.push(href);
    }
  };

  root.addEventListener('click', linkHandler);
  return () => root.removeEventListener('click', linkHandler);
}

export function PvgHomeInteractions() {
  const router = useRouter();

  useEffect(() => {
    const cleanups: Array<(() => void) | undefined> = [];

    cleanups.push(setupRotatingStack('#aboutStack .about-stack-card', 2800, { pauseOnReducedMotion: false }));
    cleanups.push(setupRotatingStack('#certStack .cert-stack-card', 3000, { pauseOnReducedMotion: false }));
    cleanups.push(setupAutoCarousel('#rudraCarousel .rudra-left-card', '#rudraCarouselDots .rudra-c-dot', 4200, { pauseOnReducedMotion: false }));
    cleanups.push(setupTrustRotation());
    cleanups.push(...setupTabs('.explore-tab', '.explore-panel', 'panel-', 'tab'));
    cleanups.push(...setupTabs('.khub-tab', '.khub-panel', 'khub-panel-', 'khub'));
    cleanups.push(...setupSliderButtons());
    cleanups.push(setupKnowledgeHubScrollControls());

    const scrollSequences = [
      setupScrollSequence({
        sectionSelector: '#configurator',
        stepSelector: '[data-config-step]',
        imageSelector: '[data-config-image]',
        stepKey: 'configStep',
        imageKey: 'configImage',
      }),
      setupScrollSequence({
        sectionSelector: '#our-legacy',
        stepSelector: '[data-legacy-step]',
        imageSelector: '[data-legacy-image]',
        stepKey: 'legacyStep',
        imageKey: 'legacyImage',
        lockTargetSelector: '.remedy-shell',
        scrollLockMode: 'fully-visible',
      }),
    ].filter((sequence): sequence is ScrollSequence => Boolean(sequence));

    cleanups.push(setupLockedScrollSteppers(scrollSequences));
    cleanups.push(setupTestimonials());
    cleanups.push(setupScrollTopButton());
    cleanups.push(setupLegacyHashLinks(router));

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, [router]);

  return null;
}
