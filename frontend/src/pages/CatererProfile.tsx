import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Users, Clock, ChefHat, ArrowLeft, Heart, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

const PRICE_LABELS: Record<string, string> = {
  '$': 'Budget Friendly',
  '$$': 'Moderate',
  '$$$': 'Premium',
  '$$$$': 'Luxury',
};
import { useCatererDetail } from '@/hooks/useCaterers';
import { useFavorites } from '@/hooks/useFavorites';

const ServiceImageCarousel = ({ images }: { images: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) return null;

  const next = () => setIndex((prev) => (prev + 1) % images.length);
  const prev = () => setIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative aspect-video w-full overflow-hidden bg-muted rounded-t-xl group cursor-pointer">
          <div 
            className="flex h-full w-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                className="h-full w-full object-cover shrink-0"
              />
            ))}
          </div>
          
          {images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                {index + 1} / {images.length}
              </div>
              {/* Progress Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1 bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
        <img src={images[index]} alt="" className="w-full h-auto max-h-[85vh] object-contain" />
      </DialogContent>
    </Dialog>
  );
};

export default function CatererProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const { caterer, isLoading } = useCatererDetail(id);
  const { toggleFavorite, isFavorited: checkIsFavorited } = useFavorites();

  useEffect(() => {
    if (id) {
      checkIsFavorited(id).then(setIsFavorite);
    }
  }, [id, checkIsFavorited]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size={40} text="Loading caterer profile..." />
        </div>
      </MainLayout>
    );
  }

  const menuItems = caterer?.menuItems || [];
  const reviews = caterer?.reviews || [];
  if (!caterer) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Caterer Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The caterer you're looking for doesn't exist or has been removed.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/caterers">Browse All Caterers</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const allImages = [caterer.coverImage, ...(caterer.images || [])].filter(Boolean);

  const menuCategories = [...new Set(menuItems.map((item: any) => item.category as string))];

  const handleRequestQuote = () => {
    if (isAuthenticated) {
      navigate(`/booking/${caterer.id}`);
    } else {
      navigate('/login', { state: { from: `/booking/${caterer.id}` } });
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src={allImages[selectedImage]}
          alt={caterer.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {(Array.isArray(caterer.cuisines) ? caterer.cuisines :
                (typeof caterer.cuisines === 'string' ? caterer.cuisines.split(',') : [])
              ).map((cuisine: string) => (
                <Badge key={cuisine} variant="secondary" className="bg-background/90 backdrop-blur-sm">
                  {cuisine}
                </Badge>
              ))}
            </div>
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {caterer.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-white/90">
              <span className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-gold text-gold" />
                <span className="font-semibold">{caterer.rating}</span>
                <span className="text-white/70">({caterer.reviewCount} reviews)</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {caterer.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {caterer.minGuests}-{caterer.maxGuests} guests
              </span>
              <Badge className="bg-primary/90">{PRICE_LABELS[caterer.priceRange] ?? caterer.priceRange}</Badge>
            </div>
          </div>
        </div>

        {/* Image Thumbnails */}
        {allImages.length > 1 && (
          <div className="absolute bottom-6 right-6 hidden md:flex gap-2">
            {allImages.slice(0, 4).map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${selectedImage === index
                  ? 'border-white'
                  : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
              >
                <img src={image} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="menu">Menu</TabsTrigger>
                <TabsTrigger value="services">
                  Services
                  {caterer.services?.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {caterer.services.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-xl font-semibold mb-3">About Us</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {caterer.longDescription}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-semibold mb-3">Our Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(caterer.specialties) ? caterer.specialties :
                        (typeof caterer.specialties === 'string' ? caterer.specialties.split(',') : [])
                      ).map((specialty: string) => (
                        <Badge key={specialty} variant="outline">
                          <ChefHat className="mr-1 h-3 w-3" />
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-semibold mb-3">Events We Cater</h3>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(caterer.eventTypes) ? caterer.eventTypes :
                        (typeof caterer.eventTypes === 'string' ? caterer.eventTypes.split(',') : [])
                      ).map((event: string) => (
                        <Badge key={event} variant="secondary">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardContent className="flex items-center gap-3 p-4">
                        <Clock className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Years in Business</p>
                          <p className="font-semibold">{caterer.yearsInBusiness} years</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="flex items-center gap-3 p-4">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Guest Capacity</p>
                          <p className="font-semibold">{caterer.minGuests} - {caterer.maxGuests}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="menu" className="mt-6">
                {menuItems.length === 0 ? (
                  <p className="text-muted-foreground">Menu coming soon...</p>
                ) : (
                  <div className="space-y-8">
                    {menuCategories.map((category: any) => (
                      <div key={category}>
                        <h3 className="font-display text-lg font-semibold mb-4 border-b pb-2">
                          {category}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {menuItems
                            .filter((item: any) => item.category === category)
                            .map((item: any) => (
                              <Card key={item.id} className="overflow-hidden h-full flex flex-col">
                                {item.image && (
                                  <div className="aspect-video w-full overflow-hidden">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-full w-full object-cover transition-transform hover:scale-105"
                                    />
                                  </div>
                                )}
                                <CardContent className="p-3 flex-1 flex flex-col">
                                  <div className="flex justify-between items-start gap-2 mb-1">
                                    <h4 className="font-semibold text-sm line-clamp-1">
                                      {item.name}
                                    </h4>
                                    <span className="font-bold text-primary text-sm whitespace-nowrap">
                                      ETB {item.price}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                    {item.description}
                                  </p>
                                  {item.isPopular && (
                                    <div className="mt-auto">
                                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider">
                                        Popular
                                      </Badge>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="services" className="mt-6">
                {!caterer.services || caterer.services.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="mx-auto h-10 w-10 mb-3 opacity-50" />
                    <p className="font-medium">No additional services listed</p>
                    <p className="text-sm mt-1">
                      This caterer focuses exclusively on catering.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {caterer.services.map((service: any) => (
                      <Card key={service.id} className="overflow-hidden border-none shadow-premium hover:shadow-xl transition-all duration-300">
                        {service.sample_images && service.sample_images.length > 0 && (
                          <ServiceImageCarousel images={service.sample_images} />
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            {service.service_name}
                          </CardTitle>
                        </CardHeader>
                        {service.description && (
                          <CardContent className="pt-0 pb-6">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {service.description}
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review: any) => {
                      return (
                        <Card key={review.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold">{review.customerName || 'Anonymous'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-0.5">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                                ))}
                              </div>
                            </div>
                            <p className="text-muted-foreground">{review.comment}</p>
                            {review.response && (
                              <div className="mt-4 rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium mb-1">Response from {caterer.name}</p>
                                <p className="text-sm text-muted-foreground">{review.response}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Quote Request Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-premium">
              <CardHeader>
                <CardTitle className="font-display">Request a Quote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ready to make your event unforgettable? Request a personalized quote from {caterer.name}.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Range</span>
                    <span className="font-medium">{PRICE_LABELS[caterer.priceRange] ?? caterer.priceRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min. Guests</span>
                    <span className="font-medium">{caterer.minGuests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max. Guests</span>
                    <span className="font-medium">{caterer.maxGuests}</span>
                  </div>
                </div>

                {(!caterer.isProfileComplete || !caterer.hasMenu) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <p className="font-semibold mb-1">Caterer setup incomplete:</p>
                    <p className="text-amber-700/80 mb-2">To ensure a high quality service, this vendor needs to complete their profile setup before taking bookings.</p>
                    <ul className="list-disc list-inside space-y-1">
                      {!caterer.isProfileComplete && <li>Profile details (Location, Description, Guest limits, etc.) are incomplete</li>}
                      {!caterer.hasMenu && <li>No menu items listed</li>}
                    </ul>
                    <p className="mt-2 font-bold">Booking will be enabled once requirements are met.</p>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRequestQuote}
                  disabled={!caterer.isProfileComplete || !caterer.hasMenu}
                >
                  Request Quote
                </Button>
                <Button
                  variant="outline"
                  className={`w-full ${isFavorite ? 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600' : ''}`}
                  size="lg"
                  onClick={async () => {
                    if (caterer?.id) {
                      const res = await toggleFavorite(caterer.id);
                      setIsFavorite(!!res);
                    }
                  }}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Favorited' : 'Save to Favorites'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
