import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Save, X, RotateCcw, CheckCircle, AlertTriangle, Eye, Copy } from 'lucide-react';
import { Constants } from '@/integrations/supabase/types';

interface MessageTemplate {
  id: string;
  name: string;
  work_status: string;
  work_category_id: string | null;
  message_content: string;
  is_active: boolean;
}

interface WorkCategory {
  id: string;
  name: string;
  is_active: boolean;
}

interface TemplateVariable {
  key: string;
  label: string;
  description: string;
}

const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: '{nombre_cliente}', label: 'Nombre del Cliente', description: 'Nombre completo del cliente' },
  { key: '{fecha_turno}', label: 'Fecha del Turno', description: 'Fecha programada para el turno' },
  { key: '{hora_turno}', label: 'Hora del Turno', description: 'Hora programada para el turno' },
  { key: '{nombre_trabajo}', label: 'Tipo de Trabajo', description: 'Categoría del trabajo' },
  { key: '{precio}', label: 'Precio', description: 'Precio total del trabajo' },
  { key: '{deposito}', label: 'Depósito', description: 'Monto del depósito' },
  { key: '{fecha_entrega}', label: 'Fecha de Entrega', description: 'Fecha tentativa de entrega' },
  { key: '{notas}', label: 'Notas', description: 'Notas adicionales del trabajo' },
];

const EMOJI_SHORTCUTS = [
  '😊', '👋', '✅', '📅', '💰', '📱', '⏰', '🔔', '💼', '✨',
  '👍', '❤️', '🙏', '📝', '🎉', '⚡', '🔥', '💯', '🚀', '💪'
];

const MessageTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    work_status: '',
    work_category_id: '',
    message_content: ''
  });
  const [previewContent, setPreviewContent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [originalFormData, setOriginalFormData] = useState(formData);
  const { toast } = useToast();

  const workStatuses = Constants.public.Enums.work_status;

  const loadTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los templates',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('work_categories')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        variant: 'destructive'
      });
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, [loadTemplates, loadCategories]);

  const validateUniqueness = useCallback(async (workStatus: string, categoryId: string) => {
    if (!workStatus) return true;

    const existingTemplate = templates.find(t => 
      t.work_status === workStatus && 
      t.work_category_id === (categoryId || null) &&
      t.id !== selectedTemplate?.id
    );

    if (existingTemplate) {
      setValidationError(`Ya existe un template para "${workStatus}" y esta categoría: "${existingTemplate.name}"`);
      return false;
    }

    setValidationError(null);
    return true;
  }, [templates, selectedTemplate]);

  useEffect(() => {
    if (formData.work_status || formData.work_category_id) {
      validateUniqueness(formData.work_status, formData.work_category_id);
    }
  }, [formData.work_status, formData.work_category_id, validateUniqueness]);

  const generatePreview = useCallback(() => {
    let preview = formData.message_content;
    
    // Replace variables with sample data
    const sampleData = {
      '{nombre_cliente}': 'María García',
      '{fecha_turno}': '15/03/2024',
      '{hora_turno}': '14:30',
      '{nombre_trabajo}': 'Corte y Color',
      '{precio}': '$15,000',
      '{deposito}': '$7,500',
      '{fecha_entrega}': '20/03/2024',
      '{notas}': 'Traer foto de referencia'
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    setPreviewContent(preview);
  }, [formData.message_content]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  const handleVariableInsert = (variable: string) => {
    const textarea = document.getElementById('message-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = formData.message_content.substring(0, start) + variable + formData.message_content.substring(end);
      
      setFormData(prev => ({ ...prev, message_content: newContent }));
      
      // Focus back to textarea and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleEmojiInsert = (emoji: string) => {
    const textarea = document.getElementById('message-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = formData.message_content.substring(0, start) + emoji + formData.message_content.substring(end);
      
      setFormData(prev => ({ ...prev, message_content: newContent }));
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  };

  const handleCreateNew = () => {
    const newFormData = {
      name: '',
      work_status: '',
      work_category_id: '',
      message_content: ''
    };
    setFormData(newFormData);
    setOriginalFormData(newFormData);
    setSelectedTemplate(null);
    setIsCreating(true);
    setIsEditing(false);
    setValidationError(null);
  };

  const handleSelectTemplate = (template: MessageTemplate) => {
    const newFormData = {
      name: template.name,
      work_status: template.work_status,
      work_category_id: template.work_category_id || '',
      message_content: template.message_content
    };
    setFormData(newFormData);
    setOriginalFormData(newFormData);
    setSelectedTemplate(template);
    setIsEditing(true);
    setIsCreating(false);
    setValidationError(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.work_status || !formData.message_content) {
      toast({
        title: 'Error',
        description: 'Por favor complete todos los campos obligatorios',
        variant: 'destructive'
      });
      return;
    }

    if (validationError) {
      toast({
        title: 'Error',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }

    try {
      const templateData = {
        name: formData.name,
        work_status: formData.work_status,
        work_category_id: formData.work_category_id || null,
        message_content: formData.message_content
      };

      if (isCreating) {
        const { error } = await supabase
          .from('message_templates')
          .insert(templateData as any);

        if (error) throw error;

        toast({
          title: 'Éxito',
          description: 'Template creado correctamente'
        });
      } else if (selectedTemplate) {
        const { error } = await supabase
          .from('message_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id);

        if (error) throw error;

        toast({
          title: 'Éxito',
          description: 'Template actualizado correctamente'
        });
      }

      await loadTemplates();
      setIsCreating(false);
      setIsEditing(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el template',
        variant: 'destructive'
      });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedTemplate(null);
    setValidationError(null);
  };

  const handleRestore = () => {
    setFormData(originalFormData);
    setValidationError(null);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Todas las categorías';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Categoría desconocida';
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      completed: 'Completado',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return statusLabels[status] || status;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración de Templates</h1>
          <p className="text-muted-foreground">Gestiona plantillas de mensajes para notificaciones automáticas</p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Templates Existentes</CardTitle>
            <CardDescription>
              Selecciona un template para editarlo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay templates configurados
              </p>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                    selectedTemplate?.id === template.id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{template.name}</h3>
                    <Badge variant="secondary">{getStatusLabel(template.work_status)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getCategoryName(template.work_category_id)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Editor de Template */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Crear Nuevo Template' : isEditing ? 'Editar Template' : 'Editor de Template'}
            </CardTitle>
            <CardDescription>
              {isCreating || isEditing ? 'Configure los detalles del template' : 'Selecciona un template para editarlo'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(isCreating || isEditing) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Nombre del Template *</Label>
                    <Input
                      id="template-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Recordatorio de turno"
                    />
                  </div>
                  <div>
                    <Label htmlFor="work-status">Estado *</Label>
                    <Select value={formData.work_status} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, work_status: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {workStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {getStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Tipo de Trabajo</Label>
                  <Select value={formData.work_category_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, work_category_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas las categorías</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* Variables Dinámicas */}
                <div>
                  <Label className="text-sm font-medium">Variables Dinámicas</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Haz clic en una variable para insertarla en el mensaje
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATE_VARIABLES.map((variable) => (
                      <Button
                        key={variable.key}
                        variant="outline"
                        size="sm"
                        onClick={() => handleVariableInsert(variable.key)}
                        className="text-xs h-8"
                        title={variable.description}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {variable.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Emojis */}
                <div>
                  <Label className="text-sm font-medium">Emojis Rápidos</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {EMOJI_SHORTCUTS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEmojiInsert(emoji)}
                        className="text-lg h-8 w-8 p-0"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="message-content">Contenido del Mensaje *</Label>
                  <Textarea
                    id="message-content"
                    value={formData.message_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, message_content: e.target.value }))}
                    placeholder="Escribe tu mensaje aquí. Usa las variables dinámicas para personalizar..."
                    className="min-h-[120px]"
                  />
                </div>

                {/* Vista Previa */}
                {formData.message_content && (
                  <div>
                    <Label className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Vista Previa
                    </Label>
                    <div className="p-3 bg-muted rounded-lg border mt-2">
                      <p className="whitespace-pre-wrap text-sm">{previewContent}</p>
                    </div>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="flex justify-between pt-4">
                  <div className="flex gap-2">
                    <Button onClick={handleCancel} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    {isEditing && (
                      <Button onClick={handleRestore} variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar
                      </Button>
                    )}
                  </div>
                  <Button 
                    onClick={handleSave} 
                    disabled={!!validationError || !formData.name || !formData.work_status || !formData.message_content}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isCreating ? 'Crear Template' : 'Guardar Cambios'}
                  </Button>
                </div>
              </>
            )}

            {!isCreating && !isEditing && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Selecciona un template de la lista o crea uno nuevo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessageTemplates;