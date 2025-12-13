
-- Migration to enhance leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium'; -- low, medium, high
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_close_date DATE;
