import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Users, Calendar, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general de tu taller
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trabajos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 desde ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">
              +5 este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,450</div>
            <p className="text-xs text-muted-foreground">
              +15% vs mes anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>Alertas y Trabajos en Riesgo</span>
          </CardTitle>
          <CardDescription>
            Trabajos que requieren atención inmediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Arreglo vestido - María García</p>
                <p className="text-sm text-amber-600 dark:text-amber-300">Entrega programada para mañana</p>
              </div>
              <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
                Urgente
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">Tapizado sillón - Juan Pérez</p>
                <p className="text-sm text-red-600 dark:text-red-300">Vencida hace 2 días</p>
              </div>
              <span className="text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                Vencido
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trabajos Recientes</CardTitle>
            <CardDescription>Últimos trabajos ingresados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dobladillo pantalón</p>
                  <p className="text-sm text-muted-foreground">Ana López</p>
                </div>
                <span className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                  Pendiente
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reparación cremallera</p>
                  <p className="text-sm text-muted-foreground">Carlos Ruiz</p>
                </div>
                <span className="text-sm text-blue-600 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">
                  En proceso
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Costura personalizada</p>
                  <p className="text-sm text-muted-foreground">Laura Martín</p>
                </div>
                <span className="text-sm text-purple-600 bg-purple-100 dark:bg-purple-900/20 px-2 py-1 rounded">
                  Completado
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
            <CardDescription>Citas programadas para hoy y mañana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">10:00 AM - Tapizado sillón</p>
                  <p className="text-sm text-muted-foreground">José Fernández</p>
                </div>
                <span className="text-xs text-blue-600">Hoy</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">2:30 PM - Prueba vestido</p>
                  <p className="text-sm text-muted-foreground">Elena Castro</p>
                </div>
                <span className="text-xs text-blue-600">Hoy</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">11:00 AM - Medidas traje</p>
                  <p className="text-sm text-muted-foreground">Roberto Silva</p>
                </div>
                <span className="text-xs text-green-600">Mañana</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;