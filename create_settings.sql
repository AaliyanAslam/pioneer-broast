CREATE TABLE store_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a default estimated time
INSERT INTO store_settings (setting_key, setting_value) 
VALUES ('estimated_time', '45-50 minutes');
