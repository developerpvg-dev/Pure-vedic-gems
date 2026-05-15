'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackLeadEvent } from '@/lib/utils/analytics';

const STORAGE_KEY = 'pvg_home_recommendation';

type RecommendationResponse = {
  recommendation?: {
    rashi: string | null;
    primaryGemNames: string[];
    supportingGemNames: string[];
    landingHref: string;
    advisory: string;
    notes: string[];
  };
  error?: string;
};

type RecommendationPayload = {
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  purpose?: string;
  name?: string;
  email?: string;
  phone?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export function PvgRecommendationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function submitRecommendation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload: RecommendationPayload = {
      birthDate: getString(formData, 'birthDate') || undefined,
      birthTime: getString(formData, 'birthTime') || undefined,
      birthPlace: getString(formData, 'birthPlace') || undefined,
      purpose: getString(formData, 'purpose') || undefined,
      name: getString(formData, 'name') || undefined,
      email: getString(formData, 'email') || undefined,
      phone: getString(formData, 'phone') || undefined,
    };

    try {
      const response = await fetch('/api/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as RecommendationResponse;

      if (!response.ok || !data.recommendation) {
        throw new Error(data.error || 'Unable to generate recommendation');
      }

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ payload, recommendation: data.recommendation, createdAt: Date.now() })
      );
      trackLeadEvent('homepage_recommendation', {
        purpose: payload.purpose,
        has_birth_date: Boolean(payload.birthDate),
        has_birth_place: Boolean(payload.birthPlace),
        has_phone: Boolean(payload.phone),
      });
      router.push('/tools/recommendation?source=home');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to generate recommendation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="reco-form-panel" onSubmit={submitRecommendation} aria-busy={isSubmitting}>
      <div className="reco-form-grid">
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoDob">Date of Birth</label>
          <input className="reco-form-input" id="recoDob" type="date" name="birthDate" required autoComplete="bday" />
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoTob">Birth Time</label>
          <input className="reco-form-input" id="recoTob" type="time" name="birthTime" />
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoBirthPlace">Birth Place</label>
          <input className="reco-form-input" id="recoBirthPlace" type="text" name="birthPlace" placeholder="City" autoComplete="address-level2" />
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoName">Your Name</label>
          <input className="reco-form-input" id="recoName" type="text" name="name" placeholder="Full Name" autoComplete="name" required />
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoEmail">Email</label>
          <input className="reco-form-input" id="recoEmail" type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoPhone">Phone</label>
          <input className="reco-form-input" id="recoPhone" type="tel" name="phone" placeholder="+91 XXXXX XXXXX" autoComplete="tel" />
        </div>
        <div className="reco-form-group">
          <label className="reco-form-label" htmlFor="recoPurpose">Purpose</label>
          <select className="reco-form-input reco-form-select" id="recoPurpose" name="purpose" defaultValue="career growth">
            <option value="career growth">Career &amp; Finance</option>
            <option value="health wellbeing">Health &amp; Wellbeing</option>
            <option value="marriage harmony">Marriage &amp; Relationships</option>
            <option value="spiritual growth">Spiritual Growth</option>
            <option value="general wellbeing">General Wellbeing</option>
          </select>
        </div>
      </div>
      <button type="submit" className="reco-form-cta" disabled={isSubmitting}>
        {isSubmitting ? 'Preparing Recommendation' : 'Get Recommendation'}
      </button>
      {message ? <p className="reco-form-status" role="status">{message}</p> : null}
    </form>
  );
}
