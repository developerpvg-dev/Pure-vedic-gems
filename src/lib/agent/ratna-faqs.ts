/** Client-approved Ratna FAQs (Oct 2026). Loaded into agent_knowledge by POST /api/agent/knowledge/seed. */
export const RATNA_FAQS: Array<{ q: string; en: string; hi: string }> = [
  // Certification & authenticity
  {
    q: 'Are your gemstones certified?',
    en: 'Yes, gemstones are provided with certification from a recognized gemological laboratory where applicable. The certificate generally includes important details such as gemstone identification, weight, measurements, and treatment information. We recommend reviewing the certificate carefully before purchasing so you know exactly what you are buying.',
    hi: 'हाँ, जहाँ लागू हो वहाँ रत्नों के साथ मान्यता प्राप्त जेमोलॉजिकल लैब का प्रमाणपत्र दिया जाता है। इसमें रत्न की पहचान, वजन, माप और किसी भी ट्रीटमेंट से जुड़ी महत्वपूर्ण जानकारी शामिल हो सकती है। खरीदने से पहले प्रमाणपत्र को ध्यान से देखना अच्छा रहता है, ताकि आपको रत्न की सही जानकारी मिल सके।',
  },
  {
    q: 'How can I verify that a gemstone is genuine?',
    en: 'A genuine gemstone should be supported by reliable identification and appropriate gemological documentation. You can compare the gemstone’s weight, measurements, variety, and treatment details with the accompanying certificate. If you need additional confirmation, you may also consult an independent qualified gemologist.',
    hi: 'किसी रत्न की असलियत जानने के लिए उसकी सही जेमोलॉजिकल पहचान और प्रमाणपत्र देखना महत्वपूर्ण है। रत्न का वजन, माप, प्रकार और ट्रीटमेंट से जुड़ी जानकारी प्रमाणपत्र से मिलाकर देखें। यदि आपको अतिरिक्त पुष्टि चाहिए, तो किसी स्वतंत्र और योग्य जेमोलॉजिस्ट से भी रत्न की जाँच करवा सकते हैं।',
  },
  {
    q: 'Do you sell natural gemstones?',
    en: 'We offer natural gemstones and provide available information about their characteristics and treatment status. Because natural gemstones form in nature, they may contain inclusions, color variations, or other internal features. These natural characteristics do not automatically mean that the gemstone is defective or of poor quality.',
    hi: 'हम प्राकृतिक रत्न उपलब्ध कराते हैं और उनकी विशेषताओं तथा ट्रीटमेंट से जुड़ी उपलब्ध जानकारी स्पष्ट रूप से बताते हैं। प्राकृतिक रूप से बनने के कारण रत्नों में छोटे इन्क्लूजन, रंग में हल्का अंतर या अंदरूनी प्राकृतिक निशान हो सकते हैं। ऐसे निशान होना अपने-आप में रत्न के नकली या खराब होने का संकेत नहीं है।',
  },
  {
    q: 'Can I see the gemstone certificate before buying?',
    en: 'Where available, you can review the gemstone certificate and product details before you buy. The certificate may include important information such as gemstone identification, weight, measurements, and treatment details. Reviewing these details can help you make a more informed and confident buying decision.',
    hi: 'हाँ, जहाँ उपलब्ध हो, खरीदने से पहले आप रत्न का प्रमाणपत्र और उसकी जानकारी देख सकते हैं। प्रमाणपत्र में रत्न की पहचान, वजन, माप और किसी भी ट्रीटमेंट से जुड़ी महत्वपूर्ण जानकारी दी जा सकती है। इन विवरणों को पहले देखकर आप अधिक जानकारी के साथ और भरोसे से अपना निर्णय ले सकते हैं।',
  },
  {
    q: 'What is the difference between treated and untreated gemstones?',
    en: 'Untreated gemstones retain their natural characteristics without artificial enhancement, while treated gemstones may undergo processes intended to improve their colour or clarity. A treated gemstone is not necessarily fake, but the treatment should be disclosed. Treatment can also affect the gemstone’s value, care requirements, and buyer preference.',
    hi: 'बिना ट्रीटमेंट वाले रत्न अपनी प्राकृतिक अवस्था और विशेषताओं के साथ रहते हैं, जबकि ट्रीटेड रत्नों पर रंग या स्पष्टता बेहतर करने के लिए कुछ प्रक्रियाएँ की जा सकती हैं। ट्रीटेड होने का अर्थ यह नहीं है कि रत्न नकली है, लेकिन इसकी जानकारी स्पष्ट होनी चाहिए। ट्रीटमेंट रत्न की कीमत, देखभाल और उपयोग की पसंद को भी प्रभावित कर सकता है।',
  },
  {
    q: 'Can I use a treated gemstone for astrology?',
    en: 'Astrological preferences regarding treated gemstones vary across traditions and practitioners. Many Vedic astrology practitioners prefer natural and untreated or minimally treated gemstones for astrological use. If you are buying a gemstone specifically for astrology, review its treatment details and consult a qualified astrologer before making your decision.',
    hi: 'ज्योतिषीय उपयोग में ट्रीटेड रत्नों को लेकर अलग-अलग परंपराओं और विशेषज्ञों की अलग राय हो सकती है। वैदिक ज्योतिष में कई विशेषज्ञ प्राकृतिक और बिना ट्रीटमेंट या कम से कम ट्रीटमेंट वाले रत्नों को प्राथमिकता देते हैं। यदि आप रत्न ज्योतिषीय उद्देश्य से खरीद रहे हैं, तो उसकी ट्रीटमेंट जानकारी देखकर योग्य ज्योतिषी से सलाह लेना बेहतर है।',
  },
  {
    q: 'What information is mentioned on a gemstone certificate?',
    en: 'A gemstone certificate may include details such as gemstone species, variety, weight, dimensions, color, transparency, and treatment observations. The exact information can differ depending on the gemological laboratory issuing the report. Always compare the certificate details with the gemstone you receive.',
    hi: 'रत्न के प्रमाणपत्र में उसकी प्रजाति, प्रकार, वजन, माप, रंग, पारदर्शिता और ट्रीटमेंट से जुड़ी जानकारी दी जा सकती है। अलग-अलग जेमोलॉजिकल लैब की रिपोर्ट का प्रारूप थोड़ा अलग हो सकता है। रत्न मिलने के बाद उसके मुख्य विवरण प्रमाणपत्र में दी गई जानकारी से जरूर मिलाकर देखें।',
  },
  {
    q: 'Are all natural gemstones flawless?',
    en: 'No. Natural gemstones commonly contain inclusions, internal features, or minor surface characteristics that developed during their formation. These features can be completely natural and do not automatically indicate poor quality. Exceptionally clean or nearly flawless natural gemstones are generally rarer and may be more valuable.',
    hi: 'नहीं। प्राकृतिक रत्नों में छोटे इन्क्लूजन, अंदरूनी रेखाएँ या अन्य प्राकृतिक निशान मिलना सामान्य बात है, क्योंकि ये रत्न बनने की प्राकृतिक प्रक्रिया का हिस्सा होते हैं। ऐसे निशान हमेशा खराब गुणवत्ता का संकेत नहीं होते। बहुत साफ या लगभग बिना इन्क्लूजन वाले प्राकृतिक रत्न अपेक्षाकृत दुर्लभ हो सकते हैं।',
  },

  // Gemstone selection & astrology
  {
    q: 'How do I choose the right gemstone for myself?',
    en: 'The right gemstone depends on your purpose, budget, personal preference, and how you intend to use it. For astrological purposes, factors such as birth details and horoscope analysis may also be considered. For jewellery or collection, focus on color, clarity, durability, size, treatment status, and overall appearance.',
    hi: 'आपके लिए सही रत्न का चुनाव आपके उद्देश्य, बजट, पसंद और उपयोग पर निर्भर करता है। यदि रत्न ज्योतिषीय उद्देश्य से लेना है, तो जन्म विवरण और कुंडली का विश्लेषण भी महत्वपूर्ण हो सकता है। ज्वेलरी या कलेक्शन के लिए रंग, स्पष्टता, मजबूती, आकार, ट्रीटमेंट और रत्न की समग्र सुंदरता को ध्यान में रखें।',
  },
  {
    q: 'Can one gemstone work the same way for everyone?',
    en: 'Not necessarily. Astrological gemstone recommendations are generally personalized, and a gemstone considered suitable for one person may not be recommended for another. Individual birth details, horoscope factors, and the purpose of wearing the gemstone may all influence the recommendation.',
    hi: 'जरूरी नहीं। ज्योतिषीय रत्नों की सलाह सामान्यतः व्यक्ति की कुंडली और जन्म विवरण के आधार पर दी जाती है। जो रत्न एक व्यक्ति के लिए उपयुक्त माना जाए, वही दूसरे व्यक्ति के लिए भी सही हो यह आवश्यक नहीं है। इसलिए व्यक्तिगत ज्योतिषीय सलाह के लिए अपनी कुंडली का उचित विश्लेषण करवाना बेहतर है।',
  },
  {
    q: 'Do gemstones need energization before wearing?',
    en: 'In many Vedic traditions, gemstones are cleansed and energized before being worn for astrological purposes. The exact process can vary depending on the gemstone, tradition, and practitioner. If you wish to follow a specific Vedic method, consult a trusted astrologer or priest for the appropriate procedure.',
    hi: 'कई वैदिक परंपराओं में ज्योतिषीय उद्देश्य से रत्न पहनने से पहले उसका शुद्धिकरण और ऊर्जाकरण किया जाता है। इसकी विधि रत्न, परंपरा और ज्योतिषीय मान्यता के अनुसार अलग हो सकती है। यदि आप किसी विशेष वैदिक विधि का पालन करना चाहते हैं, तो योग्य ज्योतिषी या पंडित से सही प्रक्रिया पूछ सकते हैं।',
  },
  {
    q: 'How should I energize a gemstone?',
    en: 'Gemstone energization may involve cleansing, prayer, mantra chanting, or other traditional rituals. There is no single method followed by every astrologer or tradition. If the gemstone is being worn for a specific astrological purpose, follow the method recommended by a qualified practitioner familiar with your tradition.',
    hi: 'रत्न को ऊर्जित करने की प्रक्रिया में शुद्धिकरण, पूजा, मंत्र-जप या अन्य पारंपरिक विधियाँ शामिल हो सकती हैं। सभी परंपराओं और ज्योतिषियों की विधि एक जैसी नहीं होती। यदि आप किसी विशेष ज्योतिषीय उद्देश्य से रत्न पहन रहे हैं, तो अपनी परंपरा के अनुसार योग्य विशेषज्ञ द्वारा बताई गई विधि अपनाना बेहतर है।',
  },
  {
    q: 'What is the best day to wear a gemstone?',
    en: 'In Vedic astrology, different gemstones are traditionally associated with particular planets, days, and sometimes specific timings. However, the ideal day and time may also depend on your horoscope and the reason for wearing the gemstone. For personalized guidance, consult a qualified astrologer.',
    hi: 'वैदिक ज्योतिष में अलग-अलग रत्नों को विशेष ग्रहों, दिनों और कभी-कभी विशेष समय से जोड़ा जाता है। लेकिन रत्न पहनने का सही दिन और समय आपकी कुंडली और रत्न पहनने के उद्देश्य पर भी निर्भर कर सकता है। व्यक्तिगत सलाह के लिए योग्य ज्योतिषी से मार्गदर्शन लेना बेहतर है।',
  },
  {
    q: 'Which finger should I wear my gemstone ring on?',
    en: 'The traditionally recommended finger depends on the gemstone and the astrological system being followed. Personal horoscope factors can also influence how a gemstone is advised to be worn. If you are wearing the ring specifically for Vedic astrology, confirm the correct finger with a qualified astrologer.',
    hi: 'रत्न की अंगूठी किस उंगली में पहननी चाहिए, यह रत्न और अपनाई जा रही ज्योतिषीय परंपरा पर निर्भर करता है। आपकी व्यक्तिगत कुंडली के अनुसार भी सलाह अलग हो सकती है। यदि आप रत्न विशेष रूप से वैदिक ज्योतिष के लिए पहन रहे हैं, तो सही उंगली के बारे में योग्य ज्योतिषी से पुष्टि जरूर करें।',
  },
  {
    q: 'Can I wear more than one gemstone together?',
    en: 'Some gemstone combinations are traditionally considered compatible, while others may require careful consideration in Vedic astrology. Compatibility can depend on your horoscope, planetary factors, and the reason you are wearing each gemstone. It is advisable to consult a qualified astrologer before combining multiple astrological gemstones.',
    hi: 'कुछ रत्नों के संयोजन को परंपरागत रूप से अनुकूल माना जाता है, जबकि कुछ रत्नों को साथ पहनने से पहले सावधानी की सलाह दी जाती है। यह आपकी कुंडली, ग्रहों की स्थिति और रत्न पहनने के उद्देश्य पर निर्भर कर सकता है। कई ज्योतिषीय रत्न एक साथ पहनने से पहले योग्य ज्योतिषी से सलाह लेना बेहतर है।',
  },

  // Care & maintenance
  {
    q: 'How should I clean my gemstone?',
    en: 'Many gemstones can be gently cleaned with mild soap, lukewarm water, and a soft cloth, but every gemstone has different care requirements. Some stones may be sensitive to heat, chemicals, steam, or ultrasonic cleaners. If you are unsure, ask a qualified jeweller before using any advanced cleaning method.',
    hi: 'कई रत्नों को हल्के साबुन, गुनगुने पानी और मुलायम कपड़े से धीरे-धीरे साफ किया जा सकता है, लेकिन हर रत्न की देखभाल अलग होती है। कुछ रत्न गर्मी, केमिकल, स्टीम या अल्ट्रासोनिक क्लीनर से प्रभावित हो सकते हैं। यदि आपको सही सफाई विधि का पता न हो, तो पहले किसी योग्य ज्वेलर से सलाह लें।',
  },
  {
    q: 'Can I wear my gemstone while bathing?',
    en: 'It depends on the gemstone, its treatment, and the jewellery setting. Repeated exposure to soap, shampoo, chemicals, or water may affect certain gemstones or metals over time. As a general precaution, removing gemstone jewellery before bathing can help protect its appearance and setting.',
    hi: 'यह रत्न, उसके ट्रीटमेंट और ज्वेलरी की सेटिंग पर निर्भर करता है। साबुन, शैम्पू, केमिकल और बार-बार पानी के संपर्क से कुछ रत्नों या धातुओं पर समय के साथ असर पड़ सकता है। सामान्य सावधानी के तौर पर नहाने से पहले रत्न की ज्वेलरी उतारना बेहतर रहता है।',
  },
  {
    q: 'Can I wear my gemstone while sleeping?',
    en: 'You may wear some gemstone jewellery while sleeping, but it is generally safer to remove delicate rings, pendants, or settings before bed. Pressure, friction, or accidental impact can loosen a setting or damage the jewellery. Removing it can help protect both the gemstone and the mounting.',
    hi: 'कुछ लोग रत्न की ज्वेलरी पहनकर सोते हैं, लेकिन नाजुक अंगूठी, पेंडेंट या सेटिंग वाली ज्वेलरी को सोने से पहले उतारना अधिक सुरक्षित रहता है। दबाव, रगड़ या अचानक टकराने से सेटिंग ढीली हो सकती है। ज्वेलरी उतारने से रत्न और उसकी सेटिंग दोनों सुरक्षित रहती हैं।',
  },
  {
    q: 'Can sunlight damage gemstones?',
    en: 'Some gemstones can be affected by prolonged exposure to strong sunlight or heat. Their color may fade, change, or become less attractive over time, and certain treatments may also be sensitive to heat. Unless you know the gemstone is stable, avoid leaving it in strong direct sunlight for long periods.',
    hi: 'कुछ रत्नों पर लंबे समय तक तेज धूप या अधिक गर्मी का असर पड़ सकता है। उनका रंग हल्का पड़ सकता है, बदल सकता है या उनकी सुंदरता प्रभावित हो सकती है। कुछ ट्रीटमेंट भी गर्मी के प्रति संवेदनशील होते हैं, इसलिए बिना सही जानकारी के रत्न को लंबे समय तक सीधी तेज धूप में न रखें।',
  },
  {
    q: 'How should I store my gemstone jewellery?',
    en: 'Keep gemstone jewellery separately in a soft pouch or a lined jewellery box to reduce the risk of scratches. Harder gemstones can scratch softer stones if they are stored together. It is also best to keep jewellery away from excessive moisture, heat, perfumes, household chemicals, and harsh cleaning products.',
    hi: 'रत्नों की ज्वेलरी को खरोंच से बचाने के लिए अलग-अलग मुलायम पाउच या लाइनिंग वाले ज्वेलरी बॉक्स में रखें। कठोर रत्न साथ रखने पर नरम रत्नों पर खरोंच आ सकती है। ज्वेलरी को अधिक नमी, गर्मी, परफ्यूम, घरेलू केमिकल और तेज क्लीनिंग प्रोडक्ट्स से दूर रखना भी अच्छा रहता है।',
  },
  {
    q: 'What should I do if my gemstone gets scratched or damaged?',
    en: 'Avoid trying to polish, repair, or reset a damaged gemstone at home. Take it to a qualified jeweller or gemstone professional who can inspect both the stone and its setting. Depending on the damage, professional polishing, repolishing, resetting, or another suitable repair may be recommended.',
    hi: 'यदि रत्न पर खरोंच आ जाए या वह क्षतिग्रस्त हो जाए, तो उसे घर पर पॉलिश या ठीक करने की कोशिश न करें। किसी योग्य ज्वेलर या जेमस्टोन विशेषज्ञ से रत्न और उसकी सेटिंग की जाँच करवाएँ। नुकसान के अनुसार प्रोफेशनल पॉलिशिंग, री-पॉलिशिंग या री-सेटिंग की जरूरत हो सकती है।',
  },

  // Product information
  {
    q: 'Will my gemstone look exactly like the website photos?',
    en: 'Natural gemstones can appear slightly different depending on lighting, camera settings, screen display, and viewing angle. Their color, inclusions, transparency, and tone may look different under natural and artificial light. Review all available photos, videos, product details, and certification information before making your purchase.',
    hi: 'प्राकृतिक रत्न अलग-अलग रोशनी, कैमरा सेटिंग, स्क्रीन और देखने के कोण के अनुसार थोड़ा अलग दिखाई दे सकते हैं। प्राकृतिक और कृत्रिम रोशनी में उनका रंग, पारदर्शिता या इन्क्लूजन अलग नजर आ सकते हैं। खरीदने से पहले उपलब्ध फोटो, वीडियो, प्रोडक्ट विवरण और प्रमाणपत्र की जानकारी ध्यान से देखना बेहतर है।',
  },
  {
    q: 'Can I request additional photos or videos before buying?',
    en: 'Additional photos or videos may be available for selected gemstones depending on the product and stock status. Videos can be useful for understanding the gemstone’s color, transparency, inclusions, and overall appearance under different lighting. Please contact the support team to check what additional visuals are available.',
    hi: 'कुछ रत्नों के लिए उपलब्धता के अनुसार अतिरिक्त फोटो या वीडियो दिए जा सकते हैं। वीडियो की मदद से आप रत्न का रंग, पारदर्शिता, प्राकृतिक इन्क्लूजन और अलग-अलग रोशनी में उसका वास्तविक रूप बेहतर समझ सकते हैं। अधिक फोटो या वीडियो चाहिए हों, तो हमारी सपोर्ट टीम से संपर्क कर सकते हैं।',
  },
  {
    q: 'How is gemstone weight measured?',
    en: 'Gemstone weight is generally measured in carats. One carat is equal to 0.2 grams, while the metal weight of jewellery is usually measured separately in grams. Two gemstones with the same carat weight can still appear different in size because gemstone density and cutting proportions vary.',
    hi: 'रत्न का वजन सामान्यतः कैरेट में मापा जाता है। एक कैरेट 0.2 ग्राम के बराबर होता है, जबकि ज्वेलरी में इस्तेमाल होने वाली धातु का वजन अलग से ग्राम में मापा जा सकता है। समान कैरेट वजन वाले दो रत्न भी उनकी घनत्व और कट के कारण आकार में अलग दिखाई दे सकते हैं।',
  },
  {
    q: 'Can I choose a gemstone based only on carat weight?',
    en: 'Carat weight is important, but it should not be the only factor in your decision. A gemstone’s color, clarity, cut, treatment status, durability, origin information, and overall appearance may also affect its quality and value. Choose a gemstone that balances your purpose, preference, and budget.',
    hi: 'कैरेट वजन महत्वपूर्ण है, लेकिन केवल वजन देखकर रत्न चुनना सही नहीं है। रत्न का रंग, स्पष्टता, कट, ट्रीटमेंट, मजबूती, उपलब्ध उत्पत्ति की जानकारी और समग्र सुंदरता भी उसकी गुणवत्ता और मूल्य को प्रभावित कर सकती है। अपने उद्देश्य, पसंद और बजट को ध्यान में रखकर संतुलित चुनाव करें।',
  },
  {
    q: 'Do you provide gemstone recommendations?',
    en: 'Yes, guidance can be provided based on your purpose, gemstone preference, budget, and available product options. If you need an astrological recommendation, accurate birth details and proper horoscope analysis may be required. Any recommendation should be viewed as guidance and not as a guarantee of specific results.',
    hi: 'हाँ, आपकी जरूरत, बजट, पसंद और उपलब्ध रत्नों के आधार पर सही विकल्प चुनने में मार्गदर्शन दिया जा सकता है। यदि आपको ज्योतिषीय सलाह चाहिए, तो सही जन्म विवरण और कुंडली का विश्लेषण आवश्यक हो सकता है। किसी भी रत्न की सलाह को मार्गदर्शन के रूप में लें, निश्चित परिणाम की गारंटी के रूप में नहीं।',
  },

  // Shipping & delivery
  {
    q: 'How long does shipping take?',
    en: 'Shipping time depends on product availability, destination, customization requirements, and the courier service used. A ready loose gemstone may usually be dispatched sooner than custom-made jewellery that requires additional production work. Please check the estimated dispatch and delivery timeline when placing your order.',
    hi: 'शिपिंग का समय रत्न की उपलब्धता, डिलीवरी स्थान, कस्टमाइजेशन और कूरियर सेवा पर निर्भर करता है। तैयार लूज रत्न आमतौर पर कस्टम-मेड ज्वेलरी की तुलना में जल्दी भेजा जा सकता है, क्योंकि कस्टम ज्वेलरी को बनाने में अतिरिक्त समय लगता है। ऑर्डर करते समय अनुमानित डिस्पैच और डिलीवरी समय जरूर देख लें।',
  },
  {
    q: 'Do you offer international shipping?',
    en: 'International shipping may be available depending on the destination and applicable shipping regulations. Customs duties, import taxes, clearance charges, and other local requirements can differ from country to country. Please confirm shipping availability and applicable charges for your destination before placing an international order.',
    hi: 'गंतव्य देश और वहाँ के नियमों के अनुसार अंतरराष्ट्रीय शिपिंग उपलब्ध हो सकती है। कस्टम ड्यूटी, इंपोर्ट टैक्स, क्लीयरेंस शुल्क और अन्य स्थानीय नियम हर देश में अलग हो सकते हैं। अंतरराष्ट्रीय ऑर्डर करने से पहले अपने देश के लिए शिपिंग उपलब्धता और लागू शुल्क की पुष्टि जरूर करें।',
  },
  {
    q: 'Can I track my order?',
    en: 'Tracking information is generally provided after the order has been dispatched, depending on the courier and shipping method selected. You can use the tracking details to follow the shipment’s progress. If tracking is unavailable or has not updated for some time, contact customer support for assistance.',
    hi: 'ऑर्डर डिस्पैच होने के बाद कूरियर और शिपिंग विधि के अनुसार ट्रैकिंग जानकारी उपलब्ध कराई जा सकती है। दिए गए ट्रैकिंग नंबर से आप अपने पार्सल की स्थिति देख सकते हैं। यदि ट्रैकिंग अपडेट न हो रही हो या आपको ऑर्डर की स्थिति समझने में परेशानी हो, तो कस्टमर सपोर्ट से संपर्क करें।',
  },
  {
    q: 'Is my gemstone safely packaged?',
    en: 'Gemstones and jewellery should be packed securely to reduce movement and the risk of damage during transit. Packaging may vary depending on whether you purchase a loose gemstone, ring, pendant, or another jewellery item. When the parcel arrives, inspect the outer package and product carefully before disposing of the packaging.',
    hi: 'रत्न और ज्वेलरी को ट्रांजिट के दौरान हिलने या क्षतिग्रस्त होने के जोखिम को कम करने के लिए सुरक्षित तरीके से पैक किया जाना चाहिए। लूज रत्न, अंगूठी, पेंडेंट या अन्य ज्वेलरी के अनुसार पैकिंग अलग हो सकती है। पार्सल मिलने पर बाहरी पैकिंग और प्रोडक्ट दोनों को ध्यान से जांचें और तुरंत पैकिंग न फेंकें।',
  },

  // Returns, exchange & cancellation
  {
    q: 'Can I return a gemstone if I change my mind?',
    en: 'Return eligibility depends on the applicable return policy, product condition, customization status, and reason for return. Custom-made, resized, engraved, or otherwise modified products may have different return conditions. Please review the return policy carefully before purchasing and contact customer support if you need clarification.',
    hi: 'रत्न वापस करने की पात्रता लागू रिटर्न पॉलिसी, प्रोडक्ट की स्थिति, कस्टमाइजेशन और रिटर्न के कारण पर निर्भर करती है। कस्टम-मेड, साइज बदली हुई, उत्कीर्ण या अन्य तरीके से बदली गई ज्वेलरी पर अलग नियम हो सकते हैं। खरीदने से पहले रिटर्न पॉलिसी जरूर पढ़ें और किसी भी संदेह में कस्टमर सपोर्ट से संपर्क करें।',
  },
  {
    q: 'What if I receive a damaged or incorrect product?',
    en: 'If you receive a damaged, incorrect, or visibly different product, contact customer support as soon as possible. Share your order details along with clear photos or videos showing the issue, and keep the original packaging safely. The support team can then guide you according to the applicable replacement or return policy.',
    hi: 'यदि आपको क्षतिग्रस्त, गलत या ऑर्डर से अलग प्रोडक्ट मिलता है, तो जल्द से जल्द कस्टमर सपोर्ट से संपर्क करें। समस्या दिखाने वाली साफ फोटो या वीडियो के साथ ऑर्डर की जानकारी साझा करें और मूल पैकिंग सुरक्षित रखें। इसके बाद टीम लागू रिटर्न या रिप्लेसमेंट पॉलिसी के अनुसार आपकी सहायता करेगी।',
  },
  {
    q: 'Can I exchange my gemstone for another one?',
    en: 'Exchange eligibility depends on the product, its condition, customization, certification documents, and the applicable exchange policy. The gemstone may need to be returned in its original eligible condition along with relevant documents and packaging. Contact customer support to confirm whether your specific order qualifies for an exchange.',
    hi: 'रत्न का एक्सचेंज प्रोडक्ट, उसकी स्थिति, कस्टमाइजेशन, प्रमाणपत्र और लागू एक्सचेंज पॉलिसी पर निर्भर करता है। रत्न को आवश्यक मूल स्थिति में, संबंधित दस्तावेजों और पैकिंग के साथ वापस करना पड़ सकता है। अपने ऑर्डर पर एक्सचेंज उपलब्ध है या नहीं, इसकी पुष्टि कस्टमर सपोर्ट से जरूर करें।',
  },
  {
    q: 'Will I get the same gemstone shown in the product listing?',
    en: 'This depends on how the product is listed. If the listing is for an individual one-of-a-kind gemstone, the exact stone shown may be the stone supplied, subject to availability. If it is a general category listing, a gemstone matching the stated specifications may be provided instead.',
    hi: 'यह प्रोडक्ट लिस्टिंग के प्रकार पर निर्भर करता है। यदि वेबसाइट पर किसी एक यूनिक रत्न की व्यक्तिगत लिस्टिंग है, तो उपलब्धता के अनुसार वही दिखाया गया रत्न दिया जा सकता है। यदि लिस्टिंग किसी सामान्य कैटेगरी की है, तो बताए गए स्पेसिफिकेशन से मेल खाता समान रत्न दिया जा सकता है।',
  },
  {
    q: 'Can I cancel my order?',
    en: 'Order cancellation may be possible before dispatch or before customization work begins, depending on the order status and applicable policy. Once a gemstone has been resized, customized, mounted into jewellery, or shipped, cancellation may be restricted. Contact customer support as soon as possible if you wish to cancel.',
    hi: 'ऑर्डर की स्थिति और लागू पॉलिसी के अनुसार डिस्पैच या कस्टमाइजेशन शुरू होने से पहले कैंसिलेशन संभव हो सकता है। रत्न का साइज बदलने, उसे कस्टमाइज करने, ज्वेलरी में सेट करने या शिप होने के बाद कैंसिलेशन सीमित हो सकता है। ऑर्डर कैंसिल करना हो तो जल्द से जल्द कस्टमर सपोर्ट से संपर्क करें।',
  },

  // Customization, jewellery & support
  {
    q: 'Can you make a custom gemstone ring or pendant?',
    en: 'Custom jewellery options may be available depending on the gemstone, preferred design, metal, ring size, and production feasibility. A custom order may require additional time for design approval, gemstone setting, and manufacturing. Share your requirements with the support team to understand the available customization options.',
    hi: 'रत्न, पसंदीदा डिजाइन, धातु, रिंग साइज और निर्माण की संभावना के अनुसार कस्टम अंगूठी या पेंडेंट बनवाने का विकल्प उपलब्ध हो सकता है। कस्टम ज्वेलरी में डिजाइन अप्रूवल, रत्न सेटिंग और निर्माण के लिए अतिरिक्त समय लग सकता है। अपनी जरूरत टीम के साथ साझा करके उपलब्ध विकल्पों की जानकारी लें।',
  },
  {
    q: 'What metal should I choose for my gemstone?',
    en: 'The right metal depends on the jewellery design, durability, budget, personal preference, and intended use. Gold, silver, platinum, and other suitable alloys may be used depending on the design. For astrological jewellery, traditional recommendations regarding metal can vary, so consult a qualified astrologer if needed.',
    hi: 'सही धातु का चुनाव ज्वेलरी डिजाइन, मजबूती, बजट, व्यक्तिगत पसंद और उपयोग पर निर्भर करता है। डिजाइन के अनुसार सोना, चांदी, प्लेटिनम या अन्य उपयुक्त धातुओं का उपयोग किया जा सकता है। यदि रत्न ज्योतिषीय उद्देश्य से पहनना है, तो धातु के बारे में योग्य ज्योतिषी से सलाह लेना बेहतर है।',
  },
  {
    q: 'Can a gemstone lose its color or shine over time?',
    en: 'Yes, some gemstones can lose shine or change in appearance because of scratches, chemicals, dirt, heat, sunlight, or improper cleaning. Treated gemstones may require additional care depending on the treatment used. Proper storage, gentle cleaning, and periodic professional inspection can help maintain the gemstone’s appearance.',
    hi: 'हाँ, कुछ रत्नों की चमक समय के साथ खरोंच, धूल, केमिकल, तेज गर्मी, धूप या गलत सफाई के कारण कम हो सकती है। कुछ ट्रीटेड रत्नों को अतिरिक्त देखभाल की जरूरत होती है। सही तरीके से रखने, हल्की सफाई करने और समय-समय पर ज्वेलर से जांच करवाने से रत्न की सुंदरता बनाए रखने में मदद मिलती है।',
  },
  {
    q: 'Are gemstone benefits guaranteed?',
    en: 'No specific astrological, spiritual, financial, health, or personal result can be guaranteed by wearing a gemstone. Gemstone use in astrology is based on traditional beliefs and practices, and individual experiences can differ. Gemstones should never be considered a substitute for qualified medical, financial, legal, or other professional advice.',
    hi: 'किसी भी रत्न को पहनने से ज्योतिषीय, आध्यात्मिक, आर्थिक, स्वास्थ्य या व्यक्तिगत परिणाम की गारंटी नहीं दी जा सकती। ज्योतिष में रत्नों का उपयोग पारंपरिक मान्यताओं और प्रथाओं पर आधारित है, और हर व्यक्ति का अनुभव अलग हो सकता है। रत्न को मेडिकल, वित्तीय, कानूनी या किसी अन्य विशेषज्ञ सलाह का विकल्प नहीं मानना चाहिए।',
  },
  {
    q: 'How can I contact customer support for gemstone guidance?',
    en: 'You can contact our customer support team through the communication options available on the website. To receive more relevant guidance, share the gemstone you are considering, your purpose, approximate budget, and any specific concerns you have. For personalized astrological advice, additional birth details may be required.',
    hi: 'आप वेबसाइट पर उपलब्ध संपर्क माध्यमों से हमारी कस्टमर सपोर्ट टीम से जुड़ सकते हैं। बेहतर मार्गदर्शन के लिए जिस रत्न में आपकी रुचि है, खरीदने का उद्देश्य, लगभग बजट और अपने सवाल स्पष्ट रूप से बताएं। यदि आपको व्यक्तिगत ज्योतिषीय सलाह चाहिए, तो जन्म विवरण जैसी अतिरिक्त जानकारी की आवश्यकता हो सकती है।',
  },
];
