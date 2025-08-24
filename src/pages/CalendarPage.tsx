
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Appointment {
  id: string;
  work_id: string;
  client_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  clients: {
    name: string;
    phone?: string;
  };
  works: {
    id: string;
    entry_date: string;
    price: number;
    status: string;
    work_categories: {
      name: string;
    };
  };
}

interface Work {
  id: string;
  clients: {
    id: string;
    name: string;
  };
  work_categories: {
    name: string;
    requires_appointment: boolean;
  };
}

const statusLabels = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada'
};

const statusColors = {
  scheduled: 'default',
  confirmed: 'secondary',
  completed: 'secondary',
  cancelled: 'destructive'
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    work_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
    fetchWorksRequiringAppointment();
  }, [currentDate]);

  const fetchAppointments = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (name, phone),
          works (
            id,
            entry_date,
            price,
            status,
            work_categories (name)
          )
        `)
        .gte('appointment_date', startOfMonth.toISOString().split('T')[0])
        .lte('appointment_date', endOfMonth.toISOString().split('T')[0])
        .order('appointment_date')
        .order('appointment_time');

      if (error) throw error;
      
      console.log('Fetched appointments:', data);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las citas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWorksRequiringAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from('works')
        .select(`
          id,
          clients (id, name),
          work_categories (name, requires_appointment)
        `)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter only works that require appointment
      const worksNeedingAppointment = (data || []).filter(
        work => work.work_categories.requires_appointment === true
      );
      
      console.log('Works requiring appointment:', worksNeedingAppointment);
      setWorks(worksNeedingAppointment);
    } catch (error) {
      console.error('Error fetching works:', error);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.work_id || !formData.appointment_date || !formData.appointment_time) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos obligatorios',
        variant: 'destructive'
      });
      return;
    }

    try {
      const selectedWork = works.find(w => w.id === formData.work_id);
      if (!selectedWork) throw new Error('Trabajo no encontrado');

      const { error } = await supabase
        .from('appointments')
        .insert([{
          work_id: formData.work_id,
          client_id: selectedWork.clients.id,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          notes: formData.notes || null,
          status: 'scheduled'
        }]);

      if (error) throw error;

      toast({
        title: 'Cita creada',
        description: 'La cita se ha programado correctamente'
      });

      setFormData({ work_id: '', appointment_date: '', appointment_time: '', notes: '' });
      setIsCreateDialogOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la cita',
        variant: 'destructive'
      });
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: 'El estado de la cita se ha actualizado'
      });
      fetchAppointments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive'
      });
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAppointmentsForDate = (date: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), date)
      .toISOString().split('T')[0];
    const dayAppointments = appointments.filter(apt => apt.appointment_date === dateStr);
    console.log(`Appointments for ${dateStr}:`, dayAppointments);
    return dayAppointments;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const openCreateDialog = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({
        ...prev,
        appointment_date: date.toISOString().split('T')[0]
      }));
    }
    setIsCreateDialogOpen(true);
  };

  const openDetailDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailDialogOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // Don't automatically open create dialog
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-border"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayAppointments = getAppointmentsForDate(day);
      const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = new Date().toDateString() === currentDayDate.toDateString();
      const isSelected = selectedDate?.toDateString() === currentDayDate.toDateString();

      days.push(
        <div
          key={day}
          className={`h-24 border border-border p-1 cursor-pointer hover:bg-accent transition-colors ${
            isToday ? 'bg-primary/10' : ''
          } ${isSelected ? 'bg-accent' : ''}`}
          onClick={() => handleDateClick(currentDayDate)}
        >
          <div className={`font-medium text-sm ${isToday ? 'text-primary' : ''}`}>
            {day}
          </div>
          <div className="space-y-1 mt-1 max-h-16 overflow-y-auto">
            {dayAppointments.slice(0, 2).map((apt) => (
              <div
                key={apt.id}
                className="text-xs p-1 rounded bg-primary/20 text-primary truncate cursor-pointer hover:bg-primary/30 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  openDetailDialog(apt);
                }}
                title={`${apt.appointment_time} - ${apt.clients.name} - ${apt.works.work_categories.name}`}
              >
                {apt.appointment_time} {apt.clients.name}
              </div>
            ))}
            {dayAppointments.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{dayAppointments.length - 2} más
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendario de Citas</h1>
          <p className="text-muted-foreground">Gestiona las citas y programaciones del taller</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openCreateDialog(selectedDate || undefined)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Programar Nueva Cita</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <Label htmlFor="work">Trabajo que requiere cita *</Label>
                <Select value={formData.work_id} onValueChange={(value) => setFormData({ ...formData, work_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un trabajo" />
                  </SelectTrigger>
                  <SelectContent>
                    {works.length === 0 ? (
                      <SelectItem value="" disabled>No hay trabajos que requieran cita</SelectItem>
                    ) : (
                      works.map((work) => (
                        <SelectItem key={work.id} value={work.id}>
                          {work.clients.name} - {work.work_categories.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="appointment_date">Fecha *</Label>
                <Input
                  id="appointment_date"
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="appointment_time">Hora *</Label>
                <Input
                  id="appointment_time"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre la cita"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={works.length === 0}>
                  Programar Cita
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {selectedDate && (
        <Card className="bg-accent/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fecha seleccionada:</p>
                <p className="font-medium">{selectedDate.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
              <Button size="sm" onClick={() => openCreateDialog(selectedDate)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Cita
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>
                {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Days of week header */}
          <div className="grid grid-cols-7 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0 border border-border">
            {renderCalendarGrid()}
          </div>
        </CardContent>
      </Card>

      {/* Today's appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Citas de Hoy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const todayAppointments = appointments.filter(apt => apt.appointment_date === today);
            
            return todayAppointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay citas programadas para hoy
              </p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="flex justify-between items-center p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => openDetailDialog(appointment)}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{appointment.appointment_time}</span>
                        <span>-</span>
                        <span>{appointment.clients.name}</span>
                        <Badge variant={statusColors[appointment.status as keyof typeof statusColors] as any}>
                          {statusLabels[appointment.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {appointment.works.work_categories.name}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={appointment.status}
                        onValueChange={(newStatus) => updateAppointmentStatus(appointment.id, newStatus)}
                      >
                        <SelectTrigger className="w-auto" onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Appointment Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de la Cita</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                  <p className="text-sm">{selectedAppointment.clients.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                  <p className="text-sm">{selectedAppointment.clients.phone || 'No especificado'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha</Label>
                  <p className="text-sm">{new Date(selectedAppointment.appointment_date).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Hora</Label>
                  <p className="text-sm">{selectedAppointment.appointment_time}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Categoría de Trabajo</Label>
                <p className="text-sm">{selectedAppointment.works.work_categories.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Precio</Label>
                  <p className="text-sm">${selectedAppointment.works.price}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estado del Trabajo</Label>
                  <p className="text-sm capitalize">{selectedAppointment.works.status.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Estado de la Cita</Label>
                <div className="mt-1">
                  <Badge variant={statusColors[selectedAppointment.status as keyof typeof statusColors] as any}>
                    {statusLabels[selectedAppointment.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notas</Label>
                  <p className="text-sm bg-muted p-2 rounded">{selectedAppointment.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Cerrar
                </Button>
                <Select
                  value={selectedAppointment.status}
                  onValueChange={(newStatus) => {
                    updateAppointmentStatus(selectedAppointment.id, newStatus);
                    setSelectedAppointment(prev => prev ? {...prev, status: newStatus} : null);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Cambiar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
