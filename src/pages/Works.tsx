import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ClipboardList, Eye, Calendar, DollarSign, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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

  const updateWorkStatus = async (workId: string, newStatus: string) => {
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

  const filteredWorks = works.filter(work => {
    const matchesSearch = 
      work.clients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.work_categories.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || work.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const isOverdue = (work: Work) => {
    if (work.status === 'delivered' || work.status === 'cancelled') return false;
    const tentativeDate = new Date(work.tentative_delivery_date);
    const today = new Date();
    return tentativeDate < today;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando trabajos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trabajos y Pedidos</h1>
          <p className="text-muted-foreground">Gestiona todos los trabajos de tu taller</p>
        </div>
        
        <Button onClick={() => navigate('/create-work')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Trabajo
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, categoría o notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
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
        <div className="grid gap-4">
          {filteredWorks.map((work) => (
            <Card key={work.id} className={`hover:shadow-md transition-shadow ${isOverdue(work) ? 'border-destructive' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{work.clients.name}</CardTitle>
                      {isOverdue(work) && (
                        <Badge variant="destructive" className="text-xs">Retrasado</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
                    <Badge variant={statusColors[work.status as keyof typeof statusColors] as any}>
                      {statusLabels[work.status as keyof typeof statusLabels]}
                    </Badge>
                    <Select value={work.status} onValueChange={(newStatus) => updateWorkStatus(work.id, newStatus)}>
                      <SelectTrigger className="w-auto h-8">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Precio:</span>
                    <p className="font-medium">{formatCurrency(work.price)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Depósito:</span>
                    <p className="font-medium">
                      {formatCurrency(work.deposit_amount)}
                      <Badge variant="outline" className="ml-2 text-xs">
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
                    <p className={`font-medium ${isOverdue(work) ? 'text-destructive' : ''}`}>
                      {new Date(work.tentative_delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {work.actual_delivery_date && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Fecha de Entrega:</span>
                    <p className="font-medium text-green-600">
                      {new Date(work.actual_delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {work.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notas:</span>
                    <p className="mt-1 text-foreground">{work.notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    Creado: {new Date(work.created_at).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/work/${work.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteWork(work.id)}
                      className="text-destructive hover:text-destructive"
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