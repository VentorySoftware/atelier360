import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export const getPendingWorksCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('works')
    .select('*', { count: 'exact' })
    .in('status', ['pending', 'in_progress']);

  if (error) {
    console.error('Error getting pending works:', error);
    return 0;
  }

  return count || 0;
};

export const getTotalClientsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error getting total clients:', error);
    return 0;
  }

  return count || 0;
};

export const getTodayAppointments = async (): Promise<Tables<'appointments'>[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('appointment_date', today)
    .order('appointment_time');

  if (error) {
    console.error('Error getting today appointments:', error);
    return [];
  }

  return data || [];
};

export const getMonthlyRevenue = async (): Promise<number> => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const { data, error } = await supabase
    .from('works')
    .select('price')
    .eq('status', 'delivered')
    .gte('actual_delivery_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
    .lte('actual_delivery_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`);

  if (error) {
    console.error('Error getting monthly revenue:', error);
    return 0;
  }

  return data.reduce((sum, work) => sum + (work.price || 0), 0);
};

export const getRecentWorks = async (limit: number = 5): Promise<any[]> => {
  const { data, error } = await supabase
    .from('works')
    .select(`
      *,
      clients (name),
      work_categories (name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting recent works:', error);
    return [];
  }

  return data || [];
};

export const getUrgentWorks = async (): Promise<any[]> => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const { data, error } = await supabase
    .from('works')
    .select(`
      *,
      clients (name)
    `)
    .in('status', ['pending', 'in_progress'])
    .lte('tentative_delivery_date', tomorrow.toISOString().split('T')[0]);

  if (error) {
    console.error('Error getting urgent works:', error);
    return [];
  }

  return data || [];
};
