import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Home from "@/pages/Home";
import BrowseCaterers from "@/pages/BrowseCaterers";
import CatererProfile from "@/pages/CatererProfile";
import BookingForm from "@/pages/BookingForm";
import MyBookings from "@/pages/MyBookings";
import Login from "@/pages/Login";
import VendorLogin from "@/pages/vendor/Login";
import VendorPending from "@/pages/vendor/Pending";
import VendorDashboard from "@/pages/vendor/Dashboard";
import MenuItemForm from "@/pages/vendor/MenuItemForm";
import PackageForm from "@/pages/vendor/PackageForm";
import BookingDetails from "@/pages/vendor/BookingDetails";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors (client errors)
        const status = (error as { response?: { status?: number } } | null)?.response?.status;
        if (status !== undefined && status >= 400 && status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/caterers" element={<BrowseCaterers />} />
            <Route path="/caterer/:id" element={<CatererProfile />} />
            <Route path="/caterer/:id/book" element={<BookingForm />} />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />

            {/* Vendor Routes */}
            <Route path="/vendor/login" element={<VendorLogin />} />
            <Route
              path="/vendor/pending"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorPending />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/bookings/:bookingId"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <BookingDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/menu/new"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <MenuItemForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/menu/:itemId/edit"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <MenuItemForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/packages/new"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <PackageForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/packages/:packageId/edit"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <PackageForm />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
