import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Eye, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';

type Client = Tables<'clients'> & {
  works_count?: number;
  total_spent?: number;
  last_work_date?: string;
};

const ClientsReportSection = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Client>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    nameFilter: ''
  });

  useEffect(() => {
    fetchClients();
  }, [filters]);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          works:works(count)
        `);

      // Aplicar filtros por fecha
      if (filters.startDate && filters.endDate) {
        query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Enriquecer datos con estadísticas
      const enrichedClients = await Promise.all((data || []).map(async (client) => {
        // Obtener estadísticas de trabajos
        const { data: worksData } = await supabase
          .from('works')
          .select('price, created_at')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false });

        const works_count = worksData?.length || 0;
        const total_spent = worksData?.reduce((sum, work) => sum + (work.price || 0), 0) || 0;
        const last_work_date = worksData?.[0]?.created_at || null;

        return {
          ...client,
          works_count,
          total_spent,
          last_work_date
        };
      }));

      setClients(enrichedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.id.toLowerCase().includes(searchTerm.toLowerCase())
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

    setFilteredClients(filtered);
  };

  const handleSort = (field: keyof Client) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredClients.map(client => ({
      'ID': client.id.substring(0, 8),
      'Nombre': client.name || 'N/A',
      'Email': client.email || 'N/A',
      'Teléfono': client.phone || 'N/A',
      'Dirección': client.address || 'N/A',
      'Trabajos Realizados': client.works_count || 0,
      'Total Gastado': client.total_spent || 0,
      'Último Trabajo': client.last_work_date ? new Date(client.last_work_date).toLocaleDateString('es-AR') : 'N/A',
      'Fecha Alta': new Date(client.created_at || '').toLocaleDateString('es-AR'),
      'Notas': client.notes || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    
    const fileName = `reporte_clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Fecha Alta Inicio</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Fecha Alta Fin</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={fetchClients} className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono o ID..."
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
            Resultados ({filteredClients.length} clientes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando clientes...</div>
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
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Nombre
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('works_count')}
                    >
                      <div className="flex items-center gap-1">
                        Trabajos
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('total_spent')}
                    >
                      <div className="flex items-center gap-1">
                        Total Gastado
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Último Trabajo</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Fecha Alta
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No se encontraron clientes con los filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">
                          {client.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{client.email || 'Sin email'}</div>
                            <div className="text-sm text-muted-foreground">{client.phone || 'Sin teléfono'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{client.works_count || 0}</span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(client.total_spent || 0)}
                        </TableCell>
                        <TableCell>
                          {client.last_work_date ? formatDate(client.last_work_date) : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          {client.created_at ? formatDate(client.created_at) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/clients`)}
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

export default ClientsReportSection;