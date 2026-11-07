import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Employee {
  id: number;
  name: string;
  phone: string;
  shift: string;
  start_time: string;
  end_time: string;
  demandas: string | null;
  situacao: string | null;
  manual_status: string | null;
  created_at: string;
}
