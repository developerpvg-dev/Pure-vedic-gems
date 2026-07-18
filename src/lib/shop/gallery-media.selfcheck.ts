import { buildProductGalleryImages } from './gallery-media';

const photos = ['https://cdn.example/ruby.jpg'];
const cert = 'https://cdn.example/lab-report.png';
const merged = buildProductGalleryImages(photos, cert);
if (merged.length !== 2 || merged[1] !== cert) throw new Error('cert should append');
if (buildProductGalleryImages(photos, 'https://youtu.be/abc').length !== 1) {
  throw new Error('video cert url must not append');
}
if (buildProductGalleryImages(photos, 'https://cdn.example/report.pdf').length !== 1) {
  throw new Error('pdf cert must not append');
}
console.log('gallery-media self-check ok');
