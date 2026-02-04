import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";

// Pages
import AuthPage from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

// Franchise Pages
import FranchiseDashboard from "@/pages/franchise/Dashboard";
import StudentsPage from "@/pages/franchise/Students";
import InventoryPage from "@/pages/franchise/Inventory";
import SchedulePage from "@/pages/franchise/Schedule";
import PaymentsPage from "@/pages/franchise/Payments";
import TrainingPage from "@/pages/franchise/Training";
import SettingsPage from "@/pages/franchise/Settings";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminFranchisesPage from "@/pages/admin/Franchises";
import AdminProductsPage from "@/pages/admin/Products";
import AdminAnalyticsPage from "@/pages/admin/Analytics";
import AdminPaymentsPage from "@/pages/admin/Payments";
import AdminSettingsPage from "@/pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Auth Route */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Redirect root to auth */}
              <Route path="/" element={<Navigate to="/auth" replace />} />

              {/* Franchise Routes */}
              <Route element={<ProtectedRoute allowedRoles={['franchise_owner']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/franchise/dashboard" element={<FranchiseDashboard />} />
                  <Route path="/franchise/students" element={<StudentsPage />} />
                  <Route path="/franchise/inventory" element={<InventoryPage />} />
                  <Route path="/franchise/schedule" element={<SchedulePage />} />
                  <Route path="/franchise/payments" element={<PaymentsPage />} />
                  <Route path="/franchise/training" element={<TrainingPage />} />
                  <Route path="/franchise/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/franchises" element={<AdminFranchisesPage />} />
                  <Route path="/admin/products" element={<AdminProductsPage />} />
                  <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                  <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                  <Route path="/admin/settings" element={<AdminSettingsPage />} />
                </Route>
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
