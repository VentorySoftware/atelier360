import React, { useState, useEffect } from 'react';
import { Tabs } from '@/components/ui/tabs'; // Importar componentes de pestañas
import { ReportFilters as ReportFiltersType, getUsersList, getClientsList } from '@/lib/reportQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface ReportFiltersProps {
  setFilters: (filters: ReportFiltersType) => void;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({ setFilters }) => {
  const [localFilters, setLocalFilters] = useState<ReportFiltersType>({});
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await getUsersList();
        const clientsData = await getClientsList();
        setUsers(usersData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = (key: keyof ReportFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    setFilters(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    setFilters(emptyFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filtros de Reportes</h2>
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Limpiar Filtros
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Grupo de Fechas - Diseño Mejorado */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Rango de Fechas</label>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={localFilters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="flex-1"
                placeholder="Fecha inicio"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={localFilters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="flex-1"
                placeholder="Fecha fin"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Usuario</label>
          <Select 
            value={localFilters.userId || ''} 
            onValueChange={(value) => handleFilterChange('userId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los usuarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Cliente</label>
          <Select 
            value={localFilters.clientId || ''} 
            onValueChange={(value) => handleFilterChange('clientId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Estado</label>
          <Select 
            value={localFilters.status || ''} 
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_progress">En progreso</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Estado Cita</label>
          <Select 
            value={localFilters.appointmentStatus || ''} 
            onValueChange={(value) => handleFilterChange('appointmentStatus', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="scheduled">Programada</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="rescheduled">Reprogramada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Rango de Tiempo Predefinido */}
        <div>
          <label className="block text-sm font-medium mb-2">Rango Predefinido</label>
          <Select 
            value={localFilters.timeRange || ''} 
            onValueChange={(value) => {
              handleFilterChange('timeRange', value);
              // Limpiar fechas personalizadas si se selecciona un rango predefinido
              if (value !== 'custom') {
                handleFilterChange('startDate', '');
                handleFilterChange('endDate', '');
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
