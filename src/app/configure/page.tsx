import type { Metadata } from 'next';
import ConfiguratorClient from './ConfiguratorClient';
import type { SettingType } from '@/lib/types/configurator';

export const metadata: Metadata = {
  title: 'Design Your Dream Jewelry | PureVedicGems Configurator',
  description:
    'Build your perfect Vedic jewelry piece in 7 steps — choose your gemstone, setting, metal, certification, and energization. Heritage craftsmanship since 1937.',
  openGraph: {
    title: 'Gem-to-Jewelry Configurator | PureVedicGems',
    description:
      'Design your own Vedic gemstone jewelry in 7 simple steps.',
  },
};

const SETTINGS = new Set(['ring', 'pendant', 'bracelet', 'loose']);

/**
 * /configure — Start fresh configurator (no pre-selected product).
 * Optional ?design=&setting= deep-link from public design pages.
 */
export default async function ConfigurePage({
  searchParams,
}: {
  searchParams: Promise<{ design?: string; setting?: string }>;
}) {
  const sp = await searchParams;
  const setting =
    sp.setting && SETTINGS.has(sp.setting) ? (sp.setting as SettingType) : null;

  return (
    <ConfiguratorClient
      presetDesignId={sp.design?.trim() || null}
      presetSetting={setting}
    />
  );
}
