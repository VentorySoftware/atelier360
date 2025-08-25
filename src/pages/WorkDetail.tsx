import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, User, Tag, Calendar, DollarSign, Phone, Edit, 
  ClipboardList, Clock, Package, CheckCircle, Truck, X, 
  Plus, Save, FileText, TrendingUp, Clock4, CalendarCheck
} from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import AppointmentForm from '@/components/AppointmentForm';

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
} as const;

const depositStatusLabels = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado'
};

interface Appointment {
  id: string;
  work_id: string;
  client_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

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
    requires_appointment?: boolean;
  };
}

const WorkDetail: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const [work, setWork] = useState<Work | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkDetail = async () => {
      try {
        const { data: workData, error: workError } = await supabase
          .from('works')
          .select(`
            *,
            clients (name, phone),
            work_categories (name, requires_appointment)
          `)
          .eq('id', workId)
          .single();

        if (workError) throw workError;
        setWork(workData);

        // Fetch appointments for this work
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('work_id', workId)
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });

        if (appointmentsError) {
          console.error('Error fetching appointments:', appointmentsError);
          throw appointmentsError;
        }
        
        console.log('Appointments data:', appointmentsData);
        setAppointments(appointmentsData || []);
      } catch (error) {
        console.error('Error fetching work details:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los detalles del trabajo',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (workId) {
      fetchWorkDetail();
    }
  }, [workId, toast]);

  const updateWorkStatus = async (newStatus: string) => {
    if (!work) return;

    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'delivered') {
        updateData.actual_delivery_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('works')
        .update(updateData)
        .eq('id', work.id);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: 'El estado del trabajo se ha actualizado correctamente',
      });

      setWork({ ...work, status: newStatus, ...updateData });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  const addNote = async () => {
    if (!work || !newNote.trim()) return;

    try {
      setSaving(true);
      const updatedNotes = work.notes ? `${work.notes}\n\n${new Date().toLocaleDateString()}: ${newNote}` : `${new Date().toLocaleDateString()}: ${newNote}`;

      const { error } = await supabase
        .from('works')
        .update({ notes: updatedNotes })
        .eq('id', work.id);

      if (error) throw error;

      toast({
        title: 'Nota agregada',
        description: 'La nota se ha agregado correctamente',
      });

      setWork({ ...work, notes: updatedNotes });
      setNewNote('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar la nota',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appointmentId);

      if (error) throw error;

      // Actualizar el estado local
      setAppointments(prevAppointments => 
        prevAppointments.map(app => 
          app.id === appointmentId ? { ...app, status: newStatus, updated_at: new Date().toISOString() } : app
        )
      );

      toast({
        title: 'Estado actualizado',
        description: 'El estado de la cita se ha actualizado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la cita',
        variant: 'destructive',
      });
    }
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

  const isOverdue = () => {
    if (!work || work.status === 'delivered' || work.status === 'cancelled') return false;
    const tentativeDate = new Date(work.tentative_delivery_date);
    const today = new Date();
    return tentativeDate < today;
  };

  const getAppointmentStatusLabel = (status: string) => {
    const statusLabels = {
      scheduled: 'Programada',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      rescheduled: 'Reprogramada'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  const getAppointmentStatusColor = (status: string) => {
    const statusColors = {
      scheduled: 'secondary',
      confirmed: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
      rescheduled: 'outline'
    } as const;
    return statusColors[status as keyof typeof statusColors] || 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-gradient-dashboard">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto shadow-glow"></div>
          <p className="mt-4 text-muted-foreground">Cargando detalles del trabajo...</p>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-gradient-dashboard">
        <div className="text-center">
          <p className="text-muted-foreground">No se encontró el trabajo</p>
          <Button onClick={() => navigate('/works')} className="mt-4">
            Volver a Trabajos
          </Button>
        </div>
      </div>
    );
  }

  const progressData = getWorkProgress(work.status);
  const overdue = isOverdue();
  const saldoPendiente = work.price - work.deposit_amount;

  return (
    <div className="min-h-screen bg-gradient-dashboard p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/works')} className="hover-scale transition-smooth">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Detalles del Trabajo</h1>
              <p className="text-muted-foreground">ID: {work.id}</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate(`/edit-work/${work.id}`)}
            className="bg-gradient-primary hover-scale shadow-elegant"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Trabajo
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Información principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Barra de Progreso */}
            <Card className="card-elegant bg-gradient-card-hover">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gradient">
                  <TrendingUp className="h-5 w-5" />
                  <span>Progreso del Trabajo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progressData.isCancelled ? (
                  <div className="text-center">
                    <Badge variant="destructive" className="px-4 py-2 text-lg shadow-danger">
                      Trabajo Cancelado
                    </Badge>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Progreso actual</span>
                      <span className="text-muted-foreground">{progressData.progress}%</span>
                    </div>
                    <Progress value={progressData.progress} className="h-3 bg-gradient-primary" />
                    
                    <div className="flex justify-between items-center mt-4 px-2">
                      {progressData.steps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index <= progressData.currentStep;
                        const isCurrent = index === progressData.currentStep;
                        
                        return (
                          <div key={step.key} className="flex flex-col items-center space-y-2 flex-1">
                            <div className={`p-2 rounded-full border-2 transition-smooth ${
                              isCompleted 
                                ? 'bg-gradient-primary border-primary text-primary-foreground shadow-elegant' 
                                : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                            } ${isCurrent ? 'ring-2 ring-primary ring-offset-2 pulse' : ''}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className={`text-xs text-center max-w-[60px] leading-tight transition-smooth ${
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

            {/* Citas - Sección Destacada */}
            <Card className="card-elegant bg-gradient-card-hover border-2 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="flex items-center space-x-2 text-primary">
                  <Calendar className="h-6 w-6" />
                  <span>Agenda del Trabajo</span>
                </CardTitle>
                <CardDescription>
                  Citas programadas para este trabajo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {appointments.length > 0 ? (
                  appointments.map((appointment) => (
                    <div key={appointment.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <CalendarCheck className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">
                              {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                            <Clock4 className="h-4 w-4" />
                            <span className="font-medium">{appointment.appointment_time}</span>
                          </div>
                          {appointment.notes && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                              <p className="text-muted-foreground">{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Select value={appointment.status} onValueChange={(newStatus) => updateAppointmentStatus(appointment.id, newStatus)}>
                            <SelectTrigger className="w-auto h-8 hover-scale transition-smooth">
                              <Edit className="h-3 w-3" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries({
                                scheduled: 'Programada',
                                confirmed: 'Confirmada',
                                completed: 'Completada',
                                cancelled: 'Cancelada',
                                rescheduled: 'Reprogramada'
                              }).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Badge 
                            variant={getAppointmentStatusColor(appointment.status)}
                            className="ml-2 px-3 py-1 text-sm"
                          >
                            {getAppointmentStatusLabel(appointment.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>ID: {appointment.id}</span>
                        <span>
                          Creado: {new Date(appointment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No hay citas programadas para este trabajo.</p>
                    <Button 
                      onClick={() => navigate('/calendar')}
                      variant="outline"
                      className="hover-scale"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Programar Cita
                    </Button>
                  </div>
                )}

                {/* Formulario para agregar nueva cita */}
                <AppointmentForm
                  workId={work.id}
                  clientId={work.client_id}
                  onAppointmentCreated={() => {
                    // Recargar citas después de crear una nueva
                    const fetchAppointments = async () => {
                      const { data: appointmentsData, error } = await supabase
                        .from('appointments')
                        .select('*')
                        .eq('work_id', workId)
                        .order('appointment_date', { ascending: true })
                        .order('appointment_time', { ascending: true });
                      
                      if (!error && appointmentsData) {
                        setAppointments(appointmentsData);
                      }
                    };
                    fetchAppointments();
                  }}
                  onCancel={() => setNewNote('')}
                />
              </CardContent>
            </Card>

            {/* Información del Cliente y Trabajo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-elegant bg-gradient-card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Cliente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-lg text-gradient">{work.clients.name}</p>
                    {work.clients.phone && (
                      <div className="space-y-3 mt-3">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{work.clients.phone}</span>
                        </div>
                        <a
                          href={`https://wa.me/${work.clients.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-green-600 hover:text-green-700 transition-colors text-sm"
                        >
                          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.极狐汽车57-.347"/>
                          </svg>
                          Enviar WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elegant bg-gradient-card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Tag className="h-5 w-5" />
                    <span>Trabajo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-gradient">{work.work_categories.name}</p>
                    <div className="flex items-center space-x-2 mt-3">
                      <Badge 
                        variant={statusColors[work.status as keyof typeof statusColors] as any} 
                        className="shadow-elegant"
                      >
                        {statusLabels[work.status as keyof typeof statusLabels]}
                      </Badge>
                      <Select value={work.status} onValueChange={updateWorkStatus}>
                        <SelectTrigger className="w-auto h-8 hover-scale transition-smooth">
                          <Edit className="h-3 w-3" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Entrada: {new Date(work.entry_date).toLocaleDateString()}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                      <Calendar className="h-4 w-4" />
                      <span>
                        Entrega: {new Date(work.tentative_delivery_date).toLocaleDateString()}
                        {overdue && ' ⚠️ Retrasado'}
                      </span>
                    </div>
                    {work.actual_delivery_date && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Calendar className="h-4 w-4" />
                        <span>Entregado: {new Date(work.actual_delivery_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notas */}
            <Card className="card-elegant bg-gradient-card-hover">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Notas y Observaciones</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {work.notes && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Notas existentes:</h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{work.notes}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Textarea
                    placeholder="Agregar nueva nota..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button 
                    onClick={addNote} 
                    disabled={!newNote.trim() || saving}
                    className="bg-gradient-primary hover-scale"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Nota
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Información financiera */}
          <div className="space-y-6">
            {/* Información del Cliente y Trabajo */}
            <div className="grid grid-cols-1 gap-6">
              <Card className="card-elegant bg-gradient-card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Cliente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-lg text-gradient">{work.clients.name}</p>
                    {work.clients.phone && (
                      <div className="space-y-3 mt-3">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{work.clients.phone}</span>
                        </div>
                        <a
                          href={`https://wa.me/${work.clients.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-green-600 hover:text-green-700 transition-colors text-sm"
                        >
                          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.极狐汽车57-.347"/>
                          </svg>
                          Enviar WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-elegant bg-gradient-card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Tag className="h-5 w-5" />
                    <span>Trabajo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-gradient">{work.work_categories.name}</p>
                    <div className="flex items-center space-x-2 mt-3">
                      <Badge 
                        variant={statusColors[work.status as keyof typeof statusColors] as any} 
                        className="shadow-elegant"
                      >
                        {statusLabels[work.status as keyof typeof statusLabels]}
                      </Badge>
                      <Select value={work.status} onValueChange={updateWorkStatus}>
                        <SelectTrigger className="w-auto h-8 hover-scale transition-smooth">
                          <Edit className="h-3 w-3" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Entrada: {new Date(work.entry_date).toLocaleDateString()}</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                      <Calendar className="h-4 w-4" />
                      <span>
                        Entrega: {new Date(work.tentative_delivery_date).toLocaleDateString()}
                        {overdue && ' ⚠️ Retrasado'}
                      </span>
                    </div>
                    {work.actual_delivery_date && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Calendar className="h-4 w-4" />
                        <span>Entregado: {new Date(work.actual_delivery_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Información Financiera */}
            <Card className="card-elegant bg-gradient-card-hover border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <DollarSign className="h-5 w-5" />
                  <span>Información Financiera</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <span className="text-sm font-medium">Precio Total:</span>
                    <span className="font-bold text-green-600 text-lg">
                      {formatCurrency(work.price)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <div>
                      <span className="text-sm font-medium block">Seña Abonada:</span>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {depositStatusLabels[work.deposit_status as keyof typeof depositStatusLabels]}
                      </Badge>
                    </div>
                    <span className="font-bold text-blue-600 text-lg">
                      {formatCurrency(work.deposit_amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <span className="text-sm font-medium">Saldo Pendiente:</span>
                    <span className={`font-bold text-lg ${
                      saldoPendiente > 0 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(saldoPendiente)}
                    </span>
                  </div>
                </div>

                {saldoPendiente > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200">
                    <p className="text-amber-700 dark:text-amber-300 text-sm text-center">
                      💰 Saldo pendiente por cobrar
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información de Registro */}
            <Card className="card-elegant bg-gradient-card-hover">
              <CardHeader>
                <CardTitle>Información de Registro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Creado el: {new Date(work.created_at).toLocaleDateString()} a las{' '}
                  {new Date(work.created_at).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkDetail;
