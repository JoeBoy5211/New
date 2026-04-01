import { Link } from 'react-router-dom';
import { ChefHat, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <ChefHat className="h-8 w-8 text-primary" />
              <span className="font-display text-xl font-semibold text-primary">
                CaterConnect
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Connecting you with premium catering services for every occasion. 
              From intimate gatherings to grand celebrations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/caterers" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Browse Caterers
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/vendor/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Become a Caterer
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Event Types */}
          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">
              Events We Serve
            </h3>
            <ul className="space-y-2">
              <li className="text-sm text-muted-foreground">Weddings</li>
              <li className="text-sm text-muted-foreground">Corporate Events</li>
              <li className="text-sm text-muted-foreground">Private Parties</li>
              <li className="text-sm text-muted-foreground">Galas & Fundraisers</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                hello@caterconnect.com
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                (555) 123-4567
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Nationwide Service
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CaterConnect. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
