import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  description?: string;
  estimated_hours: number;
  tolerance_days: number;
  requires_appointment: boolean;
  is_active: boolean;
  created_at: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_hours: 0,
    tolerance_days: 3,
    requires_appointment: false,
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('work_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('work_categories')
          .update(formData)
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: 'Categoría actualizada',
          description: 'La categoría se ha actualizado correctamente'
        });
      } else {
        const { error } = await supabase
          .from('work_categories')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Categoría creada',
          description: 'La categoría se ha creado correctamente'
        });
      }

      resetForm();
      setIsCreateDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: editingCategory ? 'No se pudo actualizar la categoría' : 'No se pudo crear la categoría',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      estimated_hours: category.estimated_hours,
      tolerance_days: category.tolerance_days,
      requires_appointment: category.requires_appointment,
      is_active: category.is_active
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return;

    try {
      const { error } = await supabase
        .from('work_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: 'Categoría eliminada',
        description: 'La categoría se ha eliminado correctamente'
      });
      fetchCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la categoría',
        variant: 'destructive'
      });
    }
  };

  const toggleStatus = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('work_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: `La categoría se ha ${!category.is_active ? 'activado' : 'desactivado'}`
      });
      fetchCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive'
      });
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      estimated_hours: 0,
      tolerance_days: 3,
      requires_appointment: false,
      is_active: true
    });
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categorías de Trabajo</h1>
          <p className="text-muted-foreground">Gestiona los tipos de trabajos que realizas en tu taller</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Reparación de motor"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el tipo de trabajo"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated_hours">Horas Estimadas</Label>
                  <Input
                    id="estimated_hours"
                    type="number"
                    min="0"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tolerance_days">Días de Tolerancia</Label>
                  <Input
                    id="tolerance_days"
                    type="number"
                    min="0"
                    value={formData.tolerance_days}
                    onChange={(e) => setFormData({ ...formData, tolerance_days: parseInt(e.target.value) || 0 })}
                    placeholder="3"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_appointment"
                  checked={formData.requires_appointment}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_appointment: checked })}
                />
                <Label htmlFor="requires_appointment">Requiere cita previa</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Categoría activa</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar categorías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm ? 'No se encontraron categorías' : 'No hay categorías registradas'}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Comienza creando tu primera categoría de trabajo'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {category.name}
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(category)}
                      title={category.is_active ? 'Desactivar' : 'Activar'}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.description && (
                  <p className="text-sm text-muted-foreground">
                    {category.description.length > 100 
                      ? `${category.description.substring(0, 100)}...` 
                      : category.description}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{category.estimated_hours}h</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{category.tolerance_days}d</span>
                  </div>
                </div>

                {category.requires_appointment && (
                  <Badge variant="outline" className="text-xs">
                    Requiere cita
                  </Badge>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Creada: {new Date(category.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}