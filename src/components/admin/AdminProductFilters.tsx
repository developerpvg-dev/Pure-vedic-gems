'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react';
import type { AdminFilterOptions } from '@/lib/admin/product-filters';
import { CANONICAL_CATEGORY_OPTIONS } from '@/lib/constants/product-taxonomy';
import type { ShopFilterOption } from '@/lib/shop/filters';

export type AdminProductFilterState = {
  search: string;
  category: string;
  sub_category: string;
  product_type: string;
  status: string;
  availability: string;
  stock: string;
  origin: string;
  planet: string;
  shape: string;
  quality_label: string;
  certificate_lab: string;
  treatment: string;
  price_mode: string;
  min_price: string;
  max_price: string;
  min_carat: string;
  max_carat: string;
  featured: string;
  directors_pick: string;
  configurator_enabled: string;
  sort_by: string;
  sort_order: string;
};

export const EMPTY_ADMIN_PRODUCT_FILTERS: AdminProductFilterState = {
  search: '',
  category: '',
  sub_category: '',
  product_type: '',
  status: '',
  availability: '',
  stock: '',
  origin: '',
  planet: '',
  shape: '',
  quality_label: '',
  certificate_lab: '',
  treatment: '',
  price_mode: '',
  min_price: '',
  max_price: '',
  min_carat: '',
  max_carat: '',
  featured: '',
  directors_pick: '',
  configurator_enabled: '',
  sort_by: 'newest',
  sort_order: 'desc',
};

const AVAILABILITY_OPTIONS = ['in_stock', 'reserved', 'sold', 'on_demand', 'out_of_stock', 'archived'];

const SORT_OPTIONS = [
  { value: 'newest-desc', sort_by: 'newest', sort_order: 'desc', label: 'Newest first' },
  { value: 'newest-asc', sort_by: 'newest', sort_order: 'asc', label: 'Oldest first' },
  { value: 'price-asc', sort_by: 'price', sort_order: 'asc', label: 'Price: low to high' },
  { value: 'price-desc', sort_by: 'price', sort_order: 'desc', label: 'Price: high to low' },
  { value: 'carat-asc', sort_by: 'carat', sort_order: 'asc', label: 'Carat: low to high' },
  { value: 'carat-desc', sort_by: 'carat', sort_order: 'desc', label: 'Carat: high to low' },
  { value: 'name-asc', sort_by: 'name', sort_order: 'asc', label: 'Name: A–Z' },
  { value: 'name-desc', sort_by: 'name', sort_order: 'desc', label: 'Name: Z–A' },
  { value: 'stock-asc', sort_by: 'stock', sort_order: 'asc', label: 'Stock: low to high' },
  { value: 'stock-desc', sort_by: 'stock', sort_order: 'desc', label: 'Stock: high to low' },
];

const FILTER_LABELS: Record<keyof AdminProductFilterState, string> = {
  search: 'Search',
  category: 'Category',
  sub_category: 'Sub-category',
  product_type: 'Type',
  status: 'Status',
  availability: 'Availability',
  stock: 'Stock',
  origin: 'Origin',
  planet: 'Planet',
  shape: 'Shape',
  quality_label: 'Quality',
  certificate_lab: 'Cert lab',
  treatment: 'Treatment',
  price_mode: 'Price mode',
  min_price: 'Min price',
  max_price: 'Max price',
  min_carat: 'Min carat',
  max_carat: 'Max carat',
  featured: 'Featured',
  directors_pick: "Director's pick",
  configurator_enabled: 'Configurator',
  sort_by: 'Sort',
  sort_order: 'Order',
};

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function selectClassName() {
  return 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30';
}

function inputClassName() {
  return 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30';
}

function optionLabel(options: ShopFilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? label(value);
}

function FilterField({
  labelText,
  children,
  hint,
}: {
  labelText: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {labelText}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[10px] text-gray-400">{hint}</span> : null}
    </label>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: ShopFilterOption[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`${selectClassName()} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
          {option.count > 0 ? ` (${option.count})` : ''}
        </option>
      ))}
    </select>
  );
}

function TriStateSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClassName()}>
      <option value="">Any</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  );
}

function buildFilterParams(filters: AdminProductFilterState) {
  const params = new URLSearchParams();
  const entries: Array<[string, string]> = [
    ['search', filters.search],
    ['category', filters.category],
    ['sub_category', filters.sub_category],
    ['product_type', filters.product_type],
    ['status', filters.status],
    ['availability_status', filters.availability],
    ['stock', filters.stock],
    ['origin', filters.origin],
    ['planet', filters.planet],
    ['shape', filters.shape],
    ['quality_label', filters.quality_label],
    ['certificate_lab', filters.certificate_lab],
    ['treatment', filters.treatment],
    ['price_mode', filters.price_mode],
    ['min_price', filters.min_price],
    ['max_price', filters.max_price],
    ['min_carat', filters.min_carat],
    ['max_carat', filters.max_carat],
    ['featured', filters.featured],
    ['directors_pick', filters.directors_pick],
    ['configurator_enabled', filters.configurator_enabled],
    ['sort_by', filters.sort_by],
    ['sort_order', filters.sort_order],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
  }
  return params;
}

export function adminProductFiltersToParams(filters: AdminProductFilterState, page: number, perPage: number) {
  const params = buildFilterParams(filters);
  params.set('page', String(page));
  params.set('per_page', String(perPage));
  return params;
}

export function countActiveAdminFilters(filters: AdminProductFilterState) {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === 'sort_by') return value !== 'newest';
    if (key === 'sort_order') return value !== 'desc';
    return Boolean(value);
  }).length;
}

type AdminProductFiltersProps = {
  filters: AdminProductFilterState;
  onChange: (updates: Partial<AdminProductFilterState>) => void;
  onClear: () => void;
};

export function AdminProductFilters({ filters, onChange, onClear }: AdminProductFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<AdminFilterOptions | null>(null);

  useEffect(() => {
    const params = filters.category ? `?category=${encodeURIComponent(filters.category)}` : '';
    void fetch(`/api/admin/products/filter-options${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AdminFilterOptions | null) => {
        if (data) setFilterOptions(data);
      })
      .catch(() => undefined);
  }, [filters.category]);

  const sortValue = `${filters.sort_by}-${filters.sort_order}`;
  const activeCount = countActiveAdminFilters(filters);
  const categoryLabel =
    CANONICAL_CATEGORY_OPTIONS.find((c) => c.value === filters.category)?.label ??
    label(filters.category);

  const activeBadges = useMemo(() => {
    const badges: Array<{ key: keyof AdminProductFilterState; label: string }> = [];
    const optionMap: Partial<Record<keyof AdminProductFilterState, ShopFilterOption[]>> = {
      category: filterOptions?.categories,
      sub_category: filterOptions?.subcategories,
      product_type: filterOptions?.productTypes,
      origin: filterOptions?.origins,
      planet: filterOptions?.planets,
      shape: filterOptions?.shapes,
      quality_label: filterOptions?.qualityLabels,
      certificate_lab: filterOptions?.certificateLabs,
      treatment: filterOptions?.treatments,
      price_mode: filterOptions?.priceModes,
    };

    for (const [key, value] of Object.entries(filters) as Array<[keyof AdminProductFilterState, string]>) {
      if (!value) continue;
      if (key === 'sort_by' && value === 'newest') continue;
      if (key === 'sort_order' && value === 'desc') continue;

      let display = value;
      if (key === 'status') display = value === 'active' ? 'Active' : value === 'trash' ? 'Trash' : 'Draft';
      else if (key === 'availability') display = label(value);
      else if (key === 'stock') display = value === 'low' ? 'Low stock' : 'Out of stock';
      else if (['featured', 'directors_pick', 'configurator_enabled'].includes(key)) {
        display = value === 'true' ? 'Yes' : 'No';
      } else if (key === 'min_price' || key === 'max_price') {
        display = `₹${Number(value).toLocaleString('en-IN')}`;
      } else if (key === 'min_carat' || key === 'max_carat') {
        display = `${value} ct`;
      } else if (optionMap[key]) {
        display = optionLabel(optionMap[key] ?? [], value);
      }

      badges.push({ key, label: `${FILTER_LABELS[key]}: ${display}` });
    }
    return badges;
  }, [filterOptions, filters]);

  function updateSort(nextValue: string) {
    const match = SORT_OPTIONS.find((option) => option.value === nextValue);
    if (!match) return;
    onChange({ sort_by: match.sort_by, sort_order: match.sort_order });
  }

  function clearBadge(key: keyof AdminProductFilterState) {
    if (key === 'category') onChange({ category: '', sub_category: '' });
    else if (key === 'sort_by' || key === 'sort_order') onChange({ sort_by: 'newest', sort_order: 'desc' });
    else onChange({ [key]: '' });
  }

  const advancedActiveCount = [
    filters.product_type,
    filters.availability,
    filters.stock,
    filters.origin,
    filters.planet,
    filters.shape,
    filters.quality_label,
    filters.certificate_lab,
    filters.treatment,
    filters.price_mode,
    filters.min_price,
    filters.max_price,
    filters.min_carat,
    filters.max_carat,
    filters.featured,
    filters.directors_pick,
    filters.configurator_enabled,
  ].filter(Boolean).length;

  return (
    <div className="mt-6 space-y-3">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <FilterField labelText="Search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => onChange({ search: e.target.value })}
                  placeholder="SKU, tag, name, slug…"
                  className={`${inputClassName()} pl-9`}
                />
              </div>
            </FilterField>
          </div>

          <div className="lg:col-span-3">
            <FilterField labelText="Category">
              <FilterSelect
                value={filters.category}
                onChange={(value) => onChange({ category: value, sub_category: '' })}
                placeholder="All categories"
                options={filterOptions?.categories ?? []}
              />
            </FilterField>
          </div>

          <div className="lg:col-span-3">
            <FilterField
              labelText="Sub-category"
              hint={
                filters.category
                  ? `All ${categoryLabel || 'category'} sub-types`
                  : 'Choose a category first'
              }
            >
              <FilterSelect
                value={filters.sub_category}
                onChange={(value) => onChange({ sub_category: value })}
                placeholder={filters.category ? 'All sub-categories' : 'Select category first'}
                options={filterOptions?.subcategories ?? []}
                disabled={!filters.category}
              />
            </FilterField>
          </div>

          <div className="lg:col-span-2">
            <FilterField labelText="Status">
              <select
                value={filters.status}
                onChange={(e) => onChange({ status: e.target.value })}
                className={selectClassName()}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Draft</option>
              </select>
            </FilterField>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterField labelText="Sort">
              <select
                value={sortValue}
                onChange={(e) => updateSort(e.target.value)}
                className={`${selectClassName()} min-w-[160px]`}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>

          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              advancedOpen
                ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-200'
                : 'bg-gray-50 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            More filters
            {advancedActiveCount > 0 && (
              <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {advancedActiveCount}
              </span>
            )}
            {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {advancedOpen && (
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Additional filters</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-medium text-amber-700 hover:text-amber-800"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Inventory</p>
              <FilterField labelText="Availability">
                <select
                  value={filters.availability}
                  onChange={(e) => onChange({ availability: e.target.value })}
                  className={selectClassName()}
                >
                  <option value="">Any</option>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {label(option)}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField labelText="Stock level">
                <select
                  value={filters.stock}
                  onChange={(e) => onChange({ stock: e.target.value })}
                  className={selectClassName()}
                >
                  <option value="">Any</option>
                  <option value="low">Low stock (&lt; 5)</option>
                  <option value="out">Out of stock</option>
                </select>
              </FilterField>
              <FilterField labelText="Product type">
                <FilterSelect
                  value={filters.product_type}
                  onChange={(value) => onChange({ product_type: value })}
                  placeholder="Any type"
                  options={filterOptions?.productTypes ?? []}
                />
              </FilterField>
            </div>

            <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Gem details</p>
              <FilterField labelText="Origin">
                <FilterSelect
                  value={filters.origin}
                  onChange={(value) => onChange({ origin: value })}
                  placeholder="Any origin"
                  options={filterOptions?.origins ?? []}
                />
              </FilterField>
              <FilterField labelText="Planet">
                <FilterSelect
                  value={filters.planet}
                  onChange={(value) => onChange({ planet: value })}
                  placeholder="Any planet"
                  options={filterOptions?.planets ?? []}
                />
              </FilterField>
              <FilterField labelText="Shape">
                <FilterSelect
                  value={filters.shape}
                  onChange={(value) => onChange({ shape: value })}
                  placeholder="Any shape"
                  options={filterOptions?.shapes ?? []}
                />
              </FilterField>
              <FilterField labelText="Treatment">
                <FilterSelect
                  value={filters.treatment}
                  onChange={(value) => onChange({ treatment: value })}
                  placeholder="Any treatment"
                  options={filterOptions?.treatments ?? []}
                />
              </FilterField>
            </div>

            <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Pricing & flags</p>
              <div className="grid grid-cols-2 gap-2">
                <FilterField labelText="Min ₹">
                  <input
                    type="number"
                    min={0}
                    value={filters.min_price}
                    onChange={(e) => onChange({ min_price: e.target.value })}
                    placeholder="0"
                    className={inputClassName()}
                  />
                </FilterField>
                <FilterField labelText="Max ₹">
                  <input
                    type="number"
                    min={0}
                    value={filters.max_price}
                    onChange={(e) => onChange({ max_price: e.target.value })}
                    placeholder="No limit"
                    className={inputClassName()}
                  />
                </FilterField>
                <FilterField labelText="Min ct">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={filters.min_carat}
                    onChange={(e) => onChange({ min_carat: e.target.value })}
                    placeholder="0"
                    className={inputClassName()}
                  />
                </FilterField>
                <FilterField labelText="Max ct">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={filters.max_carat}
                    onChange={(e) => onChange({ max_carat: e.target.value })}
                    placeholder="No limit"
                    className={inputClassName()}
                  />
                </FilterField>
              </div>
              <FilterField labelText="Quality">
                <FilterSelect
                  value={filters.quality_label}
                  onChange={(value) => onChange({ quality_label: value })}
                  placeholder="Any quality"
                  options={filterOptions?.qualityLabels ?? []}
                />
              </FilterField>
              <FilterField labelText="Cert lab">
                <FilterSelect
                  value={filters.certificate_lab}
                  onChange={(value) => onChange({ certificate_lab: value })}
                  placeholder="Any lab"
                  options={filterOptions?.certificateLabs ?? []}
                />
              </FilterField>
              <FilterField labelText="Price mode">
                <FilterSelect
                  value={filters.price_mode}
                  onChange={(value) => onChange({ price_mode: value })}
                  placeholder="Any mode"
                  options={filterOptions?.priceModes ?? []}
                />
              </FilterField>
              <div className="grid grid-cols-3 gap-2">
                <FilterField labelText="Featured">
                  <TriStateSelect value={filters.featured} onChange={(value) => onChange({ featured: value })} />
                </FilterField>
                <FilterField labelText="Director's pick">
                  <TriStateSelect
                    value={filters.directors_pick}
                    onChange={(value) => onChange({ directors_pick: value })}
                  />
                </FilterField>
                <FilterField labelText="Configurator">
                  <TriStateSelect
                    value={filters.configurator_enabled}
                    onChange={(value) => onChange({ configurator_enabled: value })}
                  />
                </FilterField>
              </div>
            </div>
          </div>

          {(filterOptions?.priceRanges.length ?? 0) > 0 && (
            <div className="mt-4 rounded-lg border border-gray-100 bg-white p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Quick price</p>
              <div className="flex flex-wrap gap-2">
                {filterOptions!.priceRanges.map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => {
                      const [min, max] = range.value.split('-');
                      onChange({ min_price: min ?? '', max_price: max ?? '' });
                    }}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 transition hover:border-amber-300 hover:bg-amber-50"
                  >
                    {range.label} ({range.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {(filterOptions?.caratRanges.length ?? 0) > 0 && (
            <div className="mt-3 rounded-lg border border-gray-100 bg-white p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Quick carat</p>
              <div className="flex flex-wrap gap-2">
                {filterOptions!.caratRanges.map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => {
                      const [min, max] = range.value.split('-');
                      onChange({ min_carat: min ?? '', max_carat: max ?? '' });
                    }}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 transition hover:border-amber-300 hover:bg-amber-50"
                  >
                    {range.label} ({range.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeBadges.map((badge) => (
            <span
              key={badge.key}
              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200"
            >
              {badge.label}
              <button
                type="button"
                onClick={() => clearBadge(badge.key)}
                className="rounded-full p-0.5 hover:bg-amber-100"
                aria-label={`Remove ${badge.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
