import React, { useState } from 'react';
import { Send, MessageSquare, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';

interface NotifyClientButtonProps {
  workData: {
    id: string;
    status: string;
    category_id: string | null;
    client_id: string;
    price: number;
    deposit_amount: number | null;
    tentative_delivery_date: string;
    notes: string | null;
  };
  clientData: {
    name: string;
    phone?: string;
  };
  categoryName?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const NotifyClientButton: React.FC<NotifyClientButtonProps> = ({
  workData,
  clientData,
  categoryName,
  disabled = false,
  variant = 'default',
  size = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { findTemplate, generateMessage, hasTemplate, getDefaultTemplate } = useMessageTemplates();
  const { toast } = useToast();

  // Check if template exists for current work
  const templateExists = hasTemplate(workData.status, workData.category_id);

  // Generate message when dialog opens
  const handleDialogOpen = async () => {
    setIsGenerating(true);
    try {
      // Find template or use default
      const template = findTemplate(workData.status, workData.category_id) || getDefaultTemplate();
      
      // Generate personalized message
      const generatedMessage = await generateMessage(template, workData, clientData, categoryName);
      setMessage(generatedMessage);
    } catch (error) {
      console.error('Error generating message:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el mensaje',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: 'Copiado',
        description: 'Mensaje copiado al portapapeles'
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: 'Error',
        description: 'No se pudo copiar el mensaje',
        variant: 'destructive'
      });
    }
  };

  // Open WhatsApp with pre-filled message
  const handleOpenWhatsApp = () => {
    if (!clientData.phone) {
      toast({
        title: 'Sin número de teléfono',
        description: 'El cliente no tiene un número de teléfono registrado',
        variant: 'destructive'
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Sin mensaje',
        description: 'No hay mensaje para enviar',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Clean phone number (remove spaces, dashes, parentheses, etc.)
      let cleanPhone = clientData.phone.replace(/[\s\-\(\)\+]/g, '');
      
      // Add country code if not present (assuming Argentina +54)
      if (!cleanPhone.startsWith('54') && !cleanPhone.startsWith('+54')) {
        cleanPhone = '54' + cleanPhone;
      }
      
      // Remove + if present
      cleanPhone = cleanPhone.replace(/^\+/, '');
      
      console.log('Original phone:', clientData.phone);
      console.log('Cleaned phone:', cleanPhone);
      console.log('Message length:', message.length);
      
      // Create WhatsApp URL with pre-filled message
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      
      console.log('WhatsApp URL:', whatsappUrl);
      
      // Try multiple methods to open WhatsApp
      const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      if (!opened || opened.closed || typeof opened.closed == 'undefined') {
        // Fallback: try to navigate in same window
        console.log('Popup blocked, trying fallback...');
        window.location.href = whatsappUrl;
      } else {
        console.log('WhatsApp opened successfully');
      }
      
      toast({
        title: 'WhatsApp abierto',
        description: `Se abrió WhatsApp para ${cleanPhone}`
      });
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      toast({
        title: 'Error',
        description: 'No se pudo abrir WhatsApp. Intenta copiar el mensaje y enviarlo manualmente.',
        variant: 'destructive'
      });
    }
  };

  const getButtonText = () => {
    if (!templateExists) {
      return 'Notificar Cliente (Template por defecto)';
    }
    return 'Notificar Cliente';
  };

  const getButtonIcon = () => {
    return templateExists ? <Send className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          onClick={handleDialogOpen}
          className="flex items-center gap-2"
        >
          {getButtonIcon()}
          {getButtonText()}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Notificar Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client and Work Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Información del Cliente y Trabajo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Cliente: {clientData.name}</Badge>
                <Badge variant="outline">Trabajo: {workData.id}</Badge>
                {categoryName && <Badge variant="outline">Categoría: {categoryName}</Badge>}
                <Badge variant={templateExists ? 'default' : 'secondary'}>
                  {templateExists ? 'Template personalizado' : 'Template por defecto'}
                </Badge>
              </div>
              {clientData.phone && (
                <p className="text-sm text-muted-foreground">
                  Teléfono: {clientData.phone}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Template Warning */}
          {!templateExists && (
            <Alert>
              <AlertDescription>
                No se encontró un template específico para el estado "{workData.status}" 
                {categoryName && ` y la categoría "${categoryName}"`}. 
                Se usará el template por defecto. Puedes crear un template personalizado 
                en la sección de Configuración de Templates.
              </AlertDescription>
            </Alert>
          )}

          {/* Message Preview/Editor */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Mensaje a enviar (puedes editarlo antes de enviar):
            </label>
            {isGenerating ? (
              <div className="h-32 border rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Generando mensaje...</p>
              </div>
            ) : (
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px]"
                placeholder="El mensaje generado aparecerá aquí..."
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleOpenWhatsApp}
              disabled={!message || !clientData.phone}
              className="flex items-center gap-2 flex-1"
            >
              <ExternalLink className="h-4 w-4" />
              Enviar por WhatsApp
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCopyMessage}
              disabled={!message}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cerrar
            </Button>
          </div>

          {/* Phone Number Warning */}
          {!clientData.phone && (
            <Alert variant="destructive">
              <AlertDescription>
                El cliente no tiene un número de teléfono registrado. 
                Puedes copiar el mensaje y enviarlo manualmente, o agregar 
                el número de teléfono en la información del cliente.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};