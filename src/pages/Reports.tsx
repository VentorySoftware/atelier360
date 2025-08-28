import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Calendar, DollarSign } from 'lucide-react';
import WorksReportSection from '@/components/Reports/WorksReportSection';
import ClientsReportSection from '@/components/Reports/ClientsReportSection';
import AppointmentsReportSection from '@/components/Reports/AppointmentsReportSection';
import PaymentsReportSection from '@/components/Reports/PaymentsReportSection';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('works');

  const entities = [
    {
      id: 'works',
      name: 'Trabajos',
      icon: FileText,
      description: 'Consultar trabajos por usuario, estado, cliente y fechas',
      component: WorksReportSection
    },
    {
      id: 'clients',
      name: 'Clientes',
      icon: Users,
      description: 'Buscar clientes por nombre, ID y fecha de alta',
      component: ClientsReportSection
    },
    {
      id: 'appointments',
      name: 'Citas',
      icon: Calendar,
      description: 'Revisar citas por cliente, estado y fechas',
      component: AppointmentsReportSection
    },
    {
      id: 'payments',
      name: 'Pagos',
      icon: DollarSign,
      description: 'Analizar información financiera y pagos',
      component: PaymentsReportSection
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Módulo de Reportes</h1>
        <p className="text-muted-foreground">
          Consulta y exporta información del sistema de manera rápida y eficiente
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {entities.map((entity) => (
            <TabsTrigger 
              key={entity.id} 
              value={entity.id}
              className="flex items-center gap-2"
            >
              <entity.icon className="h-4 w-4" />
              {entity.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {entities.map((entity) => {
          const Component = entity.component;
          return (
            <TabsContent key={entity.id} value={entity.id} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <entity.icon className="h-5 w-5" />
                    <div>
                      <CardTitle>Reportes de {entity.name}</CardTitle>
                      <CardDescription>{entity.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Component />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default Reports;
