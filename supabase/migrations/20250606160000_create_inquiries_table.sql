-- Create inquiries table for vehicle contact forms
CREATE TABLE IF NOT EXISTS autolensai.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES autolensai.vehicles(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_inquiries_vehicle_id ON autolensai.inquiries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_seller_id ON autolensai.inquiries(seller_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON autolensai.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON autolensai.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_inquiry_type ON autolensai.inquiries(inquiry_type);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION autolensai.update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON autolensai.inquiries
    FOR EACH ROW
    EXECUTE FUNCTION autolensai.update_inquiries_updated_at();

-- Add RLS policies for inquiries
ALTER TABLE autolensai.inquiries ENABLE ROW LEVEL SECURITY;

-- Sellers can view inquiries for their vehicles
CREATE POLICY "sellers_can_view_their_inquiries" ON autolensai.inquiries
    FOR SELECT
    USING (seller_id = auth.uid());

-- Sellers can update inquiries for their vehicles (to respond)
CREATE POLICY "sellers_can_update_their_inquiries" ON autolensai.inquiries
    FOR UPDATE
    USING (seller_id = auth.uid());

-- Anyone can create inquiries (for public vehicle listings)
CREATE POLICY "anyone_can_create_inquiries" ON autolensai.inquiries
    FOR INSERT
    WITH CHECK (true);

-- Create a view for inquiry statistics
CREATE OR REPLACE VIEW autolensai.inquiry_stats AS
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
FROM autolensai.vehicles v
LEFT JOIN autolensai.inquiries i ON v.id = i.vehicle_id
WHERE v.status = 'active'
GROUP BY v.id, v.make, v.model, v.year;

-- Grant permissions on the view
GRANT SELECT ON autolensai.inquiry_stats TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE autolensai.inquiries IS 'Stores inquiries from potential buyers for vehicle listings';
COMMENT ON VIEW autolensai.inquiry_stats IS 'Provides inquiry statistics for vehicle listings';