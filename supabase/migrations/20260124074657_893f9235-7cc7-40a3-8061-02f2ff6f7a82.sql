-- Rename location_preference column to target_customers
ALTER TABLE public.business_applications 
RENAME COLUMN location_preference TO target_customers;