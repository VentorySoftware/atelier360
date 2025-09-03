import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Calendar, DollarSign, User, Tag, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import AppointmentForm from '@/components/AppointmentForm';
import QuickClientForm from '@/components/QuickClientForm';
import { useAuth } from '@/hooks/useAuth';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

interface Category {
  id: string;
  name: string;
  estimated_hours: number;
  tolerance_days: number;
  requires_appointment: boolean;
}

export default function CreateWork() {
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    category_id: '',
    price: '',
    deposit_amount: '',
    deposit_status: 'pending',
    entry_date: new Date().toISOString().split('T')[0],
    tentative_delivery_date: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchClients();
    fetchCategories();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
        variant: 'destructive'
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('work_categories')
        .select('id, name, estimated_hours, tolerance_days, requires_appointment')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        variant: 'destructive'
      });
    }
  };

  const handleClientCreated = (newClient: any) => {
    console.log('=== handleClientCreated START ===');
    console.log('New client received:', newClient);
    console.log('Current clients before update:', clients);
    console.log('Current formData before update:', formData);
    
    // Normalizar el nuevo cliente para que coincida con el formato esperado
    const normalizedClient: Client = {
      id: newClient.id,
      name: newClient.name,
      phone: newClient.phone,
      email: newClient.email
    };
    
    setClients(prev => {
      const updated = [...prev, normalizedClient];
      console.log('Setting new clients list:', updated);
      return updated;
    });
    setFormData(prev => {
      const updated = { ...prev, client_id: newClient.id };
      console.log('Setting new formData:', updated);
      return updated;
    });
    console.log('=== handleClientCreated END ===');
  };

  const calculateDeliveryDate = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';

    const entryDate = new Date(formData.entry_date);
    const deliveryDate = new Date(entryDate);
    
    // Calcular días laborables basado en horas estimadas (8 horas por día)
    const workDays = Math.ceil(category.estimated_hours / 8) || 1;
    const totalDays = workDays + category.tolerance_days;
    
    // Agregar días laborables (excluir fines de semana)
    let addedDays = 0;
    while (addedDays < totalDays) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      // Si no es sábado (6) o domingo (0), contar el día
      if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
        addedDays++;
      }
    }

    return deliveryDate.toISOString().split('T')[0];
  };

  const handleCategoryChange = (categoryId: string) => {
    const deliveryDate = calculateDeliveryDate(categoryId);
    setFormData({
      ...formData,
      category_id: categoryId,
      tentative_delivery_date: deliveryDate,
      // Reset appointment fields when category changes
      appointment_date: '',
      appointment_time: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if category requires appointment
    const selectedCategory = categories.find(c => c.id === formData.category_id);
    
    if (!formData.client_id || !formData.category_id || !formData.price) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos obligatorios',
        variant: 'destructive'
      });
      return;
    }

    // Validate appointment fields if category requires appointment
    if (selectedCategory?.requires_appointment && (!formData.appointment_date || !formData.appointment_time)) {
      toast({
        title: 'Error',
        description: 'La cita con el cliente es obligatoria para esta categoría',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Create the work first
      const { data: workData, error: workError } = await supabase
        .from('works')
        .insert({
          client_id: formData.client_id,
          category_id: formData.category_id,
          price: parseFloat(formData.price),
          deposit_amount: parseFloat(formData.deposit_amount) || 0,
          deposit_status: formData.deposit_status as 'pending' | 'partial' | 'completed',
          entry_date: formData.entry_date,
          tentative_delivery_date: formData.tentative_delivery_date,
          notes: formData.notes || null,
          status: 'pending' as const,
          created_by: null // Will be handled by authentication logic
        } as any)
        .select()
        .single();

      if (workError) throw workError;

      // Create appointment if category requires it
      if (selectedCategory?.requires_appointment && formData.appointment_date && formData.appointment_time) {
        const { error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            work_id: workData.id,
            client_id: formData.client_id,
            appointment_date: formData.appointment_date,
            appointment_time: formData.appointment_time,
            status: 'scheduled'
          } as any);

        if (appointmentError) throw appointmentError;
      }

      toast({
        title: 'Trabajo creado',
        description: selectedCategory?.requires_appointment 
          ? 'El trabajo y la cita se han creado correctamente'
          : 'El trabajo se ha creado correctamente'
      });

      navigate('/works');
    } catch (error) {
      console.error('Error creating work:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el trabajo',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/works')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Trabajos
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Crear Nuevo Trabajo</h1>
          <p className="text-muted-foreground">Registra un nuevo trabajo en el taller</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Cliente y Trabajo */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información del Cliente y Trabajo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.client_id} 
                    onValueChange={(value) => {
                      console.log('Select value changed to:', value);
                      setFormData(prev => ({ ...prev, client_id: value }));
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <QuickClientForm onClientCreated={handleClientCreated} />
                </div>
              </div>
            </div>

            {/* Trabajo */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría de Trabajo *</Label>
                <Select value={formData.category_id} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex justify-between w-full">
                          <span>{category.name}</span>
                          <span className="text-muted-foreground text-sm ml-2">
                            {category.estimated_hours}h
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay categorías disponibles. 
                    <Button variant="link" className="h-auto p-0 ml-1" onClick={() => navigate('/categories')}>
                      Crear nueva categoría
                    </Button>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Financiera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Información Financiera</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Precios */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio Total *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-10"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit">Depósito</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="deposit"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-10"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Estado del depósito */}
            <div className="space-y-2">
              <Label htmlFor="deposit_status">Estado del Depósito</Label>
              <Select value={formData.deposit_status} onValueChange={(value) => setFormData({ ...formData, deposit_status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="completed">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fechas y Programación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Fechas y Programación</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entry_date">Fecha de Entrada *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="entry_date"
                    type="date"
                    className="pl-10"
                    value={formData.entry_date}
                    onChange={(e) => {
                      setFormData({ ...formData, entry_date: e.target.value });
                      // Recalcular fecha de entrega si hay categoría seleccionada
                      if (formData.category_id) {
                        const deliveryDate = calculateDeliveryDate(formData.category_id);
                        setFormData(prev => ({ ...prev, entry_date: e.target.value, tentative_delivery_date: deliveryDate }));
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_date">Fecha de Entrega Prevista</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="delivery_date"
                    type="date"
                    className="pl-10"
                    value={formData.tentative_delivery_date}
                    onChange={(e) => setFormData({ ...formData, tentative_delivery_date: e.target.value })}
                  />
                </div>
                {formData.category_id && (
                  <p className="text-xs text-muted-foreground">
                    Calculado automáticamente basado en la categoría seleccionada
                  </p>
                )}
              </div>
            </div>

            {/* Cita con el cliente - solo visible si la categoría requiere cita */}
            {formData.category_id && categories.find(c => c.id === formData.category_id)?.requires_appointment && (
              <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-primary" />
                  <Label className="text-base font-medium">Cita con el cliente *</Label>
                </div>
                <AppointmentForm
                  workId={formData.client_id}
                  clientId={formData.client_id}
                  onAppointmentCreated={(appointmentData) => {
                    // Actualizar el formulario con los datos de la cita
                    setFormData({
                      ...formData,
                      appointment_date: appointmentData.appointment_date,
                      appointment_time: appointmentData.appointment_time
                    });
                  }}
                  onCancel={() => setFormData({ ...formData, appointment_date: '', appointment_time: '' })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información del Taller */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Información del Taller</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Dirección del Taller</Label>
              <p className="text-muted-foreground">123 Calle Principal, Ciudad, Provincia</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Horarios de Atención</Label>
              <p className="text-muted-foreground">Lunes a Viernes: 9:00 AM - 6:00 PM</p>
              <p className="text-muted-foreground">Sábados: 10:00 AM - 4:00 PM</p>
              <p className="text-muted-foreground">Domingos: Cerrado</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Contacto</Label>
              <p className="text-muted-foreground">Teléfono: +54 11 1234-5678</p>
              <p className="text-muted-foreground">Email: taller@ejemplo.com</p>
            </div>
          </CardContent>
        </Card>

        {/* Información Adicional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="h-5 w-5" />
              <span>Información Adicional</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Detalles adicionales sobre el trabajo..."
                rows={4}
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/works')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Crear Trabajo
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
