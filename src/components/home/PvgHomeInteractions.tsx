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
  'Shop Malas': '/shop/exclusive-rudraksha-malas',
  'Shop Jewellery': '/shop/rudraksha-jewelry',
  'Show All Rudrakshas': '/shop/rudraksha',
  'View All Spiritual Idols': '/shop/idol',
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
  'Rudraksha Malas': '/shop/exclusive-rudraksha-malas',
  'Certified Jewellery': '/shop/jewelry',
};

const PARTIAL_HREFS: Array<[RegExp, string]> = [
  [/ruby|manik/i, '/shop/ruby'],
  [/pearl|moti/i, '/shop/pearl'],
  [/red coral|coral|moonga/i, '/shop/red-coral'],
  [/emerald|panna/i, '/shop/emerald'],
  [/yellow sapphire|pukhraj/i, '/shop/yellow-sapphire'],
  [/blue sapphire|neelam/i, '/shop/blue-sapphire'],
  [/hessonite|gomed/i, '/shop/hessonite'],
  [/cat'?s eye|lehsun/i, '/shop/cats-eye'],
  [/diamond|heera/i, '/shop/diamond'],
  [/ganesh/i, '/shop/ganesha'],
  [/shiva linga|shivling/i, '/shop/shivling'],
  [/lakshmi/i, '/shop/lakshmi'],
  [/hanuman/i, '/shop/hanuman'],
  [/saraswati/i, '/shop/saraswati'],
  [/durga/i, '/shop/durga-devi'],
  [/vishnu/i, '/shop/vishnu'],
  [/ring|kada/i, '/shop/ring'],
  [/pendant/i, '/shop/pendant'],
  [/bracelet/i, '/shop/bracelets'],
  [/mukhi/i, '/shop/rudraksha'],
];

function normalizeLabel(value: string | null | undefined) {
  return (value ?? '').replace(/[→▾]/g, '').replace(/\s+/g, ' ').trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getSectionVisibility(section: HTMLElement) {
  const rect = section.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
  const sectionHeight = Math.max(1, Math.min(rect.height || section.offsetHeight || 1, viewportHeight));

  return {
    rect,
    viewportHeight,
    visibleRatio: clamp(visibleHeight / sectionHeight, 0, 1),
    fullyVisible: rect.top >= -2 && rect.bottom <= viewportHeight + 2 && rect.bottom > 0,
  };
}

function resolveHref(label: string) {
  if (TEXT_HREFS[label]) return TEXT_HREFS[label];
  for (const [pattern, href] of PARTIAL_HREFS) {
    if (pattern.test(label)) return href;
  }
  return null;
}

function cycleStack(selector: string, intervalMs: number) {
  const cards = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (!cards.length) return undefined;
  let currentIndex = 0;
  const timer = window.setInterval(() => {
    currentIndex = (currentIndex + 1) % cards.length;
    cards.forEach((card, index) => {
      const position = (index - currentIndex + cards.length) % cards.length;
      card.setAttribute('data-pos', String(position));
    });
  }, intervalMs);
  return () => window.clearInterval(timer);
}

export function PvgHomeInteractions() {
  const router = useRouter();

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    const syncStepWindow = (steps: HTMLElement[], index: number) => {
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
    };

    const setupScrollSequence = (options: {
      sectionSelector: string;
      stepSelector: string;
      imageSelector: string;
      stepKey: string;
      imageKey: string;
    }) => {
      const section = document.querySelector<HTMLElement>(options.sectionSelector);
      const steps = Array.from(document.querySelectorAll<HTMLElement>(options.stepSelector));
      const images = Array.from(document.querySelectorAll<HTMLElement>(options.imageSelector));
      let currentIndex = -1;

      if (!section || !steps.length || !images.length) return null;

      const setActive = (index: number) => {
        const safeIndex = clamp(index, 0, steps.length - 1);
        if (safeIndex === currentIndex) {
          syncStepWindow(steps, safeIndex);
          return;
        }
        currentIndex = safeIndex;
        const target = String(safeIndex);

        steps.forEach((step) => {
          const isActive = step.dataset[options.stepKey] === target;
          step.classList.toggle('is-active', isActive);
          step.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        images.forEach((image) => {
          image.classList.toggle('is-active', image.dataset[options.imageKey] === target);
        });

        section.style.setProperty('--sequence-progress', `${steps.length > 1 ? (safeIndex / (steps.length - 1)) * 100 : 100}%`);
        syncStepWindow(steps, safeIndex);
      };

      const stepHandlers = steps.map((step) => {
        const handler = () => {
          setActive(Number(step.dataset[options.stepKey] || 0));
        };
        step.addEventListener('click', handler);
        return () => step.removeEventListener('click', handler);
      });

      setActive(0);

      return {
        section,
        steps,
        cleanup() {
          stepHandlers.forEach((handler) => handler());
        },
        setActive,
        getIndex() {
          return currentIndex < 0 ? 0 : currentIndex;
        },
        update() {
          const { rect, viewportHeight } = getSectionVisibility(section);
          if (rect.top >= viewportHeight - 2) {
            setActive(0);
          } else if (rect.bottom <= 2) {
            setActive(steps.length - 1);
          } else if (currentIndex < 0) {
            setActive(0);
          } else {
            syncStepWindow(steps, currentIndex);
          }
        },
      };
    };

    const setupScrollGate = (sequences: Array<NonNullable<ReturnType<typeof setupScrollSequence>>>) => {
      type ScrollSequence = NonNullable<ReturnType<typeof setupScrollSequence>>;

      const gateThreshold = 180;
      const entryThreshold = 0.65;
      const mobileGateQuery = window.matchMedia('(max-width: 767px)');
      const wheelState = new Map<ScrollSequence, { delta: number; direction: number }>();
      let activeGate: ScrollSequence | null = null;
      let releasedGate: { sequence: ScrollSequence; direction: number } | null = null;
      let lastTouchY: number | null = null;

      const pinSequence = (sequence: ScrollSequence) => {
        const previousScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        const absoluteTop = Math.max(0, window.scrollY + sequence.section.getBoundingClientRect().top);
        window.scrollTo(0, absoluteTop);
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
      };

      const clearReleasedGate = (direction: number) => {
        if (releasedGate && releasedGate.direction !== direction) releasedGate = null;
      };

      const findGateSequence = (direction: number) => {
        clearReleasedGate(direction);

        if (activeGate) {
          const activeVisibility = getSectionVisibility(activeGate.section);
          const stillNearby = activeVisibility.rect.bottom > -activeVisibility.rect.height * 0.15
            && activeVisibility.rect.top < activeVisibility.viewportHeight + activeVisibility.rect.height * 0.15;
          if (stillNearby) {
            return { sequence: activeGate, justEntered: false };
          }
          activeGate = null;
        }

        const candidates = sequences
          .map((sequence) => ({ sequence, visibility: getSectionVisibility(sequence.section) }))
          .filter(({ sequence, visibility }) => {
            const intersectsViewport = visibility.rect.bottom > 0 && visibility.rect.top < visibility.viewportHeight;
            if (!intersectsViewport || visibility.visibleRatio < entryThreshold) {
              if (releasedGate?.sequence === sequence) releasedGate = null;
              return false;
            }

            if (releasedGate && releasedGate.sequence === sequence && releasedGate.direction === direction) {
              return false;
            }

            return true;
          })
          .sort((left, right) => {
            if (right.visibility.visibleRatio !== left.visibility.visibleRatio) {
              return right.visibility.visibleRatio - left.visibility.visibleRatio;
            }
            return Math.abs(left.visibility.rect.top) - Math.abs(right.visibility.rect.top);
          });

        const candidate = candidates[0];
        if (!candidate) return null;

        const { sequence, visibility } = candidate;
        activeGate = sequence;
        if (direction > 0 && visibility.rect.top > 0) sequence.setActive(0);
        if (direction < 0 && visibility.rect.bottom < visibility.viewportHeight) sequence.setActive(sequence.steps.length - 1);
        return { sequence, justEntered: true };
      };

      const advanceSequence = (sequence: ScrollSequence, direction: number) => {
        const currentIndex = sequence.getIndex();
        const nextIndex = clamp(currentIndex + direction, 0, sequence.steps.length - 1);
        sequence.setActive(nextIndex);
      };

      const getGateState = (sequence: ScrollSequence, direction: number) => {
        const state = wheelState.get(sequence) || { delta: 0, direction };
        if (state.direction !== direction) {
          state.delta = 0;
          state.direction = direction;
        }
        return state;
      };

      const handleGateDelta = (deltaY: number, event: Event) => {
        if (mobileGateQuery.matches || !deltaY) return false;
        const direction = deltaY > 0 ? 1 : -1;
        const gate = findGateSequence(direction);
        if (!gate) {
          activeGate = null;
          wheelState.clear();
          return false;
        }
        const { sequence, justEntered } = gate;

        const currentIndex = sequence.getIndex();
        const atFirstStep = currentIndex <= 0;
        const atLastStep = currentIndex >= sequence.steps.length - 1;
        if ((direction > 0 && atLastStep) || (direction < 0 && atFirstStep)) {
          activeGate = null;
          releasedGate = { sequence, direction };
          wheelState.set(sequence, { delta: 0, direction });
          return false;
        }

        event.preventDefault();
        releasedGate = null;
        pinSequence(sequence);
        if (justEntered) {
          wheelState.set(sequence, { delta: 0, direction });
          return true;
        }

        const state = getGateState(sequence, direction);
        state.delta += Math.abs(deltaY);
        if (state.delta >= gateThreshold) {
          const before = sequence.getIndex();
          advanceSequence(sequence, direction);
          state.delta = sequence.getIndex() === before ? state.delta : 0;
        }
        wheelState.set(sequence, state);
        return true;
      };

      const onWheel = (event: WheelEvent) => {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        handleGateDelta(event.deltaY, event);
      };

      const onTouchStart = (event: TouchEvent) => {
        lastTouchY = event.touches[0]?.clientY ?? null;
      };

      const onTouchMove = (event: TouchEvent) => {
        if (lastTouchY === null || !event.touches.length) return;
        const currentTouchY = event.touches[0].clientY;
        const handled = handleGateDelta(lastTouchY - currentTouchY, event);
        if (handled) lastTouchY = currentTouchY;
      };

      const onTouchEnd = () => {
        lastTouchY = null;
      };

      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);

      return () => {
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };
    };

    const aboutCleanup = cycleStack('#aboutStack .about-stack-card', 5000);
    const certCleanup = cycleStack('#certStack .cert-stack-card', 5000);
    if (aboutCleanup) cleanups.push(aboutCleanup);
    if (certCleanup) cleanups.push(certCleanup);

    const rudraCards = Array.from(document.querySelectorAll<HTMLElement>('#rudraCarousel .rudra-left-card'));
    const rudraDots = Array.from(document.querySelectorAll<HTMLElement>('#rudraCarouselDots .rudra-c-dot'));
    if (rudraCards.length) {
      let currentIndex = 0;
      const goToRudra = (nextIndex: number) => {
        rudraCards[currentIndex]?.classList.remove('is-active');
        rudraDots[currentIndex]?.classList.remove('is-active');
        currentIndex = (nextIndex + rudraCards.length) % rudraCards.length;
        rudraCards[currentIndex]?.classList.add('is-active');
        rudraDots[currentIndex]?.classList.add('is-active');
      };
      let timer = window.setInterval(() => goToRudra(currentIndex + 1), 3500);
      const dotHandlers = rudraDots.map((dot, index) => {
        const handler = () => {
          goToRudra(index);
          window.clearInterval(timer);
          timer = window.setInterval(() => goToRudra(currentIndex + 1), 3500);
        };
        dot.addEventListener('click', handler);
        return () => dot.removeEventListener('click', handler);
      });
      cleanups.push(() => {
        window.clearInterval(timer);
        dotHandlers.forEach((cleanup) => cleanup());
      });
    }

    const trustCards = Array.from(document.querySelectorAll<HTMLElement>('.trust-card'));
    if (trustCards.length) {
      let groupIndex = 0;
      let cardsPerTrustGroup = 0;
      let timer: number | null = null;
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
      const restartTrustRotation = () => {
        if (timer) window.clearInterval(timer);
        timer = null;
        cardsPerTrustGroup = getCardsPerTrustGroup();
        groupIndex = 0;
        showGroup();
        if (cardsPerTrustGroup && trustCards.length > cardsPerTrustGroup) {
          timer = window.setInterval(() => {
            groupIndex += 1;
            showGroup();
          }, 2500);
        }
      };
      restartTrustRotation();
      window.addEventListener('resize', restartTrustRotation, { passive: true });
      cleanups.push(() => {
        if (timer) window.clearInterval(timer);
        window.removeEventListener('resize', restartTrustRotation);
        clearTrustGroups();
      });
    }

    const bindTabs = (tabSelector: string, panelSelector: string, panelPrefix: string, dataAttr: string) => {
      const tabs = Array.from(document.querySelectorAll<HTMLElement>(tabSelector));
      const panels = Array.from(document.querySelectorAll<HTMLElement>(panelSelector));
      const handlers = tabs.map((tab) => {
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
      cleanups.push(...handlers);
    };

    bindTabs('.explore-tab', '.explore-panel', 'panel-', 'tab');
    bindTabs('.khub-tab', '.khub-panel', 'khub-panel-', 'khub');

    const scrollAreas = Array.from(document.querySelectorAll<HTMLElement>('.semi-circle-scroll, .explore-scroll, .dp-scroll-wrap'));
    const dragCleanups = scrollAreas.map((element) => {
      let isDragging = false;
      let startX = 0;
      let scrollLeft = 0;
      const onMouseDown = (event: MouseEvent) => {
        isDragging = true;
        element.style.cursor = 'grabbing';
        startX = event.pageX - element.offsetLeft;
        scrollLeft = element.scrollLeft;
      };
      const stopDragging = () => {
        isDragging = false;
        element.style.cursor = 'grab';
      };
      const onMouseMove = (event: MouseEvent) => {
        if (!isDragging) return;
        event.preventDefault();
        const currentX = event.pageX - element.offsetLeft;
        element.scrollLeft = scrollLeft - (currentX - startX) * 1.4;
      };
      element.addEventListener('mousedown', onMouseDown);
      element.addEventListener('mouseleave', stopDragging);
      element.addEventListener('mouseup', stopDragging);
      element.addEventListener('mousemove', onMouseMove);
      return () => {
        element.removeEventListener('mousedown', onMouseDown);
        element.removeEventListener('mouseleave', stopDragging);
        element.removeEventListener('mouseup', stopDragging);
        element.removeEventListener('mousemove', onMouseMove);
      };
    });
    cleanups.push(...dragCleanups);

    const sliderButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.pvg-slider-btn'));
    const sliderCleanups = sliderButtons.map((button) => {
      const handler = () => {
        const targetId = button.dataset.sliderTarget;
        const direction = button.dataset.sliderDirection === 'prev' ? -1 : 1;
        const scrollTarget = targetId ? document.getElementById(targetId) : null;
        if (!scrollTarget) return;
        const amount = Math.max(240, Math.round(scrollTarget.clientWidth * 0.82));
        scrollTarget.scrollBy({ left: amount * direction, behavior: 'smooth' });
      };
      button.addEventListener('click', handler);
      return () => button.removeEventListener('click', handler);
    });
    cleanups.push(...sliderCleanups);

    const stepRows = Array.from(document.querySelectorAll<HTMLElement>('.cfg-step-row'));
    const imageSlots = Array.from(document.querySelectorAll<HTMLElement>('.cfg-img-slot'));
    if (stepRows.length && imageSlots.length) {
      let currentStep = 0;
      const goToStep = (nextStep: number) => {
        stepRows.forEach((row, index) => row.classList.toggle('is-cfg-active', index === nextStep));
        imageSlots.forEach((slot, index) => {
          slot.classList.toggle('cfg-visible', index === nextStep);
          slot.classList.toggle('cfg-hidden', index !== nextStep);
        });
        currentStep = nextStep;
      };
      const stepHandlers = stepRows.map((row, index) => {
        const handler = () => goToStep(index);
        row.addEventListener('click', handler);
        return () => row.removeEventListener('click', handler);
      });
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let timer: number | null = prefersReducedMotion ? null : window.setInterval(() => goToStep((currentStep + 1) % stepRows.length), 2500);
      const section = document.getElementById('configurator');
      const pause = () => {
        if (timer) window.clearInterval(timer);
        timer = null;
      };
      const resume = () => {
        if (!timer && !prefersReducedMotion) timer = window.setInterval(() => goToStep((currentStep + 1) % stepRows.length), 2500);
      };
      section?.addEventListener('mouseenter', pause);
      section?.addEventListener('mouseleave', resume);
      cleanups.push(() => {
        if (timer) window.clearInterval(timer);
        stepHandlers.forEach((cleanup) => cleanup());
        section?.removeEventListener('mouseenter', pause);
        section?.removeEventListener('mouseleave', resume);
      });
    }

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
      }),
    ].filter((sequence): sequence is NonNullable<typeof sequence> => Boolean(sequence));

    if (scrollSequences.length) {
      const runScrollSync = () => {
        scrollSequences.forEach((sequence) => sequence.update());
      };

      const scrollGateCleanup = setupScrollGate(scrollSequences);
      window.addEventListener('scroll', runScrollSync, { passive: true });
      window.addEventListener('resize', runScrollSync);
      runScrollSync();

      cleanups.push(() => {
        window.removeEventListener('scroll', runScrollSync);
        window.removeEventListener('resize', runScrollSync);
        scrollSequences.forEach((sequence) => sequence.cleanup());
        scrollGateCleanup?.();
      });
    }

    const testimonialTrack = document.getElementById('testiTrackV2');
    if (testimonialTrack) {
      const cards = Array.from(testimonialTrack.querySelectorAll<HTMLElement>('.testi-card-v2'));
      let index = 0;
      const getVisibleCount = () => {
        const width = testimonialTrack.parentElement?.offsetWidth ?? 0;
        if (width < 600) return 1;
        if (width < 940) return 2;
        return 3;
      };
      const goToTestimonial = (nextIndex: number) => {
        const firstCard = cards[0];
        if (!firstCard) return;
        const max = Math.max(0, cards.length - getVisibleCount());
        index = Math.min(Math.max(nextIndex, 0), max);
        testimonialTrack.style.transform = `translateX(-${index * (firstCard.offsetWidth + 20)}px)`;
      };
      const nextButton = document.getElementById('testiNextV2');
      const prevButton = document.getElementById('testiPrevV2');
      const nextHandler = () => goToTestimonial(index + 1);
      const prevHandler = () => goToTestimonial(index - 1);
      const resizeHandler = () => goToTestimonial(0);
      nextButton?.addEventListener('click', nextHandler);
      prevButton?.addEventListener('click', prevHandler);
      window.addEventListener('resize', resizeHandler, { passive: true });
      cleanups.push(() => {
        nextButton?.removeEventListener('click', nextHandler);
        prevButton?.removeEventListener('click', prevHandler);
        window.removeEventListener('resize', resizeHandler);
      });
    }

    const scrollTopButton = document.getElementById('pvgScrollTop');
    if (scrollTopButton) {
      const scrollHandler = () => scrollTopButton.classList.toggle('show', window.scrollY > 500);
      const clickHandler = () => window.scrollTo({ top: 0, behavior: 'smooth' });
      window.addEventListener('scroll', scrollHandler, { passive: true });
      scrollTopButton.addEventListener('click', clickHandler);
      scrollHandler();
      cleanups.push(() => {
        window.removeEventListener('scroll', scrollHandler);
        scrollTopButton.removeEventListener('click', clickHandler);
      });
    }

    const root = document.querySelector<HTMLElement>('.pvg-react-home-root');
    if (root) {
      const linkHandler = (event: MouseEvent) => {
        const target = event.target as Element | null;
        const anchor = target?.closest<HTMLAnchorElement>('a[href="#"]');
        if (!anchor) return;
        const href = resolveHref(normalizeLabel(anchor.textContent));
        if (!href) return;
        event.preventDefault();
        if (href.startsWith('#')) {
          document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          router.push(href);
        }
      };
      root.addEventListener('click', linkHandler);
      cleanups.push(() => root.removeEventListener('click', linkHandler));
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [router]);

  return null;
}