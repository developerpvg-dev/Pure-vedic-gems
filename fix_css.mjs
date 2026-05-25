import fs from 'fs';
let code = fs.readFileSync('src/app/home.css', 'utf8');

code = code.replace(
`#testimonials {
  padding-top: 80px;
  padding-bottom: 80px;
}`,
`#testimonials {
  padding-top: 40px;
  padding-bottom: 30px;
}
@media (min-width: 768px) {
  #testimonials {
    padding-top: 80px;
    padding-bottom: 60px;
  }
}`
);

fs.writeFileSync('src/app/home.css', code);
console.log('CSS fixed padding-bottom');
