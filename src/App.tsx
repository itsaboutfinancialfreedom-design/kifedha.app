import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { TransactionsProvider } from "@/context/TransactionsContext";
import { RequireAuth } from "@/components/RequireAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Tracker from "./pages/Tracker";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Budget from "./pages/Budget";
import Protection from "./pages/Protection";
import Debt from "./pages/Debt";
import Advisor from "./pages/Advisor";
import Dashboards from "./pages/Dashboards";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Learn from "./pages/Learn";
import Upgrade from "./pages/Upgrade";
import UpgradeSuccess from "./pages/UpgradeSuccess";
import IncomeAllocatorPage from "./pages/IncomeAllocator";
import RiskProfile from "./pages/RiskProfile";
import ProtectionCalculator from "./pages/ProtectionCalculator";
import DebtPlanner from "./pages/DebtPlanner";
import NotificationSettings from "./pages/NotificationSettings";
import MpesaSetup from "./pages/MpesaSetup";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import Pricing from "./pages/Pricing";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { PastDueBanner } from "@/components/PastDueBanner";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const guarded = (el: JSX.Element) => <RequireAuth>{el}</RequireAuth>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TransactionsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <PaymentTestModeBanner />
              <PastDueBanner />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/refund" element={<RefundPolicy />} />
                <Route path="/tools/income-allocator" element={<IncomeAllocatorPage />} />
                <Route
                  path="/onboarding"
                  element={
                    <RequireAuth requireOnboarded={false}>
                      <Onboarding />
                    </RequireAuth>
                  }
                />
                <Route path="/tracker" element={guarded(<Tracker />)} />
                <Route path="/dashboard" element={guarded(<Dashboard />)} />
                <Route path="/goals" element={guarded(<Goals />)} />
                <Route path="/budget" element={guarded(<Budget />)} />
                <Route path="/protection" element={guarded(<Protection />)} />
                <Route path="/debt" element={guarded(<Debt />)} />
                <Route path="/advisor" element={guarded(<Advisor />)} />
                <Route path="/dashboards" element={guarded(<Dashboards />)} />
                <Route path="/settings" element={guarded(<Settings />)} />
                <Route path="/reports" element={guarded(<Reports />)} />
                <Route path="/learn" element={guarded(<Learn />)} />
                <Route path="/advisor/upgrade" element={guarded(<Upgrade />)} />
                <Route path="/advisor/success" element={guarded(<UpgradeSuccess />)} />
                <Route path="/assessment/risk-profile" element={guarded(<RiskProfile />)} />
                <Route path="/tools/protection-calculator" element={<ProtectionCalculator />} />
                <Route path="/tools/debt-planner" element={guarded(<DebtPlanner />)} />
                <Route path="/debt-planner" element={guarded(<DebtPlanner />)} />
                <Route path="/protection-gap" element={guarded(<ProtectionCalculator />)} />

                <Route path="/settings/notifications" element={guarded(<NotificationSettings />)} />
                <Route path="/settings/mpesa" element={guarded(<MpesaSetup />)} />

              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </TransactionsProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
