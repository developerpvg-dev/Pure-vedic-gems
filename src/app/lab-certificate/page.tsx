import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, FileBadge2, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { LabCertificate } from '@/lib/types/database';
import './lab-certificate-page.css';

export const metadata: Metadata = {
  title: 'Lab Certificate Samples | Pure Vedic Gems',
  description: 'View sample gemstone and Rudraksha lab certificates used by Pure Vedic Gems from reputed Indian and international laboratories.',
};

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

const LOCAL_CERTIFICATE_ASSETS: Record<string, string> = {
  'grs-international-swiss-lab': '/legacy/lab-certificates/grs-international-swiss-lab.jpg',
  'gii-govt-lab-gjepc-mumbai': '/legacy/lab-certificates/gii-govt-lab-gjepc-mumbai.jpg',
  'iigj-govt-lab-gjepc-delhi': '/legacy/lab-certificates/iigj-govt-lab-gjepc-delhi.jpg',
  'rudraksha-certificate': '/legacy/lab-certificates/rudraksha-certificate.jpg',
  'iigj-govt-lab-gjepc-jaipur': '/legacy/lab-certificates/iigj-govt-lab-gjepc-jaipur.jpg',
  'igi-international-gemological-institute-india-jaipur-mumbai': '/legacy/lab-certificates/igi-india-jaipur-mumbai.jpg',
  'igi-international-gemological-institute-india-jaipur-mumbai-2': '/legacy/lab-certificates/igi-india-jaipur-mumbai-2.jpg',
  'igi-gtl-certificate-delhi': '/legacy/lab-certificates/igi-gtl-certificate-delhi.jpg',
  'gia-gemological-institute-of-america': '/legacy/lab-certificates/gia-gemological-institute-of-america.jpg',
};

function certificateAsset(certificate: LabCertificate) {
  return LOCAL_CERTIFICATE_ASSETS[certificate.slug] ?? certificate.certificate_url;
}

export default async function LabCertificatePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('lab_certificates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  const certificates = (data ?? []) as LabCertificate[];

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-10 pt-10 sm:px-6 lg:pt-14" aria-labelledby="lab-cert-heading">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-0 flex flex-col items-center justify-center">
            <h1 className="section-title" id="lab-cert-heading">
              Lab Certificate Samples
            </h1>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Certificate examples from government-recognised Indian labs and international gemological institutes used with eligible gemstones and Rudrakshas.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>

          <div className="pvg-lab-trust-box">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <p>
              Every sample is displayed as a public reference so customers understand the lab documentation available with eligible gemstones and Rudrakshas.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" aria-label="Certificate samples">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => {
            const assetUrl = certificateAsset(certificate);
            return (
              <article key={certificate.id} className="pvg-lab-cert-card group">
                <Link href={assetUrl} target="_blank" rel="noreferrer" className="relative block aspect-[4/3] bg-[#faf8f4]">
                  {assetUrl ? (
                    <Image
                      src={assetUrl}
                      alt={certificate.name}
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-contain p-3 transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileBadge2 className="h-16 w-16 text-[#b8861e]" aria-hidden="true" />
                    </div>
                  )}
                </Link>
                <div className="p-5">
                  <p className="pvg-lab-cert-eyebrow">{certificate.lab_name || 'Certificate'}</p>
                  <h2 className="pvg-lab-cert-title">{certificate.name}</h2>
                  {certificate.description ? (
                    <p className="pvg-lab-cert-desc">{certificate.description}</p>
                  ) : null}
                  <Link href={assetUrl} target="_blank" rel="noreferrer" className="pvg-lab-cert-link">
                    View certificate
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
