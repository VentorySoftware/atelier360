import React from 'react';
import { Tables } from '@/integrations/supabase/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ReportTableProps {
  data: Tables<'works'>[] | Tables<'appointments'>[];
  title: string;
}

const ReportTable: React.FC<ReportTableProps> = ({ data, title }) => {
  const exportToCSV = () => {
    const csvContent = [
      ['ID', 'Cliente', 'Estado', 'Precio', 'Fecha Entrega', 'Fecha Creación'],
      ...data.map(item => [
        item.id,
        item.clients?.name || 'N/A',
        item.status || 'N/A',
        item.price || '0',
        item.actual_delivery_date || 'N/A',
        item.created_at || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      completed: 'Completado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      scheduled: 'Programada',
      confirmed: 'Confirmada',
      rescheduled: 'Reprogramada'
    };
    return statusLabels[status] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button onClick={exportToCSV} size="sm" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Fecha Entrega</TableHead>
              <TableHead>Fecha Creación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay datos para mostrar
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id.substring(0, 8)}...</TableCell>
                  <TableCell>{item.clients?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.status === 'completed' || item.status === 'delivered' 
                        ? 'bg-green-100 text-green-800' 
                        : item.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusLabel(item.status || '')}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(item.price || 0)}</TableCell>
                  <TableCell>{item.actual_delivery_date ? formatDate(item.actual_delivery_date) : 'N/A'}</TableCell>
                  <TableCell>{item.created_at ? formatDate(item.created_at) : 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        Total de registros: {data.length}
      </div>
    </div>
  );
};

export default ReportTable;
