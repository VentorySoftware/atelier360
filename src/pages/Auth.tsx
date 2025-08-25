import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoginAnimation } from '@/components/LoginAnimation';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginAnimation, setShowLoginAnimation] = useState(false);
  const [allowRedirect, setAllowRedirect] = useState(false);

  // Redirect if already authenticated and animation is complete
  if (user && !loading && allowRedirect) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: 'Error al iniciar sesión',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setShowLoginAnimation(true);
      toast({
        title: 'Sesión iniciada',
        description: 'Bienvenido a Atelier360'
      });
      
      // Allow redirect after animation completes
      setTimeout(() => {
        setAllowRedirect(true);
      }, 1500);
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      toast({
        title: 'Error al registrarse',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Registro exitoso',
        description: 'Revisa tu email para confirmar tu cuenta'
      });
      // Note: For signup, we don't redirect immediately as user needs to confirm email
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoginAnimation 
        isVisible={showLoginAnimation} 
        onComplete={() => setShowLoginAnimation(false)} 
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-dashboard p-4 relative overflow-hidden">
        {/* Background animated elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full animate-breathing-slow blur-xl" />
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-secondary/20 rounded-full animate-breathing-slower blur-lg" />
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-accent/30 rounded-full animate-float blur-sm" />
        </div>

        <Card className="w-full max-w-md relative z-10 animate-[loginAppear_1.2s_cubic-bezier(0.4,0,0.2,1)] shadow-elegant border-border/50 backdrop-blur-sm bg-card/95">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <CardHeader className="text-center relative">
          <CardTitle className="text-3xl font-bold text-gradient animate-[morphingBorder_4s_ease-in-out_infinite]">
            Atelier360
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Sistema de gestión para talleres de costura
          </CardDescription>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 rounded-t-xl animate-[shimmerGlow_3s_linear_infinite]" />
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Contraseña</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full relative overflow-hidden group hover:shadow-glow transition-all duration-300" 
                  disabled={isLoading}
                >
                  <span className="relative z-10">
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nombre completo</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full relative overflow-hidden group hover:shadow-glow transition-all duration-300" 
                  disabled={isLoading}
                >
                  <span className="relative z-10">
                    {isLoading ? 'Registrando...' : 'Registrarse'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="text-center mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-border/50">
            <div className="text-sm font-semibold text-foreground/70 animate-welcome-pulse">
              Developed by Ventory
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default Auth;