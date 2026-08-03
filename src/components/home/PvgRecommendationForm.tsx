'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { LoginModal } from '@/components/auth/LoginModal';
import { startRs101Checkout } from '@/lib/consultation/rs101-checkout';
import { RS101_AMOUNT_INR } from '@/lib/consultation/rs101-amount';
import { GEM_RECOMMENDATION_PURPOSE_SUGGESTIONS } from '@/lib/constants/recommendation-purposes';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';

type Rs101FormState = {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  birth_time: string;
  birth_place: string;
  customer_state: string;
  customer_country: string;
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
  customer_state: '',
  customer_country: '',
  life_situation: '',
  website: '',
};

export function PvgRecommendationForm() {
  const { user, profile, isAuthenticated } = useAuth();
  const { format } = useCurrency();
  const priceLabel = format(RS101_AMOUNT_INR);
  const [form, setForm] = useState<Rs101FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [guestChoiceOpen, setGuestChoiceOpen] = useState(false);

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
    if (!form.date_of_birth) {
      nextErrors.date_of_birth = 'Date of birth is required.';
    } else {
      const dob = new Date(`${form.date_of_birth}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(dob.getTime())) {
        nextErrors.date_of_birth = 'Please enter a valid date of birth.';
      } else if (dob > today) {
        nextErrors.date_of_birth = 'Date of birth cannot be in the future.';
      }
    }
    if (!form.birth_time.trim()) nextErrors.birth_time = 'Birth time is required.';
    else if (!/^\d{2}:\d{2}$/.test(form.birth_time)) {
      nextErrors.birth_time = 'Please enter a valid birth time.';
    }
    if (!form.birth_place.trim()) nextErrors.birth_place = 'Birth place is required.';
    if (!form.full_name.trim()) nextErrors.full_name = 'Your name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required.';
    else if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone)) {
      nextErrors.phone = 'Please enter a valid phone number.';
    }
    if (!form.customer_state.trim()) nextErrors.customer_state = 'State is required.';
    if (!form.customer_country.trim()) nextErrors.customer_country = 'Country is required.';
    if (!form.life_situation.trim()) nextErrors.life_situation = 'Purpose / area of concern is required.';
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
      const firstId = (
        {
          date_of_birth: 'recoDob',
          birth_time: 'recoTob',
          birth_place: 'recoBirthPlace',
          full_name: 'recoName',
          email: 'recoEmail',
          phone: 'recoPhone',
          customer_state: 'recoState',
          customer_country: 'recoCountry',
          life_situation: 'recoPurpose',
        } as Record<string, string>
      )[Object.keys(validationErrors)[0]!];
      if (firstId) document.getElementById(firstId)?.focus();
      return;
    }

    // Logged-in: pay immediately. Guest: offer login OR continue without account.
    if (!isAuthenticated) {
      setGuestChoiceOpen(true);
      return;
    }

    void proceedToPayment();
  }

  async function proceedToPayment() {
    setGuestChoiceOpen(false);
    setPaying(true);
    setErrors({});

    const body: Record<string, string> = {};
    for (const [key, value] of Object.entries(form)) {
      const trimmed = value.trim();
      if (trimmed) body[key] = trimmed;
    }
    // ponytail: City/District UI removed; CRM still expects customer_city — reuse birth place.
    body.customer_city = form.birth_place.trim();

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
          Your details and {priceLabel} payment are confirmed. A confirmation email has been sent with your booking reference.
          Our Vedic experts will review your birth chart and share your personalized gemstone recommendation.
        </p>
        <p className="reco-form-success-ref">Booking reference: {success.id.slice(0, 8).toUpperCase()}</p>
        <div className="reco-form-success-actions">
          {isAuthenticated ? (
            <Link href="/account/consultations" className="reco-form-cta reco-form-cta-secondary">
              View My Booking
            </Link>
          ) : (
            <p className="reco-form-note" style={{ margin: 0 }}>
              Check your email for confirmation. You can create an account anytime to track bookings.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="reco-form-panel" onSubmit={handlePayment} aria-busy={paying} noValidate>
      <p className="reco-form-price">Expert remedies recommendation — just {priceLabel}</p>

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
            required
            aria-invalid={Boolean(errors.date_of_birth)}
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
            required
            aria-invalid={Boolean(errors.birth_time)}
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
            placeholder="City or district"
            autoComplete="address-level2"
            required
            aria-invalid={Boolean(errors.birth_place)}
          />
          {errors.birth_place ? <p className="reco-form-field-error">{errors.birth_place}</p> : null}
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
            aria-invalid={Boolean(errors.full_name)}
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
            aria-invalid={Boolean(errors.email)}
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
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone ? <p className="reco-form-field-error">{errors.phone}</p> : null}
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoState">State</label>
          <input
            className="reco-form-input"
            id="recoState"
            type="text"
            value={form.customer_state}
            onChange={(event) => updateField('customer_state', event.target.value)}
            placeholder="State"
            autoComplete="address-level1"
            required
            aria-invalid={Boolean(errors.customer_state)}
          />
          {errors.customer_state ? <p className="reco-form-field-error">{errors.customer_state}</p> : null}
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoCountry">Country</label>
          <input
            className="reco-form-input"
            id="recoCountry"
            type="text"
            value={form.customer_country}
            onChange={(event) => updateField('customer_country', event.target.value)}
            placeholder="Country"
            autoComplete="country-name"
            required
            aria-invalid={Boolean(errors.customer_country)}
          />
          {errors.customer_country ? <p className="reco-form-field-error">{errors.customer_country}</p> : null}
        </div>
        <div className="reco-form-group full">
          <label className="reco-form-label" htmlFor="recoPurpose">Purpose / Area of concern</label>
          <input
            className="reco-form-input"
            id="recoPurpose"
            type="text"
            list="reco-purpose-suggestions"
            value={form.life_situation}
            onChange={(event) => updateField('life_situation', event.target.value)}
            placeholder="Select a suggestion or type your purpose"
            maxLength={200}
            required
            aria-invalid={Boolean(errors.life_situation)}
          />
          <datalist id="reco-purpose-suggestions">
            {GEM_RECOMMENDATION_PURPOSE_SUGGESTIONS.map((purpose) => (
              <option key={purpose} value={purpose} />
            ))}
          </datalist>
          {errors.life_situation ? <p className="reco-form-field-error">{errors.life_situation}</p> : null}
        </div>
      </div>

      {guestChoiceOpen ? (
        <div className="reco-form-guest-choice" role="dialog" aria-labelledby="recoGuestChoiceTitle">
          <p id="recoGuestChoiceTitle" className="reco-form-guest-title">
            Have an account?
          </p>
          <p className="reco-form-note" style={{ marginTop: 0 }}>
            Log in or sign up to track this booking in your account — or continue and pay as a guest.
          </p>
          <div className="reco-form-guest-actions">
            <button
              type="button"
              className="reco-form-cta"
              disabled={paying}
              onClick={() => {
                setGuestChoiceOpen(false);
                setAuthModalOpen(true);
              }}
            >
              Login / Sign up
            </button>
            <button
              type="button"
              className="reco-form-cta reco-form-cta-secondary"
              disabled={paying}
              onClick={() => void proceedToPayment()}
            >
              Continue without login
            </button>
            <button
              type="button"
              className="reco-form-guest-cancel"
              disabled={paying}
              onClick={() => setGuestChoiceOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="submit" className="reco-form-cta" disabled={paying}>
          {paying ? 'Opening Payment...' : `Proceed to Pay ${priceLabel}`}
        </button>
      )}

      <p className="reco-form-note">Secure payment via Razorpay. Confirmation email sent after booking. Login not required.</p>
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
