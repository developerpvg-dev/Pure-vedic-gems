import fs from 'fs';
let code = fs.readFileSync('src/components/testimonials/TestimonialCard.tsx', 'utf8');
code = code.replace(
    '<div className={`relative aspect-[1.5] max-w-[800px] mx-auto flex items-center justify-center ${isExpanded ? "w-full" : "w-[110%] ml-[-5%] sm:w-full sm:ml-0"}`}>\n      <div className={`absolute inset-0 z-0 drop-shadow-md ${!isExpanded ? "scale-[1.03] sm:scale-100" : ""}`}>\n      {/* Background Image */}\n      <div className="absolute inset-0 z-0 drop-shadow-md">',
    '<div className={`relative aspect-[1.5] max-w-[800px] mx-auto flex items-center justify-center ${isExpanded ? "w-full" : "w-[110%] ml-[-5%] sm:w-full sm:ml-0 scale-[1.05] sm:scale-100 origin-center"}`}>\n      {/* Background Image */}\n      <div className="absolute inset-0 z-0 drop-shadow-md">'
);
fs.writeFileSync('src/components/testimonials/TestimonialCard.tsx', code);
console.log('Fixed card display jsx issue');
