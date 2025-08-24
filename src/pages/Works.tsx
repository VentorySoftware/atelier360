import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ClipboardList, Eye, Calendar, DollarSign, User, Tag, Clock, Package, CheckCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

interface Work {
  id: string;
  client_id: string;
  category_id: string;
  status: string;
  price: number;
  deposit_amount: number;
  deposit_status: string;
  entry_date: string;
  tentative_delivery_date: string;
  actual_delivery_date?: string;
  notes?: string;
  created_at: string;
  clients: {
    name: string;
    phone?: string;
  };
  work_categories: {
    name: string;
  };
}

const statusLabels = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  waiting_parts: 'Esperando Piezas',
  completed: 'Completado',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
};

const statusColors = {
  pending: 'secondary',
  in_progress: 'default',
  waiting_parts: 'outline',
  completed: 'secondary',
  delivered: 'default',
  cancelled: 'destructive'
};

const depositStatusLabels = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado'
};

export default function Works() {
  const [works, setWorks] = useState<Work[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    try {
      const { data, error } = await supabase
        .from('works')
        .select(`
          *,
          clients (name, phone),
          work_categories (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorks(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los trabajos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

const updateWorkStatus = async (workId: string, newStatus: string, clientPhone: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      // Si se marca como entregado, establecer fecha de entrega actual
      if (newStatus === 'delivered') {
        updateData.actual_delivery_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('works')
        .update(updateData)
        .eq('id', workId);

      if (error) throw error;

      // Enviar notificación por WhatsApp si el estado es "completado" y hay número de teléfono
      if (newStatus === 'completed' && clientPhone) {
        try {
          // Obtener información completa del trabajo para la plantilla
          const work = works.find(w => w.id === workId);
          if (work) {
            // Formatear el número de teléfono (remover caracteres no numéricos)
            const formattedPhone = clientPhone.replace(/\D/g, '');
            
            // Crear plantilla completa del mensaje
            const saldoPendiente = work.price - work.deposit_amount;
            const tieneSaldo = saldoPendiente > 0;
            const workshopInfo = JSON.parse(localStorage.getItem('workshopInfo') || '{}');
            
            // Depuración: mostrar la estructura de workshopInfo
            console.log('Datos del taller:', workshopInfo);
            
            const message = `🎉 *¡Hola! Su trabajo está completado* 🎉\n\n` +
                           `✨ *Detalles del trabajo:*\n` +
                           `🆔 *ID:* ${workId}\n` +
                           `📦 *Categoría:* ${work.work_categories.name}\n` +
                           `💰 *Precio total:* ${formatCurrency(work.price)}\n` +
                           `💵 *Seña abonada:* ${formatCurrency(work.deposit_amount)}\n` +
                           `${tieneSaldo ? `📋 *Saldo pendiente:* ${formatCurrency(saldoPendiente)}\n` : '✅ *Pago completo*\n'}\n` +
                           `🏢 *Dirección del taller:*\n` +
                           `📍 ${workshopInfo.street || ''} ${workshopInfo.number || ''}, ${workshopInfo.neighborhood || ''}, ${workshopInfo.city || ''}, ${workshopInfo.province || ''}\n\n` +
                           `⏰ *Horarios de atención:*\n` +
                           `📅 *Lunes a Viernes:* ${workshopInfo.weekdays?.timeRanges?.length > 0 ? 
                             workshopInfo.weekdays.timeRanges.map(range => `${range.start} - ${range.end}`).join(', ') : 'No disponible'}\n` +
                           `🗓️ *Sábados:* ${workshopInfo.saturday?.timeRanges?.length > 0 ? 
                             workshopInfo.saturday.timeRanges.map(range => `${range.start} - ${range.end}`).join(', ') : 'No disponible'}\n` +
                           `📆 *Domingos:* ${workshopInfo.sunday?.timeRanges?.length > 0 ? 
                             workshopInfo.sunday.timeRanges.map(range => `${range.start} - ${range.end}`).join(', ') : 'No disponible'}\n` +
                           `🎊 *Feriados:* ${workshopInfo.holidays?.timeRanges?.length > 0 ? 
                             workshopInfo.holidays.timeRanges.map(range => `${range.start} - ${range.end}`).join(', ') : 'No disponible'}\n\n` +
                           `${workshopInfo.references ? `🗺️ *Referencias:*\n${workshopInfo.references}\n\n` : ''}` +
                           `📱 *Cualquier consulta no dudes en comunicarte*\n\n` +
                           `🙏 *¡Gracias por confiar en nosotros!* ❤️`;
            
            // Crear el enlace de WhatsApp
            const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
            
            // Abrir WhatsApp en una nueva pestaña
            window.open(whatsappUrl, '_blank');
            
            toast({
              title: 'WhatsApp abierto',
              description: 'Se ha abierto WhatsApp con la plantilla del mensaje para el cliente'
            });
          }
        } catch (whatsappError) {
          console.error('Error al abrir WhatsApp:', whatsappError);
          toast({
            title: 'Error de WhatsApp',
            description: 'No se pudo abrir WhatsApp, pero el estado se actualizó correctamente',
            variant: 'destructive'
          });
        }
      }

      toast({
        title: 'Estado actualizado',
        description: 'El estado del trabajo se ha actualizado correctamente'
      });
      fetchWorks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive'
      });
    }
  };

  const deleteWork = async (workId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este trabajo?')) return;

    try {
      const { error } = await supabase
        .from('works')
        .delete()
        .eq('id', workId);

      if (error) throw error;

      toast({
        title: 'Trabajo eliminado',
        description: 'El trabajo se ha eliminado correctamente'
      });
      fetchWorks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el trabajo',
        variant: 'destructive'
      });
    }
  };

  const openDetailModal = (work: Work) => {
    navigate(`/works/${work.id}`);
  };

  const filteredWorks = works.filter(work => {
    const matchesSearch = 
      work.clients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.work_categories.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || work.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const isOverdue = (work: Work) => {
    if (work.status === 'delivered' || work.status === 'cancelled') return false;
    const tentativeDate = new Date(work.tentative_delivery_date);
    const today = new Date();
    return tentativeDate < today;
  };

  const getWorkProgress = (status: string) => {
    const steps = [
      { key: 'pending', label: 'Pendiente', icon: Clock, progress: 0 },
      { key: 'in_progress', label: 'En Progreso', icon: ClipboardList, progress: 25 },
      { key: 'waiting_parts', label: 'Esperando Piezas', icon: Package, progress: 50 },
      { key: 'completed', label: 'Completado', icon: CheckCircle, progress: 75 },
      { key: 'delivered', label: 'Entregado', icon: Truck, progress: 100 }
    ];

    if (status === 'cancelled') {
      return { progress: 0, currentStep: 0, steps, isCancelled: true };
    }

    const currentStepIndex = steps.findIndex(step => step.key === status);
    const currentStep = currentStepIndex >= 0 ? currentStepIndex : 0;
    const progress = currentStepIndex >= 0 ? steps[currentStepIndex].progress : 0;

    return { progress, currentStep, steps, isCancelled: false };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-gradient-dashboard">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto shadow-glow"></div>
          <p className="mt-4 text-muted-foreground text-responsive-sm">Cargando trabajos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-dashboard min-h-screen p-responsive">
      <div className="flex-responsive justify-between items-start animate-fade-in">
        <div>
          <h1 className="text-responsive-2xl font-bold text-gradient mb-2">Trabajos y Pedidos</h1>
          <p className="text-responsive-sm text-muted-foreground">Gestiona todos los trabajos de tu taller</p>
        </div>
        
        <Button onClick={() => navigate('/create-work')} className="bg-gradient-primary hover-scale shadow-elegant">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Trabajo
        </Button>
      </div>

      <div className="flex-responsive gap-responsive">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, categoría o notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-focus flex-1"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 transition-smooth">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredWorks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No se encontraron trabajos' : 'No hay trabajos registrados'}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || statusFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda' 
                : 'Comienza creando tu primer trabajo'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-responsive">
          {filteredWorks.map((work) => (
            <Card key={work.id} className={`card-elegant hover-lift transition-smooth bg-gradient-card-hover ${isOverdue(work) ? 'border-destructive shadow-danger' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex-responsive justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-responsive-lg text-gradient">{work.clients.name}</CardTitle>
                      {isOverdue(work) && (
                        <Badge variant="destructive" className="text-xs shadow-elegant">Retrasado</Badge>
                      )}
                    </div>
                    <div className="flex-responsive items-center space-x-4 text-responsive-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Tag className="h-4 w-4" />
                        <span>{work.work_categories.name}</span>
                      </div>
                      {work.clients.phone && (
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{work.clients.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={statusColors[work.status as keyof typeof statusColors] as any} className="shadow-elegant">
                      {statusLabels[work.status as keyof typeof statusLabels]}
                    </Badge>
<Select value={work.status} onValueChange={(newStatus) => updateWorkStatus(work.id, newStatus, work.clients.phone)}>
                      <SelectTrigger className="w-auto h-8 hover-scale transition-smooth">
                        <Edit className="h-4 w-4" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-responsive-sm">
                  <div>
                    <span className="text-muted-foreground">Precio:</span>
                    <p className="font-medium text-gradient">{formatCurrency(work.price)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Depósito:</span>
                    <p className="font-medium text-gradient">
                      {formatCurrency(work.deposit_amount)}
                      <Badge variant="outline" className="ml-2 text-xs shadow-elegant">
                        {depositStatusLabels[work.deposit_status as keyof typeof depositStatusLabels]}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha Entrada:</span>
                    <p className="font-medium">{new Date(work.entry_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entrega Prevista:</span>
                    <p className={`font-medium ${isOverdue(work) ? 'text-destructive font-semibold' : 'text-gradient'}`}>
                      {new Date(work.tentative_delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {work.actual_delivery_date && (
                  <div className="text-responsive-sm">
                    <span className="text-muted-foreground">Fecha de Entrega:</span>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {new Date(work.actual_delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {work.notes && (
                  <div className="text-responsive-sm">
                    <span className="text-muted-foreground">Notas:</span>
                    <p className="mt-1 text-foreground leading-relaxed">{work.notes}</p>
                  </div>
                )}

                <div className="flex-responsive justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    Creado: {new Date(work.created_at).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailModal(work)}
                      className="hover-scale transition-smooth"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteWork(work.id)}
                      className="text-destructive hover:text-destructive hover-scale transition-smooth"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
