-- Create message templates table
CREATE TABLE public.message_templates (
  id VARCHAR NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  work_status TEXT NOT NULL,
  work_category_id VARCHAR,
  message_content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique combination of work_status and work_category_id
  CONSTRAINT unique_status_category UNIQUE (work_status, work_category_id)
);

-- Create sequence for message templates
CREATE SEQUENCE public.message_templates_seq START 1;

-- Create function to generate template IDs
CREATE OR REPLACE FUNCTION public.generate_template_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        NEW.id := 'MT' || LPAD(nextval('public.message_templates_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for automatic ID generation
CREATE TRIGGER generate_message_template_id
BEFORE INSERT ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.generate_template_id();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for message templates
CREATE POLICY "Authenticated users can view message templates" 
ON public.message_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage message templates" 
ON public.message_templates 
FOR ALL 
USING (true);