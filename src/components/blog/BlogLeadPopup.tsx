'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { BlogEnquiryForm } from './BlogEnquiryForm';
import type { BlogRelatedProduct } from '@/lib/blog/blog-rail-data';
import { blogScrollRatio } from './blog-scroll-ratio';

// ponytail: v4 clears phones that auto-opened+ghost-dismissed on Google cold loads (v3 max<=0→1 bug)
function enquiryDismissKey(slug: string) {
  return `pvg-blog-enquiry-dismissed:v4:${slug}`;
}

function productsDismissKey(slug: string) {
  return `pvg-blog-products-popup-dismissed:v4:${slug}`;
}

const PRODUCTS_DELAY_MS = 30_000;
const COMPACT_MAX = 1023;
const OPEN_GRACE_MS = 1600;
const ENQUIRY_SCROLL_RATIO = 0.3;

function isCompactScreen() {
  return typeof window !== 'undefined' && window.matchMedia(`(max-width: ${COMPACT_MAX}px)`).matches;
}

function pageScrollRatio() {
  const top = window.scrollY || document.documentElement.scrollTop || 0;
  return blogScrollRatio(top, document.documentElement.scrollHeight, window.innerHeight);
}

type Stage = 'none' | 'enquiry' | 'products';

export function BlogLeadPopup({
  postTitle,
  slug,
  relatedProducts = [],
  relatedHref,
  relatedLabel,
}: {
  postTitle: string;
  slug: string;
  relatedProducts?: BlogRelatedProduct[];
  relatedHref?: string;
  relatedLabel?: string;
}) {
  const products = Array.isArray(relatedProducts) ? relatedProducts : [];
  const [stage, setStage] = useState<Stage>('none');
  const [mounted, setMounted] = useState(false);
  const formDirtyRef = useRef(false);
  const enquiryOpenedAtRef = useRef(0);
  const productsTimerRef = useRef<number | null>(null);
  const productsRef = useRef(products);
  const relatedHrefRef = useRef(relatedHref);
  const relatedLabelRef = useRef(relatedLabel);
  productsRef.current = products;
  relatedHrefRef.current = relatedHref;
  relatedLabelRef.current = relatedLabel;

  function clearProductsTimer() {
    if (productsTimerRef.current != null) {
      window.clearTimeout(productsTimerRef.current);
      productsTimerRef.current = null;
    }
  }

  function canShowProducts() {
    return Boolean(
      isCompactScreen() &&
        productsRef.current.length &&
        relatedHrefRef.current &&
        relatedLabelRef.current &&
        !localStorage.getItem(productsDismissKey(slug)),
    );
  }

  function scheduleProductsPopup() {
    if (!canShowProducts()) return;
    clearProductsTimer();
    productsTimerRef.current = window.setTimeout(() => {
      if (!canShowProducts()) return;
      setStage('products');
    }, PRODUCTS_DELAY_MS);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (localStorage.getItem(enquiryDismissKey(slug))) {
      scheduleProductsPopup();
      return () => clearProductsTimer();
    }

    function openEnquiry() {
      enquiryOpenedAtRef.current = Date.now();
      setStage('enquiry');
    }

    function onScroll() {
      if (pageScrollRatio() < ENQUIRY_SCROLL_RATIO) return;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      openEnquiry();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    // ponytail: Google mobile often finishes image/layout after first paint; one delayed recheck catches that
    const readyTimer = window.setTimeout(onScroll, 600);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.clearTimeout(readyTimer);
      clearProductsTimer();
    };
    // ponytail: slug is the visit; product refs update in render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${COMPACT_MAX}px)`);
    function onChange() {
      if (mq.matches) return;
      clearProductsTimer();
      if (stage === 'products') setStage('none');
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [stage]);

  function closeEnquiry() {
    localStorage.setItem(enquiryDismissKey(slug), 'true');
    setStage('none');
    scheduleProductsPopup();
  }

  function dismissEnquiry() {
    if (Date.now() - enquiryOpenedAtRef.current < OPEN_GRACE_MS) return;
    if (formDirtyRef.current && stage === 'enquiry') return;
    closeEnquiry();
  }

  function forceDismissEnquiry() {
    formDirtyRef.current = false;
    closeEnquiry();
  }

  function dismissProducts() {
    localStorage.setItem(productsDismissKey(slug), 'true');
    setStage('none');
  }

  useEffect(() => {
    if (stage === 'none') return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (stage === 'enquiry') {
        if (formDirtyRef.current) return;
        forceDismissEnquiry();
        return;
      }
      if (stage === 'products') dismissProducts();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [stage, slug]);

  if (!mounted || stage === 'none') return null;

  if (stage === 'enquiry') {
    return createPortal(
      <div
        className="pvg-blog-popup-backdrop"
        role="presentation"
        onClick={() => {
          if (!formDirtyRef.current) dismissEnquiry();
        }}
      >
        <section
          className="pvg-blog-popup"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-popup-heading"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="pvg-blog-popup-close"
            aria-label="Close query form"
            onClick={forceDismissEnquiry}
          >
            <X aria-hidden="true" />
          </button>
          <p className="pvg-blog-section-eyebrow">Ask an expert</p>
          <h2 id="blog-popup-heading">Have a gemstone question?</h2>
          <p>Get clear guidance from our team before choosing a certified stone.</p>
          <BlogEnquiryForm
            postTitle={postTitle}
            variant="popup"
            onDirtyChange={(dirty) => {
              formDirtyRef.current = dirty;
            }}
            onSuccess={forceDismissEnquiry}
          />
        </section>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="pvg-blog-popup-backdrop" role="presentation" onMouseDown={dismissProducts}>
      <section
        className="pvg-blog-popup pvg-blog-popup--products"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-products-popup-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="pvg-blog-popup-close" aria-label="Close related products" onClick={dismissProducts}>
          <X aria-hidden="true" />
        </button>
        <p className="pvg-blog-section-eyebrow">Shop the guide</p>
        <h2 id="blog-products-popup-heading">{relatedLabel}</h2>
        <p>Certified pieces related to this article.</p>
        <div className="pvg-blog-popup-products">
          {products.map((product) => (
            <Link key={product.id} href={product.href} className="pvg-blog-popup-product" onClick={dismissProducts}>
              <span className="pvg-blog-popup-product-thumb">
                {product.thumbnailUrl ? (
                  <Image src={product.thumbnailUrl} alt={product.name} fill sizes="56px" className="object-cover" />
                ) : null}
              </span>
              <span>
                <strong>{product.name}</strong>
                <small>{product.priceLabel}</small>
              </span>
            </Link>
          ))}
        </div>
        {relatedHref ? (
          <Link href={relatedHref} className="pvg-blog-gem-cta" onClick={dismissProducts}>
            View all {relatedLabel}
          </Link>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}
