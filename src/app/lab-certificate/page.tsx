import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, FileBadge2, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { LabCertificate } from '@/lib/types/database';

export const metadata: Metadata = {
  title: 'Lab Certificate Samples | Pure Vedic Gems',
  description: 'View sample gemstone and Rudraksha lab certificates used by Pure Vedic Gems from reputed Indian and international laboratories.',
};

export const revalidate = 300;

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
    <main className="pvg-simple-page pvg-info-page min-h-screen bg-[#fbfaf7] pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-10 pt-10 sm:px-6 lg:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#b86654]">Trust documents</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Lab certificate samples</h1>
          <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-7 text-[#5e4a38]">
              Certificate examples from government-recognised Indian labs and international gemological institutes. Admins can add new certificate names and upload sample certificate files from the control room.
          </p>
          <div className="mx-auto mt-7 flex max-w-2xl items-start gap-3 border border-[#d8bd75] bg-[#fdf3e7] px-5 py-4 text-left">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8a6400]" />
            <p className="text-sm leading-6 text-[#5e4a38]">Every sample is displayed as a public reference so customers understand the lab documentation available with eligible gemstones and Rudrakshas.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((certificate) => {
            const assetUrl = certificateAsset(certificate);
            return (
            <article key={certificate.id} className="group overflow-hidden border border-[#e5d7c8] bg-white shadow-[0_14px_40px_rgba(46,30,16,0.06)]">
              <Link href={assetUrl} target="_blank" rel="noreferrer" className="relative block aspect-[4/3] bg-[#f7efe5]">
                {assetUrl ? (
                  <Image src={assetUrl} alt={certificate.name} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-contain p-3 transition duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileBadge2 className="h-16 w-16 text-[#8a6400]" />
                  </div>
                )}
              </Link>
              <div className="p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#b86654]">{certificate.lab_name || 'Certificate'}</p>
                <h2 className="mt-2 min-h-14 text-xl font-black leading-tight text-[#15110d]">{certificate.name}</h2>
                {certificate.description && <p className="mt-3 text-sm leading-7 text-[#5e4a38]">{certificate.description}</p>}
                <Link href={assetUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 border border-[#d9c3aa] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#6b3b23] transition hover:border-[#b86654] hover:text-[#b86654]">
                  View certificate
                  <ExternalLink className="h-3.5 w-3.5" />
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
