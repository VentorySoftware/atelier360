import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface WorkData {
  status: string;
  category_id: string | null;
  client_id: string;
  price: number;
  deposit_amount: number | null;
  tentative_delivery_date: string;
  notes: string | null;
}

interface ClientData {
  name: string;
}

export const useMessageTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load all templates
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
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
    } finally {
      setLoading(false);
    }
  };

  // Find template for specific work status and category
  const findTemplate = (workStatus: string, categoryId: string | null): MessageTemplate | null => {
    // First try to find an exact match (status + category)
    let template = templates.find(t => 
      t.work_status === workStatus && 
      t.work_category_id === categoryId
    );

    // If no exact match, try to find a template for this status with "all categories"
    if (!template) {
      template = templates.find(t => 
        t.work_status === workStatus && 
        t.work_category_id === null
      );
    }

    return template || null;
  };

  // Generate message with real data
  const generateMessage = async (
    template: MessageTemplate, 
    workData: WorkData,
    clientData: ClientData,
    categoryName?: string
  ): Promise<string> => {
    let message = template.message_content;

    // Replace variables with actual data
    message = message.replace(/{nombre_cliente}/g, clientData.name);
    message = message.replace(/{categoria_trabajo}/g, categoryName || 'No especificada');
    message = message.replace(/{estado_trabajo}/g, getStatusLabel(workData.status));
    message = message.replace(/{precio}/g, `$${workData.price.toLocaleString()}`);
    message = message.replace(/{deposito}/g, `$${(workData.deposit_amount || 0).toLocaleString()}`);
    message = message.replace(/{fecha_entrega}/g, formatDate(workData.tentative_delivery_date));
    message = message.replace(/{notas}/g, workData.notes || 'Sin notas adicionales');

    // For appointment-related variables, we might need to fetch appointment data
    // For now, we'll use placeholder values
    message = message.replace(/{fecha_turno}/g, 'Próximamente');

    return message;
  };

  // Check if a template exists for given status and category
  const hasTemplate = (workStatus: string, categoryId: string | null): boolean => {
    return findTemplate(workStatus, categoryId) !== null;
  };

  // Get default template
  const getDefaultTemplate = (): MessageTemplate => {
    return {
      id: 'default',
      name: 'Template por defecto',
      work_status: 'default',
      work_category_id: null,
      message_content: 'Hola {nombre_cliente}, hay una actualización sobre tu trabajo. Estado: {estado_trabajo}. Para más información, contáctanos.',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  // Helper function to get status label
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'completed': 'Completado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return statusLabels[status] || status;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Load templates on hook initialization
  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading,
    loadTemplates,
    findTemplate,
    generateMessage,
    hasTemplate,
    getDefaultTemplate
  };
};