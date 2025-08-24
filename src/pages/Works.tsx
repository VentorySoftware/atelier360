import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ClipboardList, Eye, Calendar, DollarSign, User, Tag, X, CheckCircle, Clock, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
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
    setSelectedWork(work);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setSelectedWork(null);
    setIsDetailModalOpen(false);
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

      {/* Modal de Detalles del Trabajo */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-gradient-card">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-responsive-xl text-gradient">
              <ClipboardList className="h-6 w-6" />
              <span>Detalles del Trabajo</span>
            </DialogTitle>
            <DialogDescription className="text-responsive-base">
              Información completa del trabajo seleccionado
            </DialogDescription>
          </DialogHeader>

          {selectedWork && (
            <div className="space-y-6">
              {/* Barra de Progreso */}
              {(() => {
                const progressData = getWorkProgress(selectedWork.status);
                return (
                  <Card className="card-elegant bg-gradient-card-hover">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-responsive-sm text-gradient">Estado del Trabajo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {progressData.isCancelled ? (
                        <div className="text-center">
                          <Badge variant="destructive" className="text-responsive-sm px-4 py-2 shadow-danger">
                            Trabajo Cancelado
                          </Badge>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-responsive-sm font-medium text-gradient">Progreso</span>
                            <span className="text-responsive-sm text-muted-foreground">{progressData.progress}%</span>
                          </div>
                          <Progress value={progressData.progress} className="h-2 bg-gradient-primary" />
                          
                          {/* Iconos de pasos */}
                          <div className="flex justify-between items-center mt-4 px-2">
                            {progressData.steps.map((step, index) => {
                              const Icon = step.icon;
                              const isCompleted = index <= progressData.currentStep;
                              const isCurrent = index === progressData.currentStep;
                              
                              return (
                                <div key={step.key} className="flex flex-col items-center space-y-1 flex-1">
                                  <div className={`p-1.5 md:p-2 rounded-full border-2 transition-smooth ${
                                    isCompleted 
                                      ? 'bg-gradient-primary border-primary text-primary-foreground shadow-elegant' 
                                      : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                                  } ${isCurrent ? 'ring-2 ring-primary ring-offset-2 pulse' : ''}`}>
                                    <Icon className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                  </div>
                                  <span className={`text-[10px] md:text-xs text-center max-w-[50px] md:max-w-[60px] leading-tight transition-smooth ${
                                    isCompleted ? 'text-gradient font-medium' : 'text-muted-foreground'
                                  }`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Información del Cliente y Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-responsive">
                <Card className="card-elegant bg-gradient-card-hover">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-responsive-sm flex items-center space-x-2 text-gradient">
                      <User className="h-4 w-4" />
                      <span>Cliente</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium text-gradient">{selectedWork.clients.name}</p>
                      {selectedWork.clients.phone && (
                        <div className="space-y-2">
                          <p className="text-responsive-sm text-muted-foreground flex items-center space-x-1">
                            <span>📞</span>
                            <span>{selectedWork.clients.phone}</span>
                          </p>
                          <a
                            href={`https://wa.me/${selectedWork.clients.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-green-600 hover:text-green-700 transition-colors text-responsive-sm"
                          >
                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.864 3.488"/>
                            </svg>
                            Enviar mensaje por WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {/* Fechas debajo de la información del cliente */}
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Entrada:</span>
                        <span className="font-medium">{new Date(selectedWork.entry_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Entrega:</span>
                        <span className={`font-medium ${isOverdue(selectedWork) ? 'text-destructive' : ''}`}>
                          {new Date(selectedWork.tentative_delivery_date).toLocaleDateString()}
                          {isOverdue(selectedWork) && <span className="ml-1 text-destructive">⚠️</span>}
                        </span>
                      </div>
                      {selectedWork.actual_delivery_date && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Entregado:</span>
                          <span className="font-medium text-green-600">
                            {new Date(selectedWork.actual_delivery_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Tag className="h-4 w-4" />
                      <span>Categoría</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedWork.work_categories.name}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Información Financiera - Más compacta y en una línea */}
              <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2 text-green-700 dark:text-green-300">
                    <DollarSign className="h-4 w-4" />
                    <span>Información Financiera</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="text-center p-2 md:p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <span className="text-[10px] md:text-xs text-muted-foreground block mb-1">Total:</span>
                      <p className="text-sm md:text-lg font-bold text-green-600">{formatCurrency(selectedWork.price)}</p>
                    </div>
                    <div className="text-center p-2 md:p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <span className="text-[10px] md:text-xs text-muted-foreground block mb-1">Depósito:</span>
                      <p className="text-sm md:text-lg font-bold text-blue-600">{formatCurrency(selectedWork.deposit_amount)}</p>
                      <Badge variant="outline" className="mt-1 text-[9px] md:text-xs px-1 py-0">
                        {depositStatusLabels[selectedWork.deposit_status as keyof typeof depositStatusLabels]}
                      </Badge>
                    </div>
                    <div className="text-center p-2 md:p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <span className="text-[10px] md:text-xs text-muted-foreground block mb-1">Saldo:</span>
                      <p className="text-sm md:text-lg font-bold text-orange-600">
                        {formatCurrency(selectedWork.price - selectedWork.deposit_amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notas */}
              {selectedWork.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{selectedWork.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Información de Creación */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Información de Registro</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Creado el: {new Date(selectedWork.created_at).toLocaleDateString()} a las {new Date(selectedWork.created_at).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Botón de Cerrar */}
          <div className="flex justify-end pt-6 border-t bg-gray-50 dark:bg-gray-800 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <Button onClick={closeDetailModal} variant="outline" size="lg" className="min-w-[120px]">
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}