import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { TransactionsProvider } from "@/context/TransactionsContext";
import Landing from "./pages/Landing";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TransactionsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/protection" element={<Protection />} />
            <Route path="/debt" element={<Debt />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route path="/dashboards" element={<Dashboards />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </TransactionsProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
