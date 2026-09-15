-- Run this in Supabase Dashboard > SQL Editor after fixing the project's API key.
-- The NOT EXISTS check keeps the import safe to run more than once.

INSERT INTO public.employees (full_name, phone, department, designation, role)
SELECT source.full_name, source.phone, source.department, source.designation, 'employee'
FROM (VALUES
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
