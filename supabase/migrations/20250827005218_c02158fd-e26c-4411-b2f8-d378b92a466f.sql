-- Add financial tracking fields to works table
ALTER TABLE public.works 
ADD COLUMN amount_paid NUMERIC DEFAULT 0,
ADD COLUMN payment_method TEXT;