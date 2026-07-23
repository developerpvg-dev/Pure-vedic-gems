'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

export function ReceiptPrintBar({ orderId }: { orderId: string }) {
  useEffect(() => {
    // Auto-focus print affordance after load; user triggers print deliberately.
  }, []);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link
        href={`/admin/orders/${orderId}`}
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to order
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white"
      >
        <Printer className="h-4 w-4" />
        Print all details / PDF
      </button>
    </div>
  );
}
