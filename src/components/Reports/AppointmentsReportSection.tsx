import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Eye, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAppointmentsReport, getClientsList } from '@/lib/reportQueries';
import { Tables } from '@/integrations/supabase/types';
import * as XLSX from 'xlsx';

type Appointment = Tables<'appointments'> & {
  clients?: { name: string };
  works?: { work_categories?: { name: string } };
  profiles?: { full_name: string };
};

const AppointmentsReportSection = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [sortField, setSortField] = useState<keyof Appointment>('appointment_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtros
  const [filters, setFilters] = useState<{
    clientId: string;
    appointmentStatus: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'all' | '';
    startDate: string;
    endDate: string;
  }>({
    clientId: '',
    appointmentStatus: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm]);

  const fetchInitialData = async () => {
    try {
      const clientsData = await getClientsList();
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await getAppointmentsReport(filters);
      setAppointments(data as Appointment[]);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.works?.work_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
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

    setFilteredAppointments(filtered);
  };

  const handleSort = (field: keyof Appointment) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredAppointments.map(appointment => ({
      'ID': appointment.id.substring(0, 8),
      'Cliente': appointment.clients?.name || 'N/A',
      'Categoría Trabajo': appointment.works?.work_categories?.name || 'N/A',
      'Creado por': appointment.profiles?.full_name || 'N/A',
      'Estado': getStatusLabel(appointment.status || ''),
      'Fecha Cita': appointment.appointment_date || 'N/A',
      'Hora Cita': appointment.appointment_time || 'N/A',
      'Notas': appointment.notes || 'N/A',
      'Fecha Creación': new Date(appointment.created_at || '').toLocaleDateString('es-AR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Citas');
    
    const fileName = `reporte_citas_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      scheduled: 'Programada',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      rescheduled: 'Reprogramada'
    };
    return statusLabels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'confirmed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'rescheduled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Formato HH:MM
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Select value={filters.appointmentStatus} onValueChange={(value) => setFilters({...filters, appointmentStatus: value as any})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="rescheduled">Reprogramada</SelectItem>
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
            Resultados ({filteredAppointments.length} citas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando citas...</div>
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
                    <TableHead>Creado por</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('appointment_date')}
                    >
                      <div className="flex items-center gap-1">
                        Fecha & Hora
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        Creada
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No se encontraron citas con los filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">
                          {appointment.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="font-medium">
                          {appointment.clients?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {appointment.profiles?.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(appointment.status || '')}>
                            {getStatusLabel(appointment.status || '')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {appointment.appointment_date ? formatDate(appointment.appointment_date) : 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.appointment_time ? formatTime(appointment.appointment_time) : 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={appointment.notes || ''}>
                            {appointment.notes || 'Sin notas'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {appointment.created_at ? formatDate(appointment.created_at) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/calendar')}
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

export default AppointmentsReportSection;