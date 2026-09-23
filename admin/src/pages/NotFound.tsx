import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChefHat } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <ChefHat className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found</p>
      <Button asChild className="mt-6">
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}