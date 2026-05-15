import { ProductForm } from '@/components/admin/product-form/ProductForm';

export const dynamic = 'force-dynamic';

export default function NewNavratnaPage() {
  return <ProductForm kind="navratna" mode="create" />;
}
