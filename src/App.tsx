import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EditWork from "./pages/EditWork"; // Importar el componente EditWork desde la ruta correcta
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Clients from "./pages/Clients";
import Categories from "./pages/Categories";
import Works from "./pages/Works";
import CreateWork from "./pages/CreateWork";
import CalendarPage from "./pages/CalendarPage";
import WorkDetail from "./pages/WorkDetail";
import WorkshopInfo from "./pages/WorkshopInfo"; // Import the new component
import Users from "./pages/Users";
import Reports from "./pages/Reports"; // Importar el componente Reports
import MessageTemplates from "./pages/MessageTemplates";

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
            <Route path="/works/:workId" element={<Layout><WorkDetail /></Layout>} />
            <Route path="/categories" element={<Layout><Categories /></Layout>} />
            <Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />
            <Route path="/workshop-info" element={<Layout><WorkshopInfo /></Layout>} /> {/* New route for WorkshopInfo */}
            <Route path="/edit-work/:id" element={<Layout><EditWork /></Layout>} /> {/* Ruta para editar trabajo */}
            <Route path="/users" element={<Layout><Users /></Layout>} />
            <Route path="/message-templates" element={<Layout><MessageTemplates /></Layout>} />
            <Route path="/reports" element={<Layout><Reports /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
