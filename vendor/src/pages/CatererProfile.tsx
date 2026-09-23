import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Users, Clock, ChefHat, ArrowLeft, Sparkles, Mail, Instagram, Globe } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TikTokIcon, TelegramIcon } from '@/components/social-icons';
import { getSocialLinks } from '@/lib/social';
import { useToast } from '@/hooks/use-toast';

const PRICE_LABELS: Record<string, string> = {
  '$': 'Budget Friendly',
  '$$': 'Moderate',
  '$$$': 'Premium',
  '$$$$': 'Luxury',
};
import { useCatererDetail } from '@/hooks/supabase/usePublicCaterers';

export default function CatererProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: detail, isLoading } = useCatererDetail(id);
  const socialLinks = useMemo(() => getSocialLinks(detail ?? null), [detail]);
  const websiteUrl = useMemo(() => {
    const raw = detail?.website ?? null;
    if (!raw?.trim()) return null;
    const v = raw.trim();
    return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  }, [detail]);
  // Map Supabase detail to the page's camelCase shape
  const caterer = detail
    ? {
        ...detail,
        coverImage: detail.cover_image ?? '',
        logoUrl: detail.logo_url ?? null,
        images: detail.images ?? [],
        priceRange: detail.price_range ?? '$',
        minGuests: detail.min_guests ?? 1,
        maxGuests: detail.max_guests ?? 100,
        reviewCount: detail.review_count ?? 0,
        cuisines: detail.cuisines ?? [],
        eventTypes: detail.event_types ?? [],
        specialties: detail.specialties ?? [],
        yearsInBusiness: detail.years_in_business ?? 0,
        longDescription: detail.long_description ?? '',
        isProfileComplete: Boolean(detail.location && detail.description),
        hasMenu: (detail.menuItems ?? []).length > 0,
        hasPackages: (detail.packages ?? []).length > 0,
      }
    : null;

  const menuItems = caterer?.menuItems || [];
  const packages = caterer?.packages || [];
  const reviews = caterer?.reviews || [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size={40} text="Loading caterer profile..." />
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

  const allImages = [caterer.coverImage, ...(caterer.images || [])].filter(Boolean);

  const menuCategories = [...new Set(menuItems.map((item) => item.category as string))];

  const handleContact = (kind: 'phone' | 'email' | 'website') => {
    const phone = (caterer as unknown as { contact_phone?: string | null })?.contact_phone;
    const email = (caterer as unknown as { contact_email?: string | null })?.contact_email;
    const website = (caterer as unknown as { website?: string | null })?.website;
    if (kind === 'phone' && phone) window.location.href = `tel:${phone}`;
    else if (kind === 'email' && email) window.location.href = `mailto:${email}`;
    else if (kind === 'website' && website) window.open(website.startsWith('http') ? website : `https://${website}`, '_blank');
    else toast({ title: 'No contact info', description: 'This vendor has not shared this contact yet.', variant: 'destructive' });
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
              {caterer.cuisines.map((cuisine: string) => (
                <Badge key={cuisine} variant="secondary" className="bg-background/90 backdrop-blur-sm">
                  {cuisine}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {(caterer as unknown as { logoUrl?: string | null }).logoUrl?.trim() ? (
                <img
                  src={(caterer as unknown as { logoUrl: string }).logoUrl.trim()}
                  alt={`${caterer.name} logo`}
                  className="h-14 w-14 rounded-full border-2 border-white/80 bg-white object-cover shadow-lg"
                />
              ) : null}
              <h1 className="font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                {caterer.name}
              </h1>
              {(caterer as unknown as { is_premium?: boolean | number | null }).is_premium ? (
                <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 border-none text-white shadow-lg text-sm px-3 py-1 mt-2">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Premium Vendor
                </Badge>
              ) : null}
            </div>
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
                <TabsTrigger value="packages">
                  Packages
                  {packages?.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {packages.length}
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
                      {caterer.specialties.map((specialty: string) => (
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
                      {caterer.eventTypes.map((event: string) => (
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
                    {menuCategories.map((category) => (
                      <div key={category}>
                        <h3 className="font-display text-lg font-semibold mb-4 border-b pb-2">
                          {category}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {menuItems
                            .filter((item) => item.category === category)
                            .map((item) => (
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
                                  {item.is_popular && (
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

              <TabsContent value="packages" className="mt-6">
                {packages.length === 0 ? (
                  <p className="text-muted-foreground">No packages listed yet.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {packages.map((pkg) => (
                      <Card key={pkg.id} className="overflow-hidden h-full flex flex-col">
                        {(pkg.images ?? [])[0] && (
                          <div className="aspect-video w-full overflow-hidden">
                            <img
                              src={(pkg.images ?? [])[0]}
                              alt={pkg.name}
                              className="h-full w-full object-cover transition-transform hover:scale-105"
                            />
                          </div>
                        )}
                        <CardContent className="p-4 flex-1 flex flex-col">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="font-semibold text-sm line-clamp-1">{pkg.name}</h4>
                            <span className="font-bold text-primary text-sm whitespace-nowrap">
                              ETB {pkg.price}
                            </span>
                          </div>
                          {pkg.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{pkg.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mb-2">
                            {pkg.min_guests ?? 1}–{pkg.max_guests ?? 100} guests
                          </p>
                          {(pkg.includes ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-auto">
                              {(pkg.includes ?? []).slice(0, 4).map((inc: string) => (
                                <Badge key={inc} variant="outline" className="text-[10px]">
                                  {inc}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
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
                    {reviews.map((review) => {
                      return (
                        <Card key={review.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold">{review.customer_name || 'Anonymous'}</p>
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

                {(!caterer.isProfileComplete || (!caterer.hasMenu && !caterer.hasPackages)) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <p className="font-semibold mb-1">Vendor setup incomplete:</p>
                    <p className="text-amber-700/80 mb-2">This vendor is still completing their profile.</p>
                    <ul className="list-disc list-inside space-y-1">
                      {!caterer.isProfileComplete && <li>Profile details (Location, Description, Guest limits, etc.) are incomplete</li>}
                      {!caterer.hasMenu && !caterer.hasPackages && <li>No menu items or packages listed yet</li>}
                    </ul>
                  </div>
                )}

                <Button className="w-full" size="lg" asChild>
                  <Link to={`/caterer/${caterer.id}/book`}>Book Now</Link>
                </Button>
                <Button variant="outline" className="w-full" size="lg" onClick={() => handleContact('phone')}>
                  Call Vendor
                </Button>
                <Button variant="outline" className="w-full" size="lg" onClick={() => handleContact('email')}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Vendor
                </Button>
                {(websiteUrl || socialLinks.length > 0) && (
                  <div className="border-t pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Follow & links
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {websiteUrl && (
                        <a
                          href={websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Vendor website"
                          title="Website"
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-white text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                      {socialLinks.map((link) => (
                        <a
                          key={link.platform}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Vendor ${link.label}`}
                          title={link.label}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-white text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          {link.platform === 'instagram' && <Instagram className="h-4 w-4" />}
                          {link.platform === 'tiktok' && <TikTokIcon className="h-4 w-4" />}
                          {link.platform === 'telegram' && <TelegramIcon className="h-4 w-4" />}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
