import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, userRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    let loginPath = '/login';
    if (location.pathname.startsWith('/vendor')) {
      loginPath = '/vendor/login';
    } else if (location.pathname.startsWith('/admin')) {
      loginPath = '/admin/login';
    }

    return <Navigate to={redirectTo || loginPath} state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    switch (userRole) {
      case 'customer':
        return <Navigate to="/customer/dashboard" replace />;
      case 'vendor':
        return <Navigate to="/vendor/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Vendor approval (pending/suspended) is enforced inside
  // VendorPending / VendorDashboard via useVendorCaterer, not here.
  return <>{children}</>;
}

export function withRoleGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: UserRole[]
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}
