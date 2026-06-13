'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react';
import type { AdminFilterOptions } from '@/lib/admin/product-filters';
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
  return 'rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500';
}

function inputClassName() {
  return 'rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500';
}

function optionLabel(options: ShopFilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? label(value);
}

function FilterSelect({
  labelText,
  value,
  onChange,
  placeholder,
  options,
}: {
  labelText: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: ShopFilterOption[];
}) {
  if (options.length === 0) return null;

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{labelText}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full ${selectClassName()}`}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}{option.count > 0 ? ` (${option.count})` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

function TriStateSelect({
  labelText,
  value,
  onChange,
}: {
  labelText: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{labelText}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full ${selectClassName()}`}>
        <option value="">Any</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </label>
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
      if (key === 'status') display = value === 'active' ? 'Active' : 'Inactive';
      else if (key === 'availability') display = label(value);
      else if (key === 'stock') display = value === 'low' ? 'Low stock' : 'Out of stock';
      else if (['featured', 'directors_pick', 'configurator_enabled'].includes(key)) display = value === 'true' ? 'Yes' : 'No';
      else if (key === 'min_price' || key === 'max_price') display = `₹${Number(value).toLocaleString('en-IN')}`;
      else if (key === 'min_carat' || key === 'max_carat') display = `${value} ct`;
      else if (optionMap[key]) display = optionLabel(optionMap[key] ?? [], value);

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

  return (
    <div className="mt-6 space-y-3">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="grid gap-2 lg:grid-cols-[1fr_160px_130px_170px_140px_160px_auto]"
      >
        <div className="relative lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search SKU, tag, legacy ID, name, slug..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <select
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value, sub_category: '' })}
          className={selectClassName()}
        >
          <option value="">All categories</option>
          {(filterOptions?.categories ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}{option.count > 0 ? ` (${option.count})` : ''}
            </option>
          ))}
        </select>

        <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })} className={selectClassName()}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select value={filters.availability} onChange={(e) => onChange({ availability: e.target.value })} className={selectClassName()}>
          <option value="">All availability</option>
          {AVAILABILITY_OPTIONS.map((option) => (
            <option key={option} value={option}>{label(option)}</option>
          ))}
        </select>

        <select value={filters.stock} onChange={(e) => onChange({ stock: e.target.value })} className={selectClassName()}>
          <option value="">All stock</option>
          <option value="low">Low stock (&lt; 5)</option>
          <option value="out">Out of stock</option>
        </select>

        <select value={sortValue} onChange={(e) => updateSort(e.target.value)} className={selectClassName()}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            advancedOpen ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced
          {activeCount > 0 && (
            <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
          {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </form>

      {advancedOpen && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Advanced filters</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-medium text-amber-700 hover:text-amber-800"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              labelText="Sub-category"
              value={filters.sub_category}
              onChange={(value) => onChange({ sub_category: value })}
              placeholder="All sub-categories"
              options={filterOptions?.subcategories ?? []}
            />
            <FilterSelect
              labelText="Product type"
              value={filters.product_type}
              onChange={(value) => onChange({ product_type: value })}
              placeholder="All types"
              options={filterOptions?.productTypes ?? []}
            />
            <FilterSelect
              labelText="Origin"
              value={filters.origin}
              onChange={(value) => onChange({ origin: value })}
              placeholder="Any origin"
              options={filterOptions?.origins ?? []}
            />
            <FilterSelect
              labelText="Planet"
              value={filters.planet}
              onChange={(value) => onChange({ planet: value })}
              placeholder="Any planet"
              options={filterOptions?.planets ?? []}
            />
            <FilterSelect
              labelText="Shape"
              value={filters.shape}
              onChange={(value) => onChange({ shape: value })}
              placeholder="Any shape"
              options={filterOptions?.shapes ?? []}
            />
            <FilterSelect
              labelText="Quality label"
              value={filters.quality_label}
              onChange={(value) => onChange({ quality_label: value })}
              placeholder="Any quality"
              options={filterOptions?.qualityLabels ?? []}
            />
            <FilterSelect
              labelText="Certificate lab"
              value={filters.certificate_lab}
              onChange={(value) => onChange({ certificate_lab: value })}
              placeholder="Any lab"
              options={filterOptions?.certificateLabs ?? []}
            />
            <FilterSelect
              labelText="Treatment"
              value={filters.treatment}
              onChange={(value) => onChange({ treatment: value })}
              placeholder="Any treatment"
              options={filterOptions?.treatments ?? []}
            />
            <FilterSelect
              labelText="Price mode"
              value={filters.price_mode}
              onChange={(value) => onChange({ price_mode: value })}
              placeholder="Any price mode"
              options={filterOptions?.priceModes ?? []}
            />

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Min price (₹)</span>
              <input
                type="number"
                min={0}
                value={filters.min_price}
                onChange={(e) => onChange({ min_price: e.target.value })}
                placeholder="0"
                className={`w-full ${inputClassName()}`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Max price (₹)</span>
              <input
                type="number"
                min={0}
                value={filters.max_price}
                onChange={(e) => onChange({ max_price: e.target.value })}
                placeholder="No limit"
                className={`w-full ${inputClassName()}`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Min carat</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={filters.min_carat}
                onChange={(e) => onChange({ min_carat: e.target.value })}
                placeholder="0"
                className={`w-full ${inputClassName()}`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500">Max carat</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={filters.max_carat}
                onChange={(e) => onChange({ max_carat: e.target.value })}
                placeholder="No limit"
                className={`w-full ${inputClassName()}`}
              />
            </label>

            <TriStateSelect labelText="Featured" value={filters.featured} onChange={(value) => onChange({ featured: value })} />
            <TriStateSelect labelText="Director's pick" value={filters.directors_pick} onChange={(value) => onChange({ directors_pick: value })} />
            <TriStateSelect labelText="Configurator enabled" value={filters.configurator_enabled} onChange={(value) => onChange({ configurator_enabled: value })} />
          </div>

          {(filterOptions?.priceRanges.length ?? 0) > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-gray-500">Quick price ranges</p>
              <div className="flex flex-wrap gap-2">
                {filterOptions!.priceRanges.map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => {
                      const [min, max] = range.value.split('-');
                      onChange({ min_price: min ?? '', max_price: max ?? '' });
                    }}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-amber-300 hover:bg-amber-50"
                  >
                    {range.label} ({range.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {(filterOptions?.caratRanges.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-gray-500">Quick carat ranges</p>
              <div className="flex flex-wrap gap-2">
                {filterOptions!.caratRanges.map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => {
                      const [min, max] = range.value.split('-');
                      onChange({ min_carat: min ?? '', max_carat: max ?? '' });
                    }}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-amber-300 hover:bg-amber-50"
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
