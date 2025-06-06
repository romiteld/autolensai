-- Create custom types/enums
CREATE TYPE subscription_status_enum AS ENUM ('active', 'inactive', 'cancelled');
CREATE TYPE vehicle_condition_enum AS ENUM ('excellent', 'good', 'fair', 'poor');
CREATE TYPE vehicle_status_enum AS ENUM ('active', 'pending', 'sold', 'archived');
CREATE TYPE processing_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE test_drive_status_enum AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'failed');
CREATE TYPE video_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE subscription_status_type AS ENUM ('active', 'paused', 'cancelled', 'expired');

-- Enable RLS on auth.users (if not already enabled)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table (extends auth.users with additional fields)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  subscription_status subscription_status_enum DEFAULT 'inactive',
  subscription_tier VARCHAR DEFAULT 'basic',
  stripe_customer_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  make VARCHAR NOT NULL,
  model VARCHAR NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND EXTRACT(YEAR FROM NOW()) + 1),
  mileage INTEGER CHECK (mileage >= 0),
  price DECIMAL(10,2) CHECK (price >= 0),
  description TEXT,
  condition vehicle_condition_enum,
  location VARCHAR,
  zip_code VARCHAR(10),
  status vehicle_status_enum DEFAULT 'active',
  featured BOOLEAN DEFAULT FALSE,
  vin VARCHAR(17),
  transmission VARCHAR,
  fuel_type VARCHAR,
  exterior_color VARCHAR,
  interior_color VARCHAR,
  cloudinary_folder VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Vehicle policies
CREATE POLICY "Users can view own vehicles" ON public.vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles" ON public.vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles" ON public.vehicles
  FOR DELETE USING (auth.uid() = user_id);

-- Public can view active vehicles for browsing
CREATE POLICY "Public can view active vehicles" ON public.vehicles
  FOR SELECT USING (status = 'active');

-- Create vehicle_images table
CREATE TABLE public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  original_url VARCHAR NOT NULL,
  processed_url VARCHAR,
  cloudinary_public_id VARCHAR,
  order_index INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  processing_status processing_status_enum DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on vehicle_images
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- Vehicle images policies (users can manage images for their vehicles)
CREATE POLICY "Users can view own vehicle images" ON public.vehicle_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = vehicle_images.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own vehicle images" ON public.vehicle_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = vehicle_images.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own vehicle images" ON public.vehicle_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = vehicle_images.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own vehicle images" ON public.vehicle_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = vehicle_images.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  );

-- Public can view images for active vehicles
CREATE POLICY "Public can view active vehicle images" ON public.vehicle_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = vehicle_images.vehicle_id 
      AND vehicles.status = 'active'
    )
  );

-- Create test_drives table
CREATE TABLE public.test_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  customer_name VARCHAR NOT NULL,
  customer_email VARCHAR NOT NULL,
  customer_phone VARCHAR,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status test_drive_status_enum DEFAULT 'pending',
  license_front_url VARCHAR,
  license_back_url VARCHAR,
  verification_status verification_status_enum DEFAULT 'pending',
  verification_data JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on test_drives
ALTER TABLE public.test_drives ENABLE ROW LEVEL SECURITY;

-- Test drives policies
CREATE POLICY "Vehicle owners can view test drives" ON public.test_drives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = test_drives.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can book test drives" ON public.test_drives
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Vehicle owners can update test drives" ON public.test_drives
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = test_drives.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  );

-- Create landing_pages table
CREATE TABLE public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  seo_title VARCHAR,
  seo_description TEXT,
  meta_keywords VARCHAR[],
  page_content JSONB,
  view_count INTEGER DEFAULT 0,
  last_viewed TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on landing_pages
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Landing pages policies
CREATE POLICY "Vehicle owners can manage landing pages" ON public.landing_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = landing_pages.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  );

-- Public can view active landing pages
CREATE POLICY "Public can view active landing pages" ON public.landing_pages
  FOR SELECT USING (is_active = TRUE);

-- Create videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  video_idea TEXT NOT NULL,
  scenes JSONB NOT NULL,
  selected_images VARCHAR[] NOT NULL,
  video_clips_urls VARCHAR[],
  final_video_url VARCHAR,
  youtube_url VARCHAR,
  youtube_video_id VARCHAR,
  music_url VARCHAR,
  status video_status_enum DEFAULT 'pending',
  processing_logs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Videos policies
CREATE POLICY "Users can manage own vehicle videos" ON public.videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.vehicles 
      WHERE vehicles.id = videos.vehicle_id 
      AND vehicles.user_id = auth.uid()
    )
  );

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  plan_type VARCHAR NOT NULL,
  status subscription_status_type DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id VARCHAR UNIQUE,
  stripe_price_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for webhooks)
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_make_model ON public.vehicles(make, model);
CREATE INDEX idx_vehicles_year ON public.vehicles(year);
CREATE INDEX idx_vehicles_price ON public.vehicles(price);
CREATE INDEX idx_vehicles_location ON public.vehicles(location);
CREATE INDEX idx_vehicles_created_at ON public.vehicles(created_at);

CREATE INDEX idx_vehicle_images_vehicle_id ON public.vehicle_images(vehicle_id);
CREATE INDEX idx_vehicle_images_order_index ON public.vehicle_images(order_index);
CREATE INDEX idx_vehicle_images_is_primary ON public.vehicle_images(is_primary);

CREATE INDEX idx_test_drives_vehicle_id ON public.test_drives(vehicle_id);
CREATE INDEX idx_test_drives_scheduled_date ON public.test_drives(scheduled_date);
CREATE INDEX idx_test_drives_status ON public.test_drives(status);

CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_vehicle_id ON public.landing_pages(vehicle_id);
CREATE INDEX idx_landing_pages_is_active ON public.landing_pages(is_active);

CREATE INDEX idx_videos_vehicle_id ON public.videos(vehicle_id);
CREATE INDEX idx_videos_status ON public.videos(status);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at 
  BEFORE UPDATE ON public.vehicles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_drives_updated_at 
  BEFORE UPDATE ON public.test_drives 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landing_pages_updated_at 
  BEFORE UPDATE ON public.landing_pages 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at 
  BEFORE UPDATE ON public.videos 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();