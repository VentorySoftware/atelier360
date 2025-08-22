import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ClipboardList, Users, Calendar, BarChart3 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Crear Nuevo Trabajo",
      description: "Registrar un nuevo trabajo o pedido",
      icon: Plus,
      action: () => navigate('/crear-trabajo'),
      variant: "default" as const,
    },
    {
      title: "Ver Trabajos",
      description: "Consultar trabajos en curso",
      icon: ClipboardList,
      action: () => navigate('/trabajos'),
      variant: "outline" as const,
    },
    {
      title: "Gestionar Clientes",
      description: "Administrar base de clientes",
      icon: Users,
      action: () => navigate('/clientes'),
      variant: "outline" as const,
    },
    {
      title: "Calendario",
      description: "Ver turnos y citas programadas",
      icon: Calendar,
      action: () => navigate('/calendario'),
      variant: "outline" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">¡Bienvenido a Atelier360!</h1>
        <p className="text-muted-foreground mt-2">
          Sistema de gestión para talleres de costura y reparaciones
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <action.icon className="w-5 h-5" />
                <CardTitle className="text-lg">{action.title}</CardTitle>
              </div>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant={action.variant} 
                className="w-full" 
                onClick={action.action}
              >
                Acceder
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Resumen Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Trabajos Pendientes</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Turnos Hoy</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">-</div>
              <div className="text-sm text-muted-foreground">Próximos a Vencer</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
