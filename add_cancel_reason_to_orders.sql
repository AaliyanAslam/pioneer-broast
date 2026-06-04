-- Run this in your Supabase SQL Editor to add cancel reason per order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
