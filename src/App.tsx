import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/create-work" element={<Layout><div>Crear Trabajo - Próximamente</div></Layout>} />
          <Route path="/works" element={<Layout><div>Trabajos - Próximamente</div></Layout>} />
          <Route path="/clients" element={<Layout><div>Clientes - Próximamente</div></Layout>} />
          <Route path="/categories" element={<Layout><div>Categorías - Próximamente</div></Layout>} />
          <Route path="/calendar" element={<Layout><div>Calendario - Próximamente</div></Layout>} />
          <Route path="/users" element={<Layout><div>Usuarios - Próximamente</div></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;