import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  clientId?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled' | 'all' | '';
  appointmentStatus?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'all' | '';
  timeRange?: 'custom' | 'month' | 'year' | '';
}

export const getWorksReport = async (filters: ReportFilters = {}) => {
  let query = supabase
    .from('works')
    .select(`
      *,
      clients (name, phone, email),
      work_categories (name),
      profiles:created_by (full_name, email)
    `);

  // Aplicar filtros
  if (filters.startDate && filters.endDate) {
    query = query.gte('created_at', filters.startDate).lte('created_at', filters.endDate);
  }

  if (filters.userId && filters.userId !== 'all') {
    query = query.eq('created_by', filters.userId);
  }

  if (filters.clientId && filters.clientId !== 'all') {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching works report:', error);
    throw error;
  }

  return data || [];
};

export const getAppointmentsReport = async (filters: ReportFilters = {}) => {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      clients (name, phone, email),
      works (work_categories (name), status),
      profiles:created_by (full_name, email)
    `);

  // Aplicar filtros
  if (filters.startDate && filters.endDate) {
    query = query.gte('appointment_date', filters.startDate).lte('appointment_date', filters.endDate);
  }

  if (filters.clientId && filters.clientId !== 'all') {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters.appointmentStatus && filters.appointmentStatus !== 'all') {
    query = query.eq('status', filters.appointmentStatus);
  }

  const { data, error } = await query.order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });

  if (error) {
    console.error('Error fetching appointments report:', error);
    throw error;
  }

  return data || [];
};

export const getFinancialReport = async (filters: ReportFilters = {}) => {
  let query = supabase
    .from('works')
    .select(`
      id,
      price,
      deposit_amount,
      deposit_status,
      status,
      actual_delivery_date,
      created_at,
      clients (name),
      work_categories (name)
    `)
    .eq('status', 'delivered');

  // Aplicar filtros por fecha
  if (filters.timeRange === 'month') {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const monthEnd = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;
    query = query.gte('actual_delivery_date', monthStart).lte('actual_delivery_date', monthEnd);
  } else if (filters.timeRange === 'year') {
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;
    query = query.gte('actual_delivery_date', yearStart).lte('actual_delivery_date', yearEnd);
  } else if (filters.startDate && filters.endDate) {
    query = query.gte('actual_delivery_date', filters.startDate).lte('actual_delivery_date', filters.endDate);
  }

  const { data, error } = await query.order('actual_delivery_date', { ascending: false });

  if (error) {
    console.error('Error fetching financial report:', error);
    throw error;
  }

  return data || [];
};

export const getMonthlyRevenueData = async (year: number = new Date().getFullYear()) => {
  const { data, error } = await supabase
    .from('works')
    .select('actual_delivery_date, price')
    .eq('status', 'delivered')
    .gte('actual_delivery_date', `${year}-01-01`)
    .lte('actual_delivery_date', `${year}-12-31`);

  if (error) {
    console.error('Error fetching monthly revenue data:', error);
    throw error;
  }

  // Agrupar por mes
  const monthlyData = Array(12).fill(0).map((_, index) => ({
    month: index + 1,
    revenue: 0
  }));

  data?.forEach(work => {
    if (work.actual_delivery_date) {
      const month = new Date(work.actual_delivery_date).getMonth();
      monthlyData[month].revenue += work.price || 0;
    }
  });

  return monthlyData;
};

export const getUsersList = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name');

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return data || [];
};

export const getClientsList = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone')
    .order('name');

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }

  return data || [];
};
