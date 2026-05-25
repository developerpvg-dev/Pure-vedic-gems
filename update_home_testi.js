const fs = require('fs');
let code = fs.readFileSync('src/components/home/PvgReferenceSections.tsx', 'utf8');

// Add import
if (!code.includes('HomeTestimonialSlider')) {
  code = code.replace("import { TestimonialCard } from '@/components/testimonials/TestimonialCard';", 
    "import { TestimonialCard } from '@/components/testimonials/TestimonialCard';\nimport { HomeTestimonialSlider } from '@/components/home/HomeTestimonialSlider';");
}


// Replacing the old testimonials section HTML
const newSection = `
  <section className="bg-[#faf8f4] relative overflow-hidden" id="testimonials" aria-labelledby="testi-heading">
    <div className="absolute top-0 left-[-20px] text-[420px] font-black leading-none text-[#7a1515] opacity-5 pointer-events-none select-none" aria-hidden="true">&ldquo;</div>

    <div className="pvg-testi-inner">
      <div className="section-head mb-8">
        <h2 className="section-title">What Our Clients Say</h2>
        <p className="navratna-subtitle">Real experiences from clients across 40+ countries who chose Jyotish-certified gems.</p>
        <div className="section-rule-center"></div>
      </div>

      <HomeTestimonialSlider testimonials={featuredTestimonials} />
    </div>
  </section>`;

const searchRegex = /<section className="bg-\[#faf8f4\].*?id="testimonials"[\s\S]*?<\/section>/m;
code = code.replace(searchRegex, newSection);

fs.writeFileSync('src/components/home/PvgReferenceSections.tsx', code);
console.log('Done!');