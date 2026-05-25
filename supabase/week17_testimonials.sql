-- ============================================================================
-- Week 17: Testimonials migration and legacy testimonial seed data
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS testimonials (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(180) NOT NULL,
    slug              VARCHAR(220) UNIQUE NOT NULL,
    location          VARCHAR(180),
    rating            INTEGER CHECK (rating BETWEEN 1 AND 5) DEFAULT 5,
    title             VARCHAR(220),
    message           TEXT NOT NULL,
    proof_image_url   TEXT,
    proof_alt         VARCHAR(260),
    source_url        TEXT,
    status            VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('draft', 'approved', 'hidden')),
    is_active         BOOLEAN DEFAULT TRUE,
    show_on_homepage  BOOLEAN DEFAULT FALSE,
    sort_order        INTEGER DEFAULT 0,
    published_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_public ON testimonials(status, is_active, sort_order, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_homepage ON testimonials(show_on_homepage, status, is_active, sort_order);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads approved testimonials" ON testimonials;
CREATE POLICY "Public reads approved testimonials"
    ON testimonials FOR SELECT USING (status = 'approved' AND is_active = true);

DROP POLICY IF EXISTS "Admin manages testimonials" ON testimonials;
CREATE POLICY "Admin manages testimonials"
    ON testimonials FOR ALL USING (
        EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND is_active = true)
    );

WITH seed(slug, name, location, title, message, proof_image_url, source_url, sort_order, show_on_homepage, published_at) AS (
VALUES
-- ── Original 9 legacy testimonials (proof images self-hosted) ─────────────────
('shweta', 'Shweta', 'Sydney, Australia', 'Authentic gemstone guidance', $$It was great talking to Vikas, I found him very knowledgeable, and he helped me choose the right product. Pure Vedic Gems team equally is very very helpful, he always sorted out all my queries and was very responsive. I received the product on time and it is a wonderful piece of gem. One does not need to worry about product authenticity when buying from Pure Vedic Gems.$$, '/legacy/testimonials/shweta-proof.jpg', 'https://www.purevedicgems.com/testimonial/shweta/', 10, true, '2019-04-07'::timestamptz),
('m-bakeer', 'M Bakeer', 'Nepean, Canada', 'Energized custom ring', $$Right away as soon as I started my order I was contacted by Pure Vedic Gems team to make sure everything was set up perfectly for my ring to be made. They walked me through the whole process up to delivery. The stone was very good quality and well energized and I felt the difference as soon as I started wearing it. The craftsmanship of the ring was great as well. I am grateful to have found Pure Vedic Gems and I cannot wait to make my next purchase.$$, '/legacy/testimonials/m-bakeer-proof.jpg', 'https://www.purevedicgems.com/testimonial/m-bakeer/', 20, true, '2019-04-08'::timestamptz),
('nitin', 'Nitin', 'UK', 'Excellent service and secure delivery', $$Hi Vikasji, it is my pleasure to write feedback about the interaction that we had. I am very impressed with the quality of the gemstone, reasonable pricing, finishing, and perfection with which it is embedded into the ring. The overall services such as day to day interaction, resolving queries with quick responses, and delivery on time in secure packing were excellent. I would continue to use Pure Vedic Gems for future purchases and would highly recommend it to others.$$, '/legacy/testimonials/nitin-proof.jpg', 'https://www.purevedicgems.com/testimonial/nitin/', 30, true, '2019-08-01'::timestamptz),
('gurpreet-singh', 'Gurpreet Singh', 'Urban Estate, India', 'Trusted emerald purchase', $$A final destination when you are searching for pure unheated untreated Vedic gemstones. The very first day when I saw the website and videos of oceanic knowledge and an unsaid promise for pure ratna and consultation, I wished to meet Mr. Vikas. I bought Emerald from Pure Vedic Gems. It is really very nice quality as promised. The one trusted stop is Mr. Vikas, whose true and valuable guidance will surely make you go for a real stone, none other than Pure Vedic Gems.$$, '/legacy/testimonials/gurpreet-singh-proof.jpg', 'https://www.purevedicgems.com/testimonial/gurpreet-singh/', 40, false, '2021-04-22'::timestamptz),
('bibi-hazra', 'Bibi Hazra', 'Mauritius', 'High quality yellow sapphire and coral', $$I bought two gemstones, Yellow Sapphire and Red Coral, from Pure Vedic Gems and I am very pleased with the products and customer services. The gemstones were high quality and very beautiful. Pure Vedic Gems team was very helpful throughout the journey. They helped me from the purchase to delivery of the product. Thank you.$$, '/legacy/testimonials/bibi-hazra-proof.jpg', 'https://www.purevedicgems.com/testimonial/bibi-hazra/', 50, false, '2021-07-17'::timestamptz),
('tran-thi-yen-van', 'Tran Thi Yen Van', 'VietNam', 'Patient guidance and genuine products', $$Firstly, I want to give compliment to the website. By chance, I came to know the shop from the internet only. The design of the website attracted me a lot and gave useful knowledge about astrology and gemstones. I feel thankful to Mr. Vikas Ji and his staff for their understanding and support from A to Z. Whatever I did not understand, they guided me slowly and clearly. The products are very good and have given me positive results till now.$$, NULL, 'https://www.purevedicgems.com/testimonial/tran-thi-yen-van/', 60, true, '2017-11-08'::timestamptz),
('anagha', 'Anagha', 'Portland, U.S.A', 'Detailed astrological advice', $$As recommended by the astrologer, I purchased the gemstones. I must say that they have a unique role. After three months of wearing them, intuitively these have guided me in the right direction and given me a lot of strength in my convictions and getting beyond false sense of securities in life. I am grateful to Vikas Mehra Ji for his time, advice, and detailed and patient way of dealing with customers.$$, '/legacy/testimonials/anagha-proof.jpg', 'https://www.purevedicgems.com/testimonial/anagha/', 70, true, '2018-08-10'::timestamptz),
('sunil-kalwani', 'Sunil Kalwani', 'Los Angeles, U.S.A', 'Wonderful delivery and updates', $$The service was wonderful. Delivery and updates were very prompt and the pictures were incredibly appreciated. The ring itself has been fantastic. I wear it every day and can feel the effects of it. Very grateful to have found you and will recommend you to friends looking for gemstones and use your service for any of my own future needs.$$, '/legacy/testimonials/sunil-kalwani-proof.jpg', 'https://www.purevedicgems.com/testimonial/sunil-kalwani/', 80, false, '2018-11-30'::timestamptz),
('baljit-bains', 'Baljit Bains', 'South Australia', 'Full support for overseas clients', $$I bought two gemstones from Pure Vedic Gems. I was a bit confused because it was my first experience. Vikas Ji gave me valuable advice and the staff had lots of patience. Pure Vedic Gems team answered all my questions and helped me select the products. They helped me on every step of this process. I will highly recommend Pure Vedic Gems to any customers, especially overseas clients.$$, '/legacy/testimonials/baljit-bains-proof.jpg', 'https://www.purevedicgems.com/testimonial/baljit-bains/', 90, true, '2018-12-01'::timestamptz),
-- ── Additional testimonial from 2021 ─────────────────────────────────────────
('dhiraj-shrivastava', 'Dhiraj Shrivastava', 'Australia', 'Fourth purchase: top quality blue sapphire', $$This is my fourth gemstone purchase from Pure Vedic Gems team. This particular purchase of mine was a top quality blue sapphire from exclusive gems section. I am very happy with the quality of gemstone, ring design, overall customer service and prompt delivery. I strongly recommend to anyone who is looking for gemstones to reach out to Vikas jee and team for a genuine vedic quality gemstone with reasonable price and excellent customer service.$$, '/legacy/testimonials/dhiraj-shrivastava-proof.jpg', 'https://www.purevedicgems.com/testimonials/', 95, false, '2021-08-01'::timestamptz),
-- ── Recent testimonials 2024–2025 (proof images self-hosted) ─────────────────
('rajneesh', 'Rajneesh', 'Canada', 'Way above expectations', $$My personal experience with Pure Vedic Gems is way above expectations. My man, pure vedic gems along with his entire team very professional, thoughtful, and personable. It took me approximately 4 weeks from start to finish, which included help with choosing the right stone, design of the ring and writing this thank you note with immense pleasure, after wearing I would recommend them from the bottom of my heart. Thank you, Pure Vedic gems team along with Vikasjee, and the entire staff!! Take care of yourselves, and Godspeed!!!$$, '/legacy/testimonials/rajneesh-proof.jpg', 'https://www.purevedicgems.com/testimonials/', 100, false, '2024-06-01'::timestamptz),
('joycez', 'JoyceZ', 'USA', 'Love the Hessonite Ring!', $$Love the Hessonite Ring! Well made, beautiful authentic gemstone, clear, nicely cut and well made. Good customer service with Pure Vedic Gems Team. Fast shipping. Would definitely purchase again from Pure Vedic Gems. Thank you!$$, '/legacy/testimonials/joycez-proof.jpg', 'https://www.purevedicgems.com/testimonials/', 110, false, '2024-12-01'::timestamptz),
('vidhya', 'Vidhya', 'Bangalore, India', 'Good quality, much satisfied', $$Very good quality. Much satisfied. Friendly staff$$, '/legacy/testimonials/vidhya-proof.jpg', 'https://www.purevedicgems.com/testimonials/', 120, false, '2025-06-01'::timestamptz),
('harsh-yadav', 'Harsh Yadav', 'India', 'Authentic rudraksha and gems', $$Authentic rudraksha and gems. I attended the Praan pratishtha of my rudrakshas personally. Glad that I found Pure Vedic gems as it is difficult to find authentic rudraksha and gems.$$, '/legacy/testimonials/harsh-yadav-proof.jpg', 'https://www.purevedicgems.com/testimonials/', 130, false, '2025-06-01'::timestamptz),
('vijay-krishna-agrawal', 'Vijay Krishna Agrawal', 'India', 'Genuine and good product', $$Genuine and good product. Representative was very supportive and cooperative$$, '/legacy/testimonials/vijay-krishna-agrawal-proof.jpg', 'https://www.purevedicgems.com/testimonials/', 140, false, '2025-06-01'::timestamptz),
('dodik', 'Dodik', 'Sweden', 'Wonderful stones and ring designs', $$Great communication, wonderful choice of stones and ring designs, the ring looks gorgeous, the rudrakshis are amazing. We are very pleased and will absolutely be back again!$$, '/legacy/testimonials/dodik-proof.jpg', 'https://www.purevedicgems.com/testimonials/', 150, false, '2025-06-01'::timestamptz),
('ratish-kumar', 'Ratish Kumar', 'Chhattisgarh, India', 'Easy online purchase with excellent support', $$At first, I was apprehensive about purchasing gemstones online. But in the end, I received a link to a purevedic gem that made it very simple for the customer service representatives to choose the best quality rudraksha and emerald. They shared all of the pictures and videos of the stone and rudraksha on WhatsApp and helped me choose the design of the ring and measure my ring size correctly. I received a ring and rudraksha along with a real quality certificate in 4 to 5 days. Thanks to Purevedic gem and customer service staff$$, '/legacy/testimonials/ratish-kumar-proof.jpg', 'https://www.purevedicgems.com/testimonials/', 160, false, '2025-06-01'::timestamptz),
('aurobinda-das', 'Aurobinda Das', 'Odisha, India', 'Very good experience', $$Very good experience$$, '/legacy/testimonials/aurobinda-das-proof.jpg', 'https://www.purevedicgems.com/testimonials/', 170, false, '2025-06-01'::timestamptz),
('sreejith', 'Sreejith', 'Gulf', 'Fully energised and as per order', $$The product was fully energised and shipped as per order. Happy with the customer service and product$$, '/legacy/testimonials/sreejith-proof.jpg', 'https://www.purevedicgems.com/testimonials/', 180, false, '2025-06-01'::timestamptz),
('suchitra-bm', 'Suchitra B M', 'Belagavi, India', 'Best gemstones at reasonable price', $$Dear Vikas Mehra Sir, I would like to thank you very much for providing me with the best Gemstones at reasonable price. The quality is best for the price quoted. Best thing is the work of the kaarigar in the setting in stones in rings, amazingly beautiful work. I would also thank your team sir for the best support and services and the guidance provided by your team in analysing kundali and giving the best advice. I look to purchase more gems for my family members and by Gods grace will purchase soon. I am associated to purevedic gems since 2022 and they have gained my trust. Thank you once again for all the support and continue the good work. May God bless the team for their good work.$$, '/legacy/testimonials/suchitra-bm-proof.jpg', 'https://www.purevedicgems.com/testimonials/', 190, false, '2025-06-01'::timestamptz)
)
INSERT INTO testimonials (slug, name, location, rating, title, message, proof_image_url, proof_alt, source_url, status, is_active, show_on_homepage, sort_order, published_at)
SELECT slug, name, location, 5, title, message, proof_image_url,
    CASE WHEN proof_image_url IS NOT NULL THEN name || ' testimonial proof' ELSE NULL END,
    source_url, 'approved', true, show_on_homepage, sort_order, published_at
FROM seed
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    location = EXCLUDED.location,
    rating = EXCLUDED.rating,
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    proof_image_url = EXCLUDED.proof_image_url,
    proof_alt = EXCLUDED.proof_alt,
    source_url = EXCLUDED.source_url,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    show_on_homepage = EXCLUDED.show_on_homepage,
    sort_order = EXCLUDED.sort_order,
    published_at = EXCLUDED.published_at,
    updated_at = NOW();

COMMIT;