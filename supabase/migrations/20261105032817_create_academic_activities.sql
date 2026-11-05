CREATE TABLE public.academic_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  activity_type TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT academic_activities_student_id_not_empty
    CHECK (length(btrim(student_id)) > 0),
  CONSTRAINT academic_activities_title_length
    CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  CONSTRAINT academic_activities_description_length
    CHECK (description IS NULL OR length(description) <= 5000),
  CONSTRAINT academic_activities_subject_length
    CHECK (subject IS NULL OR length(subject) <= 200),
  CONSTRAINT academic_activities_type_valid
    CHECK (activity_type IN ('tarea', 'proyecto', 'examen', 'otro')),
  CONSTRAINT academic_activities_priority_valid
    CHECK (priority IN ('baja', 'media', 'alta')),
  CONSTRAINT academic_activities_status_valid
    CHECK (status IN ('pendiente', 'en_progreso', 'completada')),
  CONSTRAINT academic_activities_estimated_minutes_positive
    CHECK (estimated_minutes IS NULL OR estimated_minutes > 0)
);

CREATE INDEX academic_activities_student_due_created_idx
  ON public.academic_activities (student_id, due_date, created_at);

CREATE INDEX academic_activities_student_status_due_idx
  ON public.academic_activities (student_id, status, due_date);

CREATE INDEX academic_activities_student_priority_due_idx
  ON public.academic_activities (student_id, priority, due_date);

CREATE INDEX academic_activities_student_type_due_idx
  ON public.academic_activities (student_id, activity_type, due_date);

ALTER TABLE public.academic_activities ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.academic_activities FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.academic_activities TO service_role;

CREATE OR REPLACE FUNCTION public.set_academic_activities_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER academic_activities_set_updated_at
  BEFORE UPDATE ON public.academic_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_academic_activities_updated_at();
