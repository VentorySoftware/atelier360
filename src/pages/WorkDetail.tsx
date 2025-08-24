import React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
const workshopInfo = JSON.parse(localStorage.getItem('workshopInfo') || '{}');
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Tag, Calendar, DollarSign, Phone } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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

const WorkDetail: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkDetail = async () => {
      try {
        const { data, error } = await supabase
          .from('works')
          .select(`
            *,
            clients (name, phone),
            work_categories (name)
          `)
          .eq('id', workId)
          .single();

        if (error) throw error;

        setWork(data);
      } catch (error) {
        console.error('Error fetching work details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (workId) {
      fetchWorkDetail();
    }
  }, [workId]);

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
        <h1 className="text-3xl font-bold">Detalles del Trabajo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información del Cliente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold">{work.clients.name}</p>
              {work.clients.phone && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{work.clients.phone}</span>
                  </p>
                  <a
                    href={`https://wa.me/${work.clients.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-green-600 hover:text-green-700 transition-colors"
                  >
                    <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.864 3.488"/>
                    </svg>
                    Enviar mensaje por WhatsApp
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información del Trabajo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="h-5 w-5" />
              <span>Información del Trabajo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold">{work.work_categories.name}</p>
              <Badge variant={statusColors[work.status as keyof typeof statusColors] as any}>
                {statusLabels[work.status as keyof typeof statusLabels]}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Entrada: {new Date(work.entry_date).toLocaleDateString()}</span>
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
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Precio:</span>
              <span className="font-semibold">{formatCurrency(work.price)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notas */}
        {work.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{work.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorkDetail;
