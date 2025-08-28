import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Eye, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getWorksReport, getUsersList, getClientsList } from '@/lib/reportQueries';
import { Tables } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';

type Work = Tables<'works'> & {
  clients?: { name: string };
  work_categories?: { name: string };
  profiles?: { full_name: string };
};

const WorksReportSection = () => {
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [sortField, setSortField] = useState<keyof Work>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtros
  const [filters, setFilters] = useState<{
    userId: string;
    clientId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled' | 'all' | '';
    startDate: string;
    endDate: string;
  }>({
    userId: '',
    clientId: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchWorks();
  }, [filters]);

  useEffect(() => {
    filterWorks();
  }, [works, searchTerm]);

  const fetchInitialData = async () => {
    try {
      const [usersData, clientsData] = await Promise.all([
        getUsersList(),
        getClientsList()
      ]);
      setUsers(usersData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const data = await getWorksReport(filters);
      setWorks(data as Work[]);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterWorks = () => {
    let filtered = works;

    if (searchTerm) {
      filtered = filtered.filter(work =>
        work.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.work_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.id.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSort = (field: keyof Work) => {
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
      'Precio': work.price || 0,
      'Depósito': work.deposit_amount || 0,
      'Saldo Pendiente': (work.price || 0) - (work.amount_paid || 0),
      'Fecha Entrada': work.entry_date || 'N/A',
      'Fecha Entrega Tentativa': work.tentative_delivery_date || 'N/A',
      'Fecha Entrega Real': work.actual_delivery_date || 'N/A',
      'Fecha Creación': new Date(work.created_at || '').toLocaleDateString('es-AR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trabajos');
    
    const fileName = `reporte_trabajos_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
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
              <label className="text-sm font-medium mb-2 block">Usuario</label>
              <Select value={filters.userId} onValueChange={(value) => setFilters({...filters, userId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los usuarios</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value as any})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
            <div className="text-center py-8">Cargando trabajos...</div>
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
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('clients')}
                    >
                      <div className="flex items-center gap-1">
                        Cliente
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center gap-1">
                        Precio
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Fecha Creación
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                          {work.work_categories?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {work.profiles?.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(work.status || '')}>
                            {getStatusLabel(work.status || '')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(work.price || 0)}
                        </TableCell>
                        <TableCell>
                          {work.created_at ? formatDate(work.created_at) : 'N/A'}
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

export default WorksReportSection;