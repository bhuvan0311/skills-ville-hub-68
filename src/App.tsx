import { lazy, Suspense } from "react";
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
const AuthPage = lazy(() => import("@/pages/Auth"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Franchise Pages
const FranchiseDashboard = lazy(() => import("@/pages/franchise/Dashboard"));
const StudentsPage = lazy(() => import("@/pages/franchise/Students"));
const InventoryPage = lazy(() => import("@/pages/franchise/Inventory"));
const SchedulePage = lazy(() => import("@/pages/franchise/Schedule"));
const PaymentsPage = lazy(() => import("@/pages/franchise/Payments"));
const TrainingPage = lazy(() => import("@/pages/franchise/Training"));
const SettingsPage = lazy(() => import("@/pages/franchise/Settings"));
const ReportsPage = lazy(() => import("@/pages/franchise/Reports"));
const BatchExamPage = lazy(() => import("@/pages/franchise/BatchExam"));
const TeachersPage = lazy(() => import("@/pages/franchise/Teachers"));

// Admin Pages
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminFranchisesPage = lazy(() => import("@/pages/admin/Franchises"));
const AdminProductsPage = lazy(() => import("@/pages/admin/Products"));
const AdminBroadcastsPage = lazy(() => import("@/pages/admin/Broadcasts"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/Analytics"));
const AdminPaymentsPage = lazy(() => import("@/pages/admin/Payments"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/Settings"));
const AdminCertificatesPage = lazy(() => import("@/pages/admin/Certificates"));
const ErpWorkspace = lazy(() => import("@/pages/erp/Workspace"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Suspense
              fallback={
                <div
                  className="min-h-screen flex items-center justify-center text-muted-foreground"
                  role="status"
                >
                  Loading workspace…
                </div>
              }
            >
              <Routes>
                {/* Auth Route */}
                <Route path="/auth" element={<AuthPage />} />

                {/* Redirect root to auth */}
                <Route path="/" element={<Navigate to="/auth" replace />} />

                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "super_admin",
                        "franchise_owner",
                        "teacher",
                        "receptionist",
                        "parent",
                      ]}
                    />
                  }
                >
                  <Route
                    path="/erp"
                    element={<Navigate to="/erp/overview" replace />}
                  />
                  <Route path="/erp/:module" element={<ErpWorkspace />} />
                </Route>

                {/* Franchise Routes */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={["franchise_owner"]} />
                  }
                >
                  <Route element={<DashboardLayout />}>
                    <Route
                      path="/franchise/dashboard"
                      element={<FranchiseDashboard />}
                    />
                    <Route
                      path="/franchise/students"
                      element={<StudentsPage />}
                    />
                    <Route
                      path="/franchise/inventory"
                      element={<InventoryPage />}
                    />
                    <Route
                      path="/franchise/schedule"
                      element={<SchedulePage />}
                    />
                    <Route
                      path="/franchise/payments"
                      element={<PaymentsPage />}
                    />
                    <Route
                      path="/franchise/teachers"
                      element={<TeachersPage />}
                    />
                    <Route
                      path="/franchise/training"
                      element={<TrainingPage />}
                    />
                    <Route
                      path="/franchise/reports"
                      element={<ReportsPage />}
                    />
                    <Route
                      path="/franchise/batches/:id/exam"
                      element={<BatchExamPage />}
                    />
                    <Route
                      path="/franchise/settings"
                      element={<SettingsPage />}
                    />
                  </Route>
                </Route>

                {/* Admin Routes */}
                <Route
                  element={<ProtectedRoute allowedRoles={["super_admin"]} />}
                >
                  <Route element={<DashboardLayout />}>
                    <Route
                      path="/admin/dashboard"
                      element={<AdminDashboard />}
                    />
                    <Route
                      path="/admin/franchises"
                      element={<AdminFranchisesPage />}
                    />
                    <Route
                      path="/admin/products"
                      element={<AdminProductsPage />}
                    />
                    <Route
                      path="/admin/broadcasts"
                      element={<AdminBroadcastsPage />}
                    />
                    <Route
                      path="/admin/certificates"
                      element={<AdminCertificatesPage />}
                    />
                    <Route
                      path="/admin/analytics"
                      element={<AdminAnalyticsPage />}
                    />
                    <Route
                      path="/admin/payments"
                      element={<AdminPaymentsPage />}
                    />
                    <Route
                      path="/admin/settings"
                      element={<AdminSettingsPage />}
                    />
                  </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
