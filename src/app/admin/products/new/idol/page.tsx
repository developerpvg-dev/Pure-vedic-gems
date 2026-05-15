import { ProductForm } from '@/components/admin/product-form/ProductForm';

export const dynamic = 'force-dynamic';

export default function NewIdolPage() {
  return <ProductForm kind="idol" mode="create" />;
}
