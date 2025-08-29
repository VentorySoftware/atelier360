import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Edit, Save, X } from 'lucide-react';

interface TimeRange {
  start: string;
  end: string;
}

interface DaySchedule {
  open: boolean;
  timeRanges: TimeRange[];
}

interface WorkshopData {
  name: string;
  street: string;
  number: string;
  postalCode: string;
  neighborhood: string;
  city: string;
  province: string;
  reference: string;
  weekdays: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  holidays: DaySchedule;
  closedDays: string;
}

const WorkshopInfo = () => {
  const [workshopData, setWorkshopData] = useState<WorkshopData>({
    name: '',
    street: '',
    number: '',
    postalCode: '',
    neighborhood: '',
    city: '',
    province: '',
    reference: '',
    weekdays: { open: true, timeRanges: [{ start: '09:00', end: '18:00' }] },
    saturday: { open: true, timeRanges: [{ start: '09:00', end: '13:00' }] },
    sunday: { open: false, timeRanges: [{ start: '', end: '' }] },
    holidays: { open: false, timeRanges: [{ start: '', end: '' }] },
    closedDays: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<WorkshopData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedData = localStorage.getItem('workshopInfo');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setWorkshopData(parsedData);
      setOriginalData(parsedData);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setWorkshopData({ ...workshopData, [name]: value });
    setHasChanges(true);
  };

  const toggleDayOpen = (day: keyof WorkshopData) => {
    const daySchedule = workshopData[day] as DaySchedule;
    const newData = {
      ...workshopData,
      [day]: { ...daySchedule, open: !daySchedule.open }
    };
    setWorkshopData(newData);
    setHasChanges(true);
  };

  const handleTimeRangeChange = (day: keyof WorkshopData, index: number, field: 'start' | 'end', value: string) => {
    const daySchedule = workshopData[day] as DaySchedule;
    const newTimeRanges = [...daySchedule.timeRanges];
    newTimeRanges[index] = { ...newTimeRanges[index], [field]: value };
    
    const newData = {
      ...workshopData,
      [day]: { ...daySchedule, timeRanges: newTimeRanges }
    };
    setWorkshopData(newData);
    setHasChanges(true);
  };

  const addTimeRange = (day: keyof WorkshopData) => {
    const daySchedule = workshopData[day] as DaySchedule;
    const newData = {
      ...workshopData,
      [day]: {
        ...daySchedule,
        timeRanges: [...daySchedule.timeRanges, { start: '', end: '' }]
      }
    };
    setWorkshopData(newData);
    setHasChanges(true);
  };

  const removeTimeRange = (day: keyof WorkshopData, index: number) => {
    const daySchedule = workshopData[day] as DaySchedule;
    const newTimeRanges = daySchedule.timeRanges.filter((_, i) => i !== index);
    
    const newData = {
      ...workshopData,
      [day]: { ...daySchedule, timeRanges: newTimeRanges }
    };
    setWorkshopData(newData);
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Datos del taller guardados:', workshopData); // Agregar log aquí
      localStorage.setItem('workshopInfo', JSON.stringify(workshopData));
      setOriginalData(workshopData);
      setHasChanges(false);
      
      toast({
        title: 'Éxito',
        description: 'Información del taller guardada correctamente',
      });
    } catch (error) {
      console.error('Error saving workshop info:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la información',
        variant: 'destructive',
      });
    }
  };

  const renderTimeRangeInputs = (day: keyof WorkshopData, dayLabel: string) => {
    const daySchedule = workshopData[day] as DaySchedule;
    
    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">{dayLabel}</Label>
          <div className="flex items-center space-x-2">
            <Label htmlFor={`${day}-open`}>{daySchedule.open ? 'Abierto' : 'Cerrado'}</Label>
            <Switch
              id={`${day}-open`}
              checked={daySchedule.open}
              onCheckedChange={() => toggleDayOpen(day)}
              disabled={!isEditing}
            />
          </div>
        </div>

        {daySchedule.open && (
          <div className="space-y-3">
            {daySchedule.timeRanges.map((timeRange, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  type="time"
                  value={timeRange.start}
                  onChange={(e) => handleTimeRangeChange(day, index, 'start', e.target.value)}
                  placeholder="Inicio"
                  className="flex-1"
                  disabled={!isEditing}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="time"
                  value={timeRange.end}
                  onChange={(e) => handleTimeRangeChange(day, index, 'end', e.target.value)}
                  placeholder="Fin"
                  className="flex-1"
                  disabled={!isEditing}
                />
                {daySchedule.timeRanges.length > 1 && isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeTimeRange(day, index)}
                    className="text-destructive"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTimeRange(day)}
              >
                + Agregar intervalo
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Cancelar edición, restaurar datos originales
      if (originalData) {
        setWorkshopData(originalData);
      }
      setHasChanges(false);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Información del Taller</h1>
        <Button
          type="button"
          variant={isEditing ? "outline" : "default"}
          onClick={toggleEditMode}
          className="flex items-center gap-2"
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" />
              Editar
            </>
          )}
        </Button>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Detalles del Taller
              {hasChanges && (
                <span className="text-sm text-amber-600 font-medium">
                  Tienes cambios sin guardar
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Taller</Label>
              <Input 
                id="name" 
                name="name" 
                value={workshopData.name} 
                onChange={handleChange} 
                required 
                disabled={!isEditing}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Calle</Label>
                <Input 
                  id="street" 
                  name="street" 
                  value={workshopData.street} 
                  onChange={handleChange} 
                  required 
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="number">Número</Label>
                <Input 
                  id="number" 
                  name="number" 
                  value={workshopData.number} 
                  onChange={handleChange} 
                  required 
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input 
                  id="postalCode" 
                  name="postalCode" 
                  value={workshopData.postalCode} 
                  onChange={handleChange} 
                  required 
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Barrio</Label>
                <Input 
                  id="neighborhood" 
                  name="neighborhood" 
                  value={workshopData.neighborhood} 
                  onChange={handleChange} 
                  required 
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={workshopData.city} 
                  onChange={handleChange} 
                  required 
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="province">Provincia</Label>
                <Input 
                  id="province" 
                  name="province" 
                  value={workshopData.province} 
                  onChange={handleChange} 
                  required 
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reference">Referencia</Label>
              <Textarea 
                id="reference" 
                name="reference" 
                value={workshopData.reference} 
                onChange={handleChange} 
                disabled={!isEditing}
              />
            </div>

            {renderTimeRangeInputs('weekdays', 'Días de Semana')}
            {renderTimeRangeInputs('saturday', 'Sábados')}
            {renderTimeRangeInputs('sunday', 'Domingos')}
            {renderTimeRangeInputs('holidays', 'Feriados')}

            <div>
              <Label htmlFor="closedDays">Días Cerrados (separados por coma)</Label>
              <Input 
                id="closedDays" 
                name="closedDays" 
                value={workshopData.closedDays} 
                onChange={handleChange} 
                placeholder="Ej: 25/12, 1/1, 1/5" 
                disabled={!isEditing}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Ingrese las fechas en formato DD/MM separadas por comas
              </p>
            </div>

            {hasChanges && (
              <Button type="submit" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar Cambios
              </Button>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default WorkshopInfo;
