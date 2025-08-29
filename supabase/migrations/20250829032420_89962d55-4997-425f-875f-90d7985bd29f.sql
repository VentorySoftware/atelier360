-- Fix security warnings by adding SET search_path to all functions

-- Fix function search_path warnings
CREATE OR REPLACE FUNCTION public.generate_formatted_id(prefix TEXT, sequence_name TEXT)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_val INTEGER;
    formatted_id TEXT;
BEGIN
    EXECUTE format('SELECT nextval(%L)', sequence_name) INTO next_val;
    formatted_id := prefix || LPAD(next_val::TEXT, 5, '0');
    RETURN formatted_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
DECLARE
    current_user_uuid UUID;
    profile_string_id TEXT;
BEGIN
    current_user_uuid := auth.uid();
    IF current_user_uuid IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_work_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := public.generate_formatted_id('T', 'public.works_seq');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_client_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := public.generate_formatted_id('C', 'public.clients_seq');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_appointment_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := public.generate_formatted_id('A', 'public.appointments_seq');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_profile_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := public.generate_formatted_id('U', 'public.profiles_seq');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_category_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := public.generate_formatted_id('CT', 'public.work_categories_seq');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_contact_attempt_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := public.generate_formatted_id('CA', 'public.contact_attempts_seq');
    END IF;
    RETURN NEW;
END;
$$;