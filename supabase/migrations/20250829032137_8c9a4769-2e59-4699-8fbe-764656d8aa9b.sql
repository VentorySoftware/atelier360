-- Migration to transform all IDs from UUID to incremental format with prefixes
-- Step 1: Add new ID columns and sequences for each entity

-- Create sequences for each entity
CREATE SEQUENCE IF NOT EXISTS public.works_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.clients_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.appointments_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.profiles_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.work_categories_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.contact_attempts_seq START 1;

-- Function to generate formatted IDs
CREATE OR REPLACE FUNCTION public.generate_formatted_id(prefix TEXT, sequence_name TEXT)
RETURNS TEXT AS $$
DECLARE
    next_val INTEGER;
    formatted_id TEXT;
BEGIN
    EXECUTE format('SELECT nextval(%L)', sequence_name) INTO next_val;
    formatted_id := prefix || LPAD(next_val::TEXT, 5, '0');
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;

-- Add new ID columns to all tables
ALTER TABLE public.works ADD COLUMN new_id VARCHAR(20);
ALTER TABLE public.clients ADD COLUMN new_id VARCHAR(20);
ALTER TABLE public.appointments ADD COLUMN new_id VARCHAR(20);
ALTER TABLE public.profiles ADD COLUMN new_id VARCHAR(20);
ALTER TABLE public.work_categories ADD COLUMN new_id VARCHAR(20);
ALTER TABLE public.contact_attempts ADD COLUMN new_id VARCHAR(20);

-- Add new foreign key columns
ALTER TABLE public.works ADD COLUMN new_client_id VARCHAR(20);
ALTER TABLE public.works ADD COLUMN new_category_id VARCHAR(20);
ALTER TABLE public.works ADD COLUMN new_created_by VARCHAR(20);
ALTER TABLE public.appointments ADD COLUMN new_client_id VARCHAR(20);
ALTER TABLE public.appointments ADD COLUMN new_work_id VARCHAR(20);
ALTER TABLE public.appointments ADD COLUMN new_created_by VARCHAR(20);
ALTER TABLE public.contact_attempts ADD COLUMN new_work_id VARCHAR(20);
ALTER TABLE public.contact_attempts ADD COLUMN new_created_by VARCHAR(20);
ALTER TABLE public.work_categories ADD COLUMN new_created_by VARCHAR(20);
ALTER TABLE public.clients ADD COLUMN new_created_by VARCHAR(20);

-- Generate new IDs for existing records
UPDATE public.work_categories SET new_id = public.generate_formatted_id('CT', 'public.work_categories_seq');
UPDATE public.profiles SET new_id = public.generate_formatted_id('U', 'public.profiles_seq');
UPDATE public.clients SET new_id = public.generate_formatted_id('C', 'public.clients_seq');
UPDATE public.works SET new_id = public.generate_formatted_id('T', 'public.works_seq');
UPDATE public.appointments SET new_id = public.generate_formatted_id('A', 'public.appointments_seq');
UPDATE public.contact_attempts SET new_id = public.generate_formatted_id('CA', 'public.contact_attempts_seq');

-- Update foreign key references
-- Update works table references
UPDATE public.works SET new_client_id = c.new_id FROM public.clients c WHERE public.works.client_id = c.id;
UPDATE public.works SET new_category_id = wc.new_id FROM public.work_categories wc WHERE public.works.category_id = wc.id;
UPDATE public.works SET new_created_by = p.new_id FROM public.profiles p WHERE public.works.created_by = p.id;

-- Update appointments table references
UPDATE public.appointments SET new_client_id = c.new_id FROM public.clients c WHERE public.appointments.client_id = c.id;
UPDATE public.appointments SET new_work_id = w.new_id FROM public.works w WHERE public.appointments.work_id = w.id;
UPDATE public.appointments SET new_created_by = p.new_id FROM public.profiles p WHERE public.appointments.created_by = p.id;

-- Update contact_attempts table references
UPDATE public.contact_attempts SET new_work_id = w.new_id FROM public.works w WHERE public.contact_attempts.work_id = w.id;
UPDATE public.contact_attempts SET new_created_by = p.new_id FROM public.profiles p WHERE public.contact_attempts.created_by = p.id;

-- Update other created_by references
UPDATE public.work_categories SET new_created_by = p.new_id FROM public.profiles p WHERE public.work_categories.created_by = p.id;
UPDATE public.clients SET new_created_by = p.new_id FROM public.profiles p WHERE public.clients.created_by = p.id;

-- Drop old foreign key constraints (if any exist)
ALTER TABLE public.works DROP CONSTRAINT IF EXISTS works_client_id_fkey;
ALTER TABLE public.works DROP CONSTRAINT IF EXISTS works_category_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_client_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_work_id_fkey;
ALTER TABLE public.contact_attempts DROP CONSTRAINT IF EXISTS contact_attempts_work_id_fkey;

-- Drop old columns and rename new ones
-- Works table
ALTER TABLE public.works DROP COLUMN id;
ALTER TABLE public.works DROP COLUMN client_id;
ALTER TABLE public.works DROP COLUMN category_id;
ALTER TABLE public.works DROP COLUMN created_by;
ALTER TABLE public.works RENAME COLUMN new_id TO id;
ALTER TABLE public.works RENAME COLUMN new_client_id TO client_id;
ALTER TABLE public.works RENAME COLUMN new_category_id TO category_id;
ALTER TABLE public.works RENAME COLUMN new_created_by TO created_by;

-- Clients table
ALTER TABLE public.clients DROP COLUMN id;
ALTER TABLE public.clients DROP COLUMN created_by;
ALTER TABLE public.clients RENAME COLUMN new_id TO id;
ALTER TABLE public.clients RENAME COLUMN new_created_by TO created_by;

-- Appointments table
ALTER TABLE public.appointments DROP COLUMN id;
ALTER TABLE public.appointments DROP COLUMN client_id;
ALTER TABLE public.appointments DROP COLUMN work_id;
ALTER TABLE public.appointments DROP COLUMN created_by;
ALTER TABLE public.appointments RENAME COLUMN new_id TO id;
ALTER TABLE public.appointments RENAME COLUMN new_client_id TO client_id;
ALTER TABLE public.appointments RENAME COLUMN new_work_id TO work_id;
ALTER TABLE public.appointments RENAME COLUMN new_created_by TO created_by;

-- Profiles table
ALTER TABLE public.profiles DROP COLUMN id;
ALTER TABLE public.profiles RENAME COLUMN new_id TO id;

-- Work categories table
ALTER TABLE public.work_categories DROP COLUMN id;
ALTER TABLE public.work_categories DROP COLUMN created_by;
ALTER TABLE public.work_categories RENAME COLUMN new_id TO id;
ALTER TABLE public.work_categories RENAME COLUMN new_created_by TO created_by;

-- Contact attempts table
ALTER TABLE public.contact_attempts DROP COLUMN id;
ALTER TABLE public.contact_attempts DROP COLUMN work_id;
ALTER TABLE public.contact_attempts DROP COLUMN created_by;
ALTER TABLE public.contact_attempts RENAME COLUMN new_id TO id;
ALTER TABLE public.contact_attempts RENAME COLUMN new_work_id TO work_id;
ALTER TABLE public.contact_attempts RENAME COLUMN new_created_by TO created_by;

-- Add primary key constraints
ALTER TABLE public.works ADD PRIMARY KEY (id);
ALTER TABLE public.clients ADD PRIMARY KEY (id);
ALTER TABLE public.appointments ADD PRIMARY KEY (id);
ALTER TABLE public.profiles ADD PRIMARY KEY (id);
ALTER TABLE public.work_categories ADD PRIMARY KEY (id);
ALTER TABLE public.contact_attempts ADD PRIMARY KEY (id);

-- Add foreign key constraints
ALTER TABLE public.works ADD CONSTRAINT works_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);
ALTER TABLE public.works ADD CONSTRAINT works_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.work_categories(id);
ALTER TABLE public.works ADD CONSTRAINT works_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.appointments ADD CONSTRAINT appointments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);
ALTER TABLE public.appointments ADD CONSTRAINT appointments_work_id_fkey FOREIGN KEY (work_id) REFERENCES public.works(id);
ALTER TABLE public.appointments ADD CONSTRAINT appointments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.contact_attempts ADD CONSTRAINT contact_attempts_work_id_fkey FOREIGN KEY (work_id) REFERENCES public.works(id);
ALTER TABLE public.contact_attempts ADD CONSTRAINT contact_attempts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.work_categories ADD CONSTRAINT work_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.clients ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- Create functions to auto-generate IDs for new records
CREATE OR REPLACE FUNCTION public.generate_work_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id := public.generate_formatted_id('T', 'public.works_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_client_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id := public.generate_formatted_id('C', 'public.clients_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_appointment_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id := public.generate_formatted_id('A', 'public.appointments_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_profile_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id := public.generate_formatted_id('U', 'public.profiles_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_category_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id := public.generate_formatted_id('CT', 'public.work_categories_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_contact_attempt_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id := public.generate_formatted_id('CA', 'public.contact_attempts_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-generating IDs
CREATE TRIGGER trigger_generate_work_id
    BEFORE INSERT ON public.works
    FOR EACH ROW
    WHEN (NEW.id IS NULL)
    EXECUTE FUNCTION public.generate_work_id();

CREATE TRIGGER trigger_generate_client_id
    BEFORE INSERT ON public.clients
    FOR EACH ROW
    WHEN (NEW.id IS NULL)
    EXECUTE FUNCTION public.generate_client_id();

CREATE TRIGGER trigger_generate_appointment_id
    BEFORE INSERT ON public.appointments
    FOR EACH ROW
    WHEN (NEW.id IS NULL)
    EXECUTE FUNCTION public.generate_appointment_id();

CREATE TRIGGER trigger_generate_profile_id
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    WHEN (NEW.id IS NULL)
    EXECUTE FUNCTION public.generate_profile_id();

CREATE TRIGGER trigger_generate_category_id
    BEFORE INSERT ON public.work_categories
    FOR EACH ROW
    WHEN (NEW.id IS NULL)
    EXECUTE FUNCTION public.generate_category_id();

CREATE TRIGGER trigger_generate_contact_attempt_id
    BEFORE INSERT ON public.contact_attempts
    FOR EACH ROW
    WHEN (NEW.id IS NULL)
    EXECUTE FUNCTION public.generate_contact_attempt_id();

-- Update the handle_new_user function to work with new ID format
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer set search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    public.generate_formatted_id('U', 'public.profiles_seq'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;