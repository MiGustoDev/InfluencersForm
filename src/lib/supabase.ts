import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'time';
  required: boolean;
  enabled: boolean;
}

export interface FormConfiguration {
  id: string;
  fields: FormField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  instagram: string;
  recipient_name: string;
  desired_date: string;
  desired_time: string;
  address: string;
  additional_notes: string;
  metadata: Record<string, any>;
  created_at: string;
}
