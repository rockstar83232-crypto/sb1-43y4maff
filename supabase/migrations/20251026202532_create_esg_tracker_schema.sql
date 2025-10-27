/*
  # Real-Time ESG Impact Tracker Database Schema

  ## Overview
  Complete database schema for AI-powered ESG tracking platform with support for:
  - Company profiles and multi-source data integration
  - ESG reports and document storage
  - AI-powered scoring and analysis
  - Credibility verification and greenwashing detection
  - Real-time alerts and notifications
  - User roles (investors, auditors, regulators)

  ## New Tables

  ### 1. `companies`
  Stores company profiles being tracked for ESG performance
  - `id` (uuid, primary key)
  - `name` (text) - Company legal name
  - `ticker_symbol` (text, optional) - Stock ticker
  - `industry` (text) - Industry classification
  - `sector` (text) - Business sector
  - `region` (text) - Geographic region
  - `headquarters` (text) - Location
  - `website` (text, optional)
  - `description` (text, optional)
  - `employee_count` (integer, optional)
  - `revenue_usd` (numeric, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `created_by` (uuid) - References auth.users

  ### 2. `esg_reports`
  Stores uploaded and scraped ESG/sustainability reports
  - `id` (uuid, primary key)
  - `company_id` (uuid) - References companies
  - `title` (text)
  - `report_type` (text) - 'sustainability', 'annual', 'esg', 'csr', etc.
  - `report_year` (integer)
  - `source_type` (text) - 'upload', 'scrape', 'api'
  - `source_url` (text, optional)
  - `file_path` (text, optional) - Storage path
  - `raw_text` (text) - Extracted text content
  - `framework` (text) - 'SASB', 'GRI', 'EU_TAXONOMY', 'TCFD', etc.
  - `language` (text)
  - `processing_status` (text) - 'pending', 'processing', 'completed', 'failed'
  - `created_at` (timestamptz)
  - `processed_at` (timestamptz, optional)
  - `uploaded_by` (uuid) - References auth.users

  ### 3. `esg_scores`
  Stores calculated ESG scores with historical tracking
  - `id` (uuid, primary key)
  - `company_id` (uuid) - References companies
  - `report_id` (uuid, optional) - References esg_reports
  - `calculation_date` (timestamptz)
  - `overall_score` (numeric) - 0-100 scale
  - `environmental_score` (numeric)
  - `social_score` (numeric)
  - `governance_score` (numeric)
  - `risk_level` (text) - 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  - `framework_used` (text)
  - `metrics` (jsonb) - Detailed metric breakdown
  - `confidence_score` (numeric) - AI confidence 0-1
  - `created_at` (timestamptz)

  ### 4. `esg_indicators`
  Extracted ESG indicators from reports using NLP
  - `id` (uuid, primary key)
  - `report_id` (uuid) - References esg_reports
  - `company_id` (uuid) - References companies
  - `category` (text) - 'environmental', 'social', 'governance'
  - `subcategory` (text) - Specific area (e.g., 'carbon_emissions', 'labor_practices')
  - `indicator_name` (text)
  - `indicator_value` (text)
  - `unit` (text, optional)
  - `context` (text) - Surrounding text for context
  - `sentiment` (numeric) - -1 to 1 sentiment score
  - `credibility_score` (numeric) - 0-1 trust score
  - `extracted_at` (timestamptz)
  - `source_page` (integer, optional)

  ### 5. `news_articles`
  ESG-related news articles for sentiment analysis
  - `id` (uuid, primary key)
  - `company_id` (uuid) - References companies
  - `title` (text)
  - `content` (text)
  - `source` (text) - News outlet
  - `source_url` (text)
  - `published_at` (timestamptz)
  - `scraped_at` (timestamptz)
  - `sentiment` (numeric) - -1 to 1
  - `esg_relevance` (numeric) - 0-1 relevance score
  - `topics` (text[]) - Array of detected topics
  - `processing_status` (text)

  ### 6. `third_party_verifications`
  External data sources for credibility checking
  - `id` (uuid, primary key)
  - `company_id` (uuid) - References companies
  - `source_name` (text) - NGO, government agency, etc.
  - `source_type` (text) - 'NGO', 'GOVERNMENT', 'CERTIFICATION', 'AUDIT'
  - `verification_data` (jsonb) - Structured verification info
  - `trust_score` (numeric) - 0-1 source reliability
  - `last_verified` (timestamptz)
  - `verification_url` (text, optional)
  - `created_at` (timestamptz)

  ### 7. `greenwashing_flags`
  AI-detected inconsistencies and potential greenwashing
  - `id` (uuid, primary key)
  - `company_id` (uuid) - References companies
  - `report_id` (uuid, optional) - References esg_reports
  - `flag_type` (text) - 'INCONSISTENCY', 'VAGUE_CLAIM', 'MISSING_DATA', 'CONTRADICTORY'
  - `severity` (text) - 'LOW', 'MEDIUM', 'HIGH'
  - `description` (text)
  - `evidence` (jsonb) - Supporting evidence
  - `detected_at` (timestamptz)
  - `resolved` (boolean)
  - `resolution_notes` (text, optional)

  ### 8. `alerts`
  Real-time notifications for significant changes
  - `id` (uuid, primary key)
  - `user_id` (uuid) - References auth.users
  - `company_id` (uuid, optional) - References companies
  - `alert_type` (text) - 'SCORE_CHANGE', 'GREENWASHING', 'NEW_REPORT', 'COMPLIANCE_ISSUE'
  - `severity` (text) - 'INFO', 'WARNING', 'CRITICAL'
  - `title` (text)
  - `message` (text)
  - `data` (jsonb) - Additional alert data
  - `read` (boolean)
  - `created_at` (timestamptz)
  - `expires_at` (timestamptz, optional)

  ### 9. `user_profiles`
  Extended user profile information
  - `id` (uuid, primary key) - References auth.users
  - `role` (text) - 'INVESTOR', 'AUDITOR', 'REGULATOR', 'ANALYST'
  - `organization` (text, optional)
  - `watched_companies` (uuid[]) - Array of company IDs
  - `alert_preferences` (jsonb)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 10. `data_sources`
  Configuration for external data sources and APIs
  - `id` (uuid, primary key)
  - `name` (text)
  - `source_type` (text) - 'API', 'SCRAPER', 'UPLOAD'
  - `endpoint_url` (text, optional)
  - `config` (jsonb) - Source-specific configuration
  - `active` (boolean)
  - `last_sync` (timestamptz, optional)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read ESG data
  - Only authorized users can upload reports and manage companies
  - Admins have full access
  - Users can only see their own alerts and profiles
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ticker_symbol text,
  industry text NOT NULL,
  sector text NOT NULL,
  region text NOT NULL,
  headquarters text,
  website text,
  description text,
  employee_count integer,
  revenue_usd numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_region ON companies(region);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);

-- Create esg_reports table
CREATE TABLE IF NOT EXISTS esg_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  report_type text NOT NULL DEFAULT 'sustainability',
  report_year integer NOT NULL,
  source_type text NOT NULL DEFAULT 'upload',
  source_url text,
  file_path text,
  raw_text text,
  framework text,
  language text DEFAULT 'en',
  processing_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  uploaded_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_esg_reports_company ON esg_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_esg_reports_year ON esg_reports(report_year);
CREATE INDEX IF NOT EXISTS idx_esg_reports_status ON esg_reports(processing_status);

-- Create esg_scores table
CREATE TABLE IF NOT EXISTS esg_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_id uuid REFERENCES esg_reports(id) ON DELETE SET NULL,
  calculation_date timestamptz DEFAULT now(),
  overall_score numeric NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  environmental_score numeric NOT NULL CHECK (environmental_score >= 0 AND environmental_score <= 100),
  social_score numeric NOT NULL CHECK (social_score >= 0 AND social_score <= 100),
  governance_score numeric NOT NULL CHECK (governance_score >= 0 AND governance_score <= 100),
  risk_level text NOT NULL DEFAULT 'MEDIUM',
  framework_used text,
  metrics jsonb DEFAULT '{}',
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_esg_scores_company ON esg_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_esg_scores_date ON esg_scores(calculation_date DESC);
CREATE INDEX IF NOT EXISTS idx_esg_scores_risk ON esg_scores(risk_level);

-- Create esg_indicators table
CREATE TABLE IF NOT EXISTS esg_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES esg_reports(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category text NOT NULL,
  subcategory text NOT NULL,
  indicator_name text NOT NULL,
  indicator_value text NOT NULL,
  unit text,
  context text,
  sentiment numeric CHECK (sentiment >= -1 AND sentiment <= 1),
  credibility_score numeric CHECK (credibility_score >= 0 AND credibility_score <= 1),
  extracted_at timestamptz DEFAULT now(),
  source_page integer
);

CREATE INDEX IF NOT EXISTS idx_esg_indicators_report ON esg_indicators(report_id);
CREATE INDEX IF NOT EXISTS idx_esg_indicators_company ON esg_indicators(company_id);
CREATE INDEX IF NOT EXISTS idx_esg_indicators_category ON esg_indicators(category);

-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  source text NOT NULL,
  source_url text NOT NULL UNIQUE,
  published_at timestamptz NOT NULL,
  scraped_at timestamptz DEFAULT now(),
  sentiment numeric CHECK (sentiment >= -1 AND sentiment <= 1),
  esg_relevance numeric CHECK (esg_relevance >= 0 AND esg_relevance <= 1),
  topics text[],
  processing_status text DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_news_articles_company ON news_articles(company_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published_at DESC);

-- Create third_party_verifications table
CREATE TABLE IF NOT EXISTS third_party_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  source_type text NOT NULL,
  verification_data jsonb DEFAULT '{}',
  trust_score numeric DEFAULT 0.5 CHECK (trust_score >= 0 AND trust_score <= 1),
  last_verified timestamptz DEFAULT now(),
  verification_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verifications_company ON third_party_verifications(company_id);

-- Create greenwashing_flags table
CREATE TABLE IF NOT EXISTS greenwashing_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_id uuid REFERENCES esg_reports(id) ON DELETE CASCADE,
  flag_type text NOT NULL,
  severity text NOT NULL DEFAULT 'MEDIUM',
  description text NOT NULL,
  evidence jsonb DEFAULT '{}',
  detected_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolution_notes text
);

CREATE INDEX IF NOT EXISTS idx_greenwashing_company ON greenwashing_flags(company_id);
CREATE INDEX IF NOT EXISTS idx_greenwashing_severity ON greenwashing_flags(severity);
CREATE INDEX IF NOT EXISTS idx_greenwashing_resolved ON greenwashing_flags(resolved);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'INFO',
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_company ON alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'ANALYST',
  organization text,
  watched_companies uuid[],
  alert_preferences jsonb DEFAULT '{"email": true, "push": true, "score_threshold": 10}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create data_sources table
CREATE TABLE IF NOT EXISTS data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL,
  endpoint_url text,
  config jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE greenwashing_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table
CREATE POLICY "Anyone can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own companies"
  ON companies FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for esg_reports table
CREATE POLICY "Anyone can view reports"
  ON esg_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload reports"
  ON esg_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own reports"
  ON esg_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own reports"
  ON esg_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- RLS Policies for esg_scores table
CREATE POLICY "Anyone can view ESG scores"
  ON esg_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create scores"
  ON esg_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for esg_indicators table
CREATE POLICY "Anyone can view ESG indicators"
  ON esg_indicators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create indicators"
  ON esg_indicators FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for news_articles table
CREATE POLICY "Anyone can view news articles"
  ON news_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create news articles"
  ON news_articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for third_party_verifications table
CREATE POLICY "Anyone can view verifications"
  ON third_party_verifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create verifications"
  ON third_party_verifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for greenwashing_flags table
CREATE POLICY "Anyone can view greenwashing flags"
  ON greenwashing_flags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create flags"
  ON greenwashing_flags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update flags"
  ON greenwashing_flags FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for alerts table
CREATE POLICY "Users can view their own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for data_sources table
CREATE POLICY "Anyone can view data sources"
  ON data_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage data sources"
  ON data_sources FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update data sources"
  ON data_sources FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);