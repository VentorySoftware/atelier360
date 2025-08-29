-- Update table definitions to make ID nullable for inserts
-- This allows the triggers to automatically generate IDs

-- Update all tables to make ID optional for inserts
ALTER TABLE public.works ALTER COLUMN id DROP NOT NULL;
ALTER TABLE public.clients ALTER COLUMN id DROP NOT NULL;  
ALTER TABLE public.appointments ALTER COLUMN id DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN id DROP NOT NULL;
ALTER TABLE public.work_categories ALTER COLUMN id DROP NOT NULL;
ALTER TABLE public.contact_attempts ALTER COLUMN id DROP NOT NULL;

-- Set default values for ID columns to ensure they get generated
ALTER TABLE public.works ALTER COLUMN id SET DEFAULT public.generate_formatted_id('T', 'public.works_seq');
ALTER TABLE public.clients ALTER COLUMN id SET DEFAULT public.generate_formatted_id('C', 'public.clients_seq');
ALTER TABLE public.appointments ALTER COLUMN id SET DEFAULT public.generate_formatted_id('A', 'public.appointments_seq');
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT public.generate_formatted_id('U', 'public.profiles_seq');
ALTER TABLE public.work_categories ALTER COLUMN id SET DEFAULT public.generate_formatted_id('CT', 'public.work_categories_seq');
ALTER TABLE public.contact_attempts ALTER COLUMN id SET DEFAULT public.generate_formatted_id('CA', 'public.contact_attempts_seq');