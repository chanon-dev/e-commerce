import { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Layout from '@/components/Layout';
import Hero from '@/components/home/Hero';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import Categories from '@/components/home/Categories';
import Newsletter from '@/components/home/Newsletter';
import Testimonials from '@/components/home/Testimonials';

const HomePage: NextPage = () => {
  return (
    <>
      <NextSeo
        title="Home - E-commerce Store"
        description="Discover amazing products at unbeatable prices. Shop the latest trends in fashion, electronics, home & garden, and more."
        canonical="https://yourstore.com"
        openGraph={{
          type: 'website',
          locale: 'en_US',
          url: 'https://yourstore.com',
          siteName: 'E-commerce Store',
          title: 'E-commerce Store - Your One-Stop Shopping Destination',
          description: 'Discover amazing products at unbeatable prices. Shop the latest trends in fashion, electronics, home & garden, and more.',
          images: [
            {
              url: 'https://yourstore.com/og-image.jpg',
              width: 1200,
              height: 630,
              alt: 'E-commerce Store',
            },
          ],
        }}
        twitter={{
          handle: '@yourstore',
          site: '@yourstore',
          cardType: 'summary_large_image',
        }}
      />
      
      <Layout>
        <main className="min-h-screen">
          {/* Hero Section */}
          <Hero />
          
          {/* Featured Categories */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Shop by Category
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Explore our wide range of categories and find exactly what you're looking for
                </p>
              </div>
              <Categories />
            </div>
          </section>
          
          {/* Featured Products */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Featured Products
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Discover our handpicked selection of the best products
                </p>
              </div>
              <FeaturedProducts />
            </div>
          </section>
          
          {/* Testimonials */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  What Our Customers Say
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Don't just take our word for it - hear from our satisfied customers
                </p>
              </div>
              <Testimonials />
            </div>
          </section>
          
          {/* Newsletter */}
          <section className="py-16 bg-blue-600">
            <div className="container mx-auto px-4">
              <Newsletter />
            </div>
          </section>
        </main>
      </Layout>
    </>
  );
};

export default HomePage;
