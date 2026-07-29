import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useAcademicYear = () => {
  const { data, isLoading, error } = useQuery(
    ['school-settings'],
    async () => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    {
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  );

  const academicYear = data?.academic_year ?? null;
  const promotionsCompleted = data?.promotions_completed ?? false;

  return { academicYear, promotionsCompleted, isLoading: isLoading };
};