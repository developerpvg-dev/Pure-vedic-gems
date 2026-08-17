'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { BlogEnquiryForm } from './BlogEnquiryForm';
import type { BlogRelatedProduct } from '@/lib/blog/blog-rail-data';

// ponytail: v2 resets stale dismissals from earlier popup iterations during testing
function enquiryDismissKey(slug: string) {
  return `pvg-blog-enquiry-dismissed:v2:${slug}`;
}

function productsDismissKey(slug: string) {
  return `pvg-blog-products-popup-dismissed:v2:${slug}`;
}

const MOBILE_MAX = 1023;

function isCompactScreen() {
  return typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_MAX}px)`).matches;
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

  function scheduleProductsPopup() {
    if (!isCompactScreen()) return;
    if (!productsRef.current.length || !relatedHrefRef.current || !relatedLabelRef.current) return;
    if (localStorage.getItem(productsDismissKey(slug))) return;
    clearProductsTimer();
    productsTimerRef.current = window.setTimeout(() => {
      if (!isCompactScreen()) return;
      if (formDirtyRef.current) return;
      if (localStorage.getItem(productsDismissKey(slug))) return;
      setStage('products');
    }, 10_000);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Enquiry popup: desktop + mobile, 10s after landing (unless dismissed for this slug)
  useEffect(() => {
    if (localStorage.getItem(enquiryDismissKey(slug))) return;
    const timer = window.setTimeout(() => setStage('enquiry'), 10_000);
    return () => window.clearTimeout(timer);
  }, [slug]);

  // If enquiry already dismissed, still offer products on compact screens
  useEffect(() => {
    if (!localStorage.getItem(enquiryDismissKey(slug))) return;
    if (localStorage.getItem(productsDismissKey(slug))) return;
    if (!products.length) return;
    if (!isCompactScreen()) return;
    const timer = window.setTimeout(() => {
      if (!isCompactScreen()) return;
      setStage('products');
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [slug, products.length]);

  useEffect(() => () => clearProductsTimer(), []);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    function onChange() {
      if (!mq.matches && stage === 'products') {
        clearProductsTimer();
        setStage('none');
      }
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [stage]);

  function dismissEnquiry() {
    if (formDirtyRef.current && stage === 'enquiry') return;
    localStorage.setItem(enquiryDismissKey(slug), 'true');
    setStage('none');
    scheduleProductsPopup();
  }

  function forceDismissEnquiry() {
    formDirtyRef.current = false;
    localStorage.setItem(enquiryDismissKey(slug), 'true');
    setStage('none');
    scheduleProductsPopup();
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
        onMouseDown={() => {
          if (!formDirtyRef.current) dismissEnquiry();
        }}
      >
        <section
          className="pvg-blog-popup"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-popup-heading"
          onMouseDown={(event) => event.stopPropagation()}
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
