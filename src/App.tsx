import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Clients from "./pages/Clients";
import Categories from "./pages/Categories";
import Works from "./pages/Works";
import CreateWork from "./pages/CreateWork";
import CalendarPage from "./pages/CalendarPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/create-work" element={<Layout><CreateWork /></Layout>} />
            <Route path="/works" element={<Layout><Works /></Layout>} />
            <Route path="/clients" element={<Layout><Clients /></Layout>} />
            <Route path="/categories" element={<Layout><Categories /></Layout>} />
            <Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />
            
            <Route path="/users" element={<Layout><div>Usuarios - Próximamente</div></Layout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;