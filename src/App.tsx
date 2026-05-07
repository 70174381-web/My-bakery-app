import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Shop from "./pages/Shop.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminOnboarding from "./pages/AdminOnboarding.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminReviews from "./pages/AdminReviews.tsx";
import AdminQuotes from "./pages/AdminQuotes.tsx";
import AdminPortal from "./pages/AdminPortal.tsx";
import Checkout from "./pages/Checkout.tsx";
import Customize from "./pages/Customize.tsx";
import QuoteLookup from "./pages/QuoteLookup.tsx";
import OrderStatus from "./pages/OrderStatus.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/customize" element={<Customize />} />
              <Route path="/my-quotes" element={<QuoteLookup />} />
              <Route path="/order-status" element={<OrderStatus />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/signup" element={<AdminLogin mode="signup" />} />
              <Route path="/admin/onboarding" element={<AdminOnboarding />} />
              <Route path="/admin" element={<AdminPortal />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reviews"
                element={
                  <ProtectedRoute>
                    <AdminReviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/quotes"
                element={
                  <ProtectedRoute>
                    <AdminQuotes />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
