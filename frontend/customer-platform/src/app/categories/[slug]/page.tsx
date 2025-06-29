import { CategoryPage } from '@/features/categories/components/CategoryPage';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default function Category({ params }: CategoryPageProps) {
  return <CategoryPage categorySlug={params.slug} />;
}
