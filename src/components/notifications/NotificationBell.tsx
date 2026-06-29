'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPublicNotificationReadIds, markPublicNotificationsRead } from '@/lib/notifications/public-reads';

type NotificationBellVariant = 'site' | 'admin';

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
  scope?: 'public' | 'user';
};

type PanelStyle = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function isUnread(notification: NotificationRow) {
  if (notification.scope === 'public') {
    return !getPublicNotificationReadIds().has(notification.id);
  }
  return !notification.read_at;
}

function countUnread(notifications: NotificationRow[]) {
  return notifications.filter(isUnread).length;
}

function getSiteHeaderOffset() {
  if (typeof window === 'undefined') return 96;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--pvg-site-header-offset').trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 96;
}

function getViewportHeight() {
  if (typeof window === 'undefined') return 800;
  return window.visualViewport?.height ?? window.innerHeight;
}

export function NotificationBell({ variant = 'site' }: { variant?: NotificationBellVariant }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelStyle, setPanelStyle] = useState<PanelStyle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const endpoint = variant === 'admin' ? '/api/admin/in-app-notifications' : '/api/notifications';

  const updatePanelPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const gutter = 8;
    const isMobile = window.innerWidth < 640;
    const headerOffset = getSiteHeaderOffset();
    const viewportHeight = getViewportHeight();
    const width = isMobile
      ? window.innerWidth - gutter * 2
      : Math.min(380, window.innerWidth - gutter * 2);
    const left = isMobile
      ? gutter
      : Math.max(gutter, Math.min(rect.right - width, window.innerWidth - width - gutter));

    let top = Math.max(rect.bottom + gutter, headerOffset + gutter);
    let maxHeight = Math.min(480, viewportHeight - top - gutter);

    const spaceAbove = rect.top - headerOffset - gutter;
    if (maxHeight < 220 && spaceAbove > maxHeight) {
      maxHeight = Math.min(480, spaceAbove);
      top = Math.max(headerOffset + gutter, rect.top - gutter - maxHeight);
      maxHeight = Math.min(480, viewportHeight - top - gutter);
    }

    maxHeight = Math.max(180, maxHeight);
    setPanelStyle({ top, left, width, maxHeight });
  }, []);

  const loadNotifications = useCallback(async () => {
    if (variant === 'admin' && !user) return;
    try {
      const response = await fetch(`${endpoint}?limit=20`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const rows = Array.isArray(data.notifications) ? (data.notifications as NotificationRow[]) : [];
      setNotifications(rows);
      setUnreadCount(variant === 'admin' ? Number(data.unreadCount ?? 0) : countUnread(rows));
    } catch {
      // The dev server can drop polling requests during restarts/HMR. Keep the bell quiet.
    }
  }, [endpoint, user, variant]);

  useEffect(() => {
    if (variant === 'admin' && !user) return;

    const initial = window.setTimeout(loadNotifications, 0);
    const interval = window.setInterval(loadNotifications, 30000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [loadNotifications, user, variant]);

  useEffect(() => {
    if (!open) {
      setPanelStyle(null);
      return;
    }

    updatePanelPosition();

    function onDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (document.getElementById('notification-bell-panel')?.contains(target)) return;
      setOpen(false);
    }

    function onViewportChange() {
      updatePanelPosition();
    }

    document.addEventListener('mousedown', onDocumentClick);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    window.visualViewport?.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('scroll', onViewportChange);
    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
      window.visualViewport?.removeEventListener('resize', onViewportChange);
      window.visualViewport?.removeEventListener('scroll', onViewportChange);
    };
  }, [open, updatePanelPosition]);

  async function markRead(ids?: string[]) {
    const targetIds = ids?.length ? ids : notifications.map((notification) => notification.id);
    const publicIds = targetIds.filter((id) => notifications.find((notification) => notification.id === id)?.scope === 'public');
    const userIds = targetIds.filter((id) => notifications.find((notification) => notification.id === id)?.scope !== 'public');

    if (publicIds.length) markPublicNotificationsRead(publicIds);

    if (user) {
      const shouldPatchAll = !ids?.length;
      const patchIds = userIds.length ? userIds : variant === 'admin' ? targetIds : [];
      if (shouldPatchAll || patchIds.length) {
        try {
          await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shouldPatchAll ? { all: true } : { ids: patchIds }),
          });
        } catch {
          // Ignore transient failures; the next poll will refresh state.
        }
      }
    }

    await loadNotifications();
  }

  if (variant === 'admin' && !user) return null;

  const buttonClass = variant === 'admin'
    ? 'relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-950'
    : 'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EDE6D5] bg-white text-[#3A3A3A] transition hover:border-[#7A1515] hover:text-[#7A1515]';

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className={buttonClass}
        aria-label="Notifications"
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (next) window.requestAnimationFrame(updatePanelPosition);
            return next;
          });
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open && panelStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              id="notification-bell-panel"
              style={{
                top: panelStyle.top,
                left: panelStyle.left,
                width: panelStyle.width,
                maxHeight: panelStyle.maxHeight,
              }}
              className={`fixed z-[10001] flex flex-col overflow-hidden rounded-xl border bg-white shadow-2xl ${variant === 'admin' ? 'border-gray-200' : 'border-[#EDE6D5]'}`}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-gray-950">Notifications</p>
                  <p className="text-xs text-gray-500">{unreadCount} unread</p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
                  onClick={() => markRead()}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Read all
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {notifications.length ? notifications.map((notification) => {
                  const unread = isUnread(notification);
                  const content = (
                    <div className={`block border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50 ${unread ? 'bg-amber-50/65' : 'bg-white'}`}>
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${unread ? 'bg-amber-600' : 'bg-gray-300'}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-gray-950">{notification.title}</span>
                          <span className="mt-1 block break-words text-xs leading-5 text-gray-600">{notification.message}</span>
                          <span className="mt-1 block text-[11px] text-gray-400">{new Date(notification.created_at).toLocaleString('en-IN')}</span>
                        </span>
                      </div>
                    </div>
                  );

                  return notification.href ? (
                    <Link
                      key={notification.id}
                      href={notification.href}
                      onClick={() => {
                        setOpen(false);
                        if (unread) markRead([notification.id]);
                      }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      key={notification.id}
                      className="w-full"
                      onClick={() => {
                        if (unread) markRead([notification.id]);
                      }}
                    >
                      {content}
                    </button>
                  );
                }) : (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet</div>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
