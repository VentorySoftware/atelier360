import React, { useState, useEffect } from 'react';
import { ReportFilters, getWorksReport, getAppointmentsReport, getFinancialReport } from '@/lib/reportQueries';
import { Button } from '@/components/ui/button';
import ReportFiltersComponent from '@/components/Reports/ReportFilters';
import ReportTable from '@/components/Reports/ReportTable';
import ReportCharts from '@/components/Reports/ReportCharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Reports = () => {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [worksData, setWorksData] = useState([]);
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [financialData, setFinancialData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('works');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        if (activeTab === 'works') {
          const works = await getWorksReport(filters);
          setWorksData(works);
        } else if (activeTab === 'appointments') {
          const appointments = await getAppointmentsReport(filters);
          setAppointmentsData(appointments);
        } else if (activeTab === 'financial') {
          const financial = await getFinancialReport(filters);
          setFinancialData(financial);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [filters, activeTab]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Módulo de Reportes</h1>
      <ReportFiltersComponent setFilters={setFilters} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="works">Trabajos</TabsTrigger>
          <TabsTrigger value="appointments">Citas</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
        </TabsList>

        <TabsContent value="works">
          {loading ? (
            <p>Cargando reportes de trabajos...</p>
          ) : (
            <ReportTable data={worksData} title="Reportes de Trabajos" />
          )}
        </TabsContent>

        <TabsContent value="appointments">
          {loading ? (
            <p>Cargando reportes de citas...</p>
          ) : (
            <ReportTable data={appointmentsData} title="Reportes de Citas" />
          )}
        </TabsContent>

        <TabsContent value="financial">
          {loading ? (
            <p>Cargando reportes financieros...</p>
          ) : (
            <ReportCharts data={financialData} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
