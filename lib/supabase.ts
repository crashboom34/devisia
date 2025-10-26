import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'draft' | 'processing' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Estimate {
  id: string;
  project_id: string;
  scenario_type: 'eco' | 'standard' | 'premium';
  total_amount: number;
  line_items: LineItem[];
  created_at: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface ApiKey {
  id: string;
  user_id: string;
  provider: 'openai' | 'anthropic' | 'openrouter';
  api_key: string;
  model_id?: string | null;
  model_name?: string | null;
  is_active: boolean;
  created_at: string;
}
