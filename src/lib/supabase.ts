import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Company {
  id: string;
  name: string;
  ticker_symbol?: string;
  industry: string;
  sector: string;
  region: string;
  headquarters?: string;
  website?: string;
  description?: string;
  employee_count?: number;
  revenue_usd?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ESGReport {
  id: string;
  company_id: string;
  title: string;
  report_type: string;
  report_year: number;
  source_type: string;
  source_url?: string;
  file_path?: string;
  raw_text?: string;
  framework?: string;
  language: string;
  processing_status: string;
  created_at: string;
  processed_at?: string;
  uploaded_by: string;
}

export interface ESGScore {
  id: string;
  company_id: string;
  report_id?: string;
  calculation_date: string;
  overall_score: number;
  environmental_score: number;
  social_score: number;
  governance_score: number;
  risk_level: string;
  framework_used?: string;
  metrics: any;
  confidence_score?: number;
  created_at: string;
}

export interface ESGIndicator {
  id: string;
  report_id: string;
  company_id: string;
  category: string;
  subcategory: string;
  indicator_name: string;
  indicator_value: string;
  unit?: string;
  context?: string;
  sentiment?: number;
  credibility_score?: number;
  extracted_at: string;
  source_page?: number;
}

export interface GreenwashingFlag {
  id: string;
  company_id: string;
  report_id?: string;
  flag_type: string;
  severity: string;
  description: string;
  evidence: any;
  detected_at: string;
  resolved: boolean;
  resolution_notes?: string;
}

export interface Alert {
  id: string;
  user_id: string;
  company_id?: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  expires_at?: string;
}

export interface UserProfile {
  id: string;
  role: string;
  organization?: string;
  watched_companies?: string[];
  alert_preferences: any;
  created_at: string;
  updated_at: string;
}
