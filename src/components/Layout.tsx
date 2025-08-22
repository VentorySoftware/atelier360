import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  ClipboardList, 
  Users, 
  FolderTree, 
  BarChart3, 
  UserCog,
  Calendar,
  LogOut 
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const menuItems = [
  {
    title: "Crear Nuevo Trabajo",
    icon: Plus,
    url: "/crear-trabajo",
  },
  {
    title: "Trabajos / Pedidos",
    icon: ClipboardList,
    url: "/trabajos",
  },
  {
    title: "Clientes",
    icon: Users,
    url: "/clientes",
  },
  {
    title: "Categorías de Trabajo",
    icon: FolderTree,
    url: "/categorias",
  },
  {
    title: "Calendario / Turnos",
    icon: Calendar,
    url: "/calendario",
  },
  {
    title: "Dashboard / Métricas",
    icon: BarChart3,
    url: "/dashboard",
  },
  {
    title: "Usuarios",
    icon: UserCog,
    url: "/usuarios",
  },
];

const Layout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r">
          <SidebarContent>
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-sidebar-foreground">Atelier360</h2>
              {user && (
                <p className="text-sm text-sidebar-foreground/70">{user.email}</p>
              )}
            </div>
            
            <SidebarGroup>
              <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton onClick={() => handleNavigation(item.url)}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4 border-t">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b bg-background p-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Atelier360</h1>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;