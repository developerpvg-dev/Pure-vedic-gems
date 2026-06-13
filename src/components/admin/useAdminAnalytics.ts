'use client';

import { useEffect, useState } from 'react';

export function useAdminAnalytics<T>(url: string) {
  const [analytics, setAnalytics] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setAnalytics(data as T); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [url]);

  return { analytics, loading, open, setOpen, toggle: () => setOpen((value) => !value) };
}
