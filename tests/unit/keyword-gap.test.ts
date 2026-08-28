import { describe, expect, it } from 'vitest';
import { storeLocationsJsonLd } from '@/lib/constants/company-addresses';
import { MALAYSIA_GEM_REDIRECTS } from '@/lib/constants/geo-buy-seo';
import { getSeoLandingPageBySlug } from '@/lib/constants/seo-landing-pages';
import { KEYWORD_GAP_CANONICALS } from '@/lib/seo/keyword-gap-map';
import { NAVARATNA_HUB_CONTENT, NAVARATNA_RICH_CONTENT } from '@/lib/categories/shop-category-content/navaratna-content';
import { RUDRAKSHA_HUB_CONTENT } from '@/lib/categories/shop-category-content/rudraksha-content';
import { UPRATNA_HUB_CONTENT, UPRATNA_RICH_CONTENT } from '@/lib/categories/shop-category-content/upratna-content';

describe('Phase 4 keyword-gap map', () => {
  it('maps each high-intent cluster to a live canonical path', () => {
    expect(KEYWORD_GAP_CANONICALS).toHaveLength(13);
    const paths = KEYWORD_GAP_CANONICALS.map((row) => row.path as string);
    expect(paths).not.toContain('/tools/recommendation');
    for (const row of KEYWORD_GAP_CANONICALS) {
      expect(row.path.startsWith('/')).toBe(true);
      expect(row.intent.length).toBeGreaterThan(8);
    }
  });

  it('keeps sapphire hubs answering price and benefits FAQs', () => {
    const pukhraj = NAVARATNA_RICH_CONTENT['yellow-sapphire']?.faqs ?? [];
    const neelam = NAVARATNA_RICH_CONTENT['blue-sapphire']?.faqs ?? [];
    expect(pukhraj.some((faq) => /price|cost/i.test(faq.question))).toBe(true);
    expect(pukhraj.some((faq) => /benefit/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /price|cost/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /benefit/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /blue sapphire stone/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /cornflower blue sapphire/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /natural blue sapphire/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /neelam stone/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /neelam stone price/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /royal blue sapphire/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /light blue sapphire/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /blue star sapphire/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /blue sapphire birthstone/i.test(faq.question))).toBe(true);
    expect(neelam.some((faq) => /blue sapphire price/i.test(faq.question))).toBe(true);
    const panna = NAVARATNA_RICH_CONTENT.emerald?.faqs ?? [];
    expect(panna.some((faq) => /emerald stone/i.test(faq.question))).toBe(true);
    expect(panna.some((faq) => /emerald gemstone/i.test(faq.question))).toBe(true);
    expect(panna.some((faq) => /natural emerald/i.test(faq.question))).toBe(true);
    expect(panna.some((faq) => /real emerald/i.test(faq.question))).toBe(true);
    const manik = NAVARATNA_RICH_CONTENT.ruby?.faqs ?? [];
    expect(manik.some((faq) => /ruby gemstone/i.test(faq.question))).toBe(true);
    expect(manik.some((faq) => /ruby stone price/i.test(faq.question))).toBe(true);
    expect(manik.some((faq) => /natural ruby/i.test(faq.question))).toBe(true);
    expect(pukhraj.some((faq) => /yellow sapphire stone/i.test(faq.question))).toBe(true);
    expect(pukhraj.some((faq) => /yellow sapphire price/i.test(faq.question))).toBe(true);
    expect(pukhraj.some((faq) => /yellow sapphires for sale/i.test(faq.question))).toBe(true);
    const safed = NAVARATNA_RICH_CONTENT['white-sapphire']?.faqs ?? [];
    expect(safed.some((faq) => /white sapphire gemstone/i.test(faq.question))).toBe(true);
    expect(safed.some((faq) => /natural white sapphire/i.test(faq.question))).toBe(true);
    expect(safed.some((faq) => /ceylon white sapphire/i.test(faq.question))).toBe(true);
    const lehsunia = NAVARATNA_RICH_CONTENT['cats-eye']?.faqs ?? [];
    expect(lehsunia.some((faq) => /catseye gemstone/i.test(faq.question))).toBe(true);
    expect(lehsunia.some((faq) => /cat's eye chrysoberyl/i.test(faq.question))).toBe(true);
    expect(lehsunia.some((faq) => /original cats eye stone/i.test(faq.question))).toBe(true);
    expect(lehsunia.some((faq) => /cats eye gemstone price/i.test(faq.question))).toBe(true);
    const doodhia = UPRATNA_RICH_CONTENT.opal?.faqs ?? [];
    expect(doodhia.some((faq) => /opal gemstone/i.test(faq.question))).toBe(true);
    expect(doodhia.some((faq) => /fire opal/i.test(faq.question))).toBe(true);
    expect(doodhia.some((faq) => /opal price/i.test(faq.question))).toBe(true);
    expect(doodhia.some((faq) => /opals for sale/i.test(faq.question))).toBe(true);
    const moti = NAVARATNA_RICH_CONTENT.pearl?.faqs ?? [];
    expect(moti.some((faq) => /pearl gemstone/i.test(faq.question))).toBe(true);
    expect(moti.some((faq) => /moti stone price/i.test(faq.question))).toBe(true);
    const moonga = NAVARATNA_RICH_CONTENT['red-coral']?.faqs ?? [];
    expect(moonga.some((faq) => /red coral stone/i.test(faq.question))).toBe(true);
    expect(moonga.some((faq) => /moonga stone price/i.test(faq.question))).toBe(true);
    const heera = NAVARATNA_RICH_CONTENT.diamond?.faqs ?? [];
    expect(heera.some((faq) => /diamond gemstone/i.test(faq.question))).toBe(true);
    expect(heera.some((faq) => /natural diamond/i.test(faq.question))).toBe(true);
    const gomed = NAVARATNA_RICH_CONTENT.hessonite?.faqs ?? [];
    expect(gomed.some((faq) => /hessonite stone/i.test(faq.question))).toBe(true);
    expect(gomed.some((faq) => /gomed stone price/i.test(faq.question))).toBe(true);
    const pita = NAVARATNA_RICH_CONTENT.pitambari?.faqs ?? [];
    expect(pita.some((faq) => /pitambari sapphire/i.test(faq.question))).toBe(true);
    expect(pita.some((faq) => /sri lankan pitambari/i.test(faq.question))).toBe(true);
    const exclusive = NAVARATNA_RICH_CONTENT['exclusive-gems']?.faqs ?? [];
    expect(exclusive.some((faq) => /exclusive gems/i.test(faq.question))).toBe(true);
  });

  it('covers navaratna set intent on the parent hub', () => {
    expect(NAVARATNA_HUB_CONTENT.seo_title).toMatch(/buy navaratna gems online in india/i);
    expect(NAVARATNA_HUB_CONTENT.seo_title!.length).toBeLessThanOrEqual(60);
    expect(NAVARATNA_HUB_CONTENT.seo_description!.length).toBeLessThanOrEqual(155);
    expect(NAVARATNA_HUB_CONTENT.about_html).toMatch(/\/gemstones\/navaratna\/ruby/);
    expect(NAVARATNA_HUB_CONTENT.quality_price_html).toMatch(/diamond/i);
    expect(NAVARATNA_HUB_CONTENT.quality_price_html).toMatch(/zircon/i);
    expect(NAVARATNA_HUB_CONTENT.who_should_wear_html).toMatch(/gems-recommendations/);
    expect((NAVARATNA_HUB_CONTENT.faqs?.length ?? 0)).toBeGreaterThanOrEqual(8);
    expect(NAVARATNA_HUB_CONTENT.faqs?.some((faq) => /price/i.test(faq.question))).toBe(true);
    expect(NAVARATNA_HUB_CONTENT.faqs?.some((faq) => /wear/i.test(faq.question))).toBe(true);
    expect(NAVARATNA_HUB_CONTENT.how_to_wear_html).toMatch(/inimical/i);
    expect(NAVARATNA_HUB_CONTENT.how_to_wear_html).not.toMatch(/Sunday \(Ravivar\)/);
    expect(NAVARATNA_HUB_CONTENT.about_html).toMatch(/Lehsuniya/);
  });

  it('covers upratna substitute intent on the parent hub', () => {
    expect(UPRATNA_HUB_CONTENT.seo_title).toMatch(/buy upratna gems online in india/i);
    expect(UPRATNA_HUB_CONTENT.seo_title!.length).toBeLessThanOrEqual(60);
    expect(UPRATNA_HUB_CONTENT.seo_description!.length).toBeLessThanOrEqual(155);
    expect(UPRATNA_HUB_CONTENT.about_html).toMatch(/\/gemstones\/upratna\/amethyst/);
    expect(UPRATNA_HUB_CONTENT.about_html).not.toMatch(/href="\/shop\/amethyst"/);
    expect(UPRATNA_HUB_CONTENT.who_should_wear_html).toMatch(/gems-recommendations/);
    expect(UPRATNA_HUB_CONTENT.how_to_wear_html).not.toMatch(/Sunday \(Ravivar\)/);
    expect((UPRATNA_HUB_CONTENT.faqs?.length ?? 0)).toBeGreaterThanOrEqual(8);
    expect(UPRATNA_HUB_CONTENT.faqs?.some((faq) => /price/i.test(faq.question))).toBe(true);
    expect(UPRATNA_HUB_CONTENT.faqs?.some((faq) => /wear/i.test(faq.question))).toBe(true);
  });

  it('covers original/certified rudraksha intent on the parent hub', () => {
    expect(RUDRAKSHA_HUB_CONTENT.seo_title).toMatch(/buy original rudraksha online in india/i);
    expect(RUDRAKSHA_HUB_CONTENT.seo_title!.length).toBeLessThanOrEqual(60);
    expect(RUDRAKSHA_HUB_CONTENT.seo_description!.length).toBeLessThanOrEqual(155);
    expect(RUDRAKSHA_HUB_CONTENT.about_html).toMatch(/Elaeocarpus/);
    expect(RUDRAKSHA_HUB_CONTENT.about_html).toMatch(/\/knowledge\/rudraksha-qualities/);
    expect(RUDRAKSHA_HUB_CONTENT.how_to_wear_html).not.toMatch(/Sunday \(Ravivar\)/);
    expect(RUDRAKSHA_HUB_CONTENT.who_should_wear_html).toMatch(/5-mukhi/);
    expect(RUDRAKSHA_HUB_CONTENT.types_html).toMatch(/\/shop\/malas/);
    expect(RUDRAKSHA_HUB_CONTENT.quality_price_html).toMatch(/government certified/i);
    expect(RUDRAKSHA_HUB_CONTENT.buyer_beware_html).toMatch(/X-ray|x-ray/i);
    expect((RUDRAKSHA_HUB_CONTENT.faqs?.length ?? 0)).toBeGreaterThanOrEqual(8);
    expect(RUDRAKSHA_HUB_CONTENT.faqs?.some((faq) => /original rudraksha online/i.test(faq.question))).toBe(true);
    expect(RUDRAKSHA_HUB_CONTENT.faqs?.some((faq) => /x-ray/i.test(faq.question))).toBe(true);
    expect(RUDRAKSHA_HUB_CONTENT.faqs?.some((faq) => /government certified/i.test(faq.question))).toBe(true);
  });
});

describe('stores schema', () => {
  it('emits PostalAddress on each visitable location', () => {
    const graph = storeLocationsJsonLd('https://purevedicgems.com', {
      india: '+91 9871582404',
      uk: '+44 7831 491778',
    });
    expect(graph).toHaveLength(3);
    for (const node of graph) {
      expect(node.address['@type']).toBe('PostalAddress');
      expect(node.address.streetAddress).toBeTruthy();
      expect(node.parentOrganization).toEqual({ '@id': 'https://purevedicgems.com/#organization' });
    }
    expect(graph.filter((node) => node['@type'] === 'JewelryStore')).toHaveLength(2);
    expect(graph.find((node) => node['@type'] === 'LocalBusiness')?.name).toMatch(/appointment only/i);
  });
});

describe('Malaysia gem redirects', () => {
  it('point buy-guides at quality hubs, not consultation', () => {
    expect(MALAYSIA_GEM_REDIRECTS).toHaveLength(8);
    for (const [source, dest] of MALAYSIA_GEM_REDIRECTS) {
      expect(source).toMatch(/malaysia/i);
      expect(dest.startsWith('/knowledge/gem-qualities/')).toBe(true);
      expect(dest).not.toBe('/consultation');
    }
  });
});

describe('SEO landings', () => {
  it('points Venus knowledge to the diamond guide', () => {
    const venus = getSeoLandingPageBySlug('gemstones-by-planet-venus');
    expect(venus?.relatedKnowledge[0]?.href).toBe('/knowledge/gemstones/diamond-heera-guide');
  });
});
