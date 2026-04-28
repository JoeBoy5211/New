import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Star, Users, Calendar, Award } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/MainLayout';
import { CatererCard } from '@/components/CatererCard';
import { useCaterers } from '@/hooks/useCaterers';

const testimonials = [
  {
    quote: "CaterConnect made finding the perfect caterer for our wedding absolutely seamless. The quality exceeded our expectations!",
    author: "Emily & James",
    event: "Wedding Reception",
    rating: 5,
  },
  {
    quote: "As an event planner, I rely on CaterConnect for all my corporate clients. The variety and professionalism is unmatched.",
    author: "Michael Chen",
    event: "Corporate Events",
    rating: 5,
  },
  {
    quote: "From the initial quote to the final bite, everything was perfect. Our anniversary dinner was unforgettable.",
    author: "The Johnsons",
    event: "Anniversary Celebration",
    rating: 5,
  },
];

const stats = [
  { value: '50+', label: 'Premium Caterers', icon: Award },
  { value: '500+', label: 'Events Served', icon: Calendar },
  { value: '100+', label: 'Happy Guests', icon: Users },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { caterers, isLoading } = useCaterers();
  const featuredCaterers = caterers.slice(0, 3);

  const handleSearch = () => {
    navigate(`/caterers${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(var(--burgundy-light))]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555244162-803834f70033?w=1920')] bg-cover bg-center opacity-10" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="animate-fade-in font-display text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
              Exceptional Catering for{' '}
              <span className="text-gradient-gold">Unforgettable</span> Events
            </h1>
            <p className="mt-6 animate-fade-in text-lg text-primary-foreground/80 [animation-delay:200ms]">
              Connect with premium caterers who transform your celebrations into
              culinary masterpieces. From intimate gatherings to grand galas.
            </p>

            <div className="mt-10 animate-fade-in [animation-delay:400ms]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by cuisine, location, or event type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="h-14 bg-background pl-12 text-base shadow-lg"
                  />
                </div>
                <Button size="lg" className="h-14 px-8" onClick={handleSearch}>
                  Find Caterers
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <stat.icon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Caterers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Featured Caterers
            </h2>
            <p className="mt-3 text-muted-foreground">
              Handpicked culinary artists ready to make your event extraordinary
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featuredCaterers.map((caterer, index) => (
              <div
                key={caterer.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CatererCard caterer={caterer} />
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/caterers">
                View All Caterers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Three simple steps to your perfect catering experience
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Browse & Discover',
                description: 'Explore our curated selection of premium caterers, filtered by cuisine, location, and event type.',
              },
              {
                step: '02',
                title: 'Request a Quote',
                description: 'Share your event details and receive personalized quotes from caterers who match your vision.',
              },
              {
                step: '03',
                title: 'Celebrate',
                description: 'Sit back and enjoy as your chosen caterer delivers an unforgettable culinary experience.',
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className="relative rounded-xl bg-background p-8 shadow-premium"
              >
                <span className="font-display text-5xl font-bold text-primary/10">
                  {item.step}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
                {index < 2 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 md:block">
                    <ArrowRight className="h-8 w-8 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              What Our Clients Say
            </h2>
            <p className="mt-3 text-muted-foreground">
              Trusted by thousands of happy hosts
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                  ))}
                </div>
                <blockquote className="mb-4 text-foreground">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-premium py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Ready to Create Something Special?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            Whether you're planning a wedding, corporate event, or intimate celebration,
            we'll help you find the perfect caterer.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/caterers">Browse Caterers</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/vendor/login">Become a Caterer</Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
