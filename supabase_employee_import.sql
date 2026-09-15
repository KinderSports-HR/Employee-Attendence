-- Run this in Supabase Dashboard > SQL Editor after fixing the project's API key.
-- The NOT EXISTS check keeps the import safe to run more than once.

INSERT INTO public.employees (full_name, phone, department, designation, role)
SELECT source.full_name, source.phone, source.department, source.designation, 'employee'
FROM (VALUES
    ('Kanaiyabhai Bhil', '8141356881', 'Morbi', NULL),
    ('Makwana Aartiben Batukbhai', '6359584768', 'Bhavnagar', NULL),
    ('Nasim Majgul', '9601058195', 'Ahmedabad', NULL),
    ('Paritosh Bhatti', '7984044850', NULL, NULL),
    ('JIGAR KHARVARA', '7984752624', 'Gandhinagar', NULL),
    ('Prakash Bhabhor', '9726465426', 'Inschool', 'InSchool Trainer'),
    ('Roshan Shrivatsav', '9537050964', 'Inschool', 'Gymkhana Trainer'),
    ('Ankita Parmar', '9998280372', 'Inschool', 'InSchool Trainer'),
    ('Bhargavsinh Solanki', '9104017580', 'Inschool', 'Academy Coach'),
    ('Naranbhai Makwana', '9998915478', 'Inschool', 'Coach'),
    ('Karan Vyas', '8347877700', 'Inschool', 'Academy Coach'),
    ('Sohilkumar Chaudhari', '9712780453', 'Inschool', 'DLSS Trainer'),
    ('Mali Vimalaben Punmaji', '9428070476', 'Inschool', 'InSchool Trainer')
) AS source(full_name, phone, department, designation)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.employees existing
    WHERE regexp_replace(COALESCE(existing.phone, ''), '\D', '', 'g') = source.phone
);

-- The app uses the Supabase publishable key and its own phone-based login.
-- Run this once in Supabase SQL Editor if attendance deletion is blocked by RLS.
DROP POLICY IF EXISTS attendance_delete_policy ON public.attendance;
CREATE POLICY attendance_delete_policy
ON public.attendance
FOR DELETE
TO public
USING (true);

CREATE OR REPLACE FUNCTION public.delete_attendance_record(p_attendance_id text, p_employee_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
        deleted_count integer;
BEGIN
        DELETE FROM public.attendance
        WHERE id::text = p_attendance_id
            AND employee_id::text = p_employee_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_attendance_record(text, text) TO public;
