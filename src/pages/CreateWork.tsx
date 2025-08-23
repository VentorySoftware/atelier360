import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Calendar, DollarSign, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  estimated_hours: number;
  tolerance_days: number;
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
    notes: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();

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
        .select('id, name, estimated_hours, tolerance_days')
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
      tentative_delivery_date: deliveryDate
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.category_id || !formData.price) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos obligatorios',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
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
          status: 'pending' as const
        });

      if (error) throw error;

      toast({
        title: 'Trabajo creado',
        description: 'El trabajo se ha creado correctamente'
      });

      navigate('/works');
    } catch (error) {
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

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="h-5 w-5" />
              <span>Información del Trabajo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger>
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
              {clients.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay clientes disponibles. 
                  <Button variant="link" className="h-auto p-0 ml-1" onClick={() => navigate('/clients')}>
                    Crear nuevo cliente
                  </Button>
                </p>
              )}
            </div>

            {/* Categoría */}
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