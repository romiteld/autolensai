-- Insert sample data for development (only if no data exists)

-- Create a table for vehicle makes and models for autocomplete
CREATE TABLE IF NOT EXISTS public.vehicle_makes (
  id SERIAL PRIMARY KEY,
  make VARCHAR NOT NULL UNIQUE,
  models VARCHAR[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert popular vehicle makes
INSERT INTO public.vehicle_makes (make, models) VALUES 
  ('Toyota', ARRAY['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Tacoma', 'Tundra', 'Sienna', 'Avalon', '4Runner']),
  ('Honda', ARRAY['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Fit', 'HR-V', 'Passport', 'Ridgeline', 'Insight']),
  ('Ford', ARRAY['F-150', 'Escape', 'Explorer', 'Mustang', 'Focus', 'Fusion', 'Edge', 'Expedition', 'Transit', 'Ranger']),
  ('Chevrolet', ARRAY['Silverado', 'Equinox', 'Malibu', 'Traverse', 'Tahoe', 'Suburban', 'Camaro', 'Corvette', 'Cruze', 'Impala']),
  ('BMW', ARRAY['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'i3', 'i8', 'Z4', 'M3']),
  ('Mercedes-Benz', ARRAY['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class', 'CLA', 'GLB', 'G-Class'])
ON CONFLICT (make) DO NOTHING;

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  stripe_price_id VARCHAR,
  features JSONB DEFAULT '{}',
  max_vehicles INTEGER DEFAULT 1,
  ai_generations_per_month INTEGER DEFAULT 10,
  video_generations_per_month INTEGER DEFAULT 2,
  marketing_automation BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  analytics_dashboard BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert subscription plans
INSERT INTO public.subscription_plans (
  name, 
  price_monthly, 
  stripe_price_id,
  features,
  max_vehicles,
  ai_generations_per_month,
  video_generations_per_month,
  marketing_automation,
  priority_support,
  analytics_dashboard
) VALUES 
  (
    'Basic',
    29.99,
    'price_basic_monthly',
    '{"ai_descriptions": true, "image_processing": true, "landing_pages": true}',
    1,
    10,
    2,
    FALSE,
    FALSE,
    FALSE
  ),
  (
    'Pro',
    59.99,
    'price_pro_monthly',
    '{"ai_descriptions": true, "image_processing": true, "video_generation": true, "social_media_posting": true}',
    3,
    25,
    5,
    TRUE,
    FALSE,
    TRUE
  ),
  (
    'Enterprise',
    99.99,
    'price_enterprise_monthly',
    '{"ai_descriptions": true, "crewai_automation": true, "advanced_analytics": true}',
    10,
    100,
    20,
    TRUE,
    TRUE,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.vehicle_makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "Public can view vehicle makes" ON public.vehicle_makes FOR SELECT USING (TRUE);
CREATE POLICY "Public can view subscription plans" ON public.subscription_plans FOR SELECT USING (TRUE);