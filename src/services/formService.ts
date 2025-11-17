import { supabase, FormConfiguration, FormSubmission } from '../lib/supabase';

export const formService = {
  async getActiveConfiguration(): Promise<FormConfiguration | null> {
    const { data, error } = await supabase
      .from('form_configurations')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async submitForm(formData: Omit<FormSubmission, 'id' | 'created_at' | 'metadata'>) {
    const { data, error } = await supabase
      .from('form_submissions')
      .insert([{ ...formData, coupon_code: formData.coupon_code ?? null }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSubmissions(page: number = 0, limit: number = 10, searchTerm: string = '') {
    let query = supabase
      .from('form_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (searchTerm) {
      query = query.or(`instagram.ilike.%${searchTerm}%,recipient_name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  async updateSubmission(id: string, updates: Partial<FormSubmission>) {
    const allowedFields: (keyof FormSubmission)[] = [
      'instagram',
      'recipient_name',
      'desired_date',
      'desired_time',
      'address',
      'additional_notes',
      'coupon_code'
    ];

    const sanitizedUpdates = allowedFields.reduce((acc, field) => {
      if (updates[field] !== undefined) {
        acc[field] = updates[field];
      }
      return acc;
    }, {} as Partial<FormSubmission>);

    const { data, error } = await supabase
      .from('form_submissions')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSubmission(id: string) {
    const { data, error } = await supabase
      .from('form_submissions')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async restoreSubmission(submission: FormSubmission) {
    const { data, error } = await supabase
      .from('form_submissions')
      .insert([submission])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateConfiguration(id: string, fields: any[]) {
    const { data, error } = await supabase
      .from('form_configurations')
      .update({ fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSubmissionsByDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
