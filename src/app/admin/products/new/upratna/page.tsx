import { ProductForm } from '@/components/admin/product-form/ProductForm';

export const dynamic = 'force-dynamic';

export default function NewUpratnaPage() {
  return <ProductForm kind="upratna" mode="create" />;
}
