-- Add intake/output checklist fields to service_orders

ALTER TABLE service_orders
ADD COLUMN IF NOT EXISTS device_powers_on BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS device_vibrates BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS intake_analysis TEXT,
ADD COLUMN IF NOT EXISTS output_analysis TEXT,
ADD COLUMN IF NOT EXISTS intake_photos TEXT[], -- Array of photo URLs
ADD COLUMN IF NOT EXISTS output_photos TEXT[]; -- Array of photo URLs

-- Add comment for documentation
COMMENT ON COLUMN service_orders.device_powers_on IS 'Checklist: Device powers on when received';
COMMENT ON COLUMN service_orders.device_vibrates IS 'Checklist: Device vibrates when received';
COMMENT ON COLUMN service_orders.intake_analysis IS 'Detailed analysis of device condition on intake';
COMMENT ON COLUMN service_orders.output_analysis IS 'Detailed analysis of device condition after repair';
COMMENT ON COLUMN service_orders.intake_photos IS 'Array of photo URLs showing device condition on intake';
COMMENT ON COLUMN service_orders.output_photos IS 'Array of photo URLs showing device condition after repair';
