import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Users, Calendar, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { 
  getPendingWorksCount, 
  getTotalClientsCount, 
  getTodayAppointments, 
  getMonthlyRevenue, 
  getRecentWorks, 
  getUrgentWorks 
} from '@/lib/dashboardQueries';

interface DashboardData {
  pendingWorks: number;
  totalClients: number;
  todayAppointments: any[];
  monthlyRevenue: number;
  recentWorks: any[];
  urgentWorks: any[];
  loading: boolean;
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData>({
    pendingWorks: 0,
    totalClients: 0,
    todayAppointments: [],
    monthlyRevenue: 0,
    recentWorks: [],
    urgentWorks: [],
    loading: true
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [
          pendingWorks,
          totalClients,
          todayAppointments,
          monthlyRevenue,
          recentWorks,
          urgentWorks
        ] = await Promise.all([
          getPendingWorksCount(),
          getTotalClientsCount(),
          getTodayAppointments(),
          getMonthlyRevenue(),
          getRecentWorks(3),
          getUrgentWorks()
        ]);

        setData({
          pendingWorks,
          totalClients,
          todayAppointments,
          monthlyRevenue,
          recentWorks,
          urgentWorks,
          loading: false
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    loadDashboardData();
  }, []);

  if (data.loading) {
    return (
      <div className="space-y-6 bg-gradient-dashboard min-h-screen p-responsive">
        <div className="animate-fade-in">
          <h1 className="text-responsive-2xl font-bold text-gradient mb-2">Dashboard</h1>
          <p className="text-responsive-sm text-muted-foreground">
            Resumen general de tu taller
          </p>
        </div>
        <div className="grid-responsive-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-32 bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'in_progress': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'delivered': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En proceso';
      case 'completed': return 'Completado';
      case 'delivered': return 'Entregado';
      default: return status;
    }
  };

  const getUrgencyLevel = (deliveryDate: string) => {
    const today = new Date();
    const delivery = new Date(deliveryDate);
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Vencido';
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    return `En ${diffDays} días`;
  };

  const getUrgencyColor = (deliveryDate: string) => {
    const today = new Date();
    const delivery = new Date(deliveryDate);
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200';
    if (diffDays <= 1) return 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200';
    return 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200';
  };

  return (
    <div className="space-y-6 bg-gradient-dashboard min-h-screen p-responsive">
      <div className="animate-fade-in">
        <h1 className="text-responsive-2xl font-bold text-gradient mb-2">Dashboard</h1>
        <p className="text-responsive-sm text-muted-foreground">
          Resumen general de tu taller
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid-responsive-4 animate-slide-up">
        <Card className="card-hover shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trabajos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{data.pendingWorks}</div>
            <p className="text-xs text-muted-foreground">
              {data.pendingWorks > 0 ? 'Requieren atención' : 'Todo al día'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{data.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes registrados
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{data.todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.todayAppointments.length > 0 ? 'Programadas' : 'Sin citas'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover shadow-elegant bg-gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">{formatCurrency(data.monthlyRevenue)}</div>
            <p className="text-xs text-primary-foreground/80">
              {data.monthlyRevenue > 0 ? 'Ingresos generados' : 'Sin ingresos aún'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {data.urgentWorks.length > 0 && (
        <Card className="shadow-elegant bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning animate-float" />
              <span>Alertas y Trabajos en Riesgo</span>
            </CardTitle>
            <CardDescription>
              Trabajos que requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.urgentWorks.map((work) => (
                <div 
                  key={work.id}
                  className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      {work.work_categories?.name} - {work.clients?.name}
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-300">
                      Entrega: {new Date(work.tentative_delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getUrgencyColor(work.tentative_delivery_date)}`}>
                    {getUrgencyLevel(work.tentative_delivery_date)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trabajos Recientes</CardTitle>
            <CardDescription>Últimos trabajos ingresados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentWorks.map((work) => (
                <div key={work.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{work.work_categories?.name}</p>
                    <p className="text-sm text-muted-foreground">{work.clients?.name}</p>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${getStatusColor(work.status)}`}>
                    {getStatusText(work.status)}
                  </span>
                </div>
              ))}
              {data.recentWorks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay trabajos recientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
            <CardDescription>Citas programadas para hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{appointment.appointment_time} - Cita</p>
                    <p className="text-sm text-muted-foreground">ID: {appointment.work_id}</p>
                  </div>
                  <span className="text-xs text-blue-600">Hoy</span>
                </div>
              ))}
              {data.todayAppointments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay citas para hoy
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;