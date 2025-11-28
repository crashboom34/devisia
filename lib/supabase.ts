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
  client_name?: string;
  client_address?: string;
  work_type?: string;
  notes?: string;
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

export interface ProjectRoom {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RoomPhoto {
  id: string;
  room_id: string;
  image_url: string;
  comment?: string;
  dimensions_text?: string;
  sort_order: number;
  created_at: string;
}

export interface EstimateTemplate {
  id: string;
  template_id: string;
  name: string;
  category: string;
  lots: TemplateLot[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateLot {
  name: string;
  postes: TemplatePoste[];
}

export interface TemplatePoste {
  name: string;
  description: string;
  gamme_entree: string;
  gamme_standard: string;
  gamme_premium: string;
}
