'use client';
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";

interface Property {
  _id: string;
  title: string;
  description: string;
  images: Array<{ url: string }>;
  pricing: {
    rentPrice?: number;
    salePrice?: number;
    currency?: string;
  };
  listingType?: string;
  propertyType?: string;
  isFeatured?: boolean;
  createdAt: string;
}

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const carouselData = [
    {
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
      title: "Smart Living, Redefined",
      subtitle: "Experience luxury integrated with cutting-edge home automation."
    },
    {
      img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2047&auto=format&fit=crop",
      title: "Secure Your Future",
      subtitle: "Find properties with military-grade security and smart monitoring."
    },
    {
      img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
      title: "Eco-Friendly Spaces",
      subtitle: "Solar-powered smart homes designed for sustainable luxury."
    }
  ];

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [searchRes, featuredRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8080/api/properties/search?limit=12&sortBy=createdAt&sortOrder=desc`),
        axios.get(`http://127.0.0.1:8080/api/properties/featured`)
      ]);
      setProperties(searchRes.data.data.properties || searchRes.data.data || []);
      setFeaturedProperties(featuredRes.data.data || []);
    } catch (err: any) {
      console.error("Failed to load properties", err);
      if (err.message === "Network Error") {
        setError("Our servers are currently unreachable. Please check your connection or try again later.");
      } else {
        setError("Something went wrong while loading the platform. Please refresh the page.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselData.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const spotlightProperty = featuredProperties[0] || properties[0];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section / Dynamic Carousel */}
      <section className="relative h-[85vh] overflow-hidden">
        {carouselData.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${i === carouselIndex ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-110 translate-x-full'}`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.img})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

            <div className="relative z-10 flex flex-col items-start justify-center h-full max-w-7xl mx-auto px-6 md:px-12 text-white">
              <div className="overflow-hidden">
                <h1 className={`text-4xl md:text-6xl lg:text-8xl font-black mb-4 md:mb-6 uppercase tracking-tighter ${i === carouselIndex ? 'animate-slideUp' : ''}`}>
                  {slide.title.split(' ').map((word, idx) => (
                    <span key={idx} className={idx === 1 ? "text-primary italic" : ""}>{word} </span>
                  ))}
                </h1>
              </div>
              <p className={`text-lg md:text-xl lg:text-2xl mb-8 md:mb-10 max-w-xl font-medium opacity-90 leading-relaxed ${i === carouselIndex ? 'animate-fadeIn delay-500' : ''}`}>
                {slide.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
                <Link href="/properties" className="bg-primary hover:bg-white hover:text-primary text-white px-8 py-3 md:px-10 md:py-4 rounded-full font-black text-sm md:text-lg transition-all shadow-2xl hover:shadow-primary/40 transform hover:-translate-y-1 text-center w-full sm:w-auto">
                  START EXPLORING
                </Link>
                <Link href="/register" className="glass-morphism text-white border-2 border-white/30 hover:bg-white/10 px-8 py-3 md:px-10 md:py-4 rounded-full font-black text-sm md:text-lg transition-all backdrop-blur-md text-center w-full sm:w-auto">
                  JOIN COMMUNITY
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {carouselData.map((_, i) => (
            <button
              key={i}
              onClick={() => setCarouselIndex(i)}
              className={`h-1.5 transition-all duration-500 rounded-full ${i === carouselIndex ? 'w-12 bg-primary' : 'w-4 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      </section>

      {/* Stats Spotlight */}
      <section className="py-12 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
          <div><p className="text-3xl md:text-4xl font-black text-primary">500+</p><p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 mt-2">Smart Units</p></div>
          <div><p className="text-3xl md:text-4xl font-black text-primary">12k+</p><p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 mt-2">Happy Tenants</p></div>
          <div><p className="text-3xl md:text-4xl font-black text-primary">99%</p><p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 mt-2">Security Rate</p></div>
          <div><p className="text-3xl md:text-4xl font-black text-primary">24h</p><p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400 mt-2">Smart Support</p></div>
        </div>
      </section>

      {/* Spotlight Canvas */}
      {spotlightProperty && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              <div className="w-full lg:w-3/5 group relative overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)]">
                <img
                  src={spotlightProperty.images?.[0]?.url || carouselData[0].img}
                  alt="Spotlight"
                  className="w-full h-[300px] sm:h-[400px] lg:h-[600px] object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 lg:top-8 lg:left-8 bg-white/90 backdrop-blur-md px-4 py-2 lg:px-6 lg:py-2 rounded-full shadow-xl">
                  <span className="text-xs lg:text-sm font-black text-primary uppercase tracking-widest">Featured Listing</span>
                </div>
              </div>
              <div className="w-full lg:w-2/5 flex flex-col items-start">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 lg:mb-6 leading-tight uppercase tracking-tighter">
                  Experience The<br /><span className="text-primary italic">Elite Standard</span>
                </h2>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-3 lg:mb-4">{spotlightProperty.title}</h3>
                <p className="text-base lg:text-lg text-gray-500 mb-8 lg:mb-10 leading-relaxed font-medium">
                  {spotlightProperty.description ? (spotlightProperty.description.substring(0, 180) + '...') : "Discover an exceptional living experience perfectly maintained with smart home features."}
                </p>
                <div className="flex flex-col gap-6 w-full">
                  <div className="flex flex-col sm:flex-row gap-4 border-b border-gray-100 pb-6">
                    <div className="bg-gray-50 p-4 rounded-2xl flex-1 text-center">
                      <p className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase mb-1">Price</p>
                      <p className="text-lg lg:text-xl font-black text-gray-900">{spotlightProperty.pricing.currency === 'NGN' ? '₦' : '$'}{spotlightProperty.pricing.rentPrice?.toLocaleString() || spotlightProperty.pricing.salePrice?.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl flex-1 text-center">
                      <p className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase mb-1">Type</p>
                      <p className="text-lg lg:text-xl font-black text-gray-900 uppercase tracking-tighter">{spotlightProperty.listingType?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <Link href={`/properties/${spotlightProperty._id}`} className="group inline-flex items-center gap-4 text-xl font-black text-gray-900 hover:text-primary transition-colors">
                    EXPLORE THIS PROPERTY
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white transition-transform group-hover:rotate-45">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Popular Houses Section */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-4 md:gap-6">
            <div>
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] md:text-sm">Our Portfolio</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mt-2 md:mt-4 tracking-tighter uppercase">Recently <br className="hidden sm:block"/> <span className="text-primary italic">Handpicked</span></h2>
            </div>
            <p className="text-gray-500 max-w-sm font-medium text-base md:text-lg leading-relaxed">
              Discover the latest additions to our exclusive smart home collective, vetted for quality and innovation.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/50 backdrop-blur-sm h-[400px] rounded-[2rem] animate-pulse border border-white" />
              ))}
            </div>
          ) : error ? (
            <div className="col-span-full py-24 bg-red-50/50 rounded-[3rem] text-center border border-red-100 backdrop-blur-sm">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Connection Interrupted</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">{error}</p>
              <button
                onClick={() => fetchAllData()}
                className="bg-gray-900 text-white hover:bg-red-600 px-10 py-4 rounded-full font-black tracking-widest transition-all shadow-xl shadow-red-200"
              >
                TRY AGAIN
              </button>
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.length > 0 ? (
                properties.slice(0, 8).map((property) => (
                  <PropertyCard key={property._id} property={property} />
                ))
              ) : (
                <div className="col-span-full py-20 bg-white rounded-[2rem] text-center shadow-sm border border-gray-100">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">No active listings currently</h3>
                  <p className="text-gray-500 mt-2">Become the first to list a property in this exclusive cycle.</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-20 text-center">
            <Link href="/properties" className="inline-flex items-center gap-4 bg-gray-900 text-white hover:bg-primary px-12 py-5 rounded-full font-black tracking-widest transition-all shadow-xl shadow-gray-200">
              VIEW FULL COLLECTION
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials - Crimson Theme */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-primary rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 lg:p-24 relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-white/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-10 md:mb-16 text-center uppercase tracking-tighter">Voices Of Our <span className="text-white/40 italic">Community</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {[
                  { text: "SmartHome made finding my apartment so easy. The technology integration is seamless!", author: "Sarah Johnson", role: "Resident" },
                  { text: "As a vendor, listing properties here has doubled my inquiries. Highly professional platform.", author: "Marcus Thompson", role: "Real Estate Agent" },
                  { text: "The crimson design is beautiful and the user experience is unlike any other app in Nigeria.", author: "Bello Ahmed", role: "Property Owner" }
                ].map((t, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-lg p-6 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 flex flex-col justify-between hover:bg-white/15 transition-all">
                    <p className="text-white text-base md:text-lg lg:text-xl font-medium leading-relaxed mb-6 md:mb-8 italic">"{t.text}"</p>
                    <div className="flex items-center gap-3 md:gap-4 border-t border-white/10 pt-4 md:pt-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-white text-primary rounded-xl md:rounded-2xl flex items-center justify-center font-bold shadow-lg shrink-0">
                        {t.author.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-white tracking-tight">{t.author}</h4>
                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - High End */}
      <footer className="bg-black text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
          <div className="md:col-span-2">
            <h3 className="text-4xl font-black text-primary mb-8 tracking-tighter uppercase italic">SMARTHOME</h3>
            <p className="text-xl text-gray-500 max-w-sm font-medium leading-relaxed">
              We're orchestrating the future of living. Premium properties, military-grade security, and autonomous home control for the digital age.
            </p>
            <div className="flex gap-4 mt-8">
              {['FB', 'TW', 'IG', 'LI'].map(s => (
                <div key={s} className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center hover:bg-primary transition-colors cursor-pointer text-xs font-black">{s}</div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-black mb-8 uppercase text-xs tracking-[0.3em] text-gray-600">Explore</h4>
            <ul className="space-y-4 text-gray-400 font-bold">
              <li><Link href="/properties" className="hover:text-primary transition-colors">COLLECTION</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">DASHBOARD</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">ACCOUNT</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">JOIN US</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black mb-8 uppercase text-xs tracking-[0.3em] text-gray-600">Connect</h4>
            <ul className="space-y-4 text-gray-400 font-bold">
              <li>Lagos, Nigeria</li>
              <li>+234 800 SMARTHOME</li>
              <li>info@smarthome.ng</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-600 font-bold text-xs tracking-widest">© {new Date().getFullYear()} SMARTHOME ELITE SERIES</p>
          <div className="flex gap-8 text-gray-600 font-bold text-xs tracking-widest">
            <span className="hover:text-primary cursor-pointer">PRIVACY</span>
            <span className="hover:text-primary cursor-pointer">TERMS</span>
            <span className="hover:text-primary cursor-pointer">SECURITY</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
