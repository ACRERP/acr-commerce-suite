import { supabase } from '@/lib/supabase';

export interface Student {
  id: string;
  name: string;
  email: string;
  enrollment_number: string;
  status: 'active' | 'inactive' | 'graduated';
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  enrolled_count?: number;
}

export const academicService = {
  async getRecentStudents() {
    const { data, error } = await supabase
      .from('academic_students')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data as Student[];
  },

  async getStats() {
    // Parallel requests for stats
    const [students, courses] = await Promise.all([
      supabase.from('academic_students').select('id', { count: 'exact', head: true }),
      supabase.from('academic_courses').select('id', { count: 'exact', head: true })
    ]);

    return {
      activeStudents: students.count || 0,
      totalClasses: courses.count || 0,
    };
  }
};
