import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export default function About() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      <Navbar />

      <main className="py-16 px-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <img
              src="/images/about.png"
              alt="About Camellia"
              className="w-full rounded-lg shadow-lg object-cover h-96"
            />
          </div>

          <section className="mb-16">
            <h1 className="text-5xl font-bold mb-8 font-serif text-center">About Camellia</h1>

            <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
              <p>
                Camellia is your gateway to Sri Lanka's most exquisite tea plantations and the rich heritage of Ceylon tea tourism. We believe that experiencing tea is not just about tasting a beverage, but immersing yourself in centuries of tradition, culture, and natural beauty.
              </p>

              <p>
                Our mission is to connect travelers and tea enthusiasts with authentic tea estate experiences across Sri Lanka's premier tea-growing regions. From the misty highlands of Nuwara Eliya to the lush valleys of Ella, we guide you through the journey of Ceylon tea from leaf to cup.
              </p>

              <p>
                With over a decade of experience in tea tourism, Camellia has established trusted partnerships with family-owned plantations, local guides, and hospitality experts who are passionate about sharing the authentic Ceylon tea experience. We are committed to sustainable practices and supporting local communities while providing world-class service to our guests.
              </p>

              <p>
                Every experience with Camellia is carefully curated to give you an unforgettable journey through Sri Lanka's tea country. Whether you're a seasoned tea connoisseur or a curious traveler, we invite you to discover the magic of Ceylon tea with us.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
