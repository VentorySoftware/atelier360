import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type WorkStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'partial' | 'completed';

interface Work {
  id: string;
  client_id: string;
  category_id: string;
  price: number;
  deposit_amount: number;
  deposit_status: PaymentStatus;
  status: WorkStatus;
  entry_date: string;
  tentative_delivery_date: string;
  actual_delivery_date?: string;
  notes?: string;
  clients?: { name: string };
  work_categories?: { name: string };
}

const EditWork: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [work, setWork] = useState<Work | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch work details with related data
        const { data: workData, error: workError } = await supabase
          .from('works')
          .select(`
            *,
            clients (name),
            work_categories (name)
          `)
          .eq('id', id)
          .single();

        if (workError) throw workError;

        // Fetch clients list
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .order('name');

        if (clientsError) throw clientsError;

        // Fetch categories list
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('work_categories')
          .select('id, name')
          .order('name');

        if (categoriesError) throw categoriesError;

        setWork(workData);
        setClients(clientsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, toast]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!work) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('works')
        .update({
          client_id: work.client_id,
          category_id: work.category_id,
          price: Number(work.price),
          deposit_amount: Number(work.deposit_amount),
          deposit_status: work.deposit_status,
          status: work.status,
          entry_date: work.entry_date,
          tentative_delivery_date: work.tentative_delivery_date,
          actual_delivery_date: work.actual_delivery_date || null,
          notes: work.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', work.id);

      if (error) throw error;

      toast({
        title: '¡Éxito!',
        description: 'El trabajo se ha actualizado correctamente',
      });

      navigate(`/works/${work.id}`);
    } catch (error) {
      console.error('Error updating work:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el trabajo',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (field: keyof Work, value: any) => {
    setWork(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando detalles del trabajo...</p>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-muted-foreground">No se encontró el trabajo</p>
          <Button onClick={() => navigate('/works')} className="mt-4">
            Volver a Trabajos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Editar Trabajo</h1>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Cliente y Trabajo - Combinada */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información del Cliente y Trabajo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información del Cliente */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente</Label>
                  <Select
                    value={work.client_id}
                    onValueChange={(value) => handleInputChange('client_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Información del Trabajo */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Categoría</Label>
                  <Select
                    value={work.category_id}
                    onValueChange={(value) => handleInputChange('category_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={work.status}
                    onValueChange={(value) => handleInputChange('status', value as WorkStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="delivered">Entregado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Financiera */}
          <Card>
            <CardHeader>
              <CardTitle>Información Financiera</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={work.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Anticipo</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  step="0.01"
                  value={work.deposit_amount}
                  onChange={(e) => handleInputChange('deposit_amount', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit_status">Estado del Anticipo</Label>
                <Select
                  value={work.deposit_status}
                  onValueChange={(value) => handleInputChange('deposit_status', value as PaymentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="partial">Parcial</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle>Fechas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entry_date">Fecha de Entrada</Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={work.entry_date}
                  onChange={(e) => handleInputChange('entry_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tentative_delivery_date">Fecha Tentativa de Entrega</Label>
                <Input
                  id="tentative_delivery_date"
                  type="date"
                  value={work.tentative_delivery_date}
                  onChange={(e) => handleInputChange('tentative_delivery_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual_delivery_date">Fecha Real de Entrega</Label>
                <Input
                  id="actual_delivery_date"
                  type="date"
                  value={work.actual_delivery_date || ''}
                  onChange={(e) => handleInputChange('actual_delivery_date', e.target.value || null)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas del Trabajo</Label>
                <Textarea
                  id="notes"
                  value={work.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Agregar notas sobre el trabajo..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={updating}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={updating}>
            <Save className="h-4 w-4 mr-2" />
            {updating ? 'Actualizando...' : 'Actualizar Trabajo'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditWork;
