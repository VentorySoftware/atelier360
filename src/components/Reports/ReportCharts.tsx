import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx'; // Agregar la importación de xlsx

interface FinancialWork {
  id: string;
  price: number;
  deposit_amount: number;
  deposit_status: string;
  status: string;
  actual_delivery_date: string;
  created_at: string;
  clients?: { name: string };
  work_categories?: { name: string };
}

interface ReportChartsProps {
  data: FinancialWork[];
}

const ReportCharts: React.FC<ReportChartsProps> = ({ data }) => {
  const totalRevenue = data.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalWorks = data.length;
  const averageRevenue = totalWorks > 0 ? totalRevenue / totalWorks : 0;

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
      ID: item.id,
      Cliente: item.clients?.name || 'N/A',
      Categoría: item.work_categories?.name || 'N/A',
      Precio: item.price || 0,
      Depósito: item.deposit_amount || 0,
      'Fecha Entrega': item.actual_delivery_date || 'N/A'
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reportes');

    XLSX.writeFile(workbook, `reporte_financiero_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  // Agrupar por mes para el gráfico
  const monthlyData = data.reduce((acc, item) => {
    if (item.actual_delivery_date) {
      const month = new Date(item.actual_delivery_date).toLocaleString('es-AR', { month: 'long' });
      acc[month] = (acc[month] || 0) + (item.price || 0);
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Reporte Financiero</h2>
        <Button onClick={exportToExcel} size="sm" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Ingresos Totales</h3>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800 mb-2">Trabajos Entregados</h3>
          <p className="text-2xl font-bold text-green-900">{totalWorks}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-800 mb-2">Promedio por Trabajo</h3>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(averageRevenue)}</p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-4">Detalle de Trabajos Entregados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Cliente</th>
                <th className="text-left py-2">Categoría</th>
                <th className="text-right py-2">Precio</th>
                <th className="text-right py-2">Depósito</th>
                <th className="text-left py-2">Fecha Entrega</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-4">
                    No hay datos financieros para mostrar
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{item.clients?.name || 'N/A'}</td>
                    <td className="py-2">{item.work_categories?.name || 'N/A'}</td>
                    <td className="text-right py-2 font-medium">{formatCurrency(item.price || 0)}</td>
                    <td className="text-right py-2">{formatCurrency(item.deposit_amount || 0)}</td>
                    <td className="py-2">{item.actual_delivery_date ? formatDate(item.actual_delivery_date) : 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico Simple (Placeholder) */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-md font-medium mb-4">Distribución de Ingresos por Mes</h3>
        <div className="space-y-2">
          {Object.entries(monthlyData).length === 0 ? (
            <p className="text-muted-foreground text-center">No hay datos para mostrar</p>
          ) : (
            Object.entries(monthlyData).map(([month, revenue]) => (
              <div key={month} className="flex items-center justify-between">
                <span className="text-sm">{month}</span>
                <div className="flex items-center space-x-2">
                  <div 
                    className="bg-blue-200 h-4 rounded"
                    style={{ width: `${(revenue / totalRevenue) * 200}px` }}
                  />
                  <span className="text-sm font-medium w-20 text-right">
                    {formatCurrency(revenue)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Total de trabajos entregados: {totalWorks} | Período: {data.length > 0 ? 
          `${formatDate(data[data.length - 1].actual_delivery_date || data[data.length - 1].created_at)} - ${formatDate(data[0].actual_delivery_date || data[0].created_at)}` 
          : 'Sin datos'
        }
      </div>
    </div>
  );
};

export default ReportCharts;
