'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoginModal } from '@/components/auth/LoginModal';
import { startRs101Checkout } from '@/lib/consultation/rs101-checkout';
import { GEM_RECOMMENDATION_PURPOSE_SUGGESTIONS } from '@/lib/constants/recommendation-purposes';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';

type Rs101FormState = {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  birth_time: string;
  birth_place: string;
  life_situation: string;
  website: string;
};

const INITIAL_FORM: Rs101FormState = {
  full_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  birth_time: '',
  birth_place: '',
  life_situation: '',
  website: '',
};

export function PvgRecommendationForm() {
  const { user, profile, isAuthenticated } = useAuth();
  const [form, setForm] = useState<Rs101FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!user && !profile) return;
    setForm((current) => ({
      ...current,
      full_name: current.full_name || profile?.full_name || '',
      email: current.email || profile?.email || user?.email || '',
      phone: current.phone || profile?.phone || profile?.whatsapp || '',
      date_of_birth: current.date_of_birth || profile?.date_of_birth || '',
      birth_time: current.birth_time || profile?.birth_time || '',
      birth_place: current.birth_place || profile?.birth_place || '',
    }));
  }, [profile, user]);

  function updateField(field: keyof Rs101FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!form.full_name.trim()) nextErrors.full_name = 'Please enter your full name.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!form.phone.trim() || !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) {
      nextErrors.phone = 'Please enter a valid phone number.';
    }
    if (form.date_of_birth) {
      const dob = new Date(`${form.date_of_birth}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(dob.getTime())) {
        nextErrors.date_of_birth = 'Please enter a valid date of birth.';
      } else if (dob > today) {
        nextErrors.date_of_birth = 'Date of birth cannot be in the future.';
      }
    }
    if (form.birth_time && !/^\d{2}:\d{2}$/.test(form.birth_time)) {
      nextErrors.birth_time = 'Please enter a valid birth time.';
    }
    return nextErrors;
  }

  function applyApiErrors(fieldErrors: Record<string, string> = {}, message: string) {
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({ _form: message });
  }

  function handlePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    void proceedToPayment();
  }

  async function proceedToPayment() {
    setPaying(true);
    setErrors({});

    const body: Record<string, string> = {};
    for (const [key, value] of Object.entries(form)) {
      const trimmed = value.trim();
      if (trimmed) body[key] = trimmed;
    }

    try {
      await startRs101Checkout(body, {
        onDismiss: () => setPaying(false),
        onSuccess: (consultationId) => {
          trackStorefrontEvent('consultation_payment_success', {
            consultation_id: consultationId,
            plan_id: 'rs101',
            source: 'homepage',
          });
          setSuccess({ id: consultationId });
          setPaying(false);
          document.getElementById('gem-recommendation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        onError: ({ message, fieldErrors }) => {
          applyApiErrors(fieldErrors, message);
          setPaying(false);
        },
      });
    } catch {
      setErrors({ _form: 'Something went wrong while starting payment.' });
      setPaying(false);
    }
  }

  if (success) {
    return (
      <div className="reco-form-panel reco-form-success" role="status">
        <div className="reco-form-success-icon" aria-hidden="true">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h3 className="reco-form-success-title">Recommendation Booked</h3>
        <p className="reco-form-success-copy">
          Your details and Rs 101 payment are confirmed. A confirmation email has been sent with your booking reference.
          Our Vedic experts will review your birth chart and share your personalized gemstone recommendation.
        </p>
        <p className="reco-form-success-ref">Booking reference: {success.id.slice(0, 8).toUpperCase()}</p>
        <div className="reco-form-success-actions">
          {isAuthenticated ? (
            <Link href="/account/consultations" className="reco-form-cta reco-form-cta-secondary">
              View My Booking
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form className="reco-form-panel" onSubmit={handlePayment} aria-busy={paying} noValidate>
      <p className="reco-form-price">Expert gemstone recommendation — just Rs 101</p>

      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.website}
        onChange={(event) => updateField('website', event.target.value)}
        className="hidden"
      />

      <div className="reco-form-grid">
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoDob">Date of Birth</label>
          <input
            className="reco-form-input"
            id="recoDob"
            type="date"
            value={form.date_of_birth}
            max={new Date().toISOString().split('T')[0]}
            onChange={(event) => updateField('date_of_birth', event.target.value)}
            autoComplete="bday"
          />
          {errors.date_of_birth ? <p className="reco-form-field-error">{errors.date_of_birth}</p> : null}
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoTob">Birth Time</label>
          <input
            className="reco-form-input"
            id="recoTob"
            type="time"
            value={form.birth_time}
            onChange={(event) => updateField('birth_time', event.target.value)}
          />
          {errors.birth_time ? <p className="reco-form-field-error">{errors.birth_time}</p> : null}
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoBirthPlace">Birth Place</label>
          <input
            className="reco-form-input"
            id="recoBirthPlace"
            type="text"
            value={form.birth_place}
            onChange={(event) => updateField('birth_place', event.target.value)}
            placeholder="City"
            autoComplete="address-level2"
          />
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoName">Your Name</label>
          <input
            className="reco-form-input"
            id="recoName"
            type="text"
            value={form.full_name}
            onChange={(event) => updateField('full_name', event.target.value)}
            placeholder="Full Name"
            autoComplete="name"
            required
          />
          {errors.full_name ? <p className="reco-form-field-error">{errors.full_name}</p> : null}
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoEmail">Email</label>
          <input
            className="reco-form-input"
            id="recoEmail"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          {errors.email ? <p className="reco-form-field-error">{errors.email}</p> : null}
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoPhone">Phone</label>
          <input
            className="reco-form-input"
            id="recoPhone"
            type="tel"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder="+91 XXXXX XXXXX"
            autoComplete="tel"
            required
          />
          {errors.phone ? <p className="reco-form-field-error">{errors.phone}</p> : null}
        </div>
        <div className="reco-form-group full">
          <label className="reco-form-label" htmlFor="recoPurpose">Purpose</label>
          <input
            className="reco-form-input"
            id="recoPurpose"
            type="text"
            list="reco-purpose-suggestions"
            value={form.life_situation}
            onChange={(event) => updateField('life_situation', event.target.value)}
            placeholder="Select a suggestion or type your purpose"
            maxLength={200}
          />
          <datalist id="reco-purpose-suggestions">
            {GEM_RECOMMENDATION_PURPOSE_SUGGESTIONS.map((purpose) => (
              <option key={purpose} value={purpose} />
            ))}
          </datalist>
          {errors.life_situation ? <p className="reco-form-field-error">{errors.life_situation}</p> : null}
        </div>
      </div>
      <button type="submit" className="reco-form-cta" disabled={paying}>
        {paying ? 'Opening Payment...' : 'Proceed to Pay Rs 101'}
      </button>
      <p className="reco-form-note">Secure payment via Razorpay. Confirmation email sent after booking.</p>
      {errors._form ? <p className="reco-form-status" role="alert">{errors._form}</p> : null}
      <LoginModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          void proceedToPayment();
        }}
      />
    </form>
  );
}
