import { ReactNode, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { LogoutAnimation } from '@/components/LogoutAnimation';
import { LoginAnimation } from '@/components/LoginAnimation';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      // Show welcome animation when user first enters the system
      setShowWelcomeAnimation(true);
      setTimeout(() => setShowWelcomeAnimation(false), 1200);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <LogoutAnimation 
        isVisible={showLogoutAnimation} 
        onComplete={() => setShowLogoutAnimation(false)} 
      />
      <LoginAnimation 
        isVisible={showWelcomeAnimation} 
        onComplete={() => setShowWelcomeAnimation(false)} 
      />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar onLogout={() => setShowLogoutAnimation(true)} />
          
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">
              <SidebarTrigger />
              <div className="text-sm text-muted-foreground">
                ¡Bienvenido a Atelier360!
              </div>
            </header>
            
            <main className="flex-1 p-6">
              <div>
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
