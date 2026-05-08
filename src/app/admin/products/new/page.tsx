'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { MediaUploader } from '@/components/admin/MediaUploader';
import {
  AVAILABILITY_STATUS_OPTIONS,
  CANONICAL_CATEGORY_OPTIONS,
  JEWELLERY_TYPES,
  PRODUCT_TYPE_OPTIONS,
} from '@/lib/constants/product-taxonomy';

const RichTextEditor = dynamic(
  () => import('@/components/admin/RichTextEditor').then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-50" /> }
);

// ── Categories mapped from old PureVedicGems website ────────────────
const CATEGORIES = CANONICAL_CATEGORY_OPTIONS;

const SUB_CATEGORIES: Record<string, { value: string; label: string }[]> = {
  navaratna: [
    { value: 'yellow-sapphire', label: 'Yellow Sapphire (Pukhraj)' },
    { value: 'blue-sapphire', label: 'Blue Sapphire (Neelam)' },
    { value: 'ruby', label: 'Ruby (Manik)' },
    { value: 'emerald', label: 'Emerald (Panna)' },
    { value: 'red-coral', label: 'Red Coral (Moonga)' },
    { value: 'hessonite', label: 'Hessonite (Gomed)' },
    { value: 'pearl', label: 'Pearl (Moti)' },
    { value: 'cats-eye', label: "Cat's Eye (Lehsunia)" },
    { value: 'diamond', label: 'Diamond (Heera)' },
    { value: 'white-sapphire', label: 'White Sapphire (Safed Pukhraj)' },
    { value: 'pitambari', label: 'Pitambari' },
  ],
  upratna: [
    { value: 'opal', label: 'Opal' },
    { value: 'turquoise', label: 'Turquoise (Firoza)' },
    { value: 'amethyst', label: 'Amethyst (Katela)' },
    { value: 'moonstone', label: 'Moonstone (Chandrakant)' },
    { value: 'garnet', label: 'Garnet' },
    { value: 'peridot', label: 'Peridot (Zabarjad)' },
    { value: 'tanzanite', label: 'Tanzanite' },
    { value: 'lapis-lazuli', label: 'Lapis Lazuli (Lajward)' },
    { value: 'citrine', label: 'Citrine (Sunela)' },
    { value: 'aquamarine', label: 'Aquamarine (Beruj)' },
    { value: 'blue-topaz', label: 'Blue Topaz' },
    { value: 'white-topaz', label: 'White Topaz' },
    { value: 'zircon', label: 'Zircon' },
    { value: 'iolite', label: 'Iolite' },
    { value: 'tourmaline', label: 'Tourmaline' },
    { value: 'diopside', label: 'Diopside' },
    { value: 'malachite', label: 'Malachite' },
    { value: 'tiger-eye', label: 'Tiger Eye' },
    { value: 'kyanite', label: 'Kyanite' },
    { value: 'sunstone', label: 'Sunstone' },
    { value: 'hakik', label: 'Hakik (Agate)' },
    { value: 'white-coral', label: 'White Coral' },
    { value: 'spinel', label: 'Spinel' },
    { value: 'chrysoberyl', label: 'Chrysoberyl' },
  ],
  rudraksha: [
    { value: '1-mukhi', label: '1 Mukhi' }, { value: '2-mukhi', label: '2 Mukhi' },
    { value: '3-mukhi', label: '3 Mukhi' }, { value: '4-mukhi', label: '4 Mukhi' },
    { value: '5-mukhi', label: '5 Mukhi' }, { value: '6-mukhi', label: '6 Mukhi' },
    { value: '7-mukhi', label: '7 Mukhi' }, { value: '8-mukhi', label: '8 Mukhi' },
    { value: '9-mukhi', label: '9 Mukhi' }, { value: '10-mukhi', label: '10 Mukhi' },
    { value: '11-mukhi', label: '11 Mukhi' }, { value: '12-mukhi', label: '12 Mukhi' },
    { value: '13-mukhi', label: '13 Mukhi' }, { value: '14-mukhi', label: '14 Mukhi' },
    { value: '15-mukhi', label: '15 Mukhi' }, { value: '16-mukhi', label: '16 Mukhi' },
    { value: '17-mukhi', label: '17 Mukhi' }, { value: '18-mukhi', label: '18 Mukhi' },
    { value: '19-mukhi', label: '19 Mukhi' }, { value: '20-mukhi', label: '20 Mukhi' },
    { value: '21-mukhi', label: '21 Mukhi' },
    { value: 'gauri-shankar', label: 'Gauri Shankar' },
    { value: 'ganesh-rudraksha', label: 'Ganesh Rudraksha' },
    { value: 'savar-rudraksha', label: 'Savar Rudraksha' },
    { value: 'trijuti-rudraksha', label: 'Trijuti Rudraksha' },
  ],
  idol: [
    { value: 'shree-yantra', label: 'Shree Yantra' },
    { value: 'durga-devi', label: 'Durga Devi' },
    { value: 'hanuman', label: 'Hanuman' },
    { value: 'shiv-ji', label: 'Shiv Ji' },
    { value: 'shivling', label: 'Shivling' },
    { value: 'ganesha', label: 'Ganesha' },
    { value: 'lakshmi', label: 'Lakshmi' },
    { value: 'nandi', label: 'Nandi' },
    { value: 'other-idol', label: 'Other' },
  ],
  jewelry: [
    { value: 'bracelets', label: 'Bracelets' },
    { value: 'exclusive-rudraksha-malas', label: 'Exclusive Rudraksha Malas' },
    { value: 'rudraksha-jewelry', label: 'Ready Rudraksha Jewelry' },
    { value: 'diamond-jewellery', label: 'Diamond Jewellery' },
    { value: 'malas', label: 'Malas' },
    { value: 'astro-gems-stock', label: 'Ready Astro-Gems Stock' },
    { value: 'ring', label: 'Ring' },
    { value: 'pendant', label: 'Pendant' },
    { value: 'necklace', label: 'Necklace' },
    { value: 'earring', label: 'Earring' },
  ],
};

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SHAPES = ['Round', 'Oval', 'Cushion', 'Emerald Cut', 'Pear', 'Heart', 'Marquise', 'Princess', 'Octagonal', 'Triangular', 'Cabochon', 'Mixed'];
const CERTIFICATIONS = ['GIA', 'IGI', 'GJEPC', 'IIGJ', 'GRS', 'Gübelin', 'SSEF', 'AGL', 'HRD Antwerp', 'GII', 'GFCO', 'None'];
const QUALITIES = ['Economy', 'Good', 'Premium', 'Luxury', 'Super Luxury', 'Collector'];
const TREATMENTS = ['Natural', 'Unheated', 'Heated', 'Minor Oil', 'No Oil', 'No Treatment', 'None'];
const METALS = ['Gold 22K', 'Gold 18K', 'Gold 14K', 'Silver 925', 'Platinum', 'Panchdhatu', 'Ashtadhatu'];
const ORIGINS = ['Ceylon (Sri Lanka)', 'Burma (Myanmar)', 'Kashmir', 'Colombia', 'Zambia', 'Madagascar', 'Thailand', 'Brazil', 'Italy', 'Australia', 'India', 'Nepal', 'Tanzania', 'Japan', 'Afghanistan', 'Russia'];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Reusable form components OUTSIDE the page to prevent re-mount on re-render ──

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-gray-700">
      {children}
    </label>
  );
}

function FormInput({
  id, value, onChange, placeholder, type = 'text', required = false,
}: {
  id: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
    />
  );
}

function FormSelect({
  id, value, onChange, options, placeholder,
}: {
  id: string; value: string; onChange: (v: string) => void;
  options: readonly string[] | readonly { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
    >
      <option value="">{placeholder ?? 'Select...'}</option>
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const lbl = typeof opt === 'string' ? opt : opt.label;
        return <option key={val} value={val}>{lbl}</option>;
      })}
    </select>
  );
}

// ── Media file type ──
interface MediaFile {
  url: string;
  name: string;
  type: 'image' | 'video';
  preview?: string;
}

type CategoryOption = { value: string; label: string };

type ManagedCategoryApiRow = {
  name: string;
  slug: string;
  type?: string;
  family?: string;
  parent_id?: string | null;
  homepage_slot?: string | null;
  is_active?: boolean;
};

const RUDRAKSHA_TYPES = ['Nepali', 'Indonesian', 'Java', 'Collector', 'Gauri Shankar', 'Ganesh', 'Savar', 'Trijuti'];
const IDOL_COMPOSITIONS = ['Brass', 'Copper', 'Panchdhatu', 'Ashtadhatu', 'Silver', 'Crystal', 'Marble', 'Gemstone', 'Wood'];

function categoryKeyFromManaged(row: ManagedCategoryApiRow) {
  if (row.type === 'navaratna' || row.type === 'upratna' || row.type === 'rudraksha') return row.type;
  if (row.family === 'idol') return 'idol';
  if (row.family === 'mala') return 'mala';
  if (row.family === 'jewelry' || row.homepage_slot === 'explore_jewelry') return 'jewelry';
  return null;
}

function mergeOptions(...groups: CategoryOption[][]) {
  const seen = new Set<string>();
  const merged: CategoryOption[] = [];
  for (const group of groups) {
    for (const option of group) {
      if (seen.has(option.value)) continue;
      seen.add(option.value);
      merged.push(option);
    }
  }
  return merged;
}

function parsePositiveNumber(value: string) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parsePositiveInteger(value: string) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function productTypeForCategory(category: string) {
  if (category === 'rudraksha') return 'rudraksha';
  if (category === 'idol') return 'idol';
  if (category === 'jewelry') return 'jewelry';
  if (category === 'mala') return 'mala';
  return 'gemstone';
}

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') ?? '';
  const initialProductType = searchParams.get('product_type') ?? productTypeForCategory(initialCategory);
  const initialSubCategory = searchParams.get('sub_category') ?? '';
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [managedSubCategories, setManagedSubCategories] = useState<Record<string, CategoryOption[]>>({});

  // Step 1: Basic info
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [subCategory, setSubCategory] = useState(initialSubCategory);
  const [productType, setProductType] = useState(initialProductType);
  const [tagNumber, setTagNumber] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Gem-specific details
  const [caratWeight, setCaratWeight] = useState('');
  const [origin, setOrigin] = useState('');
  const [shape, setShape] = useState('');
  const [colorGrade, setColorGrade] = useState('');
  const [clarity, setClarity] = useState('');
  const [treatment, setTreatment] = useState('Natural');
  const [certification, setCertification] = useState('');
  const [quality, setQuality] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [certificateLab, setCertificateLab] = useState('');
  const [certificateDisplayEnabled, setCertificateDisplayEnabled] = useState(false);
  const [mukhiCount, setMukhiCount] = useState('');
  const [rudrakshaType, setRudrakshaType] = useState('');
  const [rulingDeity, setRulingDeity] = useState('');
  const [deity, setDeity] = useState('');
  const [beadSizeMm, setBeadSizeMm] = useState('');
  const [beadWeight, setBeadWeight] = useState('');
  const [xrayCertified, setXrayCertified] = useState(false);
  const [xrayCertificateNumber, setXrayCertificateNumber] = useState('');
  const [energizationEligible, setEnergizationEligible] = useState(false);
  const [jewelleryType, setJewelleryType] = useState('');
  const [baseMetal, setBaseMetal] = useState('');
  const [metalPurity, setMetalPurity] = useState('');
  const [metalWeightGrams, setMetalWeightGrams] = useState('');
  const [sizeLabel, setSizeLabel] = useState('');
  const [ringSize, setRingSize] = useState('');
  const [designCode, setDesignCode] = useState('');
  const [makingCharge, setMakingCharge] = useState('');
  const [readyStock, setReadyStock] = useState(false);
  const [composition, setComposition] = useState('');
  const [dimensionLength, setDimensionLength] = useState('');
  const [dimensionWidth, setDimensionWidth] = useState('');
  const [dimensionDepth, setDimensionDepth] = useState('');

  // Step 3: Pricing
  const [price, setPrice] = useState('');
  const [pricePerCarat, setPricePerCarat] = useState('');
  const [comparePrice, setComparePrice] = useState('');

  // Step 4: Vedic details
  const [planet, setPlanet] = useState('');
  const [vedicName, setVedicName] = useState('');
  const [hindiName, setHindiName] = useState('');
  const [rashi, setRashi] = useState('');
  const [finger, setFinger] = useState('');
  const [wearingDay, setWearingDay] = useState('');
  const [wearingMetal, setWearingMetal] = useState('');
  const [mantra, setMantra] = useState('');
  const [vedicSignificance, setVedicSignificance] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [wearingGuide, setWearingGuide] = useState('');
  const [expertNote, setExpertNote] = useState('');

  // Step 5: Media & status
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [certificateUrl, setCertificateUrl] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('in_stock');
  const [inStock, setInStock] = useState(true);
  const [stockQty, setStockQty] = useState('1');
  const [featured, setFeatured] = useState(false);
  const [isDirectorsPick, setIsDirectorsPick] = useState(false);
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [configuratorEnabled, setConfiguratorEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchManagedCategories() {
      const response = await fetch('/api/admin/homepage-categories');
      if (!response.ok) return;
      const data = await response.json();
      const rows = [
        ...((data.gem_categories ?? []) as ManagedCategoryApiRow[]),
        ...((data.catalog_categories ?? []) as ManagedCategoryApiRow[]),
      ].filter((row) => row.is_active !== false);

      const next: Record<string, CategoryOption[]> = {};
      for (const row of rows) {
        const key = categoryKeyFromManaged(row);
        if (!key) continue;
        next[key] = [...(next[key] ?? []), { value: row.slug, label: row.name }];
      }
      if (!cancelled) setManagedSubCategories(next);
    }

    void fetchManagedCategories();
    return () => { cancelled = true; };
  }, []);

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

  const totalSteps = 5;
  const subCats = useMemo(() => {
    if (!category) return [];
    return mergeOptions(SUB_CATEGORIES[category] ?? [], managedSubCategories[category] ?? []);
  }, [category, managedSubCategories]);
  const isGemstoneProduct = productType === 'gemstone' || ['navaratna', 'upratna', 'gemstone'].includes(category);
  const isRudrakshaProduct = productType === 'rudraksha' || category === 'rudraksha';
  const isJewelleryProduct = productType === 'jewelry' || productType === 'mala' || category === 'jewelry' || category === 'mala';
  const isIdolProduct = productType === 'idol' || category === 'idol';
  const detailStepLabel = isRudrakshaProduct
    ? 'Rudraksha Details'
    : isJewelleryProduct
      ? 'Jewellery Details'
      : isIdolProduct
        ? 'Idol Details'
        : 'Gem Details';

  async function handleSubmit() {
    setError('');
    const images = mediaFiles.filter(f => f.type === 'image').map(f => f.url);
    const videos = mediaFiles.filter(f => f.type === 'video').map(f => f.url);

    const body = {
      name: name.trim(),
      sku: sku.trim(),
      slug: slug.trim(),
      category,
      sub_category: subCategory || undefined,
      product_type: productType,
      tag_number: tagNumber || undefined,
      short_desc: shortDesc || undefined,
      description: description || undefined,
      carat_weight: caratWeight ? parseFloat(caratWeight) : undefined,
      origin: origin || undefined,
      shape: shape || undefined,
      color_grade: colorGrade || undefined,
      clarity: clarity || undefined,
      treatment: treatment || 'Natural',
      certification: certification || undefined,
      quality_label: quality || undefined,
      certificate_number: certificateNumber || undefined,
      certificate_lab: certificateLab || certification || undefined,
      certificate_status: certificateDisplayEnabled || certification ? 'available' : 'not_required',
      certificate_display_enabled: certificateDisplayEnabled,
      mukhi_count: parsePositiveInteger(mukhiCount),
      rudraksha_type: rudrakshaType || undefined,
      ruling_deity: rulingDeity || undefined,
      deity: deity || undefined,
      bead_size_mm: parsePositiveNumber(beadSizeMm),
      bead_weight: parsePositiveNumber(beadWeight),
      xray_certified: xrayCertified,
      xray_certificate_number: xrayCertificateNumber || undefined,
      energization_eligible: energizationEligible,
      jewellery_type: jewelleryType || undefined,
      base_metal: baseMetal || undefined,
      metal_purity: metalPurity || undefined,
      metal_weight_grams: parsePositiveNumber(metalWeightGrams),
      size_label: sizeLabel || undefined,
      ring_size: ringSize || undefined,
      design_code: designCode || undefined,
      making_charge: parsePositiveNumber(makingCharge),
      ready_stock: readyStock,
      composition: composition || undefined,
      dimensions_mm: dimensionLength || dimensionWidth || dimensionDepth ? {
        length: parsePositiveNumber(dimensionLength),
        width: parsePositiveNumber(dimensionWidth),
        depth: parsePositiveNumber(dimensionDepth),
        unit: 'mm',
      } : undefined,
      price: parseFloat(price) || 0,
      price_mode: pricePerCarat ? 'per_carat' : availabilityStatus === 'on_demand' ? 'on_demand' : 'fixed',
      price_per_carat: pricePerCarat ? parseFloat(pricePerCarat) : undefined,
      compare_price: comparePrice ? parseFloat(comparePrice) : undefined,
      planet: planet || undefined,
      vedic_name: vedicName || undefined,
      hindi_name: hindiName || undefined,
      rashi: rashi || undefined,
      finger: finger || undefined,
      wearing_day: wearingDay || undefined,
      wearing_metal: wearingMetal || undefined,
      mantra: mantra || undefined,
      vedic_significance: vedicSignificance || undefined,
      benefits: benefitsText.split('\n').map((item) => item.trim()).filter(Boolean),
      wearing_guide: wearingGuide || undefined,
      expert_note: expertNote || undefined,
      images: images.length > 0 ? images : undefined,
      video_url: videos[0] || undefined,
      certificate_url: certificateUrl || undefined,
      certificate_file_url: certificateUrl || undefined,
      thumbnail_url: images[0] || undefined,
      availability_status: availabilityStatus,
      stock_status: inStock ? 'in_stock' : 'out_of_stock',
      in_stock: inStock && availabilityStatus === 'in_stock',
      stock_quantity: parseInt(stockQty) || 1,
      featured,
      is_directors_pick: isDirectorsPick,
      display_order: parseInt(displayOrder) || 0,
      is_active: isActive,
      configurator_enabled: configuratorEnabled,
      category_assignments: subCategory ? [
        { category_slug: subCategory, is_primary: true, sort_order: 0 },
        category && category !== subCategory ? { category_slug: category, is_primary: false, sort_order: 1 } : null,
      ].filter(Boolean) : undefined,
      option_rules: {
        certificate_enabled: certificateDisplayEnabled,
        energization_enabled: configuratorEnabled,
        jewelry_design_enabled: configuratorEnabled,
        metal_enabled: configuratorEnabled,
        ring_size_enabled: configuratorEnabled,
        allowed_setting_types: configuratorEnabled ? ['ring', 'pendant', 'bracelet'] : [],
        allowed_metals: [],
        allowed_ring_size_systems: configuratorEnabled ? ['india', 'us', 'uk_au', 'eu'] : [],
      },
    };

    setSaving(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create product');
        setSaving(false);
        return;
      }
      router.push('/admin/products');
    } catch {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/products" className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Add New Product</h1>
          <p className="text-sm text-gray-500">Step {step} of {totalSteps}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i + 1)}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-amber-500' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {/* Step labels */}
      <div className="mb-6 hidden gap-1.5 sm:flex">
        {['Basic Info', detailStepLabel, 'Pricing', 'Vedic', 'Media & Status'].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i + 1)}
            className={`flex-1 text-center text-xs font-medium transition-colors ${
              i + 1 === step ? 'text-amber-600' : i + 1 < step ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* ── Step 1: Basic Info ─────────────────── */}
      {step === 1 && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

          <div>
            <Label htmlFor="name">Product Name *</Label>
            <FormInput id="name" value={name} onChange={handleNameChange} placeholder="e.g. Yellow Sapphire 3.15ct Premium" required />
            <p className="mt-1 text-xs text-gray-400">Format: [Gem Name] [Carat]ct [Quality]</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <FormInput id="sku" value={sku} onChange={setSku} placeholder="e.g. YS-3150-CEY" required />
            </div>
            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <FormInput id="slug" value={slug} onChange={setSlug} placeholder="auto-generated" required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="product_type">Product Type *</Label>
              <FormSelect id="product_type" value={productType} onChange={setProductType} options={PRODUCT_TYPE_OPTIONS} />
            </div>
            <div>
              <Label htmlFor="tag_number">Legacy Tag Number</Label>
              <FormInput id="tag_number" value={tagNumber} onChange={setTagNumber} placeholder="e.g. S216" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Category *</Label>
              <FormSelect
                id="category"
                value={category}
                onChange={(v) => {
                  setCategory(v);
                  setSubCategory('');
                  if (v === 'rudraksha') setProductType('rudraksha');
                  else if (v === 'idol') setProductType('idol');
                  else if (v === 'jewelry') setProductType('jewelry');
                  else if (v === 'mala') setProductType('mala');
                  else if (['navaratna', 'upratna', 'gemstone'].includes(v)) setProductType('gemstone');
                }}
                options={CATEGORIES}
                placeholder="Select category..."
              />
            </div>
            {subCats.length > 0 && (
              <div>
                <Label htmlFor="sub_category">Sub-Category</Label>
                <FormSelect
                  id="sub_category"
                  value={subCategory}
                  onChange={setSubCategory}
                  options={subCats}
                  placeholder="Select sub-category"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="short_desc">Short Description</Label>
            <textarea
              id="short_desc"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Brief one-liner for product cards..."
              rows={2}
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <Label>Full Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Write a detailed product description... Use the toolbar for bold, lists, headings etc."
            />
          </div>
        </div>
      )}

      {/* ── Step 2: Section-aware product details ───────────── */}
      {step === 2 && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{detailStepLabel}</h2>
            <p className="mt-1 text-sm text-gray-500">Only the fields relevant to the selected section need to be filled.</p>
          </div>

          {isGemstoneProduct && (
            <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Gemstone identity</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="carat_weight">Carat Weight</Label>
                  <FormInput id="carat_weight" value={caratWeight} onChange={setCaratWeight} placeholder="e.g. 4.51" type="number" />
                </div>
                <div>
                  <Label htmlFor="quality">Quality</Label>
                  <FormSelect id="quality" value={quality} onChange={setQuality} options={QUALITIES} placeholder="Select quality" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="origin">Origin</Label>
                  <FormSelect id="origin" value={origin} onChange={setOrigin} options={ORIGINS} placeholder="Select origin" />
                </div>
                <div>
                  <Label htmlFor="shape">Shape</Label>
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
                  <FormInput id="clarity" value={clarity} onChange={setClarity} placeholder="e.g. Eye Clean, VS1" />
                </div>
              </div>
            </div>
          )}

          {isRudrakshaProduct && (
            <div className="space-y-4 rounded-lg border border-orange-100 bg-orange-50/60 p-4">
              <h3 className="text-sm font-semibold text-orange-950">Rudraksha specifications</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="mukhi_count">Mukhi Count</Label>
                  <FormInput id="mukhi_count" value={mukhiCount} onChange={setMukhiCount} placeholder="e.g. 5" type="number" />
                </div>
                <div>
                  <Label htmlFor="rudraksha_type">Rudraksha Type</Label>
                  <FormSelect id="rudraksha_type" value={rudrakshaType} onChange={setRudrakshaType} options={RUDRAKSHA_TYPES} placeholder="Select type" />
                </div>
                <div>
                  <Label htmlFor="ruling_deity">Ruling Deity</Label>
                  <FormInput id="ruling_deity" value={rulingDeity} onChange={setRulingDeity} placeholder="e.g. Shiva" />
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
                  <Label htmlFor="xray_certificate_number">X-Ray Certificate No.</Label>
                  <FormInput id="xray_certificate_number" value={xrayCertificateNumber} onChange={setXrayCertificateNumber} placeholder="Certificate number" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={xrayCertified} onChange={(e) => setXrayCertified(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                  X-Ray certified
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={energizationEligible} onChange={(e) => setEnergizationEligible(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                  Energization eligible
                </label>
              </div>
            </div>
          )}

          {isJewelleryProduct && (
            <div className="space-y-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
              <h3 className="text-sm font-semibold text-emerald-950">Jewellery and setting details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="jewellery_type">Jewellery Type</Label>
                  <FormSelect id="jewellery_type" value={jewelleryType} onChange={setJewelleryType} options={JEWELLERY_TYPES} placeholder="Select type" />
                </div>
                <div>
                  <Label htmlFor="base_metal">Base Metal</Label>
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
                  <Label htmlFor="ring_size">Ring Size</Label>
                  <FormInput id="ring_size" value={ringSize} onChange={setRingSize} placeholder="e.g. 14 India" />
                </div>
                <div>
                  <Label htmlFor="size_label">Size Label</Label>
                  <FormInput id="size_label" value={sizeLabel} onChange={setSizeLabel} placeholder="Adjustable, 18 inch" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="design_code">Design Code</Label>
                  <FormInput id="design_code" value={designCode} onChange={setDesignCode} placeholder="PVG-RING-001" />
                </div>
                <div>
                  <Label htmlFor="making_charge">Making Charge (₹)</Label>
                  <FormInput id="making_charge" value={makingCharge} onChange={setMakingCharge} placeholder="e.g. 1500" type="number" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={readyStock} onChange={(e) => setReadyStock(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                Ready stock item
              </label>
            </div>
          )}

          {isIdolProduct && (
            <div className="space-y-4 rounded-lg border border-violet-100 bg-violet-50/60 p-4">
              <h3 className="text-sm font-semibold text-violet-950">Idol details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="deity">Deity</Label>
                  <FormInput id="deity" value={deity} onChange={setDeity} placeholder="Ganesha, Lakshmi, Shiva" />
                </div>
                <div>
                  <Label htmlFor="composition">Material / Composition</Label>
                  <FormSelect id="composition" value={composition} onChange={setComposition} options={IDOL_COMPOSITIONS} placeholder="Select material" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="dimension_length">Length (mm)</Label>
                  <FormInput id="dimension_length" value={dimensionLength} onChange={setDimensionLength} placeholder="e.g. 90" type="number" />
                </div>
                <div>
                  <Label htmlFor="dimension_width">Width (mm)</Label>
                  <FormInput id="dimension_width" value={dimensionWidth} onChange={setDimensionWidth} placeholder="e.g. 60" type="number" />
                </div>
                <div>
                  <Label htmlFor="dimension_depth">Depth (mm)</Label>
                  <FormInput id="dimension_depth" value={dimensionDepth} onChange={setDimensionDepth} placeholder="e.g. 45" type="number" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={energizationEligible} onChange={(e) => setEnergizationEligible(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                Energization or pran pratistha eligible
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="treatment">Treatment / Finish</Label>
              <FormSelect id="treatment" value={treatment} onChange={setTreatment} options={TREATMENTS} />
            </div>
            <div>
              <Label htmlFor="certification">Certification</Label>
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
        </div>
      )}

      {/* ── Step 3: Pricing ────────────────────── */}
      {step === 3 && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Pricing (INR)</h2>
          <p className="text-sm text-gray-500">Per-carat rate auto-calculates the final price when carat weight is set.</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="price_per_carat">Price per Carat (₹)</Label>
              <FormInput id="price_per_carat" value={pricePerCarat} onChange={handlePerCaratChange} placeholder="e.g. 1150" type="number" />
            </div>
            <div>
              <Label htmlFor="price">Sale Price / Final Price (₹) *</Label>
              <FormInput id="price" value={price} onChange={setPrice} placeholder="Auto or manual" type="number" />
            </div>
            <div>
              <Label htmlFor="compare_price">Regular / Compare Price (₹)</Label>
              <FormInput id="compare_price" value={comparePrice} onChange={setComparePrice} placeholder="e.g. 6000" type="number" />
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Conversion guide:</strong><br />
            &bull; WC &quot;Sale price&quot; → &quot;Sale Price / Final Price&quot;<br />
            &bull; WC &quot;Regular price&quot; → &quot;Regular / Compare Price&quot;<br />
            &bull; Price per carat from product name (e.g. @1150 per ct)
          </div>
        </div>
      )}

      {/* ── Step 4: Vedic Properties ──────────── */}
      {step === 4 && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Vedic &amp; Astrological Properties</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="planet">Ruling Planet</Label>
              <FormSelect id="planet" value={planet} onChange={setPlanet} options={PLANETS} placeholder="Select planet" />
            </div>
            <div>
              <Label htmlFor="vedic_name">Vedic Name</Label>
              <FormInput id="vedic_name" value={vedicName} onChange={setVedicName} placeholder="e.g. Pukhraj" />
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
              <FormInput id="finger" value={finger} onChange={setFinger} placeholder="e.g. Index finger" />
            </div>
            <div>
              <Label htmlFor="wearing_day">Wearing Day</Label>
              <FormInput id="wearing_day" value={wearingDay} onChange={setWearingDay} placeholder="e.g. Thursday" />
            </div>
            <div>
              <Label htmlFor="wearing_metal">Wearing Metal</Label>
              <FormSelect id="wearing_metal" value={wearingMetal} onChange={setWearingMetal} options={METALS} placeholder="Select metal" />
            </div>
          </div>

          <div>
            <Label htmlFor="mantra">Mantra</Label>
            <textarea
              id="mantra"
              value={mantra}
              onChange={(e) => setMantra(e.target.value)}
              rows={2}
              placeholder="Optional mantra or invocation text..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="vedic_significance">Vedic Significance</Label>
              <textarea
                id="vedic_significance"
                value={vedicSignificance}
                onChange={(e) => setVedicSignificance(e.target.value)}
                rows={4}
                placeholder="Why this product is spiritually or astrologically selected..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <Label htmlFor="wearing_guide">Wearing / Placement Guide</Label>
              <textarea
                id="wearing_guide"
                value={wearingGuide}
                onChange={(e) => setWearingGuide(e.target.value)}
                rows={4}
                placeholder="Day, method, placement, care, or activation notes..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="benefits">Benefits</Label>
            <textarea
              id="benefits"
              value={benefitsText}
              onChange={(e) => setBenefitsText(e.target.value)}
              rows={3}
              placeholder="One benefit per line"
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <Label htmlFor="expert_note">Expert Note</Label>
            <textarea
              id="expert_note"
              value={expertNote}
              onChange={(e) => setExpertNote(e.target.value)}
              rows={3}
              placeholder="Internal curator or expert-facing note for this product..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      )}

      {/* ── Step 5: Media & Status ────────────── */}
      {step === 5 && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Media &amp; Status</h2>

          <div>
            <Label>Product Images &amp; Videos</Label>
            <MediaUploader value={mediaFiles} onChange={setMediaFiles} />
          </div>

          <div>
            <Label htmlFor="certificate_url">Certificate URL</Label>
            <FormInput id="certificate_url" value={certificateUrl} onChange={setCertificateUrl} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="stock_qty">Stock Quantity</Label>
              <FormInput id="stock_qty" value={stockQty} onChange={setStockQty} placeholder="1" type="number" />
            </div>
            <div>
              <Label htmlFor="availability_status">Availability Status</Label>
              <FormSelect id="availability_status" value={availabilityStatus} onChange={setAvailabilityStatus} options={AVAILABILITY_STATUS_OPTIONS} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
              <span className="text-sm text-gray-700">In Stock</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
              <span className="text-sm text-gray-700">Active (visible on site)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={isDirectorsPick} onChange={(e) => setIsDirectorsPick(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
              <span className="text-sm text-gray-700">Director&apos;s Pick</span>
            </label>
            {isDirectorsPick && (
              <div className="ml-7 max-w-xs">
                <Label htmlFor="display_order">Director&apos;s Pick Display Order</Label>
                <FormInput id="display_order" value={displayOrder} onChange={setDisplayOrder} placeholder="0" type="number" />
              </div>
            )}
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={configuratorEnabled} onChange={(e) => setConfiguratorEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
              <span className="text-sm text-gray-700">Enable Configurator</span>
              <span className="text-[10px] text-gray-400">(Customers can configure this gem into jewelry)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={certificateDisplayEnabled} onChange={(e) => setCertificateDisplayEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
              <span className="text-sm text-gray-700">Show certificate option/details</span>
            </label>
          </div>
        </div>
      )}

      {/* ── Navigation buttons ─────────────────── */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="order-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 sm:order-1"
        >
          ← Previous
        </button>

        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
            className="order-1 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 sm:order-2"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !name || !sku || !slug || !price}
            className="order-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:order-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Creating...' : 'Create Product'}
          </button>
        )}
      </div>
    </div>
  );
}
