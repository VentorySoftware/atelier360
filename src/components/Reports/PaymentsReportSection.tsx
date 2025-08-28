import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Eye, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getClientsList } from '@/lib/reportQueries';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';

type PaymentWork = Tables<'works'> & {
  clients?: { name: string };
  work_categories?: { name: string };
  profiles?: { full_name: string };
  pending_balance?: number;
};

const PaymentsReportSection = () => {
  const navigate = useNavigate();
  const [paymentWorks, setPaymentWorks] = useState<PaymentWork[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<PaymentWork[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [sortField, setSortField] = useState<keyof PaymentWork>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtros
  const [filters, setFilters] = useState({
    clientId: '',
    startDate: '',
    endDate: '',
    timeRange: '',
    paymentStatus: '' // pending, partial, completed
  });

  // Estados financieros resumidos
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalDeposits: 0,
    totalPending: 0,
    completedWorks: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchPaymentWorks();
  }, [filters]);

  useEffect(() => {
    filterWorks();
    calculateSummary();
  }, [paymentWorks, searchTerm]);

  const fetchInitialData = async () => {
    try {
      const clientsData = await getClientsList();
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchPaymentWorks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('works')
        .select(`
          *,
          clients (name),
          work_categories (name),
          profiles:created_by (full_name)
        `);

      // Aplicar filtros por fechas
      if (filters.timeRange === 'month') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        query = query.gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString());
      } else if (filters.timeRange === 'year') {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        query = query.gte('created_at', startOfYear.toISOString()).lte('created_at', endOfYear.toISOString());
      } else if (filters.startDate && filters.endDate) {
        query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
      }

      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Calcular saldo pendiente para cada trabajo
      const enrichedData = (data || []).map(work => ({
        ...work,
        pending_balance: (work.price || 0) - (work.amount_paid || 0)
      }));

      // Filtrar por estado de pago si está seleccionado
      let filteredByPayment = enrichedData;
      if (filters.paymentStatus === 'pending') {
        filteredByPayment = enrichedData.filter(work => (work.pending_balance || 0) > 0);
      } else if (filters.paymentStatus === 'completed') {
        filteredByPayment = enrichedData.filter(work => (work.pending_balance || 0) === 0 && (work.price || 0) > 0);
      } else if (filters.paymentStatus === 'partial') {
        filteredByPayment = enrichedData.filter(work => 
          (work.amount_paid || 0) > 0 && (work.pending_balance || 0) > 0
        );
      }

      setPaymentWorks(filteredByPayment);
    } catch (error) {
      console.error('Error fetching payment works:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterWorks = () => {
    let filtered = paymentWorks;

    if (searchTerm) {
      filtered = filtered.filter(work =>
        work.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.work_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredWorks(filtered);
  };

  const calculateSummary = () => {
    const summary = filteredWorks.reduce((acc, work) => {
      acc.totalIncome += work.price || 0;
      acc.totalDeposits += work.deposit_amount || 0;
      acc.totalPending += work.pending_balance || 0;
      if (work.status === 'delivered' || work.status === 'completed') {
        acc.completedWorks += 1;
      }
      return acc;
    }, {
      totalIncome: 0,
      totalDeposits: 0,
      totalPending: 0,
      completedWorks: 0
    });

    setFinancialSummary(summary);
  };

  const handleSort = (field: keyof PaymentWork) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredWorks.map(work => ({
      'ID': work.id.substring(0, 8),
      'Cliente': work.clients?.name || 'N/A',
      'Categoría': work.work_categories?.name || 'N/A',
      'Usuario': work.profiles?.full_name || 'N/A',
      'Estado': getStatusLabel(work.status || ''),
      'Precio Total': work.price || 0,
      'Depósito': work.deposit_amount || 0,
      'Estado Depósito': getDepositStatusLabel(work.deposit_status || ''),
      'Importe Cobrado': work.amount_paid || 0,
      'Saldo Pendiente': work.pending_balance || 0,
      'Medio de Pago': work.payment_method || 'N/A',
      'Fecha Entrega': work.actual_delivery_date || 'N/A',
      'Fecha Creación': new Date(work.created_at || '').toLocaleDateString('es-AR')
    }));

    // Agregar resumen al final
    exportData.push({
      'ID': '',
      'Cliente': '',
      'Categoría': '',
      'Usuario': '',
      'Estado': 'RESUMEN',
      'Precio Total': financialSummary.totalIncome,
      'Depósito': financialSummary.totalDeposits,
      'Estado Depósito': '',
      'Importe Cobrado': financialSummary.totalIncome - financialSummary.totalPending,
      'Saldo Pendiente': financialSummary.totalPending,
      'Medio de Pago': '',
      'Fecha Entrega': '',
      'Fecha Creación': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagos');
    
    const fileName = `reporte_pagos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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

  const getDepositStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      partial: 'Parcial'
    };
    return statusLabels[status] || status;
  };

  const getPaymentStatusBadge = (work: PaymentWork) => {
    const totalPrice = work.price || 0;
    const amountPaid = work.amount_paid || 0;
    const pendingBalance = work.pending_balance || 0;

    if (pendingBalance === 0 && totalPrice > 0) {
      return <Badge variant="default">Pagado</Badge>;
    } else if (amountPaid > 0 && pendingBalance > 0) {
      return <Badge variant="secondary">Parcial</Badge>;
    } else if (pendingBalance > 0) {
      return <Badge variant="destructive">Pendiente</Badge>;
    }
    return <Badge variant="outline">Sin datos</Badge>;
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
    <div className="space-y-6">
      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Ingresos Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalDeposits)}</div>
            <p className="text-xs text-muted-foreground">Total Depósitos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalPending)}</div>
            <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{financialSummary.completedWorks}</div>
            <p className="text-xs text-muted-foreground">Trabajos Completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cliente</label>
              <Select value={filters.clientId} onValueChange={(value) => setFilters({...filters, clientId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado de Pago</label>
              <Select value={filters.paymentStatus} onValueChange={(value) => setFilters({...filters, paymentStatus: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={filters.timeRange} onValueChange={(value) => {
                setFilters({...filters, timeRange: value, startDate: '', endDate: ''});
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Personalizado</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!filters.timeRange && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en resultados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>
            Resultados ({filteredWorks.length} trabajos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando información de pagos...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('id')}
                    >
                      <div className="flex items-center gap-1">
                        ID
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado Pago</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center gap-1">
                        Total
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Depósito</TableHead>
                    <TableHead>Cobrado</TableHead>
                    <TableHead>Pendiente</TableHead>
                    <TableHead>Medio Pago</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No se encontraron trabajos con los filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWorks.map((work) => (
                      <TableRow key={work.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">
                          {work.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium">
                          {work.clients?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(work)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(work.price || 0)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(work.deposit_amount || 0)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(work.amount_paid || 0)}
                        </TableCell>
                        <TableCell className={work.pending_balance && work.pending_balance > 0 ? 'font-medium text-red-600' : ''}>
                          {formatCurrency(work.pending_balance || 0)}
                        </TableCell>
                        <TableCell>
                          {work.payment_method || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {work.actual_delivery_date ? formatDate(work.actual_delivery_date) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/works/${work.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsReportSection;