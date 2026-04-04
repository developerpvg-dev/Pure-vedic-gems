'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { MediaUploader } from '@/components/admin/MediaUploader';

const RichTextEditor = dynamic(
  () => import('@/components/admin/RichTextEditor').then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-50" /> }
);

// ── Categories mapped from old PureVedicGems website ────────────────
const CATEGORIES = [
  { value: 'navaratna', label: 'Navaratna (Sacred Nine Gems)' },
  { value: 'upratna', label: 'Upratna (Semi-Precious Gems)' },
  { value: 'rudraksha', label: 'Rudraksha' },
  { value: 'idol', label: 'Spiritual Idols' },
  { value: 'jewelry', label: 'Jewellery' },
];

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
  options: string[] | { value: string; label: string }[]; placeholder?: string;
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

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Basic info
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
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

  // Step 5: Media & status
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [certificateUrl, setCertificateUrl] = useState('');
  const [inStock, setInStock] = useState(true);
  const [stockQty, setStockQty] = useState('1');
  const [featured, setFeatured] = useState(false);
  const [isDirectorsPick, setIsDirectorsPick] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [configuratorEnabled, setConfiguratorEnabled] = useState(false);

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
  const subCats = category ? SUB_CATEGORIES[category] ?? [] : [];

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
      short_desc: shortDesc || undefined,
      description: description || undefined,
      carat_weight: caratWeight ? parseFloat(caratWeight) : undefined,
      origin: origin || undefined,
      shape: shape || undefined,
      color_grade: colorGrade || undefined,
      clarity: clarity || undefined,
      treatment: treatment || 'Natural',
      certification: certification || undefined,
      price: parseFloat(price) || 0,
      price_per_carat: pricePerCarat ? parseFloat(pricePerCarat) : undefined,
      compare_price: comparePrice ? parseFloat(comparePrice) : undefined,
      planet: planet || undefined,
      vedic_name: vedicName || undefined,
      hindi_name: hindiName || undefined,
      rashi: rashi || undefined,
      finger: finger || undefined,
      wearing_day: wearingDay || undefined,
      wearing_metal: wearingMetal || undefined,
      images: images.length > 0 ? images : undefined,
      video_url: videos[0] || undefined,
      certificate_url: certificateUrl || undefined,
      thumbnail_url: images[0] || undefined,
      in_stock: inStock,
      stock_quantity: parseInt(stockQty) || 1,
      featured,
      is_directors_pick: isDirectorsPick,
      is_active: isActive,
      configurator_enabled: configuratorEnabled,
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
        {['Basic Info', 'Gem Details', 'Pricing', 'Vedic', 'Media & Status'].map((label, i) => (
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
              <Label htmlFor="category">Category *</Label>
              <FormSelect
                id="category"
                value={category}
                onChange={(v) => { setCategory(v); setSubCategory(''); }}
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

      {/* ── Step 2: Gemstone Details ───────────── */}
      {step === 2 && (
        <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Gemstone Details</h2>

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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="treatment">Treatment</Label>
              <FormSelect id="treatment" value={treatment} onChange={setTreatment} options={TREATMENTS} />
            </div>
            <div>
              <Label htmlFor="certification">Certification</Label>
              <FormSelect id="certification" value={certification} onChange={setCertification} options={CERTIFICATIONS} placeholder="Select lab" />
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
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={configuratorEnabled} onChange={(e) => setConfiguratorEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
              <span className="text-sm text-gray-700">Enable Configurator</span>
              <span className="text-[10px] text-gray-400">(Customers can configure this gem into jewelry)</span>
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
