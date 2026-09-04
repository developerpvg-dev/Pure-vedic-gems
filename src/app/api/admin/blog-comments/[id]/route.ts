import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Comment id is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('blog_comments').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }

  void logAdminAction({
    userId: auth.user.id,
    action: 'blog_comment_delete',
    resourceType: 'blog_comment',
    resourceId: id,
  });

  return NextResponse.json({ ok: true });
}
