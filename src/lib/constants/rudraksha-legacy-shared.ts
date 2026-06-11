/** Shared copy and internal links for legacy-format Rudraksha guide pages (15–21). */

export const WHERE_TO_BUY_BASE =
  'You should buy Rudrakshas from an authentic and reputed and very experienced company if you want pure, original, and effective healing Rudrakshas. Pure Vedic Gems Pvt. Ltd. is one of the oldest and most reputed companies dealing in authentic quality Jyotish gemstones and genuine best quality Rudrakshas only. This company is owned and managed by one of the oldest families (since 1937). Pure Vedic Gems have a vast network experience and link to buy directly from the mines/Rudrakshas farms, so end-users customers can get the best quality at the best prices. Pure Vedic Gems Company provides a reputed and authentic lab certificate with each and every Rudraksha. Pure Vedic Gems also provides free recommendations of gemstones and Rudraksha by famous and learned astrologers. You can definitely get 100% Genuine Vedic Quality Energized & Activated Rudrakshas at the best prices for the best results from Pure Vedic Gems.';

export const WHERE_TO_BUY_INHOUSE =
  ' Pure Vedic Gems Pvt. Ltd. is the only company which has a complete In-house Vedic set-up of purifying (shudhikaran) and energization (pranpratishtha) as per the authentic ancient rituals.';

export function buildWhereToBuy(extended = false): string {
  return extended ? WHERE_TO_BUY_BASE + WHERE_TO_BUY_INHOUSE : WHERE_TO_BUY_BASE;
}

export const RUDRAKSHA_COLLECTION_LINKS: { label: string; href: string }[] = [
  { label: 'Rudrakshas', href: '/shop/rudraksha' },
  { label: 'One Mukhi Rudraksha', href: '/knowledge/rudraksha/1-mukhi' },
  { label: 'Two Mukhi Rudraksha', href: '/knowledge/rudraksha/2-mukhi' },
  { label: 'Three Mukhi Rudraksha', href: '/knowledge/rudraksha/3-mukhi' },
  { label: 'Four Mukhi Rudraksha', href: '/knowledge/rudraksha/4-mukhi' },
  { label: 'Five Mukhi Rudraksha', href: '/knowledge/rudraksha/5-mukhi' },
  { label: 'Six Mukhi Rudraksha', href: '/knowledge/rudraksha/6-mukhi' },
  { label: 'Seven Mukhi Rudraksha', href: '/knowledge/rudraksha/7-mukhi' },
  { label: 'Eight Mukhi Rudraksha', href: '/knowledge/rudraksha/8-mukhi' },
  { label: 'Nine Mukhi Rudraksha', href: '/knowledge/rudraksha/9-mukhi' },
  { label: 'Ten Mukhi Rudraksha', href: '/knowledge/rudraksha/10-mukhi' },
  { label: 'Eleven Mukhi Rudraksha', href: '/knowledge/rudraksha/11-mukhi' },
  { label: 'Twelve Mukhi Rudraksha', href: '/knowledge/rudraksha/12-mukhi' },
  { label: 'Thirteen Mukhi Rudraksha', href: '/knowledge/rudraksha/13-mukhi' },
  { label: 'Fourteen Mukhi Rudraksha', href: '/knowledge/rudraksha/14-mukhi' },
  { label: 'Fifteen Mukhi Rudraksha', href: '/knowledge/rudraksha/15-mukhi' },
  { label: 'Sixteen Mukhi Rudraksha', href: '/knowledge/rudraksha/16-mukhi' },
  { label: 'Gauri Shankar Rudraksha', href: '/shop/rudraksha/gauri-shankar' },
  { label: 'Ganesh Rudraksha', href: '/shop/rudraksha/ganesh-rudraksha' },
  { label: 'Nir Mukhi Rudraksha', href: '/shop/rudraksha/nir-mukhi' },
  { label: 'Garbh Gauri', href: '/shop/rudraksha/garbh-gauri' },
];
