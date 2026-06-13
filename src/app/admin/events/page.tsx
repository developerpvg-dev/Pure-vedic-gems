'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, FolderPlus, Loader2, Pencil, Plus, Star, Trash2, Video } from 'lucide-react';
import { AdminAnalyticsPanel, AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';
import { MetricBars, RevenueTrendChart } from '@/components/admin/AdminCharts';
import { useAdminAnalytics } from '@/components/admin/useAdminAnalytics';

interface EventCategory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  event_videos?: { id: string }[];
}

interface EventVideo {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  youtube_url: string;
  youtube_id: string;
  legacy_url: string | null;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  event_video_categories?: { title: string } | null;
}

const EMPTY_CATEGORY = { title: '', slug: '', description: '', sort_order: 0, is_active: true };
const EMPTY_VIDEO = { category_id: '', title: '', slug: '', youtube_url: '', legacy_url: '', description: '', sort_order: 0, is_featured: false, is_active: true };

export default function AdminEventsPage() {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [videos, setVideos] = useState<EventVideo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [videoForm, setVideoForm] = useState(EMPTY_VIDEO);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { analytics, loading: analyticsLoading, open: analyticsOpen, toggle } = useAdminAnalytics<{
    summary: { totalCategories: number; activeCategories: number; totalVideos: number; activeVideos: number; featuredVideos: number };
    trend: Array<{ date: string; label: string; orders: number; revenue: number }>;
    categoryBreakdown: Array<{ label: string; value: number; meta: number }>;
    statusBreakdown: Array<{ label: string; value: number; meta: number }>;
  }>('/api/admin/events/analytics');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [catResponse, videoResponse] = await Promise.all([
      fetch('/api/admin/events/categories', { cache: 'no-store' }),
      fetch('/api/admin/events/videos', { cache: 'no-store' }),
    ]);
    const [catData, videoData] = await Promise.all([
      catResponse.json().catch(() => null) as Promise<{ categories?: EventCategory[] } | null>,
      videoResponse.json().catch(() => null) as Promise<{ videos?: EventVideo[] } | null>,
    ]);
    setCategories(catData?.categories ?? []);
    setVideos(videoData?.videos ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!videoForm.category_id && categories[0]?.id) {
      setVideoForm((current) => ({ ...current, category_id: categories[0].id }));
    }
  }, [categories, videoForm.category_id]);

  const filteredVideos = useMemo(
    () => selectedCategory ? videos.filter((video) => video.category_id === selectedCategory) : videos,
    [selectedCategory, videos]
  );

  async function saveCategory() {
    setSaving(true);
    setError('');
    const response = await fetch(editingCategoryId ? `/api/admin/events/categories/${editingCategoryId}` : '/api/admin/events/categories', {
      method: editingCategoryId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryForm),
    });
    const data = await response.json().catch(() => null) as { error?: string } | null;
    setSaving(false);
    if (!response.ok) {
      setError(data?.error ?? 'Failed to save category');
      return;
    }
    setCategoryForm(EMPTY_CATEGORY);
    setEditingCategoryId(null);
    void fetchAll();
  }

  async function saveVideo() {
    setSaving(true);
    setError('');
    const response = await fetch(editingVideoId ? `/api/admin/events/videos/${editingVideoId}` : '/api/admin/events/videos', {
      method: editingVideoId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoForm),
    });
    const data = await response.json().catch(() => null) as { error?: string } | null;
    setSaving(false);
    if (!response.ok) {
      setError(data?.error ?? 'Failed to save video');
      return;
    }
    setVideoForm({ ...EMPTY_VIDEO, category_id: videoForm.category_id });
    setEditingVideoId(null);
    void fetchAll();
  }

  function editCategory(category: EventCategory) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      title: category.title,
      slug: category.slug,
      description: category.description ?? '',
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
  }

  function editVideo(video: EventVideo) {
    setEditingVideoId(video.id);
    setVideoForm({
      category_id: video.category_id,
      title: video.title,
      slug: video.slug,
      youtube_url: video.youtube_url,
      legacy_url: video.legacy_url ?? '',
      description: '',
      sort_order: video.sort_order,
      is_featured: video.is_featured,
      is_active: video.is_active,
    });
  }

  async function deactivate(path: string) {
    await fetch(path, { method: 'DELETE' });
    void fetchAll();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Events & Seminars Videos" description="Create video categories and add YouTube videos to each category." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Categories" value={(analytics?.summary.totalCategories ?? categories.length).toLocaleString('en-IN')} icon={FolderPlus} tone="text-gray-900" bg="bg-gray-50" subtext={`${analytics?.summary.activeCategories ?? 0} active`} />
        <AdminStatCard label="Total videos" value={(analytics?.summary.totalVideos ?? videos.length).toLocaleString('en-IN')} icon={Video} tone="text-blue-600" bg="bg-blue-50" />
        <AdminStatCard label="Active videos" value={(analytics?.summary.activeVideos ?? 0).toLocaleString('en-IN')} icon={BarChart3} tone="text-green-600" bg="bg-green-50" />
        <AdminStatCard label="Featured" value={(analytics?.summary.featuredVideos ?? 0).toLocaleString('en-IN')} icon={Star} tone="text-amber-600" bg="bg-amber-50" />
      </div>

      <AdminAnalyticsPanel title="Events video analytics" subtitle="Category distribution · last 30 days" loading={analyticsLoading} open={analyticsOpen} onToggle={toggle}>
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-3">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Upload trend</h3>
            {analytics ? <RevenueTrendChart data={analytics.trend} /> : null}
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-2">
            <MetricBars embedded title="Videos per category" icon={FolderPlus} items={analytics?.categoryBreakdown.slice(0, 8) ?? []} />
          </div>
        </div>
      </AdminAnalyticsPanel>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900"><FolderPlus className="h-5 w-5 text-amber-600" /> {editingCategoryId ? 'Edit category' : 'Add category'}</h2>
          <div className="mt-4 grid gap-3">
            <input value={categoryForm.title} onChange={(event) => setCategoryForm({ ...categoryForm, title: event.target.value })} placeholder="Category title" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })} placeholder="Slug (optional)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <textarea value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} placeholder="Description" rows={2} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={categoryForm.sort_order} onChange={(event) => setCategoryForm({ ...categoryForm, sort_order: Number(event.target.value) || 0 })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={categoryForm.is_active} onChange={(event) => setCategoryForm({ ...categoryForm, is_active: event.target.checked })} /> Active</label>
            </div>
            <button onClick={saveCategory} disabled={saving} className="inline-flex w-fit items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save category
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900"><Video className="h-5 w-5 text-amber-600" /> {editingVideoId ? 'Edit video' : 'Add video'}</h2>
          <div className="mt-4 grid gap-3">
            <select value={videoForm.category_id} onChange={(event) => setVideoForm({ ...videoForm, category_id: event.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
            </select>
            <input value={videoForm.title} onChange={(event) => setVideoForm({ ...videoForm, title: event.target.value })} placeholder="Video title" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input value={videoForm.youtube_url} onChange={(event) => setVideoForm({ ...videoForm, youtube_url: event.target.value })} placeholder="YouTube URL or video ID" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input value={videoForm.slug} onChange={(event) => setVideoForm({ ...videoForm, slug: event.target.value })} placeholder="Slug (optional)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input value={videoForm.legacy_url} onChange={(event) => setVideoForm({ ...videoForm, legacy_url: event.target.value })} placeholder="Legacy event URL" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <div className="grid grid-cols-3 gap-3">
              <input type="number" value={videoForm.sort_order} onChange={(event) => setVideoForm({ ...videoForm, sort_order: Number(event.target.value) || 0 })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={videoForm.is_featured} onChange={(event) => setVideoForm({ ...videoForm, is_featured: event.target.checked })} /> Featured</label>
              <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={videoForm.is_active} onChange={(event) => setVideoForm({ ...videoForm, is_active: event.target.checked })} /> Active</label>
            </div>
            <button onClick={saveVideo} disabled={saving || !videoForm.category_id} className="inline-flex w-fit items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save video
            </button>
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section>
          <h2 className="mb-3 text-lg font-bold text-gray-900">Categories</h2>
          {loading ? <Loader2 className="h-6 w-6 animate-spin text-amber-600" /> : (
            <div className="space-y-2">
              {categories.map((category) => (
                <article key={category.id} className={`rounded-xl border border-gray-200 bg-white p-3 shadow-sm ${category.is_active ? '' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => setSelectedCategory(category.id === selectedCategory ? '' : category.id)} className="min-w-0 text-left">
                      <h3 className="font-semibold text-gray-900">{category.title}</h3>
                      <p className="text-xs text-gray-500">{category.slug} · {category.event_videos?.length ?? 0} videos</p>
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => editCategory(category)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-amber-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => deactivate(`/api/admin/events/categories/${category.id}`)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-gray-900">Videos</h2>
          <div className="space-y-2">
            {filteredVideos.map((video) => (
              <article key={video.id} className={`rounded-xl border border-gray-200 bg-white p-3 shadow-sm ${video.is_active ? '' : 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{video.title}</h3>
                    <p className="text-xs text-gray-500">{video.event_video_categories?.title ?? 'Category'} · {video.youtube_id}</p>
                    <a href={video.youtube_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-amber-700 hover:underline">{video.youtube_url}</a>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editVideo(video)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-amber-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => deactivate(`/api/admin/events/videos/${video.id}`)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
