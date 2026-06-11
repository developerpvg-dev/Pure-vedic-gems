import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.resolve(root, '..', 'legacy_tier_images.json');
const legacyJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const KEY_TO_SLUG = {
  'buy-online-blue-sapphire-gemstone': 'blue-sapphire',
  'buy-online-yellow-sapphire-gemstone': 'yellow-sapphire',
  'buy-online-ruby-gemstone': 'ruby',
  'buy-online-emerald-gemstone': 'emerald',
  'red-coral-qualities': 'red-coral',
  'buy-online-catseye-gemstone': 'catseye',
  'hessonite-qualites': 'hessonite',
};

const SHOP = {
  'blue-sapphire': '/shop/blue-sapphire',
  'yellow-sapphire': '/shop/yellow-sapphire',
  ruby: '/shop/ruby',
  emerald: '/shop/emerald',
  'red-coral': '/shop/red-coral',
  catseye: '/shop/cats-eye',
  hessonite: '/shop/hessonite',
};

function img(slug, file) {
  return `/gems-knowledge/${slug}/${file}`;
}

function tierFromJson(slug, key, tierTitle, note, rows) {
  const meta = legacyJson[key];
  const files = meta.images.filter((i) => i.tier === tierTitle).map((i) => i.filename);
  return {
    title: tierTitle,
    note,
    rows,
    images: files.map((f) => ({ src: img(slug, f), alt: `${tierTitle} — ${f}` })),
  };
}

const GUIDES = {
  'blue-sapphire': {
    legacyH1: legacyJson['buy-online-blue-sapphire-gemstone'].h1,
    certificationQuote: legacyJson['buy-online-blue-sapphire-gemstone'].certification_quote,
    shopLabel: 'Click here to View Our Products',
    aboutTitle: 'About Astro-Jyotish Standard Vedic Blue-Sapphire',
    aboutParagraphs: [
      'Blue Sapphire gemstone is also known as Neelam in India, and it is blue in color. Blue Sapphire is a precious and expensive gemstone. Blue Sapphire gemstone is a very strong and dreaded stone in astrology. It is due to the unstable nature of Blue Sapphire which brings only extremities. Blue Sapphire gemstone provides very beneficial results if suitable but may be very harmful if unsuitable. That is why it is always taken on a trial basis first and if it does not cause any harm in the trial period only then should be set in a ring.',
      'There are many theories on the ways of testing the effects of Blue sapphire gemstones, like placing it under the pillow, etc. But we only recommend checking the effects of blue sapphire gemstones by tying or sticking it on your body using a cloth or a sticking (Medical) tape (available on chemists). And the minimum trial over a body to see the positive or negative effects should be 3 days. During the trial period of blue sapphire gemstone, if it is unsuitable, it may manifest it\'s harm by a continuous new and acute headache, minor accidents, pain in the abdomen, bad news, delays in almost all ventures. But if it is suitable, don\'t expect any miracles in the testing period, it usually takes a few weeks to a few months to feel the positive benefits of blue sapphire gemstones.',
      'Blue Sapphire gemstone emits violet cosmic rays. Lack of violet cosmic rays will create immediate disorder or diseases. Usually, the nervous system first to be affected which results in fainting, fits, virility, mental disorder, deafness, baldness. Blue Sapphire gemstone clears infections and wards off all negative energies. Blue Sapphire gemstone is also considered to be anti tumor and anti fat and helps in reducing therapy, strengthens bones and helps calms nerves and emotions.',
      'If blue sapphire gemstone suits the wearer it removes his poverty and gives the wearer almost everything a man could desire namely health, wealth, longevity, happiness, prosperity, name and fame. The native gets good servants, advancement in profession and favors from government. The native will get land, building, and properties. It also ensures success in politics. The sources of Blue Sapphires gemstones are Kashmir, Salem, Burma, Thailand, Sri Lanka, Australia, Cambodia, U.S.A, and Africa.',
    ],
    generalCharacteristicsTitle: 'General Characteristics of a Jyotish Blue-Sapphire (Neelam)',
    generalCharacteristics: [
      'It can cause a sudden upturn in business and change the life pattern for good.',
      'Protects wearers from unexpected happenings & natural calamities.',
      'It may give rapid & immense financial gain & raja yoga.',
      'Best for depressive psychosis frustration, alcoholism.',
      'Khooni Neelam (Reddish Blue Neelam) is very useful when Saturn is aspected or conjuncted by Mars or Rahu in natal charts. It\'s "Shrapit" (Curse) condition and khooni neelam provides financial and marital prosperity.',
      'Highly useful when tuberculosis is chronic.',
    ],
    goodQualitiesTitle: 'Qualities of a Good Quality Jyotish Blue-Sapphire (Neelam)',
    goodQualities: [
      'Smoothness.',
      'Transparence.',
      'Uniformity in Color.',
      'High Specific Gravity.',
      'Brilliance, exhibiting a star-like effect from inside when viewed in reflected light, emitting rays of light from inside.',
      'Solid and Compact body.',
      'Color similar to that of the neck of a peacock, or a velvety cornflower blue.',
      'Good cut and nice shape.',
    ],
    faqTitle: 'Blue Sapphire Gemstone-Frequently Asked Questions',
    tiers: [
      tierFromJson('blue-sapphire', 'buy-online-blue-sapphire-gemstone', 'Lowest Quality Blue Sapphire', "We don't keep this standard/quality of Blue Sapphire gemstone because they are totally ineffective for astrological healing purposes", [
        { label: 'Origin', value: 'Bangkok (Thailand)' },
        { label: 'Treatments', value: 'Highly Treated (Diffusion Treatment using Beryllium, Color Enhancements by Irradiation, Color Filling using resin, Etc.)' },
        { label: 'Astrologically', value: 'NOT Effective / Not Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 500-Rs 3000 per carat' },
        { label: 'Colortone & Appearance', value: 'Highly Opaque and deep Blackish Blue or Purplish tones' },
      ]),
      tierFromJson('blue-sapphire', 'buy-online-blue-sapphire-gemstone', 'Medium Quality Blue Sapphire', 'For This Category Blue Sapphires See the Economy, Premium and Super Premium Range', [
        { label: 'Origin', value: 'Bangkok (Thailand), Sri-Lanka' },
        { label: 'Treatments', value: 'Moderately Treated (Generally only heating) / Or Not Treated' },
        { label: 'Astrologically', value: 'Effective / Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 3000 – Rs 7000 per carat' },
        { label: 'Colortone & Appearance', value: 'Very light Bluish tone (If Pure & Natural), Deep Blue (If color Enhanced, using heat treatment/Plain heating not heating with chemicals), Slightly Opaque/less or medium in Transparency with few inclusions/smokiness' },
      ]),
      tierFromJson('blue-sapphire', 'buy-online-blue-sapphire-gemstone', 'High Quality Blue Sapphire', 'For This Category Blue Sapphires See the Luxury and Super Luxury Range', [
        { label: 'Origin', value: 'Sri-Lanka, Burma' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: 'Very Effective / Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 7000 – Rs 30000 per carat' },
        { label: 'Colortone & Appearance', value: 'Good In Transparency, Luster and medium blue color tone With Very less OR no Inclusions.' },
      ]),
      tierFromJson('blue-sapphire', 'buy-online-blue-sapphire-gemstone', 'Very High / Rare Quality Blue Sapphire', 'For This Category Blue Sapphires See the Exclusive Range', [
        { label: 'Origin', value: 'India (Kashmir), Sri-Lanka, Burma, Brazil' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: 'Most Effective /Highly Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 30000 – Rs 300000 Per Carat' },
        { label: 'Colortone & Appearance', value: 'Very Good Royal/Cornflower blue Color with Brilliant luster, Absolutely transparent with no inclusions.' },
      ]),
    ],
  },
  'yellow-sapphire': {
    legacyH1: legacyJson['buy-online-yellow-sapphire-gemstone'].h1,
    certificationQuote: legacyJson['buy-online-yellow-sapphire-gemstone'].certification_quote,
    shopLabel: 'Click here to View Our Products',
    aboutTitle: 'About Astro-Jyotish Standard Vedic Yellow-Sapphire',
    aboutParagraphs: [
      'Yellow Sapphire also known as Pukhraj in India is yellow in color. It is a precious and expensive stone. This is one of the most widely used gemstone to help achieve better financial status. It is used to enhance the powers of planet Jupiter (Guru). It emits blue cosmic rays. And the deficiency of blue cosmic rays makes a person pessimistic, weak willed and without faith. These rays strengthen the fat system of the body and can help cure sore throats, laryngitis, goiter, jaundice, diarrhea, gastritis, ulcer, rheumatism, impotency, gout, pain in knee joints, arthritis and lung problems. It cures chicken pox, measles, mumps, tonsillitis, whooping cough, eye inflammations, headaches, toothaches, itches on skin, menstruation pain and also strengthen the body\'s immune system overall. Yellow Sapphire denotes righteousness, piety and truthfulness. It gives life security, protects one from poverty, and removes adversity, misfortune and melancholy. The wearer may expect wealth, good health, name, honor and fame if the gem suits him or her. It is also believed that if there are obstructions in finding a suitable match for a girl, she gets married early by wearing a yellow sapphire. Like other members of the corundum family, Yellow Sapphire is also found as crystals in rocks of limestone and schist\'s and in riverbeds and streams. The primary sources in India are the Mahanadi and Brahmaputra rivers, the Himalayas, the Vindhyanchal Mountains, Orissa, Bengal, and Kashmir. They are also found in Mogok in Burma, Sri Lanka, Australia, Thailand, Brazil and Zimbabwe.',
    ],
    generalCharacteristicsTitle: 'General characteristics of a Jyotish Yellow Sapphire',
    generalCharacteristics: [
      'Ensures healthy and prolonged life.',
      'It brings wisdom, good luck and mental peace.',
      'It gives strength to your immune and digestive system, improves your blood circulation and boosts the functioning of liver and pancreas.',
      'Makes an individual confident and brings positive thoughts.',
      'It provides better decision making ability, improves your concentration and helps with academic and career success. So can also be worn by students or professionals.',
      'Also recommend to those girls who are facing problems with getting married or finding a suitable match. Married women can also wear this, if they are facing troubles in their marriage life.',
    ],
    faqTitle: 'Yellow Sapphire Gemstone-Frequently Asked Questions',
    tiers: [
      tierFromJson('yellow-sapphire', 'buy-online-yellow-sapphire-gemstone', 'Lowest Quality Yellow Sapphire', "We don't keep this standard/quality of Yellow Sapphire gemstone because they are totally ineffective for astrological healing purposes", [
        { label: 'Origin', value: 'Bangkok (Thailand)' },
        { label: 'Treatments', value: 'Highly Treated (Diffusion Treatment using Beryllium, Color Enhancements by Irradiation, color filling using resin etc.)' },
        { label: 'Astrologically', value: 'NOT Effective/Not Recommended' },
        { label: 'Price Range(Per Carat) Approx', value: 'Rs 500-Rs 3000 per carat' },
        { label: 'Colortone & Appearance', value: 'Highly Opaque and deep Yellow or orange tones' },
      ]),
      tierFromJson('yellow-sapphire', 'buy-online-yellow-sapphire-gemstone', 'Medium Quality Yellow Sapphire', 'For This Category Yellow Sapphires See the Economy, Premium and Super Premium Range', [
        { label: 'Origin', value: 'Bangkok (Thailand), Sri-Lanka' },
        { label: 'Treatments', value: 'Moderately Treated (Generally only heating) / Or Not Treated' },
        { label: 'Astrologically', value: 'Effective/Recommended' },
        { label: 'Price Range(Per Carat) Approx', value: 'Rs 3000 – Rs 12000 per carat' },
        { label: 'Colortone & Appearance', value: 'Very light yellow or golden tone, Slightly Opaque / less in Transparency with inclusions/smokiness' },
      ]),
      tierFromJson('yellow-sapphire', 'buy-online-yellow-sapphire-gemstone', 'High Quality Yellow Sapphire', 'For This Category Yellow Sapphires See the Luxury & Super Luxury Range', [
        { label: 'Origin', value: 'Sri-Lanka, Burma' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: 'Very Effective / Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 12000 – Rs 30000 per carat' },
        { label: 'Colortone & Appearance', value: 'Medium/Good in Transparency, Luster and Yellow color tone With Very less OR no Inclusions' },
      ]),
      tierFromJson('yellow-sapphire', 'buy-online-yellow-sapphire-gemstone', 'Very High / Rare Quality Yellow Sapphire', 'For This Category Yellow Sapphires See the Exclusive Range', [
        { label: 'Origin', value: 'Sri-Lanka, Burma, Brazil' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: 'Most Effective /Highly Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 30000 – Rs 80000 Per carat' },
        { label: 'Colortone & Appearance', value: 'Very Good Yellow/Golden Color with Brilliant luster, absolutely transparent with no inclusions' },
      ]),
    ],
  },
  ruby: {
    legacyH1: legacyJson['buy-online-ruby-gemstone'].h1,
    certificationQuote: legacyJson['buy-online-ruby-gemstone'].certification_quote,
    shopLabel: 'Click here to View Our Products',
    aboutTitle: 'About Astro-Jyotish Standard Vedic Ruby',
    aboutParagraphs: [
      'Ruby also known as Manik in India is Red in color. Ruby gemstones always have some internal marks or natural inclusions and a clean Ruby is extremely rare. If you find an absolutely clean Ruby, it would either be very expensive (If Pure & Natural) or would either be a fake or treated to enhance its clarity. Ruby is worn to enhance the blessings of planet Sun (Surya) in one\'s life. It emits Red cosmic rays.The Sun is the Supreme power of the solar system. The red cosmic rays are heat producing, as they are of the elements of fire. They instigate cosmic fire in the human body, which is necessary for our sight to function, it aids in digestion. Ruby is said to give good health, high position, name, fame, vigor, virtue, warmth and the capacity to command. Historically, it has been a symbol of love and passion. Ruby mines are found in Burma, Sri-Lanka, Africa, Thailand, Afghanistan and South India.',
    ],
    generalCharacteristicsTitle: 'General Characteristics of Ruby Gemstone',
    generalCharacteristics: [
      'It is a royal gemstone, used by kings and queens in their jewelries.',
      'It is a very good gemstone for people in politics, administration and government jobs.',
      'It is a very good gemstone for people in the medical profession.',
      'It is a very good gemstone for people in the entertainment industry.',
      'It is a very good gemstone for people in the sports industry.',
    ],
    faqTitle: 'Ruby Gemstone-Frequently Asked Questions',
    tiers: [
      tierFromJson('ruby', 'buy-online-ruby-gemstone', 'Lowest Quality Ruby Gemstone', "We don't keep this standard/quality of Ruby gemstone because they are totally ineffective for astrological healing purposes", [
        { label: 'Origin', value: 'Indian /African/Thailand' },
        { label: 'Treatments', value: 'Highly Treated (Heating with Glass, Resin & color filling)' },
        { label: 'Astrologically', value: 'Not Effective / Not Recommended' },
        { label: 'Price Range(Per Carat) Approx', value: 'Rs 100 - Rs 1500 Per carat' },
        { label: 'Colortone & Appearance', value: 'Highly Opaque, Faded & Dull in color (if Natural)/Good in color (Pinkish Red) & Translucent (When treated using Resin, color & Glass Filling)' },
      ]),
      tierFromJson('ruby', 'buy-online-ruby-gemstone', 'Medium Quality Ruby Gemstone', 'For This Category Rubies See the Economy, Premium and Super Premium Range', [
        { label: 'Origin', value: 'African(Mozambique)/Thailand/Burma' },
        { label: 'Treatments', value: 'Moderately Treated (mostly Heat Treated with Resin/Color filling or only Heat Treatment)' },
        { label: 'Astrologically', value: 'Moderately Effective / Recommended' },
        { label: 'Price Range(Per Carat) Approx', value: 'Rs 1500 – Rs 7000 Per carat' },
        { label: 'Colortone & Appearance', value: 'Dark Pinkish-Medium Pinkish colortone & Opaque' },
      ]),
      tierFromJson('ruby', 'buy-online-ruby-gemstone', 'High Quality Ruby Gemstone', 'For This Category Rubies See the Luxury and Super Luxury Range', [
        { label: 'Origin', value: 'African(Mozambique)/Burma/Madagaskar' },
        { label: 'Treatments', value: 'Very Less (only Heating without any Chemicals or Resin filling) or No Heating' },
        { label: 'Astrologically', value: 'Very Effective / Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 7000 – Rs 35000 per carat' },
        { label: 'Colortone & Appearance', value: 'Bright Pink or Bright Red (if Heated) and Dark Pink or Dark Red (if not Heated)/ Translucent or Semi-Transparent' },
      ]),
      tierFromJson('ruby', 'buy-online-ruby-gemstone', 'Very High / Rare Quality Ruby Gemstone', 'For This Category Rubies See the Exclusive Range of our gemstones category', [
        { label: 'Origin', value: 'Burma & Madagaskar' },
        { label: 'Treatments', value: 'No Treatments (Pure & Natural)' },
        { label: 'Astrologically', value: 'Most Effective /Highly Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 35000 – Rs 350000 Per carat' },
        { label: 'Colortone & Appearance', value: 'Deep pinkish red to blood red/ pigeon blood red and almost transparent to pure transparent.' },
      ]),
    ],
  },
  emerald: {
    legacyH1: legacyJson['buy-online-emerald-gemstone'].h1,
    certificationQuote: legacyJson['buy-online-emerald-gemstone'].certification_quote,
    shopLabel: 'Click here to View Our Products',
    aboutTitle: 'About Astro-Jyotish Standard Vedic Emeralds',
    aboutParagraphs: [
      'Emerald Gemstone also known as Panna in India is green in color, the Emerald gemstone is a silicate of aluminium and beryllium and belongs to the beryl family of gems. Emerald is a gemstone which is very rarely found clean, it is very difficult to find a flawless Emerald gemstone. Most Emerald gemstones are having a feather-like crack or inclusions. An absolutely clean Emerald would either be very expensive or a fake.',
      'Astrologically approved Emerald gemstones are used to enhance the powers of planet Mercury (Budha) in one\'s life. Emerald gemstones emit green cosmic rays. And the deficiency of green cosmic rays creates instability in thinking capabilities and leads to poor memory or loss of memory. Also development of stomach ulcers, diarrhea, headaches, kidney dysfunction, heart problems, high blood pressure, burns on skin, insomnia, asthma and nervous system related problems. Wearing a Jyotish Quality, pure and natural Emerald calms mental agitation, improves speech and intelligence, promotes healing of cancer and other degenerative diseases.',
      'A jyotish Emerald gemstone\'s influences include intelligence, good memory, intuition, rationality, skillfulness, education, speech, teaching, learning, communication, confidence, writing, trade, humour, diplomacy and commerce. One who wears a Jyotish Quality Emerald becomes educated, happy, fortunate and highly respected. The Emerald Gemstone with a deep velvet green to grass green color, radiant, smooth, transparent and with bright rays is the best, most effective and most auspicious Gem. The main sources of Emerald are India, Pakistan, Colombia, Africa, Egypt, Brazil, Afghanistan and Soviet Union.',
    ],
    faqTitle: 'Emerald Gemstone-Frequently Asked Questions',
    tiers: [
      tierFromJson('emerald', 'buy-online-emerald-gemstone', 'Lowest Quality Emerald', "We don't keep this standard/quality of Emerald gemstone because they are totally ineffective for astrological healing purposes", [
        { label: 'Origin', value: 'Indian /African' },
        { label: 'Treatments', value: 'Highly Treated (Resin & color filling)' },
        { label: 'Astrologically', value: 'NOT Effective/Not Recommended' },
        { label: 'Price Range(Per Carat) Approx', value: 'Rs 100-Rs 1000 Per carat' },
        { label: 'Colortone & Appearance', value: 'Blackish Green/Dull Faded color tone/Highly Opaque' },
      ]),
      tierFromJson('emerald', 'buy-online-emerald-gemstone', 'Medium Quality Emerald', 'For This Category Emeralds See the Economy, Premium and Super Premium Range', [
        { label: 'Origin', value: 'African (Zambian)' },
        { label: 'Treatments', value: 'Moderately Treated (Oil Treatments)' },
        { label: 'Astrologically', value: 'Effective / Recommended' },
        { label: 'Price Range(Per Carat) Approx', value: 'Rs 1000 – Rs 5000 Per carat' },
        { label: 'Colortone & Appearance', value: 'Medium Green / Slightly Opaque' },
      ]),
      tierFromJson('emerald', 'buy-online-emerald-gemstone', 'High Quality Emerald', 'For This Category Emeralds See the Luxury and Super Luxury Range', [
        { label: 'Origin', value: 'African (Zambian) & Columbian' },
        { label: 'Treatments', value: 'Very Less / No Treatments (Only oiling)' },
        { label: 'Astrologically', value: 'Very Effective / Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 5000 – Rs 20000 per carat' },
        { label: 'Colortone & Appearance', value: 'Bright Green (Parrot Green)/Translucent (Almost Transparent)' },
      ]),
      tierFromJson('emerald', 'buy-online-emerald-gemstone', 'Very High / Rare Quality Emerald', 'For This Category Emeralds See the Exclusive Range', [
        { label: 'Origin', value: 'African (Zambian) & Columbian' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: 'Most Effective /Highly Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 30000 – Rs 400000 Per carat' },
        { label: 'Colortone & Appearance', value: 'Bright Green (Grass Green)/Absolutely Transparent' },
      ]),
    ],
  },
  'red-coral': {
    legacyH1: legacyJson['red-coral-qualities'].h1,
    certificationQuote: legacyJson['red-coral-qualities'].certification_quote,
    sectionIntro: 'Red Coral Qualities available in the market',
    shopLabel: 'Click here to View Our Products',
    introBullets: [
      'Natural, Non-Treated, Astrologically Approved, Red Corals for potentiating the positive energies of planet Mars (Mangal) in one\'s life.',
      'Red Coral is also known as Laal Moonga, it is used to enhance the powers of the planet Mars (Mangal).',
      'This gemstone helps to strengthen the cosmic rays of the planet Mars.',
      'Wearing the Red Coral helps to improve physical strength and help to cure diseases like nerve diseases, gallstones, diabetes, asthma, hernia, meningitis, gouts, carbuncle, paralysis, rickets, piles etc.',
    ],
    trustPoints: [
      { bold: 'Pure Vedic Gems', text: ' is the oldest & most trusted name associated with all kinds of vedic planetary gemstones.' },
      { bold: 'Genuine Gemstones', text: ' with certification from international standard govt. labs only.' },
      { bold: 'Astrologically approved', text: ' (Jyotish standard) energized & purified gems with vedic mantras & rituals for best results.' },
    ],
    aboutTitle: 'Purified & Energized Vedic Red Coral Gemstone',
    aboutParagraphs: [
      'We deal in authentic, potent, jyotish standard (as mentioned in vedic classic texts) & Natural gemstones only for best results.',
    ],
    instructionColumns: [
      [
        'Accurate Gemstone consultation from genuine Vedic Astrologer.',
        'Most reasonable prices(direct sourcing from the mines, gems cutters-polishers).',
        'We provide most reasonable & genuine prices of astro-jyotish quality gems across the globe.',
      ],
      [
        'We have specialized & experienced artisans (karigars) for setting these gemstones according to vedic wearing instructions.',
        'We provide certification from labs having complete world standard equipments to test all the treatments and enhancements coming in gems nowadays.',
        'We have huge collection of certified, authentic & genuine jyotish gemstones.',
      ],
      [
        'We also provide special facility of energizing (Abhimantrit) the gemstone according to personalized Gotra & Rashi through vedic mantras.',
        'We provide complete genuine vedic instructions for wearing gemstone.',
        'The most common and harmless stone is red coral which is widely use to appease planet Mars.',
      ],
    ],
    generalCharacteristics: [
      'Red Coral Gemstones represents the planet Mars & people with positive Mars position in weak houses should wear Red Coral Gems for enhancing planet Mangal benefic blessings.',
      'The genuine Jyotish Red Coral gems are known to give good health and self confidence.',
      'People involved in such type of businesses like Restaurants, Jewellery and Hotel must wear a Natural Red Coral Gemstone.',
      'Jyotish quality Red Coral should be Vibrant Reddish in color and should not have broken edges should be 100% natural (no treatments).',
      'It should not have any black spots and any kind of dark spot on it.',
      'before wearing Red Coral Gemstone You should always seek the advice of knowledgeable astrologer.',
      'Red Coral Gems should be set in copper or gold made rings/pendants to enhance the positive energies of planet Mars in one\'s life.',
      'The weight of the Red coral gemstone (in ratti) to use must be at least 8% to 10% of the body weight of the wearer.',
      'Ring can be worn on the ring finger/ third finger.',
      'One should also pray to Lord Mars & chant Mantra "Aum Bhaum Bhaumaye Namah Aum" 108 times to attain best results.',
    ],
    jewelleryCta: {
      title: 'Click here to View our Astrological-Approved Jewellery Designs (Rings, Pendants, Customized Talismans)',
      href: '/shop/jewelry',
      label: 'Order Now',
    },
    energizingVideoLabel: 'Click here to View our "Purifying and Energizing of Red Coral by Vedic Rituals (Moonga Ratna) at Pure Vedic Gems"',
    energizingVideoHref: 'https://www.youtube.com/watch?v=-HXXVCG12wM',
    phone: '+91 9871582404',
    faqTitle: 'Red Coral Gemstone-Frequently Asked Questions',
    tiers: [
      tierFromJson('red-coral', 'red-coral-qualities', 'Lowest Quality Red Coral Gemstone', undefined, [
        { label: 'Origin', value: 'Indian /Italian' },
        { label: 'Treatments', value: 'Dyed, Colored or Totally fake (plastic made)' },
        { label: 'Astrologically', value: 'Not Effective / Not Recommended' },
        { label: 'Price Range (Per Carat)Approx', value: 'Rs 100-Rs 300 per carat' },
        { label: 'Colortone & Appearance', value: 'Very Dull, Light Orangish in Color, Having Dark Spots, Cracks or Dents Type Marks.' },
      ]),
      tierFromJson('red-coral', 'red-coral-qualities', 'Medium Quality Red Coral Gemstone', undefined, [
        { label: 'Origin', value: 'Indian /Italian' },
        { label: 'Treatments', value: 'No Treatment' },
        { label: 'Astrologically', value: 'Effective / Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 400 – Rs 1100 per carat' },
        { label: 'Colortone & Appearance', value: 'Medium Orangish to Light Reddish in Color Smooth and shiny in Appearance.' },
      ]),
      tierFromJson('red-coral', 'red-coral-qualities', 'High Quality Red Coral Gemstone', undefined, [
        { label: 'Origin', value: 'Italian' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: 'Very Effective / Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 1000– Rs 2000 per carat' },
        { label: 'Colortone & Appearance', value: 'Very Smooth and Shiny in Appearance, Dark Red in Color, Spotless.(These qualities of Red Corals come in dark orangish red to blood red in color).' },
      ]),
      tierFromJson('red-coral', 'red-coral-qualities', 'Very High / Rare Quality Red Coral Gemstone', undefined, [
        { label: 'Origin', value: 'Italian/Japanese' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: 'Most Effective /Highly Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 3500 – Rs 7000 Per carat' },
        { label: 'Colortone & Appearance', value: 'Orangish to Medium Reddish in Color(if Japanese) & Dark Blood Red & Very Smooth Shiny(If Italian).' },
      ]),
    ],
  },
  catseye: {
    legacyH1: legacyJson['buy-online-catseye-gemstone'].h1,
    certificationQuote: legacyJson['buy-online-catseye-gemstone'].certification_quote,
    shopLabel: 'Click here to View Our Products',
    aboutTitle: 'About Astro-Jyotish Standard Vedic Catseye',
    aboutParagraphs: [
      'Cat\'s Eye gemstone also known as lahsunia in India comes in many colors and shades. It is a gemstone used to enhance the powers of planet Ketu (the dragon\'s tail). Just like Rahu it is also an invisible planet and in Vedic astrology, it is considered to be descending node of Chandra (moon). It emits Infrared cosmic rays. If it suits it protects the wearer from hidden enemies, mysterious dangers and diseases. It helps in treating chronic ailments and terminal diseases such as cancer. It is also used to treat poor digestion, paralysis, diseases of uterus and many skin diseases. It prevents unexpected mishaps of life, accidents, drowning, intoxication, govt. Punishment. Its influences include liberation, abstract thinking, non-attachment, healing, moksha-enlightment. It also removes physical weakness and mental worries. It also makes the wearer a wealthy person. And if it does not suit the opposite will happen. One should always go for a trial period of 3 days before finally wearing a Cat\'s eye stone or talisman. The sources of Cat\'s eye gemstone are India, Burma, Sri-Lanka, Brazil, America, China, Madagascar and Rhodesia.',
    ],
    faqTitle: 'Catseye Gemstone-Frequently Asked Questions',
    tiers: [
      tierFromJson('catseye', 'buy-online-catseye-gemstone', 'Lowest Quality Catseye Gemstone', "We don't keep this standard/quality of Cat's eye gemstone because they are totally ineffective for astrological healing purposes", [
        { label: 'Origin', value: 'Indian/African' },
        { label: 'Treatments', value: 'Highly Treated / Also Fake (Man-made)' },
        { label: 'Astrologically', value: 'Not Effective / Non Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: '10 Rs - 100 Rs per Carat' },
        { label: 'Colortone & Appearance', value: 'Highly Opaque/Dull/Blackish or Dark Greyish Color (With thick Center line).(Mostly available in green, grey, black, and honey brown colors).' },
      ]),
      tierFromJson('catseye', 'buy-online-catseye-gemstone', 'Medium Quality Catseye Gemstone', 'For This Category Catseye  See the Economy, Premium and Super Premium Range', [
        { label: 'Origin', value: 'Indian/African(Quartz)/SriLankan(Chrysoberyl)' },
        { label: 'Treatments', value: 'Moderately Treated/No Treatments' },
        { label: 'Astrologically', value: 'Effective/Recommended' },
        { label: 'Price Range(Per Carat) Approx', value: '200 Rs - 1000 rs per Carat (for Quartz) 2000 Rs - 5000 Rs per Carat (for Chrysoberyl)' },
        { label: 'Colortone & Appearance', value: 'Opaque/Smooth/Bright grey (for Quartz) Translucent/with cracks & feathers type inclusions (for Chrysoberyl) (With Medium Center Line).' },
      ]),
      tierFromJson('catseye', 'buy-online-catseye-gemstone', 'High Quality Catseye Gemstone', 'For This Category Catseye  See the Luxury and Super Luxury Range', [
        { label: 'Origin', value: 'Indian/Sri-Lanka (Chrysoberyl)' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: 'Very Effective / Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: '5000 Rs - 20000 Rs per Carat' },
        { label: 'Colortone & Appearance', value: 'Almost Transparent / Clean (With Medium to Thin Centre line).' },
      ]),
      tierFromJson('catseye', 'buy-online-catseye-gemstone', 'Very High / Rare Quality Catseye Gemstone', 'For This Category Catseye  See the Exclusive Range', [
        { label: 'Origin', value: 'Indian/Sri-Lanka (Chrysoberyl)' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: 'Most Effective /Highly Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: '20000 Rs - 100000 Rs per Carat' },
        { label: 'Colortone & Appearance', value: 'Pure Transparent / perfect round shape/Absolutely clean/shiny (With very thin/silk threads type center line/lines).' },
      ]),
    ],
  },
  hessonite: {
    legacyH1: legacyJson['hessonite-qualites'].h1,
    certificationQuote: legacyJson['hessonite-qualites'].certification_quote,
    shopLabel: 'Click here to View Our Products',
    aboutTitle: 'About Astro-Jyotish Standard Vedic Hessonite',
    aboutParagraphs: [
      'The Hessonite gemstones are also called as (Gomed) stones in Hindi. As per regional differences it is also called as Gomedh or "Gomedak" in Sanskrit. It comes in reddish – brown orangish color. It is the silicate of the zirconium commonly found in igneous rock but fairly rare as a gemstone. It is a gemstone associated with planet Rahu (the dragon\'s head). In Vedic Astrology Rahu is called a \'Shadow\' planet or invisible, yet is considered a planet just the same. It emits Ultraviolet Cosmic rays. It cures diseases related to stomach causing digestive difficulty or loss of appetite. It also helps in treating disorders of brain like insanity and in treating of insomnia in particular. Being a cause of eclipse, Rahu can cause to increase darkness in one\'s personality, giving rise to desire of criminal conduct, violence, insatiable sexual desires, or other behavioural anomalies. It is supposed to be responsible for all sorts of delays or very late fulfillment of ambitions. If Gomed/Hessonite suits the wearer it helps in achieving speedy success in less time than expected and protects the wearer from misfortunes. It can increase one\'s material prosperity, fame or power over others. The chief sources of Hessonite (Gomed) are India, Africa and Sri Lanka. Wearer must consult an learnt Astrologist before choosing and wearing a Gomed/Hessonite. Even though gemstone wearer can yield enormous benefits, he/she can also attract lot of negativity if the gemstone doesn\'t match them.',
    ],
    generalCharacteristicsTitle: 'General Characteristics of Hessonite Gemstone',
    generalCharacteristics: [
      'It comes in dark reddish/ brownish, orangish colors.',
      'Helps the wearer in regard to professional advancement, finance and health.',
      'Highly recommended where Rahu is 10th house or/ and person involved in the politics.',
    ],
    faqTitle: 'Hessonite Gemstone-Frequently Asked Questions',
    tiers: [
      tierFromJson('hessonite', 'hessonite-qualites', 'Lowest Quality Hessonite(Gomed) Gemstone', "We don't keep this standard/quality of Hessonite gemstone because they are totally ineffective for astrological healing purposes", [
        { label: 'Origin', value: 'Indian /African' },
        { label: 'Treatments', value: 'Highly Treated /Also Fake(Plastic Made)' },
        { label: 'Astrologically', value: 'NOT Effective / Not Recommended' },
        { label: 'Price Range(Per Carat) Approx', value: 'Rs 10 - 100 Rs per Carat' },
        { label: 'Colortone & Appearance', value: 'Highly Opaque / Dull / Blackish / Brownish Color.' },
      ]),
      tierFromJson('hessonite', 'hessonite-qualites', 'Medium Quality Hessonite (Gomed) Gemstone', 'For This Category Hessonite See the Economy, Premium and Super Premium Range', [
        { label: 'Origin', value: 'African/Sri-Lanka' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: 'Moderately Effective /Recommended' },
        { label: 'Price Range(Per Carat) Approx', value: 'Rs 200 – Rs 600 Per carat' },
        { label: 'Colortone & Appearance', value: 'Medium With some Inclusion /Dull/ Orangish /Brownish in color' },
      ]),
      tierFromJson('hessonite', 'hessonite-qualites', 'High Quality Hessonite (Gomed) Gemstone', 'For This Category Hessonite See the Luxury and Super Luxury Range', [
        { label: 'Origin', value: 'Sri-Lanka' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: 'Very Effective / Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: '800 Rs - 1500 Rs per Carat' },
        { label: 'Colortone & Appearance', value: 'Almost Transparent / Clean / Bright Orangish/Brownish in Color' },
      ]),
      tierFromJson('hessonite', 'hessonite-qualites', 'Very High / Rare Quality Hessonite (Gomed) Gemstone', 'For This Category Hessonite See the Exclusive Range', [
        { label: 'Origin', value: 'Sri-Lanka' },
        { label: 'Treatments', value: 'No Treatments' },
        { label: 'Astrologically', value: '100 % Effective/Highly Recommended' },
        { label: 'Price Range (Per Carat) Approx', value: 'Rs 2000 - Rs 6000 per Carat' },
        { label: 'Colortone & Appearance', value: 'Absolutely Transparent / Very Bright Orangish /Brownish color Brilliance' },
      ]),
    ],
  },
};

const GEM_LEGACY_FAQS = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'lib', 'constants', 'gem-legacy-faqs.json'), 'utf8'),
);

const assembled = {};
for (const [slug, guide] of Object.entries(GUIDES)) {
  assembled[slug] = {
    slug,
    shopHref: SHOP[slug],
    faqs: GEM_LEGACY_FAQS[slug] ?? [],
    ...guide,
  };
}

const out = `// Generated by scripts/build-gem-legacy-quality-data.mjs — legacy gem quality page content.\n\nimport type { GemLegacyGuide } from './gem-legacy-quality-types';\n\nexport const LEGACY_GEM_QUALITY_SLUGS = ${JSON.stringify(Object.keys(assembled))} as const;\n\nexport type LegacyGemQualitySlug = (typeof LEGACY_GEM_QUALITY_SLUGS)[number];\n\nconst GUIDES: Record<LegacyGemQualitySlug, GemLegacyGuide> = ${JSON.stringify(assembled, null, 2)} as Record<LegacyGemQualitySlug, GemLegacyGuide>;\n\nexport function getGemLegacyGuide(slug: string): GemLegacyGuide | null {\n  return (GUIDES as Record<string, GemLegacyGuide>)[slug] ?? null;\n}\n\nexport function isLegacyGemQualitySlug(slug: string): slug is LegacyGemQualitySlug {\n  return LEGACY_GEM_QUALITY_SLUGS.includes(slug as LegacyGemQualitySlug);\n}\n`;

fs.writeFileSync(path.join(root, 'src', 'lib', 'constants', 'gem-legacy-quality-data.ts'), out);
console.log('Wrote gem-legacy-quality-data.ts');
