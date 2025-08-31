import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Save, X, RotateCcw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Available dynamic variables
const DYNAMIC_VARIABLES = [
  { key: '{nombre_cliente}', description: 'Nombre del cliente' },
  { key: '{fecha_turno}', description: 'Fecha del turno' },
  { key: '{categoria_trabajo}', description: 'Categoría del trabajo' },
  { key: '{estado_trabajo}', description: 'Estado del trabajo' },
  { key: '{precio}', description: 'Precio del trabajo' },
  { key: '{deposito}', description: 'Monto del depósito' },
  { key: '{fecha_entrega}', description: 'Fecha tentativa de entrega' },
  { key: '{notas}', description: 'Notas del trabajo' }
];

// Available emojis for WhatsApp
const WHATSAPP_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
  '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋',
  '🖖', '👏', '🙌', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾',
  '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷',
  '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'
];

// Work status options
const WORK_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'completed', label: 'Completado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' }
];

interface MessageTemplate {
  id: string;
  name: string;
  work_status: string;
  work_category_id: string | null;
  message_content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkCategory {
  id: string;
  name: string;
}

export default function MessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [categories, setCategories] = useState<WorkCategory[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    work_status: '',
    work_category_id: 'all',
    message_content: ''
  });
  const [originalFormData, setOriginalFormData] = useState(formData);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [conflictingTemplate, setConflictingTemplate] = useState<MessageTemplate | null>(null);
  const { toast } = useToast();

  // Load templates and categories
  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  // Validate uniqueness in real-time
  useEffect(() => {
    if (formData.work_status && formData.work_category_id && isEditing) {
      validateUniqueness();
    } else {
      setValidationError(null);
      setConflictingTemplate(null);
    }
  }, [formData.work_status, formData.work_category_id, selectedTemplate?.id]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
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
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('work_categories')
        .select('id, name')
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
  };

  const validateUniqueness = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('work_status', formData.work_status)
        .eq('work_category_id', formData.work_category_id === 'all' ? null : formData.work_category_id)
        .neq('id', selectedTemplate?.id || '');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const conflicting = data[0];
        setValidationError(`Ya existe un template con esta combinación: "${conflicting.name}"`);
        setConflictingTemplate(conflicting);
      } else {
        setValidationError(null);
        setConflictingTemplate(null);
      }
    } catch (error) {
      console.error('Error validating uniqueness:', error);
    }
  };

  const generatePreview = useMemo(() => {
    let preview = formData.message_content;
    
    // Replace dynamic variables with sample data
    preview = preview.replace(/{nombre_cliente}/g, 'Juan Pérez');
    preview = preview.replace(/{fecha_turno}/g, '15/02/2024 10:30');
    preview = preview.replace(/{categoria_trabajo}/g, 'Arreglo de Prenda');
    preview = preview.replace(/{estado_trabajo}/g, 'En Progreso');
    preview = preview.replace(/{precio}/g, '$2,500');
    preview = preview.replace(/{deposito}/g, '$1,000');
    preview = preview.replace(/{fecha_entrega}/g, '20/02/2024');
    preview = preview.replace(/{notas}/g, 'Ajustar largo de pantalón');
    
    return preview;
  }, [formData.message_content]);

  const insertVariable = (variable: string) => {
    if (textareaRef) {
      const start = textareaRef.selectionStart;
      const end = textareaRef.selectionEnd;
      const newContent = formData.message_content.substring(0, start) + 
                        variable + 
                        formData.message_content.substring(end);
      
      setFormData(prev => ({ ...prev, message_content: newContent }));
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        if (textareaRef) {
          textareaRef.selectionStart = textareaRef.selectionEnd = start + variable.length;
          textareaRef.focus();
        }
      }, 0);
    }
  };

  const insertEmoji = (emoji: string) => {
    if (textareaRef) {
      const start = textareaRef.selectionStart;
      const end = textareaRef.selectionEnd;
      const newContent = formData.message_content.substring(0, start) + 
                        emoji + 
                        formData.message_content.substring(end);
      
      setFormData(prev => ({ ...prev, message_content: newContent }));
      
      // Set cursor position after inserted emoji
      setTimeout(() => {
        if (textareaRef) {
          textareaRef.selectionStart = textareaRef.selectionEnd = start + emoji.length;
          textareaRef.focus();
        }
      }, 0);
    }
  };

  const handleNew = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      work_status: '',
      work_category_id: 'all',
      message_content: ''
    });
    setOriginalFormData({
      name: '',
      work_status: '',
      work_category_id: 'all',
      message_content: ''
    });
    setIsEditing(true);
    setValidationError(null);
    setConflictingTemplate(null);
  };

  const handleEdit = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    const newFormData = {
      name: template.name,
      work_status: template.work_status,
      work_category_id: template.work_category_id || 'all',
      message_content: template.message_content
    };
    setFormData(newFormData);
    setOriginalFormData(newFormData);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (validationError) {
      toast({
        title: 'Error de validación',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }

    try {
      const templateData = {
        name: formData.name,
        work_status: formData.work_status,
        work_category_id: formData.work_category_id === 'all' ? null : formData.work_category_id,
        message_content: formData.message_content,
        is_active: true
      };

      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('message_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id);
        
        if (error) throw error;
        
        toast({
          title: 'Template actualizado',
          description: 'El template se ha actualizado correctamente'
        });
      } else {
        // Create new template (omit id since it will be auto-generated)
        const { error } = await supabase
          .from('message_templates')
          .insert({
            ...templateData,
            id: '' // Will be auto-generated by trigger
          });
        
        if (error) throw error;
        
        toast({
          title: 'Template creado',
          description: 'El template se ha creado correctamente'
        });
      }

      setIsEditing(false);
      setSelectedTemplate(null);
      loadTemplates();
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
    setIsEditing(false);
    setSelectedTemplate(null);
    setFormData({
      name: '',
      work_status: '',
      work_category_id: 'all',
      message_content: ''
    });
    setValidationError(null);
    setConflictingTemplate(null);
  };

  const handleRestore = () => {
    setFormData(originalFormData);
    setValidationError(null);
    setConflictingTemplate(null);
  };

  const handleDelete = async (template: MessageTemplate) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este template?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', template.id);
      
      if (error) throw error;
      
      toast({
        title: 'Template eliminado',
        description: 'El template se ha eliminado correctamente'
      });
      
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el template',
        variant: 'destructive'
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const option = WORK_STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Todas las categorías';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Categoría desconocida';
  };

  const isFormValid = () => {
    return formData.name.trim() && 
           formData.work_status && 
           formData.message_content.trim() && 
           !validationError;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Templates</h1>
          <p className="text-muted-foreground">
            Gestiona los templates de mensajes para notificaciones automáticas
          </p>
        </div>
        <Button onClick={handleNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Templates Existentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay templates configurados
              </p>
            ) : (
              templates.map((template) => (
                <div 
                  key={template.id} 
                  className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleEdit(template)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{template.name}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(template);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {getStatusLabel(template.work_status)}
                    </Badge>
                    <Badge variant="outline">
                      {getCategoryName(template.work_category_id)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.message_content}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Editor de Templates */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTemplate ? 'Editar Template' : 'Nuevo Template'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Template</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Notificación de trabajo completado"
                />
              </div>

              <div>
                <Label htmlFor="work_status">Estado del Trabajo</Label>
                <Select
                  value={formData.work_status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, work_status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="work_category_id">Categoría de Trabajo</Label>
                <Select
                  value={formData.work_category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, work_category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Validation Error */}
              {validationError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {validationError}
                    {conflictingTemplate && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(conflictingTemplate)}
                        >
                          Ver template existente
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="message_content">Mensaje del Template</Label>
                <Textarea
                  id="message_content"
                  ref={setTextareaRef}
                  value={formData.message_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, message_content: e.target.value }))}
                  placeholder="Escribe tu mensaje aquí. Usa las variables dinámicas para personalizar..."
                  className="min-h-[120px]"
                />
              </div>

              {/* Variables Dinámicas */}
              <div>
                <Label>Variables Dinámicas</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DYNAMIC_VARIABLES.map((variable) => (
                    <Button
                      key={variable.key}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(variable.key)}
                      title={variable.description}
                    >
                      {variable.key}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Emojis */}
              <div>
                <Label>Emojis de WhatsApp</Label>
                <div className="flex flex-wrap gap-1 mt-2 max-h-32 overflow-y-auto">
                  {WHATSAPP_EMOJIS.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => insertEmoji(emoji)}
                      className="h-8 w-8 p-0"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Vista Previa */}
              <div>
                <Label>Vista Previa</Label>
                <div className="border rounded-lg p-3 bg-muted/50 min-h-[80px] whitespace-pre-wrap">
                  {generatePreview || 'La vista previa aparecerá aquí...'}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={!isFormValid()}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Guardar
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button variant="outline" onClick={handleRestore}>
                  <RotateCcw className="h-4 w-4" />
                  Restaurar
                </Button>
                <Button variant="outline" onClick={() => setValidationError(null)}>
                  <CheckCircle className="h-4 w-4" />
                  Validar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}