import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CartDrawerProvider } from "@/contexts/CartDrawerContext";
import CartDrawer from "@/components/CartDrawer";
import { CatalogProvider } from "@/contexts/CatalogContext";
import Admin from "./pages/admin/Admin";
import OrdersBoard from "./pages/admin/OrdersBoard";
import SettingsPage from "./pages/admin/SettingsPage";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductPage from "./pages/ProductPage";
import Wishlist from "./pages/Wishlist";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound";
import TrackOrder from "./pages/TrackOrder";
import { ThemeProvider } from "next-themes";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="natural-theme">
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CatalogProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <CartDrawerProvider>
                <Toaster />
                <Sonner position="top-center" richColors />
                <BrowserRouter>
                  <CartDrawer />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/index" element={<Index />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductPage />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/track" element={<TrackOrder />} />
                    <Route path="/orders" element={<TrackOrder />} />
                    <Route path="/track/:code" element={<TrackOrder />} />
                    <Route path="/admin" element={<Admin />}>
                      <Route index element={<OrdersBoard />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                    <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </CartDrawerProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
      </CatalogProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
