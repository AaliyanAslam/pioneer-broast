-- Run this in your Supabase SQL Editor to add estimated time per order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_time TEXT;
