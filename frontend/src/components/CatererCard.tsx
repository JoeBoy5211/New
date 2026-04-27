import { Link } from 'react-router-dom';
import { Star, MapPin, Users, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Caterer } from '@/data/mockData';
import { cn } from '@/lib/utils';

const PRICE_LABELS: Record<string, string> = {
  '$': 'Budget Friendly',
  '$$': 'Moderate',
  '$$$': 'Premium',
  '$$$$': 'Luxury',
};

interface CatererCardProps {
  caterer: Caterer;
  className?: string;
}

export function CatererCard({ caterer, className }: CatererCardProps) {
  return (
    <Link to={`/caterer/${caterer.id}`}>
      <Card className={cn(
        'group overflow-hidden transition-all duration-300 hover:shadow-card-hover',
        className
      )}>
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={caterer.coverImage}
            alt={caterer.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex flex-wrap gap-1.5">
              {caterer.cuisines.slice(0, 2).map((cuisine) => (
                <Badge
                  key={cuisine}
                  variant="secondary"
                  className="bg-background/90 text-xs backdrop-blur-sm"
                >
                  {cuisine}
                </Badge>
              ))}
            </div>
          </div>
          <div className="absolute right-3 top-3">
            <Badge className="bg-primary/90 backdrop-blur-sm">
              {PRICE_LABELS[caterer.priceRange] ?? caterer.priceRange}
            </Badge>
          </div>
        </div>

        <CardContent className="p-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1 w-full">
              <h3 className="font-display text-base font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-1">
                {caterer.name}
              </h3>
              {(caterer as any).is_premium === 1 && (
                <Badge variant="default" className="w-fit bg-gradient-to-r from-amber-500 to-yellow-400 border-none text-white text-[10px] px-1.5 py-0 h-4 font-bold shadow-sm">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span className="text-sm font-medium">{caterer.rating}</span>
              <span className="text-xs text-muted-foreground">
                ({caterer.reviewCount})
              </span>
            </div>
          </div>

          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
            {caterer.description}
          </p>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {caterer.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {caterer.minGuests}-{caterer.maxGuests}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
