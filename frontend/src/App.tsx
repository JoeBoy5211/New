import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Home from "@/pages/Home";
import BrowseCaterers from "@/pages/BrowseCaterers";
import CatererProfile from "@/pages/CatererProfile";
import Login from "@/pages/Login";
import BookingForm from "@/pages/BookingForm";
import CustomerDashboard from "@/pages/customer/Dashboard";
import PaymentSuccess from "@/pages/customer/PaymentSuccess";
import VendorLogin from "@/pages/vendor/Login";
import VendorPending from "@/pages/vendor/Pending";
import VendorDashboard from "@/pages/vendor/Dashboard";
import SubscriptionSuccess from "@/pages/vendor/SubscriptionSuccess";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import NotFound from "@/pages/NotFound";
import PromotionsFeed from "@/pages/PromotionsFeed";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
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
            <Route path="/login" element={<Login />} />
            <Route path="/feed" element={<PromotionsFeed />} />

            {/* Customer Protected Routes */}
            <Route
              path="/booking/:catererId"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <BookingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/payment-success"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />

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
              path="/vendor/subscription-success"
              element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <SubscriptionSuccess />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
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
