import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AppointmentFormProps {
  workId: string;
  clientId: string;
  onAppointmentCreated: (appointmentData?: { appointment_date: string; appointment_time: string }) => void;
  onCancel: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  workId,
  clientId,
  onAppointmentCreated,
  onCancel
}) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

  const checkAvailability = async (selectedDate: string, selectedTime: string) => {
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', selectedDate)
      .eq('appointment_time', selectedTime)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error checking availability:', error);
      return false;
    }

    return existingAppointments.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona fecha y hora',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const appointmentDate = format(date, 'yyyy-MM-dd');
      
      // Validar disponibilidad
      const isAvailable = await checkAvailability(appointmentDate, time);
      
      if (!isAvailable) {
        toast({
          title: 'Horario no disponible',
          description: 'Ya existe una cita programada para esta fecha y hora',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      const newAppointment = {
        work_id: workId,
        client_id: clientId,
        appointment_date: appointmentDate,
        appointment_time: time,
        status: 'scheduled',
        notes: notes.trim(),
        created_by: null // Will be handled by authentication logic
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(newAppointment as any)
        .select();

      if (error) throw error;

      toast({
        title: 'Cita programada',
        description: 'La cita se ha programado correctamente',
      });

      // NO reseteamos los campos para que el usuario vea la cita creada
      onAppointmentCreated({
        appointment_date: appointmentDate,
        appointment_time: time
      });

    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo programar la cita',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-muted/30 rounded-lg border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Programar Nueva Cita</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Fecha de la cita</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Hora de la cita</Label>
          <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {timeSlots.map((slot) => (
              <Button
                key={slot}
                type="button"
                variant={time === slot ? "default" : "outline"}
                onClick={() => setTime(slot)}
                className="h-8 text-xs"
              >
                {slot}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales para la cita..."
            className="w-full p-2 border rounded-md text-sm min-h-[80px]"
          />
        </div>

        <div className="flex space-x-2">
          <Button
            type="submit"
            disabled={loading || !date || !time}
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Programando...
              </>
            ) : (
              <>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Programar Cita
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
