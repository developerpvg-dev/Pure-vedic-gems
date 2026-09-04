'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';

type AdminBlogComment = {
  id: string;
  blog_slug: string;
  author_name: string;
  body: string;
  created_at: string;
};

const PER_PAGE = 20;

export default function AdminBlogCommentsPage() {
  const [comments, setComments] = useState<AdminBlogComment[]>([]);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PER_PAGE),
    });
    if (search) params.set('q', search);
    const response = await fetch(`/api/admin/blog-comments?${params}`, { cache: 'no-store' });
    const data = (await response.json().catch(() => null)) as {
      comments?: AdminBlogComment[];
      total?: number;
      total_pages?: number;
    } | null;
    setComments(data?.comments ?? []);
    setTotal(data?.total ?? 0);
    setTotalPages(data?.total_pages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchComments();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchComments]);

  async function remove(id: string) {
    if (!window.confirm('Delete this blog comment permanently?')) return;
    setDeletingId(id);
    const response = await fetch(`/api/admin/blog-comments/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (!response.ok) {
      window.alert('Failed to delete comment');
      return;
    }
    void fetchComments();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Blog Comments"
        description="View and remove public comments on blog posts. Comments publish immediately."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminStatCard
          label="Total comments"
          value={total.toLocaleString('en-IN')}
          icon={MessageSquare}
          tone="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      <form
        className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(q.trim());
        }}
      >
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search by slug, author, or text…"
          className="min-w-[14rem] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">
          No blog comments found.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{comment.author_name}</p>
                    <Link
                      href={`/blog/${comment.blog_slug}`}
                      target="_blank"
                      className="truncate text-xs font-medium text-amber-700 hover:underline"
                    >
                      /blog/{comment.blog_slug}
                    </Link>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {comment.body}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(comment.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(comment.id)}
                  disabled={deletingId === comment.id}
                  className="inline-flex items-center gap-1 self-start rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {deletingId === comment.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </div>
            </article>
          ))}
          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
