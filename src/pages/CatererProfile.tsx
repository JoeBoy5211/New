import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Users, Clock, ChefHat, ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCatererById } from '@/hooks/useCaterers';
import { useMenuItemsByCaterer } from '@/hooks/useMenuItems';
import { useReviewsByCaterer } from '@/hooks/useReviews';
import { useAuth } from '@/context/AuthContext';

export default function CatererProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: caterer, isLoading: catererLoading } = useCatererById(id);
  const { data: menuItems = [] } = useMenuItemsByCaterer(id);
  const { data: reviews = [] } = useReviewsByCaterer(id);

  if (catererLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

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

  const allImages = [caterer.cover_image, ...caterer.images].filter(Boolean) as string[];

  const menuCategories = [...new Set(menuItems.map((item) => item.category).filter(Boolean))];

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
          src={allImages[selectedImage] || '/placeholder.svg'}
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
              {caterer.cuisines.map((cuisine) => (
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
                <span className="text-white/70">({caterer.review_count} reviews)</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {caterer.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {caterer.min_guests}-{caterer.max_guests} guests
              </span>
              <Badge className="bg-primary/90">{caterer.price_range}</Badge>
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
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-xl font-semibold mb-3">About Us</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {caterer.long_description || caterer.description}
                    </p>
                  </div>

                  {caterer.specialties.length > 0 && (
                    <div>
                      <h3 className="font-display text-lg font-semibold mb-3">Our Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {caterer.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline">
                            <ChefHat className="mr-1 h-3 w-3" />
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {caterer.event_types.length > 0 && (
                    <div>
                      <h3 className="font-display text-lg font-semibold mb-3">Events We Cater</h3>
                      <div className="flex flex-wrap gap-2">
                        {caterer.event_types.map((event) => (
                          <Badge key={event} variant="secondary">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardContent className="flex items-center gap-3 p-4">
                        <Clock className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Years in Business</p>
                          <p className="font-semibold">{caterer.years_in_business} years</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="flex items-center gap-3 p-4">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Guest Capacity</p>
                          <p className="font-semibold">{caterer.min_guests} - {caterer.max_guests}</p>
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
                    {menuCategories.map((category) => (
                      <div key={category}>
                        <h3 className="font-display text-lg font-semibold mb-4 border-b pb-2">
                          {category}
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {menuItems
                            .filter((item) => item.category === category)
                            .map((item) => (
                              <Card key={item.id}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold flex items-center gap-2">
                                        {item.name}
                                        {item.is_popular && (
                                          <Badge variant="secondary" className="text-xs">
                                            Popular
                                          </Badge>
                                        )}
                                      </h4>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {item.description}
                                      </p>
                                    </div>
                                    <span className="font-semibold text-primary">
                                      ${item.price}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold">Customer</p>
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
                    ))}
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
                    <span className="font-medium">{caterer.price_range}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min. Guests</span>
                    <span className="font-medium">{caterer.min_guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max. Guests</span>
                    <span className="font-medium">{caterer.max_guests}</span>
                  </div>
                </div>
                <Button className="w-full" size="lg" onClick={handleRequestQuote}>
                  Request Quote
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  <Heart className="mr-2 h-4 w-4" />
                  Save to Favorites
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
