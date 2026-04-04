'use client';

import {
  useRef,
  useCallback,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  hasError = false,
  className,
}: OTPInputProps) {
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = (idx: number) => {
    const target = inputRefs.current[Math.max(0, Math.min(length - 1, idx))];
    target?.focus();
    target?.select();
  };

  const handleChange = useCallback(
    (idx: number, char: string) => {
      const ch = char.replace(/\D/g, '').slice(0, 1);
      const arr = [...digits];
      arr[idx] = ch;
      const next = arr.join('');
      onChange(next);
      if (ch && idx < length - 1) focusAt(idx + 1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [digits, onChange, length]
  );

  const handleKeyDown = useCallback(
    (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (digits[idx]) {
          const arr = [...digits];
          arr[idx] = '';
          onChange(arr.join(''));
        } else if (idx > 0) {
          focusAt(idx - 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        focusAt(idx - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        focusAt(idx + 1);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [digits, onChange]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, length);
      const arr = pasted.split('').concat(Array(length).fill('')).slice(0, length);
      onChange(arr.join(''));
      const nextEmpty = arr.findIndex((d) => !d);
      focusAt(nextEmpty === -1 ? length - 1 : nextEmpty);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, length]
  );

  return (
    <div
      className={cn('flex items-center gap-2 justify-center', className)}
      role="group"
      aria-label="One-time password input"
    >
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          pattern="\d{1}"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${idx + 1}`}
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-12 rounded-md border text-center text-lg font-bold tracking-widest',
            'transition-all duration-150 outline-none',
            'focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError
              ? 'border-red-500 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-300'
              : digit
              ? 'border-[var(--pvg-accent)] bg-[var(--pvg-gold-light)] text-[var(--pvg-primary)] focus:border-[var(--pvg-accent)] focus:ring-[var(--pvg-accent)]/30'
              : 'border-[var(--pvg-border)] bg-white text-[var(--pvg-text)] focus:border-[var(--pvg-accent)] focus:ring-[var(--pvg-accent)]/30'
          )}
        />
      ))}
    </div>
  );
}
