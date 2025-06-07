-- Create inquiries table for vehicle contact forms
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inquirer_name TEXT NOT NULL,
    inquirer_email TEXT NOT NULL,
    inquirer_phone TEXT,
    message TEXT NOT NULL,
    inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('general', 'test_drive', 'financing', 'inspection')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    response_message TEXT
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inquiries_vehicle_id ON public.inquiries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_seller_id ON public.inquiries(seller_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_inquiry_type ON public.inquiries(inquiry_type);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies for inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Sellers can view inquiries for their vehicles
CREATE POLICY "sellers_can_view_their_inquiries" ON public.inquiries
    FOR SELECT
    USING (seller_id = auth.uid());

-- Sellers can update inquiries for their vehicles (to respond)
CREATE POLICY "sellers_can_update_their_inquiries" ON public.inquiries
    FOR UPDATE
    USING (seller_id = auth.uid());

-- Anyone can create inquiries (for public vehicle listings)
CREATE POLICY "anyone_can_create_inquiries" ON public.inquiries
    FOR INSERT
    WITH CHECK (true);

-- Create a view for inquiry statistics
CREATE OR REPLACE VIEW public.inquiry_stats AS
SELECT 
    v.id as vehicle_id,
    v.make,
    v.model,
    v.year,
    COUNT(i.id) as total_inquiries,
    COUNT(CASE WHEN i.status = 'pending' THEN 1 END) as pending_inquiries,
    COUNT(CASE WHEN i.status = 'responded' THEN 1 END) as responded_inquiries,
    COUNT(CASE WHEN i.inquiry_type = 'test_drive' THEN 1 END) as test_drive_requests,
    COUNT(CASE WHEN i.inquiry_type = 'financing' THEN 1 END) as financing_inquiries,
    MAX(i.created_at) as latest_inquiry_at
FROM public.vehicles v
LEFT JOIN public.inquiries i ON v.id = i.vehicle_id
WHERE v.status = 'active'
GROUP BY v.id, v.make, v.model, v.year;

-- Grant permissions on the view
GRANT SELECT ON public.inquiry_stats TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.inquiries IS 'Stores inquiries from potential buyers for vehicle listings';
COMMENT ON VIEW public.inquiry_stats IS 'Provides inquiry statistics for vehicle listings';