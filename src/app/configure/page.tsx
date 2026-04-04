import type { Metadata } from 'next';
import ConfiguratorClient from './ConfiguratorClient';

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

/**
 * /configure — Start fresh configurator (no pre-selected product).
 */
export default function ConfigurePage() {
  return <ConfiguratorClient />;
}
