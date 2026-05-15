'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';

import { MediaUploader } from '@/components/admin/MediaUploader';
import { AVAILABILITY_STATUS_OPTIONS } from '@/lib/constants/product-taxonomy';
import {
  CharCounter,
  FaqEditor,
  FormCheckbox,
  FormInput,
  FormSelect,
  FormTextarea,
  GeoChips,
  KeywordsInput,
  Label,
  type FaqItem,
} from './fields';
import {
  CERTIFICATIONS,
  GEM_TREATMENTS,
  IDOL_COMPOSITIONS,
  JEWELLERY_TYPE_OPTS,
  KIND_CONFIGS,
  METALS,
  ORIGINS,
  PLANETS,
  QUALITIES,
  RING_SIZE_SYSTEM_OPTS,
  RUDRAKSHA_ORIGINS,
  RUDRAKSHA_TYPES,
  SCHEMA_TYPE_OPTIONS,
  SHAPES,
  TARGET_GEO_OPTIONS,
  accentClasses,
  type FormKind,
  type SectionKey,
} from './kinds';

const RichTextEditor = dynamic(
  () => import('@/components/admin/RichTextEditor').then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-50" /> }
);

interface MediaFile {
  url: string;
  name: string;
  type: 'image' | 'video';
  preview?: string;
}

type ManagedCategoryApiRow = {
  name: string;
  slug: string;
  type?: string;
  family?: string;
  parent_id?: string | null;
  homepage_slot?: string | null;
  is_active?: boolean;
};

type ProductFormProps = {
  kind: FormKind;
  mode: 'create' | 'edit';
  productId?: string;
  initialProduct?: Record<string, unknown> | null;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parsePositiveNumber(value: string) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parsePositiveInteger(value: string) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function get<T = unknown>(p: Record<string, unknown> | null | undefined, key: string): T | undefined {
  if (!p) return undefined;
  return p[key] as T | undefined;
}

const STEP_LABELS: Record<SectionKey, string> = {
  basic: 'Basic Info',
  gemstone: 'Gem Details',
  rudraksha: 'Rudraksha Details',
  idol: 'Idol Details',
  jewellery: 'Jewellery Details',
  pricing: 'Pricing',
  vedic: 'Vedic',
  media: 'Media & Status',
  seo: 'SEO & Discovery',
};

export function ProductForm({ kind, mode, productId, initialProduct }: ProductFormProps) {
  const config = KIND_CONFIGS[kind];
  const accent = accentClasses(config.accent);
  const router = useRouter();
  const searchParams = useSearchParams();
  const directorsPickPreset = mode === 'create' && searchParams.get('directors_pick') === '1';

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [managedSubCategories, setManagedSubCategories] = useState<{ value: string; label: string }[]>([]);

  // ── Basic ─────────────────────────────────────────────
  const [name, setName] = useState((get<string>(initialProduct, 'name')) ?? '');
  const [sku, setSku] = useState((get<string>(initialProduct, 'sku')) ?? '');
  const [slug, setSlug] = useState((get<string>(initialProduct, 'slug')) ?? '');
  const [subCategory, setSubCategory] = useState(
    (get<string>(initialProduct, 'sub_category')) ?? searchParams.get('sub_category') ?? ''
  );
  const [tagNumber, setTagNumber] = useState((get<string>(initialProduct, 'tag_number')) ?? '');
  const [shortDesc, setShortDesc] = useState((get<string>(initialProduct, 'short_desc')) ?? '');
  const [description, setDescription] = useState((get<string>(initialProduct, 'description')) ?? '');

  // ── Gemstone ──────────────────────────────────────────
  const [caratWeight, setCaratWeight] = useState(String((get<number>(initialProduct, 'carat_weight')) ?? ''));
  const [rattiWeight, setRattiWeight] = useState(String((get<number>(initialProduct, 'ratti_weight')) ?? ''));
  const [origin, setOrigin] = useState((get<string>(initialProduct, 'origin')) ?? '');
  const [shape, setShape] = useState((get<string>(initialProduct, 'shape')) ?? '');
  const [colorGrade, setColorGrade] = useState((get<string>(initialProduct, 'color_grade')) ?? '');
  const [clarity, setClarity] = useState((get<string>(initialProduct, 'clarity')) ?? '');
  const [treatment, setTreatment] = useState((get<string>(initialProduct, 'treatment')) ?? config.defaultTreatment);
  const [quality, setQuality] = useState(
    (get<string>(initialProduct, 'quality_label')) ?? (get<string>(initialProduct, 'quality')) ?? ''
  );
  const [dimensionLength, setDimensionLength] = useState(String((get<{ length?: number }>(initialProduct, 'dimensions_mm'))?.length ?? ''));
  const [dimensionWidth, setDimensionWidth] = useState(String((get<{ width?: number }>(initialProduct, 'dimensions_mm'))?.width ?? ''));
  const [dimensionDepth, setDimensionDepth] = useState(String((get<{ depth?: number }>(initialProduct, 'dimensions_mm'))?.depth ?? ''));
  const [certification, setCertification] = useState((get<string>(initialProduct, 'certification')) ?? '');
  const [certificateNumber, setCertificateNumber] = useState((get<string>(initialProduct, 'certificate_number')) ?? '');
  const [certificateLab, setCertificateLab] = useState((get<string>(initialProduct, 'certificate_lab')) ?? '');
  const [certificateDisplayEnabled, setCertificateDisplayEnabled] = useState(
    Boolean(get(initialProduct, 'certificate_display_enabled'))
  );

  // ── Rudraksha ─────────────────────────────────────────
  const [mukhiCount, setMukhiCount] = useState(String((get<number>(initialProduct, 'mukhi_count')) ?? ''));
  const [rudrakshaType, setRudrakshaType] = useState((get<string>(initialProduct, 'rudraksha_type')) ?? '');
  const [rudrakshaOrigin, setRudrakshaOrigin] = useState(
    (get<string>(initialProduct, 'origin')) ?? ''
  );
  const [beadSizeMm, setBeadSizeMm] = useState(String((get<number>(initialProduct, 'bead_size_mm')) ?? ''));
  const [beadWeight, setBeadWeight] = useState(String((get<number>(initialProduct, 'bead_weight')) ?? ''));
  const [xrayCertified, setXrayCertified] = useState(Boolean(get(initialProduct, 'xray_certified')));
  const [xrayCertificateNumber, setXrayCertificateNumber] = useState(
    (get<string>(initialProduct, 'xray_certificate_number')) ?? ''
  );
  const [rulingDeity, setRulingDeity] = useState((get<string>(initialProduct, 'ruling_deity')) ?? '');

  // ── Idol ──────────────────────────────────────────────
  const [deity, setDeity] = useState((get<string>(initialProduct, 'deity')) ?? '');
  const [composition, setComposition] = useState((get<string>(initialProduct, 'composition')) ?? '');
  const [energizationEligible, setEnergizationEligible] = useState(
    Boolean(get(initialProduct, 'energization_eligible'))
  );

  // ── Jewellery ─────────────────────────────────────────
  const [jewelleryType, setJewelleryType] = useState((get<string>(initialProduct, 'jewellery_type')) ?? '');
  const [baseMetal, setBaseMetal] = useState((get<string>(initialProduct, 'base_metal')) ?? '');
  const [metalPurity, setMetalPurity] = useState((get<string>(initialProduct, 'metal_purity')) ?? '');
  const [metalWeightGrams, setMetalWeightGrams] = useState(String((get<number>(initialProduct, 'metal_weight_grams')) ?? ''));
  const [sizeLabel, setSizeLabel] = useState((get<string>(initialProduct, 'size_label')) ?? '');
  const [ringSize, setRingSize] = useState((get<string>(initialProduct, 'ring_size')) ?? '');
  const [ringSizeSystem, setRingSizeSystem] = useState('');
  const [designCode, setDesignCode] = useState((get<string>(initialProduct, 'design_code')) ?? '');
  const [makingCharge, setMakingCharge] = useState(String((get<number>(initialProduct, 'making_charge')) ?? ''));
  const [readyStock, setReadyStock] = useState(Boolean(get(initialProduct, 'ready_stock')));

  // ── Pricing ───────────────────────────────────────────
  const [price, setPrice] = useState(String((get<number>(initialProduct, 'price')) ?? ''));
  const [pricePerCarat, setPricePerCarat] = useState(String((get<number>(initialProduct, 'price_per_carat')) ?? ''));
  const [comparePrice, setComparePrice] = useState(String((get<number>(initialProduct, 'compare_price')) ?? ''));

  // ── Vedic ─────────────────────────────────────────────
  const [planet, setPlanet] = useState((get<string>(initialProduct, 'planet')) ?? '');
  const [vedicName, setVedicName] = useState((get<string>(initialProduct, 'vedic_name')) ?? '');
  const [hindiName, setHindiName] = useState((get<string>(initialProduct, 'hindi_name')) ?? '');
  const [rashi, setRashi] = useState((get<string>(initialProduct, 'rashi')) ?? '');
  const [finger, setFinger] = useState((get<string>(initialProduct, 'finger')) ?? '');
  const [wearingDay, setWearingDay] = useState((get<string>(initialProduct, 'wearing_day')) ?? '');
  const [wearingMetal, setWearingMetal] = useState((get<string>(initialProduct, 'wearing_metal')) ?? '');
  const [mantra, setMantra] = useState((get<string>(initialProduct, 'mantra')) ?? '');
  const [vedicSignificance, setVedicSignificance] = useState((get<string>(initialProduct, 'vedic_significance')) ?? '');
  const [benefitsText, setBenefitsText] = useState(() => {
    const b = get<string[]>(initialProduct, 'benefits');
    return Array.isArray(b) ? b.join('\n') : '';
  });
  const [wearingGuide, setWearingGuide] = useState((get<string>(initialProduct, 'wearing_guide')) ?? '');
  const [expertNote, setExpertNote] = useState((get<string>(initialProduct, 'expert_note')) ?? '');

  // ── Media & Status ────────────────────────────────────
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(() => {
    const images = (get<string[]>(initialProduct, 'images')) ?? [];
    const list: MediaFile[] = images.map((url, i) => ({
      url,
      name: `image-${i + 1}`,
      type: 'image' as const,
    }));
    const video = get<string>(initialProduct, 'video_url');
    if (video) list.push({ url: video, name: 'video', type: 'video' });
    return list;
  });
  const [certificateUrl, setCertificateUrl] = useState((get<string>(initialProduct, 'certificate_url')) ?? '');
  const [availabilityStatus, setAvailabilityStatus] = useState((get<string>(initialProduct, 'availability_status')) ?? 'in_stock');
  const [inStock, setInStock] = useState(get<boolean>(initialProduct, 'in_stock') ?? true);
  const [stockQty, setStockQty] = useState(String(get<number>(initialProduct, 'stock_quantity') ?? 1));
  const [featured, setFeatured] = useState(Boolean(get(initialProduct, 'featured')));
  const [isDirectorsPick, setIsDirectorsPick] = useState(Boolean(get(initialProduct, 'is_directors_pick') ?? directorsPickPreset));
  const [displayOrder, setDisplayOrder] = useState(String(get<number>(initialProduct, 'display_order') ?? 0));
  const [isActive, setIsActive] = useState(get<boolean>(initialProduct, 'is_active') ?? true);
  const [configuratorEnabled, setConfiguratorEnabled] = useState(Boolean(get(initialProduct, 'configurator_enabled') ?? directorsPickPreset));

  // ── SEO / AEO / GEO ───────────────────────────────────
  const initialSeoData = (get<Record<string, unknown>>(initialProduct, 'seo_data')) ?? {};
  const [metaTitle, setMetaTitle] = useState((get<string>(initialProduct, 'meta_title')) ?? '');
  const [metaDescription, setMetaDescription] = useState((get<string>(initialProduct, 'meta_description')) ?? '');
  const [metaKeywords, setMetaKeywords] = useState<string[]>(() => {
    const v = get<string[]>(initialProduct, 'meta_keywords');
    return Array.isArray(v) ? v : [];
  });
  const [focusKeyword, setFocusKeyword] = useState(String((initialSeoData['focus_keyword'] as string | undefined) ?? ''));
  const [canonicalUrl, setCanonicalUrl] = useState((get<string>(initialProduct, 'canonical_url')) ?? '');
  const [ogImage, setOgImage] = useState((get<string>(initialProduct, 'og_image')) ?? '');
  const [quickAnswer, setQuickAnswer] = useState(String((initialSeoData['quick_answer'] as string | undefined) ?? ''));
  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    const raw = initialSeoData['faqs'];
    return Array.isArray(raw) ? (raw as FaqItem[]).filter((it) => it && typeof it === 'object') : [];
  });
  const [targetGeos, setTargetGeos] = useState<string[]>(() => {
    const raw = initialSeoData['target_geos'];
    return Array.isArray(raw) ? (raw as string[]).filter((s) => typeof s === 'string') : ['IN'];
  });
  const [schemaType, setSchemaType] = useState(String((initialSeoData['schema_type'] as string | undefined) ?? 'Product'));
  const [originRegion, setOriginRegion] = useState((get<string>(initialProduct, 'origin_region')) ?? '');

  useEffect(() => {
    let cancelled = false;
    async function fetchManagedCategories() {
      try {
        const response = await fetch('/api/admin/homepage-categories');
        if (!response.ok) return;
        const data = await response.json();
        const rows = [
          ...((data.gem_categories ?? []) as ManagedCategoryApiRow[]),
          ...((data.catalog_categories ?? []) as ManagedCategoryApiRow[]),
        ].filter((row) => row.is_active !== false);

        const next: { value: string; label: string }[] = [];
        for (const row of rows) {
          let match = false;
          if (config.kind === 'navratna' && row.type === 'navaratna') match = true;
          else if (config.kind === 'upratna' && row.type === 'upratna') match = true;
          else if (config.kind === 'rudraksha' && row.type === 'rudraksha') match = true;
          else if (config.kind === 'idol' && row.family === 'idol') match = true;
          else if (config.kind === 'jewellery' && (row.family === 'jewelry' || row.family === 'mala' || row.homepage_slot === 'explore_jewelry')) match = true;
          if (match) next.push({ value: row.slug, label: row.name });
        }
        if (!cancelled) setManagedSubCategories(next);
      } catch {
        // silently ignore — falls back to static lists
      }
    }
    void fetchManagedCategories();
    return () => {
      cancelled = true;
    };
  }, [config.kind]);

  const subCategoryOptions = useMemo(() => {
    const merged = [...config.subCategories];
    const seen = new Set(merged.map((m) => m.value));
    for (const m of managedSubCategories) {
      if (!seen.has(m.value)) {
        merged.push(m);
        seen.add(m.value);
      }
    }
    return merged;
  }, [config.subCategories, managedSubCategories]);

  function handleNameChange(val: string) {
    setName(val);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(val));
    }
  }

  function handlePerCaratChange(val: string) {
    setPricePerCarat(val);
    const ppc = parseFloat(val);
    const cw = parseFloat(caratWeight);
    if (!isNaN(ppc) && !isNaN(cw) && ppc > 0 && cw > 0) {
      setPrice(String(Math.round(ppc * cw)));
    }
  }

  const steps = config.steps;
  const totalSteps = steps.length;

  function stepFor(section: SectionKey) {
    return Math.max(1, steps.indexOf(section) + 1);
  }

  function validateRequiredFields() {
    if (!name.trim() || !sku.trim() || !slug.trim()) {
      return { message: 'Name, SKU and slug are required.', section: 'basic' as SectionKey };
    }
    if (!subCategory) {
      return { message: `Select a ${config.shortLabel.toLowerCase()} sub-category.`, section: 'basic' as SectionKey };
    }
    if ((config.kind === 'navratna' || config.kind === 'upratna') && !caratWeight.trim()) {
      return { message: 'Carat weight is required for gemstone products.', section: 'gemstone' as SectionKey };
    }
    if (config.kind === 'idol' && (!deity.trim() || !composition.trim())) {
      return { message: 'Deity / symbol and material are required for Spiritual Idols.', section: 'idol' as SectionKey };
    }
    if (config.kind === 'jewellery' && (!jewelleryType || !baseMetal)) {
      return { message: 'Jewellery type and base metal are required for Vedic Jewellery.', section: 'jewellery' as SectionKey };
    }
    if (!price.trim()) {
      return { message: 'Sale / final price is required.', section: 'pricing' as SectionKey };
    }
    if (parsePositiveInteger(stockQty) === undefined) {
      return { message: 'Stock quantity is required and must be 0 or more.', section: 'media' as SectionKey };
    }
    return null;
  }

  function handleDirectorsPickChange(nextValue: boolean) {
    setIsDirectorsPick(nextValue);
    if (nextValue) setConfiguratorEnabled(true);
  }

  function buildBody() {
    const images = mediaFiles.filter((f) => f.type === 'image').map((f) => f.url);
    const videos = mediaFiles.filter((f) => f.type === 'video').map((f) => f.url);
    const isGemKind = config.kind === 'navratna' || config.kind === 'upratna';
    const effectiveOrigin = config.kind === 'rudraksha' ? rudrakshaOrigin || undefined : origin || undefined;
    const stockQuantity = parsePositiveInteger(stockQty) ?? 0;
    const effectiveAvailabilityStatus = stockQuantity <= 0 && availabilityStatus === 'in_stock'
      ? 'out_of_stock'
      : availabilityStatus;
    const effectiveInStock = inStock && stockQuantity > 0 && effectiveAvailabilityStatus === 'in_stock';
    const effectiveConfiguratorEnabled = configuratorEnabled || isDirectorsPick;

    const seo_data: Record<string, unknown> = {
      ...initialSeoData,
      focus_keyword: focusKeyword || undefined,
      quick_answer: quickAnswer || undefined,
      faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
      target_geos: targetGeos,
      schema_type: schemaType || 'Product',
      form_kind: config.kind,
    };

    const body: Record<string, unknown> = {
      name: name.trim(),
      sku: sku.trim(),
      slug: slug.trim(),
      category: config.category,
      sub_category: subCategory || undefined,
      product_type: config.productType,
      tag_number: tagNumber || undefined,
      short_desc: shortDesc || undefined,
      description: description || undefined,

      // Gemstone fields
      carat_weight: isGemKind ? parsePositiveNumber(caratWeight) : undefined,
      ratti_weight: isGemKind ? parsePositiveNumber(rattiWeight) : undefined,
      origin: effectiveOrigin,
      origin_region: originRegion || undefined,
      shape: isGemKind ? shape || undefined : undefined,
      color_grade: isGemKind ? colorGrade || undefined : undefined,
      clarity: isGemKind ? clarity || undefined : undefined,
      treatment: treatment || config.defaultTreatment,
      quality_label: isGemKind ? quality || undefined : undefined,
      dimensions_mm: (dimensionLength || dimensionWidth || dimensionDepth)
        ? {
            length: parsePositiveNumber(dimensionLength),
            width: parsePositiveNumber(dimensionWidth),
            depth: parsePositiveNumber(dimensionDepth),
            unit: 'mm',
          }
        : undefined,
      certification: certification || undefined,
      certificate_number: certificateNumber || undefined,
      certificate_lab: certificateLab || certification || undefined,
      certificate_status: certificateDisplayEnabled || certification ? 'available' : 'not_required',
      certificate_display_enabled: certificateDisplayEnabled,

      // Rudraksha
      mukhi_count: config.kind === 'rudraksha' ? parsePositiveInteger(mukhiCount) : undefined,
      rudraksha_type: config.kind === 'rudraksha' ? rudrakshaType || undefined : undefined,
      ruling_deity: config.kind === 'rudraksha' ? rulingDeity || undefined : undefined,
      bead_size_mm: config.kind === 'rudraksha' ? parsePositiveNumber(beadSizeMm) : undefined,
      bead_weight: config.kind === 'rudraksha' ? parsePositiveNumber(beadWeight) : undefined,
      xray_certified: config.kind === 'rudraksha' ? xrayCertified : undefined,
      xray_certificate_number: config.kind === 'rudraksha' ? xrayCertificateNumber || undefined : undefined,

      // Idol
      deity: config.kind === 'idol' ? deity || undefined : undefined,
      composition: config.kind === 'idol' ? composition || undefined : undefined,
      energization_eligible:
        config.kind === 'idol' || config.kind === 'rudraksha' ? energizationEligible : undefined,

      // Jewellery
      jewellery_type: config.kind === 'jewellery' ? jewelleryType || undefined : undefined,
      base_metal: config.kind === 'jewellery' ? baseMetal || undefined : undefined,
      metal_purity: config.kind === 'jewellery' ? metalPurity || undefined : undefined,
      metal_weight_grams: config.kind === 'jewellery' || config.kind === 'idol' ? parsePositiveNumber(metalWeightGrams) : undefined,
      size_label: config.kind === 'jewellery' ? sizeLabel || undefined : undefined,
      ring_size: config.kind === 'jewellery' ? ringSize || undefined : undefined,
      design_code: config.kind === 'jewellery' ? designCode || undefined : undefined,
      making_charge: config.kind === 'jewellery' ? parsePositiveNumber(makingCharge) : undefined,
      ready_stock: config.kind === 'jewellery' ? readyStock : undefined,

      // Pricing
      price: parseFloat(price) || 0,
      price_mode: pricePerCarat ? 'per_carat' : availabilityStatus === 'on_demand' ? 'on_demand' : 'fixed',
      price_per_carat: pricePerCarat ? parseFloat(pricePerCarat) : undefined,
      compare_price: comparePrice ? parseFloat(comparePrice) : undefined,

      // Vedic
      planet: planet || undefined,
      vedic_name: vedicName || undefined,
      hindi_name: hindiName || undefined,
      rashi: rashi || undefined,
      finger: finger || undefined,
      wearing_day: wearingDay || undefined,
      wearing_metal: wearingMetal || undefined,
      mantra: mantra || undefined,
      vedic_significance: vedicSignificance || undefined,
      benefits: benefitsText.split('\n').map((it) => it.trim()).filter(Boolean),
      wearing_guide: wearingGuide || undefined,
      expert_note: expertNote || undefined,

      // Media + status
      images: images.length > 0 ? images : undefined,
      video_url: videos[0] || undefined,
      certificate_url: certificateUrl || undefined,
      certificate_file_url: certificateUrl || undefined,
      thumbnail_url: images[0] || undefined,
      availability_status: effectiveAvailabilityStatus,
      stock_status: effectiveInStock ? 'in_stock' : 'out_of_stock',
      in_stock: effectiveInStock,
      stock_quantity: stockQuantity,
      featured,
      is_directors_pick: isDirectorsPick,
      display_order: parseInt(displayOrder) || 0,
      is_active: isActive,
      configurator_enabled: effectiveConfiguratorEnabled,

      // SEO / AEO / GEO
      meta_title: metaTitle || undefined,
      meta_description: metaDescription || undefined,
      meta_keywords: metaKeywords.length ? metaKeywords : undefined,
      canonical_url: canonicalUrl || undefined,
      og_image: ogImage || images[0] || undefined,
      seo_data,

      category_assignments: subCategory
        ? [
            { category_slug: subCategory, is_primary: true, sort_order: 0 },
            config.category !== subCategory
              ? { category_slug: config.category, is_primary: false, sort_order: 1 }
              : null,
          ].filter(Boolean)
        : undefined,
    };

    if (mode === 'create') {
      body.option_rules = {
        certificate_enabled: certificateDisplayEnabled,
        energization_enabled: effectiveConfiguratorEnabled,
        jewelry_design_enabled: effectiveConfiguratorEnabled,
        metal_enabled: effectiveConfiguratorEnabled,
        ring_size_enabled: effectiveConfiguratorEnabled,
        allowed_setting_types: effectiveConfiguratorEnabled ? ['ring', 'pendant', 'bracelet'] : [],
        allowed_metals: [],
        allowed_ring_size_systems:
          effectiveConfiguratorEnabled || ringSizeSystem ? ['india', 'us', 'uk_au', 'eu'] : [],
      };
    }

    return body;
  }

  async function handleSubmit() {
    setError('');
    const validationError = validateRequiredFields();
    if (validationError) {
      setError(validationError.message);
      setStep(stepFor(validationError.section));
      return;
    }
    setSaving(true);
    try {
      const body = buildBody();
      const url = mode === 'create' ? '/api/admin/products' : `/api/admin/products/${productId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to ${mode === 'create' ? 'create' : 'update'} product`);
        setSaving(false);
        return;
      }
      router.push('/admin/products');
    } catch {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!productId) return;
    if (!confirm('Deactivate this product? It will be hidden from the site.')) return;
    const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/products');
  }

  const currentSection = steps[step - 1];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={mode === 'create' ? '/admin/products/new' : '/admin/products'}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.emoji}</span>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {mode === 'create' ? `Add ${config.label}` : `Edit ${config.label}`}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Step {step} of {totalSteps} • {config.shortLabel} workflow
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="mb-4 flex gap-1.5">
        {steps.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i + 1)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i + 1 <= step ? accent.solid.split(' ')[0] : 'bg-gray-200'
            }`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>

      {/* Step labels */}
      <div className="mb-6 hidden gap-1.5 sm:flex">
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i + 1)}
            className={`flex-1 text-center text-xs font-medium transition-colors ${
              i + 1 === step ? accent.text : i + 1 < step ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {STEP_LABELS[s]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* ── BASIC ─────────────────────────────────── */}
      {currentSection === 'basic' && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          <p className="text-sm text-gray-500">{config.description}</p>

          <div>
            <Label htmlFor="name">Product Name *</Label>
            <FormInput id="name" value={name} onChange={handleNameChange} placeholder={`e.g. ${config.kind === 'navratna' ? 'Yellow Sapphire 3.15ct Premium' : config.kind === 'rudraksha' ? '5 Mukhi Rudraksha Nepali' : config.kind === 'idol' ? 'Brass Ganesha Idol 4 inch' : 'Silver Astro Gem Ring'}`} required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <FormInput id="sku" value={sku} onChange={setSku} placeholder="e.g. PVG-YS-3150" required />
            </div>
            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <FormInput id="slug" value={slug} onChange={setSlug} placeholder="auto-generated" required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sub_category">Sub-Category *</Label>
              <FormSelect
                id="sub_category"
                value={subCategory}
                onChange={setSubCategory}
                options={subCategoryOptions}
                placeholder={`Select ${config.shortLabel.toLowerCase()} type`}
              />
            </div>
            <div>
              <Label htmlFor="tag_number">Legacy Tag / Item Code</Label>
              <FormInput id="tag_number" value={tagNumber} onChange={setTagNumber} placeholder="e.g. S216" />
            </div>
          </div>

          <div>
            <Label htmlFor="short_desc" hint={`${shortDesc.length}/500`}>Short Description</Label>
            <FormTextarea id="short_desc" value={shortDesc} onChange={setShortDesc} placeholder="One-liner shown on product cards and snippets." rows={2} maxLength={500} />
          </div>

          <div>
            <Label>Full Description</Label>
            <RichTextEditor value={description} onChange={setDescription} placeholder="Write a detailed product description..." />
          </div>
        </div>
      )}

      {/* ── GEMSTONE ──────────────────────────────── */}
      {currentSection === 'gemstone' && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Gemstone Specifications</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="carat_weight">Carat Weight *</Label>
              <FormInput id="carat_weight" value={caratWeight} onChange={setCaratWeight} placeholder="e.g. 4.51" type="number" />
            </div>
            <div>
              <Label htmlFor="ratti_weight">Ratti Weight</Label>
              <FormInput id="ratti_weight" value={rattiWeight} onChange={setRattiWeight} placeholder="e.g. 5.00" type="number" />
            </div>
            <div>
              <Label htmlFor="quality">Quality Grade</Label>
              <FormSelect id="quality" value={quality} onChange={setQuality} options={QUALITIES} placeholder="Select quality" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="origin">Origin</Label>
              <FormSelect id="origin" value={origin} onChange={setOrigin} options={ORIGINS} placeholder="Select origin" />
            </div>
            <div>
              <Label htmlFor="origin_region">Origin Region (specific)</Label>
              <FormInput id="origin_region" value={originRegion} onChange={setOriginRegion} placeholder="e.g. Ratnapura, Mogok" />
            </div>
            <div>
              <Label htmlFor="shape">Shape / Cut</Label>
              <FormSelect id="shape" value={shape} onChange={setShape} options={SHAPES} placeholder="Select shape" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="color_grade">Color Grade</Label>
              <FormInput id="color_grade" value={colorGrade} onChange={setColorGrade} placeholder="e.g. Royal Blue, Vivid" />
            </div>
            <div>
              <Label htmlFor="clarity">Clarity</Label>
              <FormInput id="clarity" value={clarity} onChange={setClarity} placeholder="e.g. Eye Clean, VS1, Transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="dim_length">Length (mm)</Label>
              <FormInput id="dim_length" value={dimensionLength} onChange={setDimensionLength} placeholder="e.g. 9.5" type="number" />
            </div>
            <div>
              <Label htmlFor="dim_width">Width (mm)</Label>
              <FormInput id="dim_width" value={dimensionWidth} onChange={setDimensionWidth} placeholder="e.g. 7.2" type="number" />
            </div>
            <div>
              <Label htmlFor="dim_depth">Depth (mm)</Label>
              <FormInput id="dim_depth" value={dimensionDepth} onChange={setDimensionDepth} placeholder="e.g. 4.6" type="number" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="treatment">Treatment / Enhancement</Label>
              <FormSelect id="treatment" value={treatment} onChange={setTreatment} options={GEM_TREATMENTS} />
            </div>
            <div>
              <Label htmlFor="certification">Certification Lab</Label>
              <FormSelect id="certification" value={certification} onChange={setCertification} options={CERTIFICATIONS} placeholder="Select lab" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="certificate_number">Certificate Number</Label>
              <FormInput id="certificate_number" value={certificateNumber} onChange={setCertificateNumber} placeholder="e.g. IGI-GTL-12345" />
            </div>
            <div>
              <Label htmlFor="certificate_lab">Certificate Lab / Authority</Label>
              <FormInput id="certificate_lab" value={certificateLab} onChange={setCertificateLab} placeholder="e.g. IGI-GTL Delhi" />
            </div>
          </div>

          <FormCheckbox
            checked={certificateDisplayEnabled}
            onChange={setCertificateDisplayEnabled}
            label="Display certificate / lab report on product page"
          />
        </div>
      )}

      {/* ── RUDRAKSHA ─────────────────────────────── */}
      {currentSection === 'rudraksha' && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Rudraksha Specifications</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="mukhi_count">Mukhi (Face) Count</Label>
              <FormInput id="mukhi_count" value={mukhiCount} onChange={setMukhiCount} placeholder="e.g. 5" type="number" />
            </div>
            <div>
              <Label htmlFor="rudraksha_type">Rudraksha Type</Label>
              <FormSelect id="rudraksha_type" value={rudrakshaType} onChange={setRudrakshaType} options={RUDRAKSHA_TYPES} placeholder="Select type" />
            </div>
            <div>
              <Label htmlFor="rudraksha_origin">Origin Country</Label>
              <FormSelect id="rudraksha_origin" value={rudrakshaOrigin} onChange={setRudrakshaOrigin} options={RUDRAKSHA_ORIGINS} placeholder="Nepal / Indonesia / Java" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="bead_size_mm">Bead Size (mm)</Label>
              <FormInput id="bead_size_mm" value={beadSizeMm} onChange={setBeadSizeMm} placeholder="e.g. 18" type="number" />
            </div>
            <div>
              <Label htmlFor="bead_weight">Bead Weight (g)</Label>
              <FormInput id="bead_weight" value={beadWeight} onChange={setBeadWeight} placeholder="e.g. 2.4" type="number" />
            </div>
            <div>
              <Label htmlFor="ruling_deity">Ruling Deity</Label>
              <FormInput id="ruling_deity" value={rulingDeity} onChange={setRulingDeity} placeholder="e.g. Shiva, Kalagni Rudra" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="xray_certificate_number">X-Ray Certificate Number</Label>
              <FormInput id="xray_certificate_number" value={xrayCertificateNumber} onChange={setXrayCertificateNumber} placeholder="Certificate number" />
            </div>
            <div>
              <Label htmlFor="certification">Authentication Lab</Label>
              <FormSelect id="certification" value={certification} onChange={setCertification} options={CERTIFICATIONS} placeholder="Select lab" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <FormCheckbox checked={xrayCertified} onChange={setXrayCertified} label="X-Ray certified authentic" />
            <FormCheckbox checked={energizationEligible} onChange={setEnergizationEligible} label="Eligible for Vedic energization" />
            <FormCheckbox checked={certificateDisplayEnabled} onChange={setCertificateDisplayEnabled} label="Display certificate publicly" />
          </div>
        </div>
      )}

      {/* ── IDOL ──────────────────────────────────── */}
      {currentSection === 'idol' && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Idol / Yantra Specifications</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="deity">Deity / Symbol *</Label>
              <FormInput id="deity" value={deity} onChange={setDeity} placeholder="Ganesha, Lakshmi, Shree Yantra" />
            </div>
            <div>
              <Label htmlFor="composition">Material / Composition *</Label>
              <FormSelect id="composition" value={composition} onChange={setComposition} options={IDOL_COMPOSITIONS} placeholder="Select material" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="dim_length">Height / Length (mm)</Label>
              <FormInput id="dim_length" value={dimensionLength} onChange={setDimensionLength} placeholder="e.g. 90" type="number" />
            </div>
            <div>
              <Label htmlFor="dim_width">Width (mm)</Label>
              <FormInput id="dim_width" value={dimensionWidth} onChange={setDimensionWidth} placeholder="e.g. 60" type="number" />
            </div>
            <div>
              <Label htmlFor="dim_depth">Depth (mm)</Label>
              <FormInput id="dim_depth" value={dimensionDepth} onChange={setDimensionDepth} placeholder="e.g. 45" type="number" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="metal_weight_grams">Idol Weight (g)</Label>
              <FormInput id="metal_weight_grams" value={metalWeightGrams} onChange={setMetalWeightGrams} placeholder="e.g. 450" type="number" />
            </div>
            <div>
              <Label htmlFor="origin_region">Origin / Source</Label>
              <FormInput id="origin_region" value={originRegion} onChange={setOriginRegion} placeholder="e.g. Moradabad, Narmada River" />
            </div>
          </div>

          <FormCheckbox
            checked={energizationEligible}
            onChange={setEnergizationEligible}
            label="Eligible for Pran Pratishta / Vedic energization"
          />
        </div>
      )}

      {/* ── JEWELLERY ─────────────────────────────── */}
      {currentSection === 'jewellery' && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Jewellery Specifications</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="jewellery_type">Jewellery Type *</Label>
              <FormSelect id="jewellery_type" value={jewelleryType} onChange={setJewelleryType} options={JEWELLERY_TYPE_OPTS} placeholder="Select type" />
            </div>
            <div>
              <Label htmlFor="base_metal">Base Metal *</Label>
              <FormSelect id="base_metal" value={baseMetal} onChange={setBaseMetal} options={METALS} placeholder="Select metal" />
            </div>
            <div>
              <Label htmlFor="metal_purity">Metal Purity</Label>
              <FormInput id="metal_purity" value={metalPurity} onChange={setMetalPurity} placeholder="22K, 18K, 925" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="metal_weight_grams">Metal Weight (g)</Label>
              <FormInput id="metal_weight_grams" value={metalWeightGrams} onChange={setMetalWeightGrams} placeholder="e.g. 5.2" type="number" />
            </div>
            <div>
              <Label htmlFor="ring_size">Ring / Size</Label>
              <FormInput id="ring_size" value={ringSize} onChange={setRingSize} placeholder="e.g. 14" />
            </div>
            <div>
              <Label htmlFor="ring_size_system">Ring Size System</Label>
              <FormSelect id="ring_size_system" value={ringSizeSystem} onChange={setRingSizeSystem} options={RING_SIZE_SYSTEM_OPTS} placeholder="Select system" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="size_label">Size Label</Label>
              <FormInput id="size_label" value={sizeLabel} onChange={setSizeLabel} placeholder="Adjustable, 18 inch" />
            </div>
            <div>
              <Label htmlFor="design_code">Design Code</Label>
              <FormInput id="design_code" value={designCode} onChange={setDesignCode} placeholder="PVG-RING-001" />
            </div>
            <div>
              <Label htmlFor="making_charge">Making Charge (₹)</Label>
              <FormInput id="making_charge" value={makingCharge} onChange={setMakingCharge} placeholder="e.g. 1500" type="number" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <FormCheckbox checked={readyStock} onChange={setReadyStock} label="Ready stock item" />
            <FormCheckbox checked={configuratorEnabled} onChange={setConfiguratorEnabled} label="Enable customization configurator" />
          </div>
        </div>
      )}

      {/* ── PRICING ───────────────────────────────── */}
      {currentSection === 'pricing' && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Pricing (INR)</h2>
          <p className="text-sm text-gray-500">
            {config.kind === 'navratna' || config.kind === 'upratna'
              ? 'Per-carat rate auto-calculates the final price when carat weight is set.'
              : 'Enter the final selling price and an optional compare price (MRP / strikethrough).'}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(config.kind === 'navratna' || config.kind === 'upratna') && (
              <div>
                <Label htmlFor="price_per_carat">Price per Carat (₹)</Label>
                <FormInput id="price_per_carat" value={pricePerCarat} onChange={handlePerCaratChange} placeholder="e.g. 1150" type="number" />
              </div>
            )}
            <div>
              <Label htmlFor="price">Sale / Final Price (₹) *</Label>
              <FormInput id="price" value={price} onChange={setPrice} placeholder="Auto or manual" type="number" required />
            </div>
            <div>
              <Label htmlFor="compare_price">Regular / Compare Price (₹)</Label>
              <FormInput id="compare_price" value={comparePrice} onChange={setComparePrice} placeholder="e.g. 6000" type="number" />
            </div>
          </div>

          <div className={`rounded-lg ${accent.bg} p-4 text-sm ${accent.text}`}>
            <strong>Tip:</strong> The compare price must be greater than or equal to the sale price.
            Per-carat pricing applies only to gemstones.
          </div>
        </div>
      )}

      {/* ── VEDIC ─────────────────────────────────── */}
      {currentSection === 'vedic' && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Vedic &amp; Astrological Properties</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="planet">Ruling Planet</Label>
              <FormSelect id="planet" value={planet} onChange={setPlanet} options={PLANETS} placeholder="Select planet" />
            </div>
            <div>
              <Label htmlFor="vedic_name">Vedic / Sanskrit Name</Label>
              <FormInput id="vedic_name" value={vedicName} onChange={setVedicName} placeholder="e.g. Pukhraj, Rudraksha" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="hindi_name">Hindi Name</Label>
              <FormInput id="hindi_name" value={hindiName} onChange={setHindiName} placeholder="e.g. पुखराज" />
            </div>
            <div>
              <Label htmlFor="rashi">Rashi (Zodiac)</Label>
              <FormInput id="rashi" value={rashi} onChange={setRashi} placeholder="e.g. Sagittarius, Pisces" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="finger">Wearing Finger</Label>
              <FormInput id="finger" value={finger} onChange={setFinger} placeholder="e.g. Index" />
            </div>
            <div>
              <Label htmlFor="wearing_day">Wearing Day</Label>
              <FormInput id="wearing_day" value={wearingDay} onChange={setWearingDay} placeholder="e.g. Thursday" />
            </div>
            <div>
              <Label htmlFor="wearing_metal">Recommended Metal</Label>
              <FormSelect id="wearing_metal" value={wearingMetal} onChange={setWearingMetal} options={METALS} placeholder="Select metal" />
            </div>
          </div>

          <div>
            <Label htmlFor="mantra">Mantra</Label>
            <FormTextarea id="mantra" value={mantra} onChange={setMantra} rows={2} placeholder="Optional mantra / invocation text..." />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="vedic_significance">Vedic Significance</Label>
              <FormTextarea id="vedic_significance" value={vedicSignificance} onChange={setVedicSignificance} rows={4} placeholder="Why this product is spiritually or astrologically selected..." />
            </div>
            <div>
              <Label htmlFor="wearing_guide">Wearing / Placement Guide</Label>
              <FormTextarea id="wearing_guide" value={wearingGuide} onChange={setWearingGuide} rows={4} placeholder="Method, placement, activation, care..." />
            </div>
          </div>

          <div>
            <Label htmlFor="benefits">Benefits (one per line)</Label>
            <FormTextarea id="benefits" value={benefitsText} onChange={setBenefitsText} rows={3} placeholder="One benefit per line" />
          </div>

          <div>
            <Label htmlFor="expert_note">Expert / Curator Note</Label>
            <FormTextarea id="expert_note" value={expertNote} onChange={setExpertNote} rows={3} placeholder="Internal curator notes — establishes expertise (E-E-A-T)." />
          </div>
        </div>
      )}

      {/* ── MEDIA & STATUS ────────────────────────── */}
      {currentSection === 'media' && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Media &amp; Status</h2>

          <div>
            <Label>Product Images &amp; Videos</Label>
            <MediaUploader value={mediaFiles} onChange={setMediaFiles} />
          </div>

          <div>
            <Label htmlFor="certificate_url">Certificate / Lab Report URL</Label>
            <FormInput id="certificate_url" value={certificateUrl} onChange={setCertificateUrl} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="stock_qty">Stock Quantity *</Label>
              <FormInput id="stock_qty" value={stockQty} onChange={setStockQty} placeholder="1" type="number" />
            </div>
            <div>
              <Label htmlFor="availability_status">Availability Status</Label>
              <FormSelect id="availability_status" value={availabilityStatus} onChange={setAvailabilityStatus} options={AVAILABILITY_STATUS_OPTIONS} />
            </div>
          </div>

          <div className="space-y-3">
            <FormCheckbox checked={inStock} onChange={setInStock} label="In stock" />
            <FormCheckbox checked={isActive} onChange={setIsActive} label="Active (visible on site)" />
            <FormCheckbox checked={featured} onChange={setFeatured} label="Featured" />
            <FormCheckbox checked={isDirectorsPick} onChange={handleDirectorsPickChange} label="Director's Pick" />
            {isDirectorsPick && (
              <div className="ml-7 max-w-xs">
                <Label htmlFor="display_order">Director&apos;s Pick Display Order</Label>
                <FormInput id="display_order" value={displayOrder} onChange={setDisplayOrder} placeholder="0" type="number" />
              </div>
            )}
            <FormCheckbox checked={configuratorEnabled} onChange={setConfiguratorEnabled} label="Enable customization configurator" />
          </div>
        </div>
      )}

      {/* ── SEO / AEO / EEO / GEO ─────────────────── */}
      {currentSection === 'seo' && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">SEO, AEO &amp; Discovery</h2>
            <p className="mt-1 text-sm text-gray-500">
              Optimised for Google search (SEO), answer engines like ChatGPT &amp; Perplexity (AEO),
              regional targeting (GEO), and authority signals (E-E-A-T).
            </p>
          </div>

          <div>
            <Label htmlFor="meta_title">
              <span>Meta Title</span>
              <CharCounter value={metaTitle} max={60} />
            </Label>
            <FormInput id="meta_title" value={metaTitle} onChange={setMetaTitle} placeholder={`e.g. ${config.label} — ${name || 'Astrologically Approved'} | PureVedicGems`} maxLength={75} />
          </div>

          <div>
            <Label htmlFor="meta_description">
              <span>Meta Description</span>
              <CharCounter value={metaDescription} max={160} />
            </Label>
            <FormTextarea id="meta_description" value={metaDescription} onChange={setMetaDescription} rows={3} placeholder="A clear 150–160 character summary of the product, benefits, and a CTA." maxLength={200} />
          </div>

          <div>
            <Label htmlFor="focus_keyword">Focus Keyword</Label>
            <FormInput id="focus_keyword" value={focusKeyword} onChange={setFocusKeyword} placeholder={`e.g. ${config.seoStarterKeywords[0]}`} />
          </div>

          <div>
            <Label>Meta Keywords / Tags</Label>
            <KeywordsInput value={metaKeywords} onChange={setMetaKeywords} placeholder="Add keyword, press Enter" />
            <p className="mt-1 text-xs text-gray-400">Suggested: {config.seoStarterKeywords.join(', ')}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="canonical_url">Canonical URL</Label>
              <FormInput id="canonical_url" value={canonicalUrl} onChange={setCanonicalUrl} placeholder="https://purevedicgems.com/..." />
            </div>
            <div>
              <Label htmlFor="og_image">OG / Social Share Image URL</Label>
              <FormInput id="og_image" value={ogImage} onChange={setOgImage} placeholder="Auto-uses first product image" />
            </div>
          </div>

          <div>
            <Label htmlFor="schema_type">Structured Data Schema Type</Label>
            <FormSelect id="schema_type" value={schemaType} onChange={setSchemaType} options={SCHEMA_TYPE_OPTIONS} />
            <p className="mt-1 text-xs text-gray-400">
              Use &ldquo;IndividualProduct&rdquo; for one-of-a-kind certified gems / collector beads.
            </p>
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-4">
            <h3 className="text-sm font-semibold text-amber-950">Answer Engine Optimization (AEO)</h3>
            <p className="mt-1 text-xs text-amber-900/80">
              These fields surface inside Google AI Overviews, ChatGPT Search, Perplexity, and Bing Copilot.
            </p>

            <div className="mt-3">
              <Label htmlFor="quick_answer" hint={`${quickAnswer.length}/300`}>Quick Answer Summary</Label>
              <FormTextarea
                id="quick_answer"
                value={quickAnswer}
                onChange={setQuickAnswer}
                rows={3}
                placeholder="A 40–60 word factual summary an AI assistant could quote verbatim. Lead with what the product is, its key attribute, and core benefit."
                maxLength={500}
              />
            </div>

            <div className="mt-4">
              <Label>FAQ Entries</Label>
              <p className="mb-2 text-xs text-amber-900/80">
                Suggested questions for {config.shortLabel}: {config.faqStarters.slice(0, 2).join(' • ')}…
              </p>
              <FaqEditor value={faqs} onChange={setFaqs} />
            </div>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
            <h3 className="text-sm font-semibold text-emerald-950">Geographic Targeting (GEO)</h3>
            <p className="mt-1 mb-3 text-xs text-emerald-900/80">
              Markets where this product should rank and be promoted. Used for hreflang, currency hints, and ad targeting.
            </p>
            <GeoChips value={targetGeos} onChange={setTargetGeos} options={TARGET_GEO_OPTIONS} />
          </div>
        </div>
      )}

      {/* ── NAVIGATION ────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-2 flex gap-2 sm:order-1">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            Back
          </button>
          {step < totalSteps && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${accent.solid}`}
            >
              Next
            </button>
          )}
        </div>

        <div className="order-1 flex gap-2 sm:order-2">
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDeactivate}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Deactivate
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${accent.solid}`}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === 'create' ? `Save ${config.shortLabel}` : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
