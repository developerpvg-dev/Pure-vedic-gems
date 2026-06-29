'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, KeyRound, Loader2, Save, User } from 'lucide-react';

type ProfileData = {
  name: string;
  email: string | null;
  avatar_url: string | null;
};

export default function DesignerProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/designer/profile');
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        setError(data.error || 'Failed to load profile');
        return;
      }
      setProfile(data);
      setName(data.name ?? '');
      setAvatarUrl(data.avatar_url ?? null);
    })();
  }, []);

  const saveProfile = useCallback(async () => {
    setSavingProfile(true);
    setError('');
    setMessage('');
    const res = await fetch('/api/admin/designer/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar_url: avatarUrl }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingProfile(false);
    if (!res.ok) {
      setError(data.error || 'Failed to save profile');
      return;
    }
    setMessage('Profile updated.');
    setProfile((current) => current ? { ...current, name, avatar_url: avatarUrl } : current);
  }, [name, avatarUrl]);

  const changePassword = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    setError('');
    setMessage('');
    const res = await fetch('/api/admin/designer/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingPassword(false);
    if (!res.ok) {
      setError(data.error || 'Failed to change password');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('Password updated successfully.');
  }, [currentPassword, newPassword, confirmPassword]);

  async function onAvatarSelected(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/designer/profile/avatar', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) {
      setError(data.error || 'Avatar upload failed');
      return;
    }
    setAvatarUrl(data.url);
    setMessage('Photo uploaded. Save profile to keep changes.');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Update your name, photo, and password.</p>
      </div>

      {(message || error) && (
        <p className={`rounded-lg px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {error || message}
        </p>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Profile</h2>
        <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-indigo-100 bg-indigo-50"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name || 'Profile'} fill className="object-cover" unoptimized />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-indigo-400">
                <User className="h-10 w-10" />
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void onAvatarSelected(e.target.files?.[0] ?? null)}
          />
          <div className="w-full flex-1 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Display name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
              <input
                value={profile?.email ?? ''}
                disabled
                className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
              />
            </div>
            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save profile
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600">
          <KeyRound className="h-4 w-4" />
          Change password
        </h2>
        <form onSubmit={changePassword} className="mt-4 space-y-3">
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
          />
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 8 characters)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Update password
          </button>
        </form>
      </section>
    </div>
  );
}
