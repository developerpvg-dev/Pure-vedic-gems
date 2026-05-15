import { ProductForm } from '@/components/admin/product-form/ProductForm';

export const dynamic = 'force-dynamic';

export default function NewRudrakshaPage() {
  return <ProductForm kind="rudraksha" mode="create" />;
}
